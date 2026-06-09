# 🚖 **FareLens – Spatial‑Temporal Uber Fare Prediction Engine**

![GitHub repo size](https://img.shields.io/github/repo-size/Nithi-121/Spatial-Temporal-Uber-Fare-Prediction-Engine?color=brightgreen)
![License](https://img.shields.io/github/license/Nithi-121/Spatial-Temporal-Uber-Fare-Prediction-Engine?color=blue)
![Python](https://img.shields.io/badge/python-3.12%20%7C%203.11-blue?logo=python)
![Streamlit](https://img.shields.io/badge/streamlit-1.38%20%7C%202.3‑FF4B4B?logo=streamlit&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0‑009688?logo=fastapi)
![Model](https://img.shields.io/badge/model‑XGBoost‑0B6623?logo=googlecloud)

> **A premium, production‑grade demo that predicts Uber fares in NYC using XGBoost, spatial clustering, and time‑series analytics.**  
> Live UI (Streamlit) + robust REST API (FastAPI) + interactive Leaflet map.

---

## ✨ **Features**

| ✅ | Feature |
|---|---------|
| 🎯 | **Accurate fare prediction** – based on distance, time, traffic, weather, and demand surge. |
| 🗺️ | **Dynamic Leaflet map** with animated ride routes & hotspot visualisation. |
| 📊 | **Analytics dashboard** – hourly, weekday & monthly fare trends, model metrics, feature importances. |
| ⚡️ | **Fast API** – powered by `uvicorn`, ready for production or container deployment. |
| 🌙 | **Dark‑mode UI** with glass‑morphism, gradients & subtle micro‑animations. |
| 🐍 | **Fully typed Python code** (Pydantic models, type hints) for maintainability. |
| 📦 | **Docker‑compose** for local development (API + Streamlit). |
| 🚀 | **One‑click deployment** on Streamlit Cloud (custom Dockerfile). |

---

## 📦 **Getting Started**

> These commands assume you have **Git**, **Python ≥ 3.12**, **Docker** (optional) and **Node ≥ 20** installed.

### 1️⃣ Clone the repo

```bash
git clone https://github.com/Nithi-121/Spatial-Temporal-Uber-Fare-Prediction-Engine.git
cd Spatial-Temporal-Uber-Fare-Prediction-Engine
```

### 2️⃣ Install Python dependencies

```bash
python -m venv .venv               # optional but recommended
source .venv/Scripts/activate      # on Windows
pip install -r requirements.txt
```

### 3️⃣ Start the FastAPI backend

```bash
uvicorn app.api:app --host 0.0.0.0 --port 8000
# → API docs at http://127.0.0.1:8000/docs
```

### 4️⃣ Run the Streamlit frontend locally (optional)

```bash
cd frontend                # root of the React‑based UI (if you want to play with it)
npm install
npm run dev                # http://localhost:5173
```

> **Or** run the **Streamlit wrapper** that talks to the FastAPI service:

```bash
streamlit run streamlit_app.py
# → UI at http://localhost:8501
```

### 5️⃣ Docker‑Compose (all‑in‑one)

```bash
docker compose up            # builds both services & starts them
# API → http://localhost:8000
# Streamlit → http://localhost:8501
```

### 6️⃣ Deploy to Streamlit Cloud (one‑click)

1. Go to **[Streamlit Cloud](https://share.streamlit.io/)** and sign in with GitHub.  
2. Click **“New app”**, select this repo, set *Main file path* to `streamlit_app.py`.  
3. In **Advanced settings**, enable **“Use custom Dockerfile”** (the repo already contains a multi‑stage Dockerfile).  
4. Click **Deploy** – Streamlit will build the container, start the API, and serve the UI at a public URL.

---

## 🔧 **Configuration & Customisation**

| Parameter | Where | Description |
|-----------|-------|-------------|
| `apiBaseUrl` | `frontend/src/components/HeroMap.tsx` | URL of the FastAPI server (default `http://127.0.0.1:8000`). |
| Model path | `app/app.py` | `models/xgb_model.pkl`. Replace with your own XGBoost model. |
| Weather / Traffic options | `frontend/src/components/HeroMap.tsx` | Extend the `select` lists to add new enums. |
| UI theme | `frontend/src/components/Navbar.tsx` | Toggle dark mode with the sidebar switch. |

---

## 📈 **Analytics Endpoints**

- `GET /analytics` – returns temporal aggregates, hotspot coordinates, model metrics, recent prediction logs.  
- `GET /` – health check (`{message: "…", model_loaded: true, analytics_ready: true}`).

---

## 📂 **Project Structure**

```
├─ Data/                     # Sample NYC Uber CSV (used for analytics)
├─ app/
│   ├─ api.py                # FastAPI routes & model logic
│   └─ app.py                # Streamlit‑style demo (optional)
├─ frontend/                 # React‑Leaflet UI (Vite + TypeScript)
│   ├─ src/
│   │   ├─ components/       # Navbar, HeroMap, AnalyticsDashboard …
│   │   └─ App.tsx
│   └─ vite.config.ts
├─ models/                   # Pre‑trained XGBoost model (xgb_model.pkl)
├─ streamlit_app.py          # Minimal Streamlit wrapper for the API
├─ Dockerfile                # Multi‑stage: FastAPI + Streamlit
├─ docker-compose.yml        # Local orchestration
├─ requirements.txt          # Python deps (fastapi, uvicorn, pydantic, joblib, pandas, numpy, streamlit)
└─ README.md                # ← You are here!
```

---

## 🧪 **Testing the API**

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
        "pickup_lat":40.758,
        "pickup_lon":-73.985,
        "dropoff_lat":40.706,
        "dropoff_lon":-73.996,
        "hour":14,
        "day":9,
        "month":6,
        "passengers":2,
        "weather_code":"Clear",
        "traffic_level":"Moderate"
      }'
```

You should receive a JSON payload like:

```json
{
  "predicted_fare": 14.73,
  "confidence_low": 13.30,
  "confidence_high": 16.50,
  "distance_mi": 2.45,
  "duration_min": 12.3,
  "surge_multiplier": 1.0,
  "fare_zone": "Standard"
}
```

---

## 📜 **License**

This project is licensed under the **MIT License** – feel free to fork, remix, and use it in your own productions.

---

## 🙏 **Acknowledgements**

- **XGBoost** – Gradient‑boosted trees for the regression backbone.  
- **Leaflet** – Interactive map visualisation.  
- **Streamlit** – Rapid UI prototyping and cloud hosting.  
- **FastAPI** – High‑performance async API framework.  
- **OpenStreetMap Nominatim** – Geocoding for location autocomplete.

---

*If you find this repo useful, ⭐️ the project and feel free to open issues or pull‑requests!*
