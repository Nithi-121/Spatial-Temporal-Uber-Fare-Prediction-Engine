import React from 'react';
import { Car, Moon, Sun } from 'lucide-react';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, setDarkMode }) => {
  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-uber-border/40 backdrop-blur-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-uber-green/10 rounded-xl border border-uber-green/20 text-uber-green animate-pulse-slow">
            <Car className="w-5.5 h-5.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-uber-green bg-clip-text text-transparent">
              FareLens
            </span>
            <span className="text-[10px] text-slate-500 font-medium -mt-1 tracking-wider uppercase">
              Predictive Engine
            </span>
          </div>
          <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-uber-green/10 text-uber-green border border-uber-green/20 rounded">
            v1.0
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#predict" className="hover:text-uber-green transition-colors">Predict</a>
          <a href="#analytics" className="hover:text-uber-green transition-colors">Analytics Dashboard</a>
          <a href="#model-details" className="hover:text-uber-green transition-colors">Model Specs</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/40 rounded-xl border border-transparent hover:border-slate-800/60 transition-all active:scale-95"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
          </button>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 hover:bg-slate-850 rounded-xl text-white transition-all scale-100 active:scale-95 shadow-sm"
          >
            <svg className="w-4 h-4 text-slate-400 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
            <span className="hidden sm:inline">Star</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-uber-green text-uber-dark rounded-md">1.2K</span>
          </a>
        </div>
      </div>
    </header>
  );
};
