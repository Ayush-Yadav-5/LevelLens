import React, { useState } from 'react';
import { 
  Volume2, 
  Play, 
  Sparkles, 
  LogOut, 
  Heart, 
  TrendingUp, 
  Award, 
  BookOpen, 
  CheckCircle2, 
  Calendar,
  PhoneCall,
  UserCheck
} from 'lucide-react';
import { Student, SkillPod } from '../types';

interface ParentPortalViewProps {
  student: Student;
  pods: SkillPod[];
  onLogout: () => void;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({
  student,
  pods = [],
  onLogout,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Guard against undefined or unmounted student session
  if (!student) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <p className="text-slate-300 text-sm">Student profile could not be loaded.</p>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
        >
          Return to Login
        </button>
      </div>
    );
  }

  // Safe lookups with optional chaining to prevent undefined access crashes
  const safePods = Array.isArray(pods) ? pods.filter(Boolean) : [];
  const readingPod = safePods.find(p => p?.id === student?.readingPodId);
  const mathPod = safePods.find(p => p?.id === student?.mathPodId);

  const handlePlayVoiceSummary = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = `Namaste! This is your weekly update from LevelLens Classroom. Your child ${student.name} in Grade ${student.grade} is making wonderful progress. She is reading with ${student.readingWpm} words per minute. For today's home game, practice counting five small pebbles or finding kitchen items that start with the /k/ sound. Dhanyavaad!`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92;
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(true);
      setTimeout(() => setIsPlayingAudio(false), 3000);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-12 animate-in fade-in">
      {/* Top Banner with Logout */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-lg">
            {student.name ? student.name.charAt(0) : 'S'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase font-mono">
                Parent Portal
              </span>
              <span className="text-xs text-slate-400">Roll #{student.rollNo}</span>
            </div>
            <h2 className="text-lg font-black text-white">{student.name}</h2>
            <p className="text-xs text-slate-400">Primary Grade {student.grade} Section {student.section}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Portal</span>
        </button>
      </div>

      {/* 60-Second Audio Voice Dispatch */}
      <div className="bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Weekly Teacher Voice Note</h3>
              <p className="text-[11px] text-amber-300/80">Hindi & English Voice Dispatch (60s)</p>
            </div>
          </div>

          <button
            onClick={handlePlayVoiceSummary}
            disabled={isPlayingAudio}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isPlayingAudio ? 'animate-pulse' : ''}`} />
            <span>{isPlayingAudio ? 'Speaking...' : 'Listen in Hindi'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800 font-mono">
          "Namaste! {student.name} is making wonderful progress this week. She is reading with {student.readingWpm} words per minute. Her teacher recommends practicing letter sounds together."
        </p>
      </div>

      {/* Today's 2-Minute Daily Verbal Home Game */}
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-emerald-400">
          <Sparkles className="w-4 h-4 fill-current" />
          <h3 className="font-extrabold text-sm">Today's 2-Minute Home Game (No Materials Needed)</h3>
        </div>

        <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <span>🎮 "Find the First Sound" Game</span>
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            While preparing dinner, ask {student.name}: <em>"Look around our kitchen. Can you find an item that starts with the sound <strong>/k/</strong>?"</em> (e.g. Katori, Kela, Kadhai). Give a high-five when they find it!
          </p>
        </div>
      </div>

      {/* Child's Learning Level Indicators */}
      <div className="grid grid-cols-2 gap-3">
        {/* Oral Reading Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block font-mono">
            Oral Reading Fluency
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white font-mono">{student.readingWpm}</span>
            <span className="text-xs text-slate-400">WPM</span>
          </div>
          <div className="text-xs text-slate-300">
            Accuracy: <strong className="text-emerald-400 font-mono">{student.readingAccuracy}%</strong>
          </div>
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {student.readingLevel ? student.readingLevel.replace('_', ' ') : 'PENDING'}
            </span>
          </div>
        </div>

        {/* Foundational Math Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block font-mono">
            Foundational Math
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white font-mono">
              {student.mathLatencyMs ? (student.mathLatencyMs / 1000).toFixed(1) : '0.0'}s
            </span>
            <span className="text-xs text-slate-400">speed</span>
          </div>
          <div className="text-xs text-slate-300">
            Level: <strong className="text-indigo-400">{student.mathLevel ? student.mathLevel.replace('_', ' ') : 'PENDING'}</strong>
          </div>
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[11px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {mathPod?.badgeTitle || 'Math Pod'}
            </span>
          </div>
        </div>
      </div>

      {/* Assigned Classroom Skill Pod Details */}
      {readingPod && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm">Classroom Learning Pod</h4>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {readingPod.name}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {readingPod.targetSkill}
          </p>
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Activity in class: </span>
            {readingPod.activities?.[0]?.title || 'Chalk Floor Hopscotch'}
          </div>
        </div>
      )}
    </div>
  );
};