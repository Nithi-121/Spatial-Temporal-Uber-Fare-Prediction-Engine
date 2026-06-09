# ---------- Backend (FastAPI) ----------
FROM python:3.12-slim AS backend
WORKDIR /app

# Install backend dependencies (includes FastAPI, uvicorn, joblib, xgboost, pandas, numpy, folium, streamlit-folium, scikit-learn, requests)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code and model
COPY app/ ./app/
COPY models/ ./models/

# Expose FastAPI port
EXPOSE 8000

# ---------- Frontend (Streamlit) ----------
FROM python:3.12-slim AS frontend
WORKDIR /app

# Install the same dependencies (required for Streamlit UI)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Streamlit entry point and backend code (so UI can import if needed)
COPY streamlit_app.py .
COPY app/ ./app/
COPY models/ ./models/

# Expose Streamlit port
EXPOSE 8501

# Run both services using a simple process manager (sh -c)
# FastAPI runs in background, Streamlit runs in foreground
CMD uvicorn app.api:app --host 0.0.0.0 --port 8000 & \
    streamlit run streamlit_app.py --server.port 8501 --server.enableCORS false --server.headless true
