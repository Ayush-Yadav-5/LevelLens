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
    <header className="bg-slate-900 border-b border-slate-800 text-white select-none sticky top-0 z-40 shadow-lg w-full">
      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Organization Title */}
        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-950/40 shrink-0 mt-0.5 sm:mt-0">
            <span className="text-lg sm:text-xl font-black text-white tracking-tighter">LL</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-white">
                LevelLens <span className="text-emerald-400 font-semibold">Classroom</span>
              </h1>
              {organization ? (
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="break-words">{organization.name}</span>
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-300 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wide shrink-0">
                  Grades 1–5
                </span>
              )}
            </div>
            {/* Subtitle now wraps normally without any ... or truncation */}
            <p className="text-[11px] sm:text-xs text-slate-400 leading-normal break-words whitespace-normal mt-0.5">
              {organization 
                ? `${organization.district ? `${organization.district}, ` : ''}${organization.state || 'Primary School Workspace'}` 
                : 'Stealth Voice Diagnostics • Fluid Cross-Grade Pods • NIPUN FLN'}
            </p>
          </div>
        </div>

        {/* Action Controls - Wraps across lines without clipping */}
        <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end w-full md:w-auto pt-1 sm:pt-0">
          {organization ? (
            <>
              {onOpenAddStudent && (
                <button
                  onClick={onOpenAddStudent}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5 shrink-0" />
                  <span>Enroll Student</span>
                </button>
              )}

              <button
                onClick={onStartGoldenPath}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 fill-current shrink-0" />
                <span>Walkthrough</span>
              </button>

              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 text-xs font-semibold rounded-xl transition-colors"
                title="Sign out of school workspace and return to home"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <>
              {onOpenSchoolLogin && (
                <button
                  onClick={onOpenSchoolLogin}
                  className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 text-center leading-snug"
                >
                  School / Tuition Login
                </button>
              )}

              {onOpenSchoolRegister && (
                <button
                  onClick={onOpenSchoolRegister}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-xl transition-all text-center leading-snug"
                >
                  Register Organisation
                </button>
              )}

              <button
                onClick={onOpenParentLogin}
                className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors text-center leading-snug"
              >
                <PhoneCall className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Parent Portal</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      {organization && (
        <nav className="bg-slate-900/90 backdrop-blur px-2 sm:px-6 border-t border-slate-800 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto flex items-center justify-start sm:justify-start gap-1.5 sm:gap-4 py-1.5 min-w-max sm:min-w-0">
            <button
              id="tab-class-map"
              onClick={() => onTabChange('class-map')}
              className={`min-h-[40px] sm:min-h-[44px] flex items-center justify-center gap-2 px-3 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                activeTab === 'class-map'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span>Class Map</span>
            </button>

            <button
              id="tab-weekly-check"
              onClick={() => onTabChange('weekly-check')}
              className={`min-h-[40px] sm:min-h-[44px] flex items-center justify-center gap-2 px-3 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all relative ${
                activeTab === 'weekly-check'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Mic className="w-4 h-4 shrink-0" />
              <span>Weekly Check</span>
            </button>

            <button
              id="tab-pods"
              onClick={() => onTabChange('pods')}
              className={`min-h-[40px] sm:min-h-[44px] flex items-center justify-center gap-2 px-3 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                activeTab === 'pods'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Skill Pods</span>
            </button>

            <button
              id="tab-compliance"
              onClick={() => onTabChange('compliance')}
              className={`min-h-[40px] sm:min-h-[44px] flex items-center justify-center gap-2 px-3 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                activeTab === 'compliance'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <FileCheck className="w-4 h-4 shrink-0" />
              <span>NIPUN FLN</span>
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};