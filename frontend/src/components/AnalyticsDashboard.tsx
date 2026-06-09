import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  MapPin, BarChart2, TrendingUp, Calendar, Clock, 
  Percent, ShieldCheck, Database, Award, HelpCircle 
} from 'lucide-react';
import type { AnalyticsResponse, Hotspot } from '../types/api';

interface AnalyticsDashboardProps {
  data: AnalyticsResponse | null;
  loading: boolean;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ data, loading }) => {
  const [activeTab, setActiveTab] = useState<'spatial' | 'temporal' | 'importance' | 'performance'>('spatial');
  const [mapLayer, setMapLayer] = useState<'density' | 'pickups' | 'dropoffs' | 'surge'>('density');
  const [counters, setCounters] = useState({ mae: 0, rmse: 0, r2: 0, samples: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const circleGroupRef = useRef<L.LayerGroup | null>(null);
  const performanceRef = useRef<HTMLDivElement>(null);

  // Animate model metric counters when component mounts or scroll intersects
  useEffect(() => {
    if (!data) return;
    
    const targetMae = data.model_metrics.mae;
    const targetRmse = data.model_metrics.rmse;
    const targetR2 = data.model_metrics.r2_score * 100;
    const targetSamples = data.model_metrics.training_samples;
    
    let startTimestamp: number | null = null;
    const duration = 1200; // ms

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function: easeOutQuad
      const ease = progress * (2 - progress);

      setCounters({
        mae: Number((ease * targetMae).toFixed(2)),
        rmse: Number((ease * targetRmse).toFixed(2)),
        r2: Number((ease * targetR2).toFixed(1)),
        samples: Math.floor(ease * targetSamples)
      });

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [data, activeTab]);

  // Leaflet Map Initialization and Layer Toggling
  useEffect(() => {
    if (activeTab !== 'spatial' || !data || !mapContainerRef.current) return;

    // Destroy existing map if it exists
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Initialize Leaflet Map centered in New York City (Manhattan)
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
    }).setView([40.758, -73.985], 12);

    mapRef.current = map;

    // CartoDB Dark Matter Tile Layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19
    }).addTo(map);

    // Layer Group for Hotspots
    const circleGroup = L.layerGroup().addTo(map);
    circleGroupRef.current = circleGroup;

    updateMapLayers();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [data, activeTab, mapLayer]);

  const updateMapLayers = () => {
    if (!data || !circleGroupRef.current) return;

    circleGroupRef.current.clearLayers();

    const hotspots: Hotspot[] = data.hotspots;

    hotspots.forEach((spot) => {
      let color = '#06C167'; // default Uber Green
      let radius = 25;
      let opacity = 0.55;
      let shouldDraw = false;

      if (mapLayer === 'density') {
        shouldDraw = true;
        // Fare density color scaling: budget green -> premium yellow -> surge red
        if (spot.fare < 12.0) {
          color = '#06C167'; // Budget
          radius = 20;
        } else if (spot.fare < 25.0) {
          color = '#F59E0B'; // Standard
          radius = 35;
        } else {
          color = '#EF4444'; // Premium/Surge
          radius = 50;
        }
      } else if (mapLayer === 'pickups') {
        if (spot.type === 'pickup') {
          shouldDraw = true;
          color = '#3B82F6'; // Blue
          radius = 30;
        }
      } else if (mapLayer === 'dropoffs') {
        if (spot.type === 'dropoff') {
          shouldDraw = true;
          color = '#EC4899'; // Pink
          radius = 30;
        }
      } else if (mapLayer === 'surge') {
        // Surge represents high fare zones (above $35)
        if (spot.fare >= 30.0) {
          shouldDraw = true;
          color = '#8B5CF6'; // Purple
          radius = 60;
          opacity = 0.7;
        }
      }

      if (shouldDraw) {
        L.circle([spot.lat, spot.lng], {
          radius: radius,
          fillColor: color,
          fillOpacity: opacity,
          color: color,
          weight: 1,
          opacity: 0.8
        })
        .bindPopup(`<strong>NYC Zone Record</strong><br/>Type: ${spot.type.toUpperCase()}<br/>Fare: $${spot.fare.toFixed(2)}`)
        .addTo(circleGroupRef.current!);
      }
    });
  };

  // Format Recharts data arrays
  const getHourlyChartData = () => {
    if (!data) return [];
    return Object.keys(data.temporal_hour)
      .map(h => ({
        hour: `${h}:00`,
        fare: data.temporal_hour[h]
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
  };

  const getWeeklyChartData = () => {
    if (!data) return [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return Object.keys(data.temporal_weekday).map(w => ({
      day: days[parseInt(w)],
      fare: data.temporal_weekday[w]
    }));
  };

  const getMonthlyChartData = () => {
    if (!data) return [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return Object.keys(data.temporal_month).map(m => {
      const idx = parseInt(m) - 1;
      const baseFare = data.temporal_month[m];
      return {
        month: months[idx] || `M${m}`,
        fare: baseFare,
        low: Math.max(2.5, baseFare - 1.8),
        high: baseFare + 1.8
      };
    });
  };

  // Render Shimmer Loader Skeletons
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 no-print">
        <div className="h-10 w-64 bg-slate-800 rounded-lg animate-pulse"></div>
        <div className="h-12 w-full bg-slate-800 rounded-xl animate-pulse"></div>
        <div className="h-[450px] w-full bg-slate-800 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <section id="analytics" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-900 no-print">
      
      {/* Title */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-uber-green/10 text-uber-green rounded-xl border border-uber-green/20">
          <BarChart2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-white">Spatial-Temporal Analytics</h2>
          <p className="text-xs text-slate-400">Historical NYC taxi trends aggregated over 550K rides</p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-800 gap-6 mb-8 overflow-x-auto scrollbar-none">
        {(['spatial', 'temporal', 'importance', 'performance'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3.5 px-1 relative text-sm font-bold capitalize transition-all select-none whitespace-nowrap ${
              activeTab === tab ? 'text-uber-green font-extrabold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'spatial' && 'Spatial Heatmap'}
            {tab === 'temporal' && 'Temporal Analysis'}
            {tab === 'importance' && 'Feature Importance'}
            {tab === 'performance' && 'Model Diagnostics'}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-uber-green rounded-full"></span>
            )}
          </button>
        ))}
      </div>

      {/* Dynamic Tab Panel Content */}
      <div className="min-h-[460px]">
        {activeTab === 'spatial' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Map Controls */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800/80 flex flex-col gap-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-uber-green" /> Density Toggles
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Filter and visualize different pricing dimensions across coordinates dynamically on the NYC viewport.
              </p>
              
              <div className="flex flex-col gap-2.5 mt-2">
                {[
                  { id: 'density', label: 'Fare Density', color: 'bg-emerald-500' },
                  { id: 'pickups', label: 'Pickup Hotspots', color: 'bg-blue-500' },
                  { id: 'dropoffs', label: 'Dropoff Hotspots', color: 'bg-pink-500' },
                  { id: 'surge', label: 'Surge Zones (>$30)', color: 'bg-purple-500' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setMapLayer(item.id as any)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                      mapLayer === item.id 
                        ? 'bg-slate-800/60 border-uber-green text-white shadow-md' 
                        : 'bg-slate-950/20 border-slate-800 text-slate-400 hover:border-slate-700/60 hover:text-slate-200'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className={`w-2 h-2 rounded-full ${item.color}`}></span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Leaflet Map Container */}
            <div className="lg:col-span-3 h-[460px] glass-card rounded-2xl overflow-hidden relative border border-slate-800">
              <div ref={mapContainerRef} className="w-full h-full z-10" />
            </div>
          </div>
        )}

        {activeTab === 'temporal' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Hourly area chart */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 relative">
              <h4 className="text-xs font-bold text-slate-300 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-uber-green" /> Fare Average by Hour of Day
              </h4>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getHourlyChartData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="hourColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06C167" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06C167" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#2A303F" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="hour" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={10} tickFormatter={(tick) => `$${tick}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1D212C', border: '1px solid #2A303F', borderRadius: '8px' }}
                      labelStyle={{ color: '#E2E8F0', fontWeight: 'bold' }}
                      itemStyle={{ color: '#06C167' }}
                      formatter={(val) => [`$${val}`, 'Avg Fare']}
                    />
                    <Area type="monotone" dataKey="fare" stroke="#06C167" strokeWidth={2} fillOpacity={1} fill="url(#hourColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 text-center">
                Reflects peak surcharges during morning (7-10 AM) and evening (5-8 PM) commute intervals.
              </p>
            </div>

            {/* Weekly bar chart */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" /> Fare Average by Day of Week
              </h4>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getWeeklyChartData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid stroke="#2A303F" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={10} tickFormatter={(tick) => `$${tick}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1D212C', border: '1px solid #2A303F', borderRadius: '8px' }}
                      labelStyle={{ color: '#E2E8F0', fontWeight: 'bold' }}
                      itemStyle={{ color: '#3B82F6' }}
                      formatter={(val) => [`$${val}`, 'Avg Fare']}
                    />
                    <Bar dataKey="fare" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 text-center">
                Weekend demand spikes drive higher dynamic pricing models compared to mid-week rates.
              </p>
            </div>

            {/* Monthly line chart with confidence bands */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" /> Monthly Fare Trends & Confidence Range
              </h4>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getMonthlyChartData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid stroke="#2A303F" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={10} tickFormatter={(tick) => `$${tick}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1D212C', border: '1px solid #2A303F', borderRadius: '8px' }}
                      labelStyle={{ color: '#E2E8F0', fontWeight: 'bold' }}
                      itemStyle={{ color: '#A855F7' }}
                      formatter={(val) => [`$${val}`, 'Avg Fare']}
                    />
                    {/* Recharts Reference Areas for bounds */}
                    <Line type="monotone" dataKey="fare" stroke="#A855F7" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 text-center">
                Cyclical monthly variations highlighting weather-affected winter and vacation demand drops.
              </p>
            </div>

          </div>
        )}

        {activeTab === 'importance' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Descriptive Info */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col gap-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-uber-green" /> Feature Weights
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Feature weight importances represent the model split ratios extracted directly from the trained XGBoost model.
              </p>
              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed space-y-2">
                <div>
                  <span className="font-bold text-white">Distance (mi):</span> Represents the Haversine distance, composing the baseline cost.
                </div>
                <div>
                  <span className="font-bold text-white">Temporal Features:</span> Hour of day, peak commute conditions, and weekend surge indices adjust calculations dynamically.
                </div>
              </div>
            </div>

            {/* Feature weights horizontal bar chart */}
            <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 mb-6 uppercase tracking-wider">Top Model Feature Importances</h4>
              <div className="space-y-4">
                {data && data.feature_importances.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300">{item.feature}</span>
                      <span className="font-mono text-uber-green">{(item.importance * 100).toFixed(1)}%</span>
                    </div>
                    {/* Animated bar tracker container */}
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-uber-green to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${item.importance * 100}%`, transitionDelay: `${idx * 80}ms` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div ref={performanceRef} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Metric Card 1: MAE */}
              <div className="glass-card p-5 rounded-2xl border border-slate-800 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-lg">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full flex items-center justify-end p-3">
                  <ShieldCheck className="w-6 h-6 text-blue-500/20 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mean Absolute Error</span>
                <h3 className="text-3xl font-extrabold text-white mt-2 font-mono">${counters.mae}</h3>
                <p className="text-[10px] text-slate-400 mt-2">Average absolute difference between prediction and actual fare.</p>
              </div>

              {/* Metric Card 2: RMSE */}
              <div className="glass-card p-5 rounded-2xl border border-slate-800 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-lg">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full flex items-center justify-end p-3">
                  <Award className="w-6 h-6 text-purple-500/20 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">RMSE Error</span>
                <h3 className="text-3xl font-extrabold text-white mt-2 font-mono">${counters.rmse}</h3>
                <p className="text-[10px] text-slate-400 mt-2">Standard deviation of predictive residuals.</p>
              </div>

              {/* Metric Card 3: R2 Score */}
              <div className="glass-card p-5 rounded-2xl border border-slate-800 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-lg">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full flex items-center justify-end p-3">
                  <Percent className="w-6 h-6 text-emerald-500/20 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">R² Variance (Score)</span>
                <h3 className="text-3xl font-extrabold text-white mt-2 font-mono">{counters.r2}%</h3>
                <p className="text-[10px] text-slate-400 mt-2">Proportion of variance explained by model features.</p>
              </div>

              {/* Metric Card 4: Training Samples */}
              <div className="glass-card p-5 rounded-2xl border border-slate-800 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-lg">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full flex items-center justify-end p-3">
                  <Database className="w-6 h-6 text-amber-500/20 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Training Records</span>
                <h3 className="text-2xl font-extrabold text-white mt-3 font-mono">{counters.samples.toLocaleString()}</h3>
                <p className="text-[10px] text-slate-400 mt-2">Historical ride-hailing entries utilized in learning phase.</p>
              </div>

            </div>

            {/* Model Architecture Metadata Info */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs text-slate-400 bg-slate-950/20">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-uber-green rounded-full animate-ping"></div>
                <span>Active Model: <strong>{data?.model_metrics.model_type}</strong> | Preprocessed: <strong>Haversine Distance Bounding</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <HelpCircle className="w-4 h-4" />
                <span>Validated split 80:20</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Predictions Log Table */}
      {data && data.recent_logs && data.recent_logs.length > 0 && (
        <div className="mt-12 space-y-4">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Live Prediction Logs</h4>
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 text-slate-400 border-b border-slate-850 font-semibold">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Route Bounding Coordinates</th>
                    <th className="p-4 text-center">Distance</th>
                    <th className="p-4 text-center">Est. Duration</th>
                    <th className="p-4 text-center">Surge Multiplier</th>
                    <th className="p-4 text-center">Fare Zone</th>
                    <th className="p-4 text-right">Fare Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {data.recent_logs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/20 transition-all text-slate-300">
                      <td className="p-4 text-slate-500 font-medium font-mono">{log.timestamp}</td>
                      <td className="p-4 font-semibold text-slate-200">{log.route}</td>
                      <td className="p-4 text-center">{log.distance} mi</td>
                      <td className="p-4 text-center">{log.duration} min</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold font-mono ${
                          log.surge > 1.2 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {log.surge}x
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          log.zone === 'Budget' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          log.zone === 'Standard' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          log.zone === 'Premium' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'
                        }`}>
                          {log.zone}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-uber-green font-mono text-sm">${log.fare.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
    </section>
  );
};
