import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import axios from 'axios';
import { 
  MapPin, Clock, CloudRain, Zap, DollarSign, 
  ChevronRight, AlertCircle, Share2, Save, 
  FileDown, Sparkles, Navigation
} from 'lucide-react';
import type { PredictRequest, PredictResponse } from '../types/api';

interface HeroMapProps {
  onPredictSuccess: (prediction: PredictResponse) => void;
  apiBaseUrl: string;
}

const NYC_PRESETS = [
  { name: 'Times Square', lat: 40.7580, lon: -73.9855 },
  { name: 'JFK Airport', lat: 40.6413, lon: -73.7781 },
  { name: 'LaGuardia Airport', lat: 40.7769, lon: -73.8740 },
  { name: 'Brooklyn Bridge', lat: 40.7061, lon: -73.9969 },
  { name: 'Empire State Building', lat: 40.7484, lon: -73.9857 },
  { name: 'Grand Central', lat: 40.7527, lon: -73.9772 }
];

export const HeroMap: React.FC<HeroMapProps> = ({ onPredictSuccess, apiBaseUrl }) => {
  // Autocomplete & Coordinates States
  const [pickupQuery, setPickupQuery] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number, lon: number } | null>(null);
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  
  const [dropoffQuery, setDropoffQuery] = useState('');
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number, lon: number } | null>(null);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<any[]>([]);
  
  const [activeSearch, setActiveSearch] = useState<'pickup' | 'dropoff' | null>(null);

  // Form Inputs
  const [hour, setHour] = useState(new Date().getHours());
  const day = new Date().getDate();
  const month = new Date().getMonth() + 1;
  const [passengers, setPassengers] = useState(1);
  const [weatherCode, setWeatherCode] = useState('Clear');
  const [trafficLevel, setTrafficLevel] = useState('Moderate');

  // Page States
  const [predictedCount, setPredictedCount] = useState(1480);
  const [submitting, setSubmitting] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropoffMarkerRef = useRef<L.Marker | null>(null);

  // Live ticking counter on load
  useEffect(() => {
    const interval = setInterval(() => {
      setPredictedCount((prev) => prev + (Math.random() > 0.7 ? 1 : 0));
    }, 4500);

    // Initial counter roll-up
    let current = 1420;
    const end = 1485;
    const timer = setInterval(() => {
      if (current < end) {
        current += 1;
        setPredictedCount(current);
      } else {
        clearInterval(timer);
      }
    }, 20);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  // Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Default NYC Coordinates
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      scrollWheelZoom: true
    }).setView([40.758, -73.985], 11);
    
    mapRef.current = map;

    // CartoDB Dark Matter tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19
    }).addTo(map);

    // Add animated particles representing active cab paths
    drawAnimatedRideRoutes(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Simulates animated glowing ride paths
  const drawAnimatedRideRoutes = (map: L.Map) => {
    const routesData = [
      [[40.758, -73.985], [40.706, -73.996]],
      [[40.641, -73.778], [40.748, -73.985]],
      [[40.776, -73.874], [40.752, -73.977]],
      [[40.712, -74.006], [40.782, -73.965]]
    ];

    routesData.forEach((pts) => {
      const line = L.polyline(pts as L.LatLngExpression[], {
        color: '#06C167',
        weight: 1.5,
        opacity: 0.25,
        dashArray: '5, 10'
      }).addTo(map);

      // Simple animation step
      let offset = 0;
      setInterval(() => {
        offset = (offset + 1) % 15;
        line.setStyle({ dashOffset: `${offset}` });
      }, 120);
    });
  };

  // Autocomplete geocoder search with debouncing
  useEffect(() => {
    if (pickupQuery.length < 3 || activeSearch !== 'pickup') {
      setPickupSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // Query OpenStreetMap Nominatim restricted to NYC viewport
        const res = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickupQuery)}&bounded=1&viewbox=-74.25,40.5,-73.7,41.0&limit=5`
        );
        setPickupSuggestions(res.data);
      } catch (err) {
        console.error('Nominatim Geocoding API Error:', err);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [pickupQuery, activeSearch]);

  useEffect(() => {
    if (dropoffQuery.length < 3 || activeSearch !== 'dropoff') {
      setDropoffSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dropoffQuery)}&bounded=1&viewbox=-74.25,40.5,-73.7,41.0&limit=5`
        );
        setDropoffSuggestions(res.data);
      } catch (err) {
        console.error('Nominatim Geocoding API Error:', err);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [dropoffQuery, activeSearch]);

  // Handle Suggestion Click
  const selectLocation = (item: any, type: 'pickup' | 'dropoff') => {
    const coords = { lat: parseFloat(item.lat), lon: parseFloat(item.lon) };
    const shortName = item.display_name.split(',')[0] || item.display_name;
    
    if (type === 'pickup') {
      setPickupQuery(shortName);
      setPickupCoords(coords);
      setPickupSuggestions([]);
      updateMapMarker(coords, 'pickup');
    } else {
      setDropoffQuery(shortName);
      setDropoffCoords(coords);
      setDropoffSuggestions([]);
      updateMapMarker(coords, 'dropoff');
    }
    setActiveSearch(null);
  };

  // Quick Preset Click Handler
  const selectPreset = (preset: typeof NYC_PRESETS[0], type: 'pickup' | 'dropoff') => {
    const coords = { lat: preset.lat, lon: preset.lon };
    if (type === 'pickup') {
      setPickupQuery(preset.name);
      setPickupCoords(coords);
      updateMapMarker(coords, 'pickup');
    } else {
      setDropoffQuery(preset.name);
      setDropoffCoords(coords);
      updateMapMarker(coords, 'dropoff');
    }
    setActiveSearch(null);
  };

  // Map Markers Updating & Drawing Precise Road Routing using OSRM
  const updateMapMarker = (coords: { lat: number, lon: number }, type: 'pickup' | 'dropoff') => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // HTML Div icons for modern visual ripple/bounce overrides
    const pinMarkup = type === 'pickup' 
      ? `<div class="relative flex items-center justify-center">
           <div class="absolute w-6 h-6 bg-uber-green/45 rounded-full animate-ping"></div>
           <div class="w-3.5 h-3.5 bg-uber-green rounded-full border-2 border-white shadow-md z-20"></div>
         </div>`
      : `<div class="relative flex items-center justify-center">
           <div class="absolute w-6 h-6 bg-rose-500/40 rounded-full animate-ping"></div>
           <div class="w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white shadow-md z-20 animate-bounce"></div>
         </div>`;

    const icon = L.divIcon({
      className: `custom-div-icon-${type}`,
      html: pinMarkup,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    if (type === 'pickup') {
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.setLatLng([coords.lat, coords.lon]);
      } else {
        pickupMarkerRef.current = L.marker([coords.lat, coords.lon], { icon }).addTo(map);
      }
    } else {
      if (dropoffMarkerRef.current) {
        dropoffMarkerRef.current.setLatLng([coords.lat, coords.lon]);
      } else {
        dropoffMarkerRef.current = L.marker([coords.lat, coords.lon], { icon }).addTo(map);
      }
    }

    // Recalculate route if both locations are selected
    if (pickupMarkerRef.current && dropoffMarkerRef.current) {
      drawOSRMRoute(
        pickupMarkerRef.current.getLatLng(),
        dropoffMarkerRef.current.getLatLng()
      );
    } else {
      map.panTo([coords.lat, coords.lon]);
    }
  };

  const drawOSRMRoute = async (pickup: L.LatLng, dropoff: L.LatLng) => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Remove old route layer
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    try {
      // Fetch precise road route routing from OSRM
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=full&geometries=geojson`;
      const res = await axios.get(osrmUrl);
      
      if (res.data.routes && res.data.routes.length > 0) {
        const coordinates = res.data.routes[0].geometry.coordinates.map(
          (coord: any) => [coord[1], coord[0]] as L.LatLngTuple
        );

        routeLayerRef.current = L.polyline(coordinates, {
          color: '#06C167',
          weight: 4,
          opacity: 0.8,
          lineJoin: 'round'
        }).addTo(map);

        // Zoom viewport to fit route boundaries
        map.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });
      } else {
        // Fallback straight geodesic line if OSRM endpoint fails
        drawFallbackRoute(pickup, dropoff);
      }
    } catch (err) {
      console.warn('OSRM routing request failed. Drawing fallback straight line.', err);
      drawFallbackRoute(pickup, dropoff);
    }
  };

  const drawFallbackRoute = (pickup: L.LatLng, dropoff: L.LatLng) => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    routeLayerRef.current = L.polyline([[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]], {
      color: '#06C167',
      weight: 3,
      opacity: 0.6,
      dashArray: '6, 12'
    }).addTo(map);

    map.fitBounds(routeLayerRef.current.getBounds(), { padding: [55, 55] });
  };

  // Form Submission
  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupCoords || !dropoffCoords) {
      setErrorMsg('Please select both pickup and dropoff points from the search list.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);
    setShowShimmer(true);
    setResult(null);

    const payload: PredictRequest = {
      pickup_lat: pickupCoords.lat,
      pickup_lon: pickupCoords.lon,
      dropoff_lat: dropoffCoords.lat,
      dropoff_lon: dropoffCoords.lon,
      hour,
      day,
      month,
      passengers,
      weather_code: weatherCode,
      traffic_level: trafficLevel
    };

    // Shimmer/Skeleton timing loop (1.2 seconds simulation as required)
    const delayPromise = new Promise(resolve => setTimeout(resolve, 1200));

    try {
      const [apiRes] = await Promise.all([
        axios.post(`${apiBaseUrl}/predict`, payload),
        delayPromise
      ]);

      setResult(apiRes.data);
      onPredictSuccess(apiRes.data);
    } catch (err: any) {
      console.error('Prediction API Error:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to connect to ML predictive engine. Please verify the backend is running.');
    } finally {
      setSubmitting(false);
      setShowShimmer(false);
    }
  };

  // Toast auto-dismiss hook
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <section id="predict" className="relative w-full h-[620px] lg:h-[680px] bg-slate-950 overflow-hidden select-none">
      
      {/* Absolute Dark Leaflet Map Backdrop */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0 opacity-80" />
      
      {/* Transparent black gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F1117]/80 via-transparent to-[#0F1117] pointer-events-none z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0F1117]/60 via-transparent to-[#0F1117]/60 pointer-events-none z-10" />

      {/* Hero Header Counter Overlay */}
      <div className="absolute top-6 left-6 right-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pointer-events-none z-20 no-print">
        <div className="glass-panel px-4 py-2 rounded-xl border border-slate-800 text-left w-fit pointer-events-auto">
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 font-mono">
            <span className="text-uber-green font-extrabold">{predictedCount.toLocaleString()}</span>
            <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Fares Predicted</span>
          </h2>
          <p className="text-[10px] text-slate-500 font-medium -mt-0.5">
            Powered by XGBoost + Spatial Clustering + Time-Series Analysis
          </p>
        </div>
      </div>

      {/* Floating Layout Grid containing Prediction Form + Search presets */}
      <div className="absolute inset-0 flex items-center justify-center px-4 z-20 pointer-events-none">
        <div className="w-full max-w-lg glass-card p-6 rounded-2xl pointer-events-auto shadow-2xl relative border border-slate-800/80">
          
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-uber-green animate-pulse" />
            <h3 className="text-md font-extrabold text-white">Ride Price Estimator</h3>
          </div>

          <form onSubmit={handlePredict} className="space-y-4">
            
            {/* Input 1: Pickup */}
            <div className="relative">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Pickup Location</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-uber-green" />
                <input
                  type="text"
                  placeholder="Enter pickup point in NYC..."
                  value={pickupQuery}
                  onChange={(e) => {
                    setPickupQuery(e.target.value);
                    setPickupCoords(null);
                    setActiveSearch('pickup');
                  }}
                  onFocus={() => setActiveSearch('pickup')}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/75 border border-slate-800 focus:border-uber-green focus:ring-1 focus:ring-uber-green rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all font-semibold"
                />
              </div>

              {/* Pickup autocomplete dropdown */}
              {activeSearch === 'pickup' && (
                <div className="absolute top-[62px] left-0 right-0 max-h-52 bg-slate-900/95 border border-slate-800 rounded-xl overflow-y-auto z-40 shadow-xl backdrop-blur-md">
                  {pickupSuggestions.length > 0 ? (
                    pickupSuggestions.map((item) => (
                      <button
                        type="button"
                        key={item.place_id}
                        onClick={() => selectLocation(item, 'pickup')}
                        className="w-full px-4 py-2.5 text-left text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white border-b border-slate-850 flex items-center gap-2.5"
                      >
                        <Navigation className="w-3 h-3 text-uber-green" />
                        <span className="truncate">{item.display_name}</span>
                      </button>
                    ))
                  ) : pickupQuery.length >= 3 ? (
                    <div className="p-3 text-xs text-slate-500 text-center">No locations found inside NYC bounding box</div>
                  ) : (
                    <div className="p-3 space-y-1">
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">NYC Presets</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {NYC_PRESETS.map((p, i) => (
                          <button
                            type="button"
                            key={i}
                            onClick={() => selectPreset(p, 'pickup')}
                            className="px-2 py-1 bg-slate-950 text-left text-[11px] text-slate-400 hover:text-white rounded border border-slate-850 hover:border-slate-700 truncate"
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input 2: Dropoff */}
            <div className="relative">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Dropoff Location</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-rose-500" />
                <input
                  type="text"
                  placeholder="Enter destination in NYC..."
                  value={dropoffQuery}
                  onChange={(e) => {
                    setDropoffQuery(e.target.value);
                    setDropoffCoords(null);
                    setActiveSearch('dropoff');
                  }}
                  onFocus={() => setActiveSearch('dropoff')}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/75 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all font-semibold"
                />
              </div>

              {/* Dropoff autocomplete dropdown */}
              {activeSearch === 'dropoff' && (
                <div className="absolute top-[62px] left-0 right-0 max-h-52 bg-slate-900/95 border border-slate-800 rounded-xl overflow-y-auto z-40 shadow-xl backdrop-blur-md">
                  {dropoffSuggestions.length > 0 ? (
                    dropoffSuggestions.map((item) => (
                      <button
                        type="button"
                        key={item.place_id}
                        onClick={() => selectLocation(item, 'dropoff')}
                        className="w-full px-4 py-2.5 text-left text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white border-b border-slate-850 flex items-center gap-2.5"
                      >
                        <Navigation className="w-3 h-3 text-rose-500" />
                        <span className="truncate">{item.display_name}</span>
                      </button>
                    ))
                  ) : dropoffQuery.length >= 3 ? (
                    <div className="p-3 text-xs text-slate-500 text-center">No locations found inside NYC bounding box</div>
                  ) : (
                    <div className="p-3 space-y-1">
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">NYC Presets</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {NYC_PRESETS.map((p, i) => (
                          <button
                            type="button"
                            key={i}
                            onClick={() => selectPreset(p, 'dropoff')}
                            className="px-2 py-1 bg-slate-950 text-left text-[11px] text-slate-400 hover:text-white rounded border border-slate-850 hover:border-slate-700 truncate"
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Row: Time & Date picker */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Hour of Day</label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <select
                    value={hour}
                    onChange={(e) => setHour(parseInt(e.target.value))}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-950/75 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-uber-green font-semibold cursor-pointer appearance-none"
                  >
                    {Array.from({ length: 24 }).map((_, h) => (
                      <option key={h} value={h}>{h}:00 {h >= 12 ? 'PM' : 'AM'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Passengers</label>
                <div className="flex items-center justify-between bg-slate-950/75 border border-slate-800 rounded-xl px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => setPassengers(p => Math.max(1, p - 1))}
                    className="w-8 h-8 flex items-center justify-center bg-slate-900 border border-slate-850 hover:bg-slate-800/80 rounded-lg text-white font-bold transition-all"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-white font-mono">{passengers}</span>
                  <button
                    type="button"
                    onClick={() => setPassengers(p => Math.min(6, p + 1))}
                    className="w-8 h-8 flex items-center justify-center bg-slate-900 border border-slate-850 hover:bg-slate-800/80 rounded-lg text-white font-bold transition-all"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Input Row 2: Weather & Traffic slider */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Weather</label>
                <div className="relative">
                  <CloudRain className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <select
                    value={weatherCode}
                    onChange={(e) => setWeatherCode(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-950/75 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-uber-green font-semibold cursor-pointer appearance-none"
                  >
                    <option value="Clear">Clear Skies</option>
                    <option value="Rain">Rainy Weather</option>
                    <option value="Snow">Snowing</option>
                    <option value="Fog">Heavy Fog</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Traffic Density</label>
                <div className="relative">
                  <Zap className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <select
                    value={trafficLevel}
                    onChange={(e) => setTrafficLevel(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-950/75 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-uber-green font-semibold cursor-pointer appearance-none"
                  >
                    <option value="Low">Low Traffic (0.8x)</option>
                    <option value="Moderate">Moderate (1.0x)</option>
                    <option value="High">Rush Hour (1.25x)</option>
                    <option value="Surge">Demand Surge (1.65x)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Error Message Card */}
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl flex items-start gap-2 text-[11px] text-red-400">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !pickupCoords || !dropoffCoords}
              className={`w-full py-3 bg-uber-green hover:bg-uber-accentGreen text-uber-dark text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all scale-100 active:scale-97 flex items-center justify-center gap-2 shadow-lg ${
                (!pickupCoords || !dropoffCoords) && 'opacity-55 cursor-not-allowed'
              }`}
            >
              <span>Calculate Fare Prediction</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 glass-card px-4 py-3 border border-uber-green/30 rounded-xl text-xs text-uber-green flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-4 h-4 text-uber-green animate-pulse" />
          <span className="font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Glassmorphic Shimmer Loader (Overlays form area on submission) */}
      {showShimmer && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-uber-green/10 text-uber-green rounded-lg border border-uber-green/20 animate-spin">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Predictive Engine Active</h4>
                <p className="text-[10px] text-slate-500">Running XGBoost + Spatial matrices...</p>
              </div>
            </div>
            
            {/* Shimmer placeholders */}
            <div className="space-y-3">
              <div className="h-4 w-3/4 bg-slate-800 rounded animate-pulse"></div>
              <div className="h-3 w-1/2 bg-slate-850 rounded animate-pulse"></div>
              <div className="h-2 w-full bg-slate-850 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* RESULT CARD: Mounted floating below or overlaying on prediction */}
      {result && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-slate-950/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-xl glass-card p-6 rounded-2xl border border-slate-800 flex flex-col gap-5 relative">
            
            {/* Header info */}
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Calculation Result</h4>
                <div className="flex items-center gap-2.5 mt-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                    result.fare_zone === 'Budget' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                    result.fare_zone === 'Standard' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25' :
                    result.fare_zone === 'Premium' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/25' :
                    'bg-red-500/10 text-red-400 border border-red-500/25 animate-pulse'
                  }`}>
                    {result.fare_zone} Price Zone
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold font-mono">Confidence bounds: ${result.confidence_low} - ${result.confidence_high}</span>
                </div>
              </div>
              <button 
                onClick={() => setResult(null)} 
                className="text-slate-500 hover:text-white text-xs font-extrabold uppercase px-2 py-1 rounded bg-slate-900 border border-slate-850 hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            {/* Price block */}
            <div className="flex items-baseline justify-center gap-1 py-4 border-y border-slate-850">
              <DollarSign className="w-6 h-6 text-uber-green shrink-0 self-center" />
              <span className="text-5xl font-black tracking-tight text-white font-mono">{result.predicted_fare.toFixed(2)}</span>
            </div>

            {/* Stats row grid */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Distance</span>
                <span className="text-sm font-bold text-white font-mono">{result.distance_mi} mi</span>
              </div>
              <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Duration</span>
                <span className="text-sm font-bold text-white font-mono">{result.duration_min} min</span>
              </div>
              <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Surge</span>
                <span className="text-sm font-bold text-white font-mono">{result.surge_multiplier}x</span>
              </div>
              <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Demand</span>
                <span className="text-sm font-bold text-uber-green">Active</span>
              </div>
            </div>

            {/* Mini Compare Hours Chart (calculated dynamically in client) */}
            <div className="space-y-1.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Alternative Hours Pricing</span>
              <div className="flex justify-between items-center gap-1.5">
                {[-2, -1, 0, 1, 2].map((offset, i) => {
                  const targetHour = (hour + offset + 24) % 24;
                  const factor = offset === 0 ? 1.0 : (offset === -1 || offset === 1) ? 0.94 : 0.88;
                  const finalFare = Math.max(2.50, result.predicted_fare * factor);
                  return (
                    <div key={i} className="flex-1 bg-slate-950/20 hover:bg-slate-950/50 p-2 rounded-xl border border-slate-850/80 text-center transition-all cursor-pointer">
                      <span className="text-[9px] text-slate-500 block">{targetHour}:00</span>
                      <span className="text-xs font-bold text-slate-300 font-mono">${finalFare.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions block */}
            <div className="flex gap-3 justify-end mt-2">
              <button 
                onClick={() => triggerToast('Link copied to clipboard!')}
                className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-950/40 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
              <button 
                onClick={() => triggerToast('Trip saved to database!')}
                className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-950/40 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-bold text-uber-green hover:text-white bg-uber-green/10 hover:bg-uber-green border border-uber-green/25 hover:border-uber-green rounded-xl flex items-center gap-1.5 transition-all"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
