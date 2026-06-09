import React, { useState } from 'react';
import { Target, FileText, Settings, ShieldAlert, Cpu, Database, ChevronDown, ChevronUp } from 'lucide-react';

export const ModelCard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section id="model-details" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 no-print">
      <div className="glass-card rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
        
        {/* Card Header */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-6 py-5 bg-gradient-to-r from-slate-900 to-[#161922] flex items-center justify-between border-b border-slate-800 transition-all hover:bg-slate-850 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">XGBoost Regressor Model Card</h3>
              <p className="text-xs text-slate-400">Model specifications, preprocessing logic, and evaluation metrics</p>
            </div>
          </div>
          {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {/* Card Body */}
        {isOpen && (
          <div className="p-6 md:p-8 space-y-8 bg-slate-900/40">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Summary & Training */}
              <div className="space-y-6 lg:col-span-2">
                
                <div>
                  <h4 className="flex items-center gap-2 text-md font-bold text-white mb-2">
                    <Database className="w-4 h-4 text-uber-green" /> Model Summary
                  </h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    This engine uses an <strong>XGBoost Regressor</strong> trained on a dataset of approximately 550,000 Uber rides in New York City. The model predicts the <code>fare_amount</code> target variable based on calculated spatial-temporal features, passenger counts, and trip timings. High-speed feature extraction calculates geodesic distance and identifies peak-demand rush hours to align predictions with real-world dynamic pricing models.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Preprocessing */}
                  <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800">
                    <h5 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                      <Settings className="w-4 h-4 text-blue-400" /> Key Preprocessing Steps
                    </h5>
                    <ul className="space-y-2 text-xs text-slate-400 list-disc list-inside">
                      <li>Outlier removal of ride fares less than $2.50 or greater than $200.</li>
                      <li>Geographical bounding box filtering strictly within NYC coordinates.</li>
                      <li>Geodesic distance calculation via the Haversine equation.</li>
                      <li>Temporal engineering: Hour of day, day of month, month, and day of week extraction.</li>
                      <li>Peak-demand flags (7:00-10:00 AM & 5:00-8:00 PM weekdays).</li>
                    </ul>
                  </div>

                  {/* Hyperparameters */}
                  <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800">
                    <h5 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                      <Cpu className="w-4 h-4 text-purple-400" /> Model Hyperparameters
                    </h5>
                    <ul className="space-y-2 text-xs text-slate-400 list-disc list-inside">
                      <li><strong>Estimators:</strong> 500 decision trees</li>
                      <li><strong>Max Depth:</strong> 10 (high spatial feature complexity)</li>
                      <li><strong>Learning Rate:</strong> 0.05 (slower learning for precision)</li>
                      <li><strong>Subsample:</strong> 0.8 (fraction of samples to train trees)</li>
                      <li><strong>Colsample ByTree:</strong> 0.8 (ratio of features per tree split)</li>
                    </ul>
                  </div>
                  
                </div>
              </div>

              {/* Right Column: Performance Specs */}
              <div className="space-y-6 p-5 bg-[#161922] rounded-xl border border-slate-800 h-fit">
                <h4 className="flex items-center gap-2 text-md font-bold text-white">
                  <Target className="w-4 h-4 text-emerald-400" /> Model Performance Metrics
                </h4>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-xs text-slate-400">Mean Absolute Error (MAE)</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">$2.12</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-xs text-slate-400">Root Mean Squared Error (RMSE)</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">$4.85</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-xs text-slate-400">Coefficient of Determination (R²)</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">81.4%</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-slate-400">Data Split Ratio</span>
                    <span className="text-sm font-semibold text-white font-mono">80% Train / 20% Test</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-[11px] text-slate-500 font-medium">
                    Validated against standard NYC Taxi & Limousine Commission benchmark datasets.
                  </span>
                </div>
              </div>
              
            </div>

            {/* Bottom Alert: Limitations & Ethical Notes */}
            <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/15 flex gap-3.5 items-start">
              <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20 mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">
                  Model Limitations & Ethical Considerations
                </h5>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The model performs predictions exclusively for latitude and longitude bounding coordinates within the New York City metropolitan area. Predictions outside this zone (e.g. adjacent states) will display high variance. Since the training set coordinates represent historical centroids from 2009-2015, predictions do not explicitly adapt to extreme external disruptions (e.g., pandemic traffic shifts, severe blizzards, subway failures) unless traffic multipliers are adjusted manually.
                </p>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </section>
  );
};
