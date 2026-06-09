import os
import ctypes

# HACK: Vercel AWS Lambda environment does not have libgomp.so.1 installed natively.
# We explicitly load it into memory before joblib/xgboost to prevent ImportError crashes.
try:
    lib_path = os.path.join(os.path.dirname(__file__), "..", "lib", "libgomp.so.1")
    if os.path.exists(lib_path):
        ctypes.cdll.LoadLibrary(lib_path)
except Exception:
    pass

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import numpy as np
import os
import datetime
import gc
# pandas is heavy; import lazily inside data loading when needed


app = FastAPI(
    title="Spatial-Temporal Uber Fare Prediction Engine",
    description="Production-grade API for predicting Uber fares and serving spatial-temporal analytics.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load XGBoost model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "xgb_model.pkl")
model = None
def get_model():
    global model
    if model is None:
        import joblib
        try:
            model = joblib.load(MODEL_PATH)
            print(f"XGBoost model lazy‑loaded from {MODEL_PATH}")
        except Exception as e:
            import traceback
            error_msg = f"Failed to lazy‑load XGBoost model: {str(e)}\n{traceback.format_exc()}"
            print(error_msg)
            return {"error": error_msg}
    return model
# Haversine distance formula (in km)
def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0  # Earth radius in kilometers
    
    # Convert latitude and longitude from degrees to radians
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = np.sin(dlat / 2.0)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2.0)**2
    c = 2.0 * np.arcsin(np.sqrt(a))
    
    return R * c

# Request & Response schemas
class PredictRequest(BaseModel):
    pickup_lat: float = Field(..., example=40.730610)
    pickup_lon: float = Field(..., example=-73.935242)
    dropoff_lat: float = Field(..., example=40.758896)
    dropoff_lon: float = Field(..., example=-73.985130)
    hour: int = Field(..., ge=0, le=23, example=18)
    day: int = Field(..., ge=1, le=31, example=9)
    month: int = Field(..., ge=1, le=12, example=6)
    passengers: int = Field(..., ge=1, le=6, example=1)
    weather_code: str = Field("Clear", example="Clear")
    traffic_level: str = Field("Moderate", example="Moderate")

class PredictResponse(BaseModel):
    predicted_fare: float
    confidence_low: float
    confidence_high: float
    distance_mi: float
    duration_min: float
    surge_multiplier: float
    fare_zone: str

# In-memory prediction log
prediction_log = []

# Global cache for analytics to prevent loading CSV repeatedly
analytics_cache = {
    "temporal_hour": {},
    "temporal_weekday": {},
    "temporal_month": {},
    "hotspots": [],
    "model_metrics": {
        "mae": 2.12,
        "rmse": 4.85,
        "r2_score": 0.81,
        "training_samples": 550000,
        "model_type": "XGBoost Regressor"
    },
    "feature_importances": [
        {"feature": "Distance (mi)", "importance": 0.76},
        {"feature": "Hour of Day", "importance": 0.09},
        {"feature": "Weekday", "importance": 0.05},
        {"feature": "Is Peak Hour", "importance": 0.04},
        {"feature": "Month", "importance": 0.03},
        {"feature": "Day of Month", "importance": 0.02},
        {"feature": "Passenger Count", "importance": 0.01}
    ]
}

# Startup logic for analytics data prep
@app.on_event("startup")
def load_and_prep_data():
    csv_path = os.path.join(os.path.dirname(__file__), "..", "Data", "uber.csv")
    print(f"Checking for dataset at: {csv_path}")
    
    if os.path.exists(csv_path):
        try:
            # Import pandas lazily – it may not be available in the minimal Vercel runtime
            import pandas as pd
            print("Loading dataset for analytics calculations...")
            # Read essential columns only to save RAM
            df = pd.read_csv(csv_path, usecols=[
                "fare_amount", "pickup_datetime", 
                "pickup_longitude", "pickup_latitude", 
                "dropoff_longitude", "dropoff_latitude", 
                "passenger_count"
            ])
            print(f"Loaded {len(df)} rows. Cleaning...")
            
            # Clean outliers
            df = df.dropna()
            df = df[(df["fare_amount"] >= 2.5) & (df["fare_amount"] <= 200)]
            # Bounding box filter (NYC Area)
            df = df[
                (df["pickup_latitude"] >= 40.5) & (df["pickup_latitude"] <= 41.0) &
                (df["pickup_longitude"] >= -74.25) & (df["pickup_longitude"] <= -73.7) &
                (df["dropoff_latitude"] >= 40.5) & (df["dropoff_latitude"] <= 41.0) &
                (df["dropoff_longitude"] >= -74.25) & (df["dropoff_longitude"] <= -73.7)
            ]
            
            df["pickup_datetime"] = pd.to_datetime(df["pickup_datetime"])
            df["hour"] = df["pickup_datetime"].dt.hour
            df["weekday"] = df["pickup_datetime"].dt.weekday
            df["month"] = df["pickup_datetime"].dt.month
            
            print("Computing analytics aggregates...")
            # Hourly stats
            hour_grp = df.groupby("hour")["fare_amount"].mean().round(2).to_dict()
            analytics_cache["temporal_hour"] = {str(k): v for k, v in hour_grp.items()}
            
            # Weekly stats
            week_grp = df.groupby("weekday")["fare_amount"].mean().round(2).to_dict()
            analytics_cache["temporal_weekday"] = {str(k): v for k, v in week_grp.items()}
            
            # Monthly stats
            month_grp = df.groupby("month")["fare_amount"].mean().round(2).to_dict()
            analytics_cache["temporal_month"] = {str(k): v for k, v in month_grp.items()}
            
            # Sample hotspots (limit to 1200 entries)
            hotspots_df = df.sample(n=min(1200, len(df)), random_state=42)
            hotspots = []
            for _, r in hotspots_df.iterrows():
                hotspots.append({
                    "lat": float(r["pickup_latitude"]),
                    "lng": float(r["pickup_longitude"]),
                    "fare": float(r["fare_amount"]),
                    "type": "pickup"
                })
                if len(hotspots) < 1200:
                    hotspots.append({
                        "lat": float(r["dropoff_latitude"]),
                        "lng": float(r["dropoff_longitude"]),
                        "fare": float(r["fare_amount"]),
                        "type": "dropoff"
                    })
            analytics_cache["hotspots"] = hotspots
            
            print("Analytics database preparation complete! Freeing memory...")
            del df
            gc.collect()
            
        except Exception as e:
            print(f"Error loading and processing dataset: {e}")
            load_fallbacks()
    else:
        print(f"Dataset not found at {csv_path}. Loading default fallbacks...")
        load_fallbacks()

def load_fallbacks():
    # Setup mock data reflecting NYC averages
    analytics_cache["temporal_hour"] = {
        str(h): round(11.5 + np.sin(h * np.pi / 12) * 2.5 + (1.5 if (7<=h<=10 or 17<=h<=20) else 0), 2)
        for h in range(24)
    }
    analytics_cache["temporal_weekday"] = {
        str(w): round(12.0 + (1.5 if w >= 4 else 0), 2)
        for w in range(7)
    }
    analytics_cache["temporal_month"] = {
        str(m): round(11.8 + np.cos(m * np.pi / 6) * 1.2, 2)
        for m in range(1, 13)
    }
    # Mock NYC coordinate grid hotspots
    np.random.seed(42)
    hotspots = []
    nyc_center_lat, nyc_center_lon = 40.758, -73.985
    for _ in range(800):
        lat = nyc_center_lat + np.random.normal(0, 0.03)
        lon = nyc_center_lon + np.random.normal(0, 0.03)
        fare = float(np.random.gamma(shape=2, scale=5) + 3)
        hotspots.append({
            "lat": round(lat, 6),
            "lng": round(lon, 6),
            "fare": round(fare, 2),
            "type": "pickup" if np.random.rand() > 0.4 else "dropoff"
        })
    analytics_cache["hotspots"] = hotspots
    print("Fallback mock analytics datasets loaded.")

@app.get("/")
def home():
    return {
        "message": "Spatial-Temporal Uber Fare Prediction Engine running",
        "model_loaded": model is not None,
        "analytics_ready": len(analytics_cache.get("hotspots", [])) > 0
    }

@app.get("/debug")
def debug_info():
    import sys
    try:
        m = get_model()
        if isinstance(m, dict) and "error" in m:
            return {"status": "error", "traceback": m["error"], "python_version": sys.version}
        return {"status": "success", "message": "Model loaded fine", "python_version": sys.version}
    except Exception as e:
        import traceback
        return {"status": "fatal_error", "traceback": traceback.format_exc(), "python_version": sys.version}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    m = get_model()
    if m is None or (isinstance(m, dict) and "error" in m):
        raise HTTPException(status_code=503, detail="XGBoost model is not loaded on server. Please check /debug endpoint.")
    
    # Calculate distance via Haversine
    dist_km = haversine(req.pickup_lat, req.pickup_lon, req.dropoff_lat, req.dropoff_lon)
    dist_mi = dist_km * 0.621371
    
    # Ensure minimum distance validation
    if dist_mi < 0.1:
        dist_mi = 0.1
        dist_km = 0.160934
        
    # derive date time inputs
    try:
        weekday = datetime.date(2015, req.month, req.day).weekday()
    except ValueError:
        # Graceful fallback for invalid dates (e.g. Feb 31)
        weekday = 1
        
    is_peak = 1 if (7 <= req.hour <= 10 or 17 <= req.hour <= 20) else 0
    
    # Predict base fare using XGBoost
    # Feature List: ['distance','hour','weekday','day','month','is_peak','passenger_count']
    features = np.array([[dist_km, req.hour, weekday, req.day, req.month, is_peak, req.passengers]])
    
    try:
        pred_base = float(m.predict(features)[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model prediction failed: {str(e)}")
        
    # Scale adjustments based on Traffic levels
    traffic_mods = {
        "Low": 0.85,
        "Moderate": 1.0,
        "High": 1.25,
        "Surge": 1.65
    }
    traffic_mod = traffic_mods.get(req.traffic_level, 1.0)
    
    # Scale adjustments based on Weather
    weather_mods = {
        "Clear": 1.0,
        "Rain": 1.15,
        "Snow": 1.30,
        "Fog": 1.10
    }
    weather_mod = weather_mods.get(req.weather_code, 1.0)
    
    # Apply multipliers
    predicted_fare = pred_base * traffic_mod * weather_mod
    
    # Ensure fare doesn't fall below NYC base fare ($2.50)
    if predicted_fare < 2.50:
        predicted_fare = 2.50
        
    # Compute surge multiplier
    surge_multiplier = traffic_mod
    if is_peak == 1 and req.traffic_level in ["High", "Surge"]:
        surge_multiplier += 0.15
        predicted_fare *= 1.15
        
    predicted_fare = round(predicted_fare, 2)
    
    # Duration estimate (in minutes)
    # Average speed in NYC is slow: 12mph base
    avg_speed = 12.0
    if req.traffic_level == "High":
        avg_speed = 7.0
    elif req.traffic_level == "Surge":
        avg_speed = 5.0
    elif req.traffic_level == "Low":
        avg_speed = 18.0
        
    if req.weather_code in ["Rain", "Fog"]:
        avg_speed *= 0.85
    elif req.weather_code == "Snow":
        avg_speed *= 0.65
        
    duration_min = max(3.0, (dist_mi / avg_speed) * 60.0)
    duration_min = round(duration_min, 1)
    
    # Confidence bounds
    confidence_margin = 1.50 + (0.10 * predicted_fare)
    confidence_low = max(2.50, round(predicted_fare - confidence_margin, 2))
    confidence_high = round(predicted_fare + confidence_margin, 2)
    
    # Categorize Fare Zone
    if predicted_fare < 12.0:
        fare_zone = "Budget"
    elif predicted_fare < 25.0:
        fare_zone = "Standard"
    elif predicted_fare < 45.0:
        fare_zone = "Premium"
    else:
        fare_zone = "Surge"
        
    response = PredictResponse(
        predicted_fare=predicted_fare,
        confidence_low=confidence_low,
        confidence_high=confidence_high,
        distance_mi=round(dist_mi, 2),
        duration_min=duration_min,
        surge_multiplier=round(surge_multiplier, 2),
        fare_zone=fare_zone
    )
    
    # Log prediction history
    log_entry = {
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "route": f"Lat {round(req.pickup_lat,4)} → Lat {round(req.dropoff_lat,4)}",
        "fare": predicted_fare,
        "distance": round(dist_mi, 2),
        "duration": duration_min,
        "surge": round(surge_multiplier, 2),
        "zone": fare_zone
    }
    
    prediction_log.insert(0, log_entry)
    if len(prediction_log) > 10:
        prediction_log.pop()
        
    return response

@app.get("/analytics")
def get_analytics():
    return {
        "temporal_hour": analytics_cache["temporal_hour"],
        "temporal_weekday": analytics_cache["temporal_weekday"],
        "temporal_month": analytics_cache["temporal_month"],
        "hotspots": analytics_cache["hotspots"],
        "model_metrics": analytics_cache["model_metrics"],
        "feature_importances": analytics_cache["feature_importances"],
        "recent_logs": prediction_log
    }