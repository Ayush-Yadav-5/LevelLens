import React from 'react';
import { 
  LayoutGrid, 
  Mic, 
  Users, 
  FileCheck, 
  WifiOff, 
  Sparkles, 
  RotateCcw,
  Smartphone,
  Tablet
} from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderNavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  goldenPathStep: number | null;
  onStartGoldenPath: () => void;
  onResetData: () => void;
  isTabletView: boolean;
  onToggleTabletView: () => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  activeTab,
  onTabChange,
  goldenPathStep,
  onStartGoldenPath,
  onResetData,
  isTabletView,
  onToggleTabletView,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white select-none sticky top-0 z-40 shadow-lg">
      {/* Mini System Status Bar (Android Tablet Aesthetic) */}
      <div className="bg-slate-950 px-4 py-1 flex items-center justify-between text-xs text-slate-400 font-mono border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            OFFLINE READY (Local DB Active)
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-400">
            Govt. Primary School #4 (Jaipur Cluster) • Gr 2–4 Composite
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleTabletView}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Toggle Android Tablet View Frame"
          >
            {isTabletView ? (
              <>
                <Smartphone className="w-3 h-3 text-emerald-400" />
                <span className="hidden md:inline">Full Width</span>
              </>
            ) : (
              <>
                <Tablet className="w-3 h-3 text-emerald-400" />
                <span className="hidden md:inline">Tablet Bezel</span>
              </>
            )}
          </button>
          <button
            onClick={onResetData}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset students and assessments to initial state"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Reset Demo</span>
          </button>
          <span className="text-emerald-400 font-semibold">100% 🔋</span>
        </div>
      </div>

      {/* Main Header & Golden Path Quick Demo Launch */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-950/40">
              <span className="text-xl font-black text-white tracking-tighter">LL</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                  LevelLens <span className="text-emerald-400 font-semibold">Classroom</span>
                </h1>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wide">
                  NIPUN FLN OS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Stealth Voice Diagnostics & Dynamic Skill Pods
              </p>
            </div>
          </div>

          {/* Quick Demo Trigger Button (Mobile) */}
          <button
            onClick={onStartGoldenPath}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-bold rounded-lg shadow"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            3-Min Demo
          </button>
        </div>

        {/* 3-Minute Hackathon Golden Path Flow Pill Guide */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-1.5 flex items-center gap-1 sm:gap-2 text-xs overflow-x-auto">
          <span className="hidden lg:flex items-center gap-1 text-[11px] font-bold text-amber-300 px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20 uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            Golden Path:
          </span>

          <button
            onClick={() => onTabChange('weekly-check')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'weekly-check'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-900/30 flex items-center justify-center text-[10px] font-bold">1</span>
            <span>Stealth Check</span>
          </button>

          <span className="text-slate-600 font-bold">→</span>

          <button
            onClick={() => onTabChange('pods')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'pods'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-900/30 flex items-center justify-center text-[10px] font-bold">2</span>
            <span>Re-Clustering</span>
          </button>

          <span className="text-slate-600 font-bold">→</span>

          <button
            onClick={() => onTabChange('class-map')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'class-map'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-900/30 flex items-center justify-center text-[10px] font-bold">3</span>
            <span>Heatmap</span>
          </button>

          <span className="text-slate-600 font-bold">→</span>

          <button
            onClick={() => onTabChange('compliance')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'compliance'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-900/30 flex items-center justify-center text-[10px] font-bold">4</span>
            <span>FLN Report</span>
          </button>

          <button
            onClick={onStartGoldenPath}
            className="hidden md:flex items-center gap-1.5 ml-2 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold rounded-lg shadow-sm whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            Walkthrough
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs (Android Large Touch Targets) */}
      <nav className="bg-slate-900/90 backdrop-blur px-2 sm:px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-around sm:justify-start gap-1 sm:gap-4 py-1.5">
          <button
            id="tab-class-map"
            onClick={() => onTabChange('class-map')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'class-map'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Class Map</span>
          </button>

          <button
            id="tab-weekly-check"
            onClick={() => onTabChange('weekly-check')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all relative ${
              activeTab === 'weekly-check'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Weekly Check</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 animate-ping" />
          </button>

          <button
            id="tab-pods"
            onClick={() => onTabChange('pods')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'pods'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Skill Pods</span>
          </button>

          <button
            id="tab-compliance"
            onClick={() => onTabChange('compliance')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'compliance'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>NIPUN FLN</span>
          </button>
        </div>
      </nav>
    </header>
  );
};
