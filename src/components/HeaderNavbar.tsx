import React from 'react';
import { 
  LayoutGrid, 
  Mic, 
  Users, 
  FileCheck, 
  Sparkles, 
  LogOut, 
  Building2, 
  UserPlus, 
  PhoneCall 
} from 'lucide-react';
import { ActiveTab, Organization } from '../types';

interface HeaderNavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  goldenPathStep: number | null;
  onStartGoldenPath: () => void;
  organization: Organization | null;
  onLogout: () => void;
  onOpenSchoolLogin?: () => void;
  onOpenSchoolRegister?: () => void;
  onOpenParentLogin: () => void;
  onOpenAddStudent?: () => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  activeTab,
  onTabChange,
  goldenPathStep,
  onStartGoldenPath,
  organization,
  onLogout,
  onOpenSchoolLogin,
  onOpenSchoolRegister,
  onOpenParentLogin,
  onOpenAddStudent,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white select-none sticky top-0 z-40 shadow-lg">
      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Brand & Organization Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-950/40 shrink-0">
            <span className="text-xl font-black text-white tracking-tighter">LL</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                LevelLens <span className="text-emerald-400 font-semibold">Classroom</span>
              </h1>
              {organization ? (
                <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-emerald-400" />
                  <span className="truncate max-w-[180px] sm:max-w-[240px]">{organization.name}</span>
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wide">
                  Grades 1–5
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate">
              {organization 
                ? `${organization.district ? `${organization.district}, ` : ''}${organization.state || 'Primary School Workspace'}` 
                : 'Stealth Voice Diagnostics • Fluid Cross-Grade Pods • NIPUN FLN'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {organization ? (
            <>
              {onOpenAddStudent && (
                <button
                  onClick={onOpenAddStudent}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Enroll Student</span>
                </button>
              )}

              <button
                onClick={onStartGoldenPath}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                Walkthrough
              </button>

              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 text-xs font-semibold rounded-xl transition-colors"
                title="Sign out of school workspace and return to home"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <>
              {onOpenSchoolLogin && (
                <button
                  onClick={onOpenSchoolLogin}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  School / Tuition Login
                </button>
              )}

              {onOpenSchoolRegister && (
                <button
                  onClick={onOpenSchoolRegister}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-xl transition-all"
                >
                  Register Organisation
                </button>
              )}

              <button
                onClick={onOpenParentLogin}
                className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                <span>Parent Portal</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Primary Navigation Tabs (Rendered strictly when School is logged in) */}
      {organization && (
        <nav className="bg-slate-900/90 backdrop-blur px-2 sm:px-6 border-t border-slate-800">
          <div className="max-w-7xl mx-auto flex items-center justify-around sm:justify-start gap-1 sm:gap-4 py-1.5">
            <button
              id="tab-class-map"
              onClick={() => onTabChange('class-map')}
              className={`flex-1 sm:flex-initial min-h-[44px] flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
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
              className={`flex-1 sm:flex-initial min-h-[44px] flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all relative ${
                activeTab === 'weekly-check'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Weekly Check</span>
            </button>

            <button
              id="tab-pods"
              onClick={() => onTabChange('pods')}
              className={`flex-1 sm:flex-initial min-h-[44px] flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
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
              className={`flex-1 sm:flex-initial min-h-[44px] flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
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
      )}
    </header>
  );
};
