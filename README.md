# 🚖 FareLens -- Spatial--Temporal Uber Fare Prediction Engine

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![Power
BI](https://img.shields.io/badge/Power%20BI-Dashboard-F2C811?logo=powerbi)
![XGBoost](https://img.shields.io/badge/Model-XGBoost-success)
![Streamlit](https://img.shields.io/badge/Streamlit-WebApp-red?logo=streamlit)

> End-to-end Machine Learning + Business Intelligence project for Uber
> fare prediction.

## ✨ Features

-   XGBoost fare prediction
-   Spatial & Temporal feature engineering
-   Power BI Executive Dashboard (5 Pages)
-   Streamlit Web Application
-   FastAPI Backend

## 🏗️ Workflow

``` text
Raw Data
 ↓
Cleaning
 ↓
EDA
 ↓
Feature Engineering
 ↓
XGBoost
 ↓
Prediction Dataset
 ↓
Power BI
 ↓
Streamlit
```

## 📊 Dashboard Gallery

Replace these with your exported screenshots:

``` md
![Executive](assets/images/executive_dashboard.png)

![Temporal](assets/images/temporal_dashboard.png)

![Spatial](assets/images/spatial_dashboard.png)

![Machine Learning](assets/images/ml_dashboard.png)

![Business](assets/images/business_dashboard.png)
```

## 🧠 ML Pipeline

-   Data Cleaning
-   Haversine Distance
-   Peak Hour Detection
-   XGBoost Regressor
-   Prediction Export

## 📦 Installation

``` bash
git clone https://github.com/Nithi-121/FareLens.git
cd FareLens
pip install -r requirements.txt
streamlit run streamlit_app/app.py
```

## 📁 Project Structure

``` text
FareLens/
├── app/                  # FastAPI Backend API
├── streamlit_app/        # Streamlit Web App
├── frontend/             # React/Vite Frontend
├── data/                 # Raw and Cleaned Datasets
├── notebooks/            # Jupyter Notebooks (EDA & Modeling)
├── models/               # XGBoost Models
├── dashboards/           # PowerBI Dashboards
├── assets/               # Images and static files
├── README.md
```

## 💼 Resume Highlights

-   Built an end-to-end Uber fare prediction engine using XGBoost.
-   Developed a five-page interactive Power BI dashboard.
-   Integrated Python, Streamlit, FastAPI, and Business Intelligence.

## 🔮 Future Work

-   Weather API
-   Live Traffic
-   Docker
-   CI/CD

## 👨‍💻 Author

Nithin P
