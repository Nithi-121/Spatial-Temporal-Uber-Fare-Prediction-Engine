# FareLens: Spatial-Temporal Uber Fare Prediction Engine

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![XGBoost](https://img.shields.io/badge/Model-XGBoost-success)
![FastAPI](https://img.shields.io/badge/API-FastAPI-009688?logo=fastapi)
![Streamlit](https://img.shields.io/badge/App-Streamlit-ff4b4b?logo=streamlit)
![React](https://img.shields.io/badge/Frontend-React-61dafb?logo=react)
![Power BI](https://img.shields.io/badge/BI-Power%20BI-f2c811?logo=powerbi)

FareLens is an end-to-end data science and business intelligence project that predicts Uber fares using spatial, temporal, trip, and passenger features. The project combines exploratory data analysis, feature engineering, XGBoost regression, API deployment, a Streamlit prediction app, a React analytics interface, and a multi-page Power BI dashboard for executive reporting.

The goal is to show the complete workflow expected in a practical data analyst or data scientist role: understanding raw trip data, preparing model-ready features, training and evaluating a predictive model, exposing the model through an API, and translating model outputs into clear business insights.

## Business Problem

Uber fare pricing depends on several signals: trip distance, pickup and dropoff location, hour of day, weekday, passenger count, and peak-hour behavior. FareLens answers three practical questions:

- What factors most strongly influence ride fares?
- How do trip demand and revenue change by hour, weekday, distance category, and passenger count?
- Can a trained machine learning model estimate fares reliably enough to support planning, monitoring, and scenario analysis?

## Project Highlights

- Built a full machine learning pipeline using Python, pandas, scikit-learn, and XGBoost.
- Engineered spatial-temporal features including trip distance, hour, weekday, month, day, passenger count, and peak-hour flag.
- Trained an XGBoost Regressor for fare prediction and exported a reusable model artifact.
- Created FastAPI prediction endpoints with request validation, confidence bands, fare zones, traffic and weather adjustments, and analytics endpoints.
- Developed Streamlit and React interfaces for model interaction and visual analysis.
- Designed a five-page Power BI dashboard covering executive KPIs, temporal patterns, spatial behavior, model performance, and revenue insights.
- Organized notebooks, data, model artifacts, dashboard files, API code, and frontend code in one reproducible repository.

## Tech Stack

| Area | Tools |
| --- | --- |
| Data processing | Python, pandas, NumPy |
| Machine learning | scikit-learn, XGBoost, joblib |
| Backend API | FastAPI, Pydantic |
| Data app | Streamlit, Plotly, Folium |
| Frontend | React, TypeScript, Vite |
| Business intelligence | Power BI |
| Version control | Git, GitHub |

## Machine Learning Approach

1. Load raw Uber trip data and inspect data quality.
2. Clean missing values, unrealistic fares, invalid coordinates, and outliers.
3. Generate spatial features using pickup and dropoff coordinates.
4. Extract temporal features from pickup datetime.
5. Create peak-hour and trip category indicators.
6. Train and validate an XGBoost regression model.
7. Export predictions for dashboard reporting.
8. Serve the trained model through FastAPI and interactive apps.

## Model Summary

| Metric | Value |
| --- | ---: |
| Model | XGBoost Regressor |
| MAE | 2.12 |
| RMSE | 4.85 |
| R2 Score | 0.81 |
| Training samples | 550,000 |

Key model drivers include trip distance, hour of day, weekday, peak-hour behavior, month, day of month, and passenger count.

## Dashboard Gallery

### 1. Executive Dashboard

This page gives a leadership-level snapshot of overall trip volume, total revenue, average fare, average distance, passenger distribution, monthly revenue trend, hourly trip demand, and peak vs non-peak behavior.

<img src="Dashboard/images/Screenshot%202026-07-15%20172000.png" alt="FareLens executive dashboard showing KPI cards, monthly revenue, trips by hour, peak-hour split, passenger distribution, and interactive slicers" width="100%">

### 2. Temporal Analysis Dashboard

This page focuses on time-based behavior. It compares trips by hour, average fare by hour, weekday trip volume, revenue by weekday, daily trip trends, and peak-hour demand. These views help identify when demand and revenue are strongest.

<img src="Dashboard/images/Screenshot%202026-07-15%20172720.png" alt="FareLens temporal analysis dashboard with hourly, weekday, daily, fare, revenue, and peak-hour charts" width="100%">

### 3. Spatial and Distance Analysis Dashboard

This page connects geography and fare behavior. It includes pickup and dropoff maps, trip distance distribution, average fare by distance category, and coordinate-level trip patterns. It is useful for identifying high-activity ride zones and distance segments.

<img src="Dashboard/images/Screenshot%202026-07-15%20172735.png" alt="FareLens spatial dashboard showing pickup and dropoff maps, trip distance distribution, fare by distance category, and interactive filters" width="100%">

### 4. Model Performance Dashboard

This page communicates model performance to business and technical stakeholders. It compares actual vs predicted fare, visualizes prediction error, and highlights how the XGBoost Regressor performs across the prediction set.

<img src="Dashboard/images/Screenshot%202026-07-15%20172752.png" alt="FareLens model performance dashboard showing XGBoost actual vs predicted fare and prediction error distribution" width="100%">

### 5. Revenue Insights Dashboard

This page analyzes revenue by distance category, peak-hour flag, passenger count, and day. It helps convert model outputs and trip data into practical business insights for pricing, demand planning, and operational reporting.

<img src="Dashboard/images/Screenshot%202026-07-15%20172805.png" alt="FareLens revenue dashboard showing revenue by distance category, peak hour, passenger count, and day" width="100%">

## Repository Structure

```text
Spatial-Temporal-Uber-Fare-Prediction-Engine/
|-- app/                  FastAPI backend for prediction and analytics
|-- assets/images/        EDA plots and supporting visual assets
|-- Dashboard/            Power BI dashboard file and dashboard screenshots
|-- Data/                 Raw, cleaned, and prediction output datasets
|-- frontend/             React + TypeScript analytics frontend
|-- lib/                  Deployment support library for XGBoost runtime
|-- models/               Trained XGBoost model artifact
|-- notebooks/            EDA, modeling, training, and dashboard notebooks
|-- streamlit_app/        Streamlit fare prediction application
|-- requirements.txt      Python dependencies
|-- runtime.txt           Runtime configuration
|-- README.md             Project documentation
```

## How to Run

### 1. Clone the repository

```bash
git clone https://github.com/Nithi-121/Spatial-Temporal-Uber-Fare-Prediction-Engine.git
cd Spatial-Temporal-Uber-Fare-Prediction-Engine
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Streamlit app

```bash
streamlit run streamlit_app/app.py
```

### 4. Run the FastAPI backend

```bash
uvicorn app.api:app --reload
```

### 5. Run the React frontend

```bash
cd frontend
npm install
npm run dev
```

## API Example

```json
{
  "pickup_lat": 40.730610,
  "pickup_lon": -73.935242,
  "dropoff_lat": 40.758896,
  "dropoff_lon": -73.985130,
  "hour": 18,
  "day": 9,
  "month": 6,
  "passengers": 1,
  "weather_code": "Clear",
  "traffic_level": "Moderate"
}
```

The API returns predicted fare, confidence range, estimated distance, estimated duration, surge multiplier, and fare zone.

## Business Impact

FareLens demonstrates how machine learning and BI can work together in a real analytics workflow:

- Pricing teams can estimate fare behavior under different trip conditions.
- Operations teams can identify peak demand windows and high-activity locations.
- Analysts can monitor revenue patterns by time, distance, and passenger segment.
- Data science teams can explain model behavior using interpretable features and dashboard summaries.

## Resume-Ready Summary

Built an end-to-end Uber fare prediction and analytics platform using Python, XGBoost, FastAPI, Streamlit, React, and Power BI. Engineered spatial-temporal trip features, trained an XGBoost regression model, served predictions through an API, and designed a five-page executive dashboard to communicate revenue, demand, location, and model performance insights.

## Author

Nithin P
