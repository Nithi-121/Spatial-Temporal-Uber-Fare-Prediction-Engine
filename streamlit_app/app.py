import streamlit as st
import joblib
import numpy as np
import pandas as pd
import folium
from streamlit_folium import st_folium
import plotly.express as px

# ---------------- PAGE CONFIG ----------------
st.set_page_config(page_title="RideIQ Pro", page_icon="🚖", layout="wide")

# ---------------- DARK MODE ----------------
dark_mode = st.sidebar.toggle("🌙 Dark Mode")

if dark_mode:
    st.markdown("""
    <style>
    .stApp { background-color: #0e1117; color: white; }
    </style>
    """, unsafe_allow_html=True)

# ---------------- LOAD MODEL ----------------
import os
model_path = os.path.join(os.path.dirname(__file__), "..", "models", "xgb_model.pkl")
model = joblib.load(model_path)

# ---------------- HEADER ----------------
st.title("🚖 RideIQ Pro")
st.caption("AI-Powered Uber Fare Prediction System")

# ---------------- SIDEBAR INPUT ----------------
st.sidebar.header("🧾 Trip Details")

distance = st.sidebar.slider("Distance (km)", 0.1, 50.0, 5.0)
hour = st.sidebar.slider("Hour", 0, 23, 12)
passenger = st.sidebar.number_input("Passengers", 1, 6, 1)

weekday = st.sidebar.selectbox(
    "Day",
    ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
)

weekday_map = {"Monday":0,"Tuesday":1,"Wednesday":2,"Thursday":3,"Friday":4,"Saturday":5,"Sunday":6}
weekday_num = weekday_map[weekday]

is_peak = 1 if (7 <= hour <= 10 or 17 <= hour <= 20) else 0

# ---------------- PREDICTION ----------------
st.subheader("🎯 Fare Prediction")

if st.button("🚀 Predict Fare"):
    features = np.array([[distance, hour, weekday_num, 1, 1, is_peak, passenger]])
    prediction = model.predict(features)

    st.success(f"💰 Estimated Fare: ${prediction[0]:.2f}")

# ---------------- LIVE MAP ----------------
st.subheader("🌍 Live Trip Map")

map_center = [40.7128, -74.0060]  # NYC default

m = folium.Map(location=map_center, zoom_start=11)

folium.Marker(map_center, tooltip="Pickup Location").add_to(m)

st_folium(m, width=700)

# ---------------- REAL-TIME GRAPH ----------------
st.subheader("📊 Fare Trend Simulation")

data = pd.DataFrame({
    "Distance": np.linspace(1, 20, 50),
    "Fare": [model.predict([[d, hour, weekday_num, 1, 1, is_peak, passenger]])[0] for d in np.linspace(1,20,50)]
})

fig = px.line(data, x="Distance", y="Fare", title="Fare vs Distance")

st.plotly_chart(fig, use_container_width=True)

# ---------------- INSIGHTS ----------------
st.subheader("📈 Insights")

if is_peak:
    st.warning("🚦 Peak hours increase fare due to demand surge")
else:
    st.info("🟢 Normal hours → standard pricing")

# ---------------- FOOTER ----------------
st.markdown("---")
st.markdown("Built by Nithin 🚀 | AI/ML Project")