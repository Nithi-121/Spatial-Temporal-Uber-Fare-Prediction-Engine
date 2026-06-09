import { useState, useEffect } from 'react';
import axios from 'axios';
import { Navbar } from './components/Navbar';
import { HeroMap } from './components/HeroMap';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ModelCard } from './components/ModelCard';
import type { AnalyticsResponse } from './types/api';
import { AlertCircle, Database, ExternalLink } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Toggle DOM element class for Tailwind class dark mode strategy
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      root.style.backgroundColor = '#0F1117';
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#F8FAFC';
    }
  }, [darkMode]);

  // Fetch initial analytics data and check backend connectivity
  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      // First hit home endpoint to verify status
      const statusRes = await axios.get(API_BASE_URL);
      if (statusRes.status === 200) {
        setBackendStatus('online');
        // Fetch analytics aggregates
        const res = await axios.get<AnalyticsResponse>(`${API_BASE_URL}/analytics`);
        setAnalyticsData(res.data);
      }
    } catch (err) {
      console.error('Backend connection check failed:', err);
      setBackendStatus('offline');
      // Load fallback analytics client-side if backend is offline
      loadFallbackAnalytics();
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Gracefully calculate client-side fallback data if server is unreachable
  const loadFallbackAnalytics = () => {
    // Generate mock hourly data
    const hourData: { [key: string]: number } = {};
    for (let h = 0; h < 24; h++) {
      hourData[h] = parseFloat((12.5 + Math.sin(h * Math.PI / 12) * 3 + (((7 <= h && h <= 10) || (17 <= h && h <= 20)) ? 2.2 : 0.0)).toFixed(2));
    }
    // Generate mock weekly data
    const weekdayData: { [key: string]: number } = {};
    for (let w = 0; w < 7; w++) {
      weekdayData[w] = parseFloat((11.8 + (w >= 4 ? 1.5 : 0)).toFixed(2));
    }
    // Generate mock monthly data
    const monthData: { [key: string]: number } = {};
    for (let m = 1; m <= 12; m++) {
      monthData[m] = parseFloat((12.1 + Math.cos(m * Math.PI / 6) * 1.4).toFixed(2));
    }
    // Mock hotspots (Times Square center)
    const hotspots = [];
    const centerLat = 40.758, centerLng = -73.985;
    for (let i = 0; i < 600; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const r = Math.sqrt(v) * 0.04;
      const lat = centerLat + r * Math.sin(theta);
      const lng = centerLng + r * Math.cos(theta);
      hotspots.push({
        lat,
        lng,
        fare: parseFloat((Math.random() * 45 + 3.5).toFixed(2)),
        type: Math.random() > 0.45 ? ('pickup' as const) : ('dropoff' as const)
      });
    }

    setAnalyticsData({
      temporal_hour: hourData,
      temporal_weekday: weekdayData,
      temporal_month: monthData,
      hotspots,
      model_metrics: {
        mae: 2.12,
        rmse: 4.85,
        r2_score: 0.81,
        training_samples: 550000,
        model_type: 'XGBoost Regressor (Demo Mode)'
      },
      feature_importances: [
        { feature: 'Distance (mi)', importance: 0.76 },
        { feature: 'Hour of Day', importance: 0.09 },
        { feature: 'Weekday', importance: 0.05 },
        { feature: 'Is Peak Hour', importance: 0.04 },
        { feature: 'Month', importance: 0.03 },
        { feature: 'Day of Month', importance: 0.02 },
        { feature: 'Passenger Count', importance: 0.01 }
      ],
      recent_logs: []
    });
  };

  // Callback after a successful prediction to synchronize logs table
  const handlePredictionSuccess = () => {
    // Re-fetch analytics to get updated list of recent predictions
    fetchAnalytics();
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0F1117] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

      {/* Backend Connection Warning Toast */}
      {backendStatus === 'offline' && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-center gap-2.5 text-xs text-amber-500 no-print font-medium animate-pulse">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Local predictive API is offline. Running in Demo Mode with mock dataset values. Spin up the FastAPI server to predict fares.</span>
        </div>
      )}

      {/* Hero / Predictor Segment */}
      <main className="w-full">
        <HeroMap onPredictSuccess={handlePredictionSuccess} apiBaseUrl={API_BASE_URL} />
      </main>

      {/* Aggregated Analytics Dashboard Segment */}
      <AnalyticsDashboard data={analyticsData} loading={analyticsLoading} />

      {/* Model Spec Details Segment */}
      <ModelCard />

      {/* Footer with Dataset attributions */}
      <footer id="dataset" className="bg-[#0b0c10] border-t border-slate-900 py-12 text-slate-500 text-xs mt-16 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-400 font-bold tracking-tight">
              <Database className="w-4 h-4 text-uber-green" />
              <span>NYC Taxi & Limousine Commission Dataset</span>
            </div>
            <p className="max-w-md text-[11px] leading-relaxed text-slate-500">
              Model trained on historical Uber trips datasets released publicly by the TLC. Preprocessing cleans coordinates outside bounding limits and filters fare outliers to guarantee production prediction boundaries.
            </p>
          </div>

          <div className="flex flex-col md:items-end gap-3">
            <div className="flex items-center gap-4 text-slate-400 font-medium">
              <a href="https://www.kaggle.com/datasets" target="_blank" rel="noopener noreferrer" className="hover:text-uber-green transition-all flex items-center gap-1.5">
                <span>Kaggle Source</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span>•</span>
              <a href="#predict" className="hover:text-uber-green transition-all">Back to Predictor</a>
            </div>
            <div className="text-[10px] text-slate-600">
              &copy; {new Date().getFullYear()} FareLens. Created for Data Science Portfolio Showcase.
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
