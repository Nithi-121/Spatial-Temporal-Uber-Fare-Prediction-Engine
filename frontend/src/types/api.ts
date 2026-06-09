export interface PredictRequest {
  pickup_lat: number;
  pickup_lon: number;
  dropoff_lat: number;
  dropoff_lon: number;
  hour: number;
  day: number;
  month: number;
  passengers: number;
  weather_code: string;
  traffic_level: string;
}

export interface PredictResponse {
  predicted_fare: number;
  confidence_low: number;
  confidence_high: number;
  distance_mi: number;
  duration_min: number;
  surge_multiplier: number;
  fare_zone: 'Budget' | 'Standard' | 'Premium' | 'Surge';
}

export interface Hotspot {
  lat: number;
  lng: number;
  fare: number;
  type: 'pickup' | 'dropoff';
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  r2_score: number;
  training_samples: number;
  model_type: string;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface PredictionLogEntry {
  timestamp: string;
  route: string;
  fare: number;
  distance: number;
  duration: number;
  surge: number;
  zone: string;
}

export interface AnalyticsResponse {
  temporal_hour: { [key: string]: number };
  temporal_weekday: { [key: string]: number };
  temporal_month: { [key: string]: number };
  hotspots: Hotspot[];
  model_metrics: ModelMetrics;
  feature_importances: FeatureImportance[];
  recent_logs: PredictionLogEntry[];
}
