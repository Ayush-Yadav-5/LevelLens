import React, { useState } from 'react';
import { 
  FileCheck, 
  Download, 
  Printer, 
  Share2, 
  MessageSquare, 
  Volume2, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Sparkles,
  PhoneCall,
  Play
} from 'lucide-react';
import { Student, FLNCompetency } from '../types';
import { OfficialReportModal } from './OfficialReportModal';

interface ComplianceDashboardProps {
  students: Student[];
  competencies: FLNCompetency[];
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({
  students,
  competencies,
}) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [selectedParentStudentId, setSelectedParentStudentId] = useState<string>('std-1'); // Aisha Patel
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const selectedStudent = students.find(s => s.id === selectedParentStudentId) || students[0];

  // Distribution calculations
  const total = students.length;
  const preWordCount = students.filter(s => s.readingLevel === 'PRE_WORD').length;
  const wordCount = students.filter(s => s.readingLevel === 'WORD').length;
  const sentenceCount = students.filter(s => s.readingLevel === 'SENTENCE').length;
  const gradeLevelCount = students.filter(s => s.readingLevel === 'GRADE_LEVEL').length;

  const count20Math = students.filter(s => s.mathLevel === 'COUNT_20').length;
  const patternMath = students.filter(s => s.mathLevel === 'PATTERN_OPS').length;
  const borrowMath = students.filter(s => s.mathLevel === 'BORROW_OPS').length;

  // Simulate IVR parent voice playback using browser SpeechSynthesis if available
  const handlePlayParentAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const message = `Namaste! This is your weekly update from LevelLens Classroom. ${selectedStudent.name} is making great progress. She is reading with ${selectedStudent.readingWpm} words per minute. For today's home game, practice counting five pebbles together. Thank you!`;
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.95;
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
    <div className="space-y-6">
      {/* Top Banner & 1-Click Government Report Button */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Administrative Win
            </span>
            <span className="text-xs text-slate-400 font-mono">
              National FLN Standards Alignment
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1">
            NIPUN Bharat FLN Compliance & Audit Bridge
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mt-0.5">
            Auto-maps classroom micro-skills directly to official government benchmark codes, eliminating manual weekend paperwork.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-generate-fln-report"
            onClick={() => setIsReportModalOpen(true)}
            className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all transform active:scale-95"
          >
            <FileCheck className="w-4 h-4" />
            <span>Generate Official FLN Report</span>
          </button>
        </div>
      </div>

      {/* Classroom Level Distributions (Stacked Visual Progress) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reading Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-white text-sm">
              Oral Reading Competency Distribution
            </h3>
            <span className="text-xs text-emerald-400 font-mono font-bold">
              {Math.round(((sentenceCount + gradeLevelCount) / total) * 100)}% Functional Readers
            </span>
          </div>

          {/* Stacked Bar */}
          <div className="w-full h-4 rounded-full bg-slate-800 flex overflow-hidden p-0.5 border border-slate-700">
            <div 
              style={{ width: `${(preWordCount / total) * 100}%` }} 
              className="bg-rose-500 h-full rounded-l-full transition-all duration-500" 
              title={`Pre-Word: ${preWordCount} (${Math.round((preWordCount/total)*100)}%)`}
            />
            <div 
              style={{ width: `${(wordCount / total) * 100}%` }} 
              className="bg-amber-500 h-full transition-all duration-500" 
              title={`Word Level: ${wordCount} (${Math.round((wordCount/total)*100)}%)`}
            />
            <div 
              style={{ width: `${(sentenceCount / total) * 100}%` }} 
              className="bg-yellow-400 h-full transition-all duration-500" 
              title={`Sentence Level: ${sentenceCount} (${Math.round((sentenceCount/total)*100)}%)`}
            />
            <div 
              style={{ width: `${(gradeLevelCount / total) * 100}%` }} 
              className="bg-emerald-500 h-full rounded-r-full transition-all duration-500" 
              title={`Grade Level: ${gradeLevelCount} (${Math.round((gradeLevelCount/total)*100)}%)`}
            />
          </div>

          {/* Legend Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
              <span className="block font-bold">Pre-Word</span>
              <span className="text-lg font-extrabold font-mono">{preWordCount}</span> ({Math.round((preWordCount/total)*100)}%)
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <span className="block font-bold">Word Level</span>
              <span className="text-lg font-extrabold font-mono">{wordCount}</span> ({Math.round((wordCount/total)*100)}%)
            </div>
            <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
              <span className="block font-bold">Sentence</span>
              <span className="text-lg font-extrabold font-mono">{sentenceCount}</span> ({Math.round((sentenceCount/total)*100)}%)
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <span className="block font-bold">Grade Level</span>
              <span className="text-lg font-extrabold font-mono">{gradeLevelCount}</span> ({Math.round((gradeLevelCount/total)*100)}%)
            </div>
          </div>
        </div>

        {/* Numeracy Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-white text-sm">
              Foundational Numeracy Distribution
            </h3>
            <span className="text-xs text-indigo-400 font-mono font-bold">
              {Math.round(((patternMath + borrowMath) / total) * 100)}% Basic Ops Mastered
            </span>
          </div>

          {/* Stacked Bar */}
          <div className="w-full h-4 rounded-full bg-slate-800 flex overflow-hidden p-0.5 border border-slate-700">
            <div 
              style={{ width: `${(count20Math / total) * 100}%` }} 
              className="bg-rose-500 h-full rounded-l-full transition-all duration-500" 
              title={`Count to 20: ${count20Math}`}
            />
            <div 
              style={{ width: `${(patternMath / total) * 100}%` }} 
              className="bg-amber-500 h-full transition-all duration-500" 
              title={`Basic Ops: ${patternMath}`}
            />
            <div 
              style={{ width: `${(borrowMath / total) * 100}%` }} 
              className="bg-emerald-500 h-full rounded-r-full transition-all duration-500" 
              title={`Regrouping: ${borrowMath}`}
            />
          </div>

          {/* Legend Details */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
              <span className="block font-bold">Count &lt; 20</span>
              <span className="text-lg font-extrabold font-mono">{count20Math}</span> ({Math.round((count20Math/total)*100)}%)
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <span className="block font-bold">Basic Ops</span>
              <span className="text-lg font-extrabold font-mono">{patternMath}</span> ({Math.round((patternMath/total)*100)}%)
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <span className="block font-bold">Regrouping</span>
              <span className="text-lg font-extrabold font-mono">{borrowMath}</span> ({Math.round((borrowMath/total)*100)}%)
            </div>
          </div>
        </div>
      </div>

      {/* NIPUN Bharat Competency Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-white text-base">
              National Benchmark Mapping (NIPUN Bharat FLN Indicators)
            </h3>
            <p className="text-xs text-slate-400">
              Micro-skills mapped to government indicators for state and district reporting.
            </p>
          </div>

          <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
            6 Core Indicators
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {competencies.map(comp => {
            const isCritical = comp.status === 'Critical Gap';
            const isOnTrack = comp.status === 'On Track';

            return (
              <div
                key={comp.code}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      {comp.code} (Gr {comp.grade})
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isOnTrack ? 'bg-emerald-500/20 text-emerald-300' : isCritical ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {comp.status}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-white mt-2 leading-snug">
                    {comp.description}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    <span className="text-slate-500 font-medium">Benchmark: </span>
                    {comp.benchmark}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Class Progress:</span>
                    <span className="font-mono font-bold text-white">{comp.achievedPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOnTrack ? 'bg-emerald-500' : isCritical ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${comp.achievedPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Parent Loop (WhatsApp & IVR Audio Summary) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">
                Parent Loop: IVR Audio & WhatsApp Summary
              </h3>
              <p className="text-xs text-slate-400">
                Low-literacy audio message script & 2-minute daily verbal games for parents.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Select Child:</label>
            <select
              value={selectedParentStudentId}
              onChange={(e) => setSelectedParentStudentId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} (Gr {s.grade})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Audio Message Generator Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4" />
                <span>IVR 60-Second Audio Voice Dispatch</span>
              </span>
              <button
                onClick={handlePlayParentAudio}
                disabled={isPlayingAudio}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow transition-all disabled:opacity-60"
              >
                <Play className={`w-3 h-3 fill-current ${isPlayingAudio ? 'animate-spin' : ''}`} />
                <span>{isPlayingAudio ? 'Playing TTS Audio...' : 'Simulate Parent Audio'}</span>
              </button>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg text-xs text-slate-300 font-mono leading-relaxed border border-slate-800">
              <p className="text-slate-400 italic mb-1">[Hindi / English Audio Script]:</p>
              <p>
                "Namaste! {selectedStudent.name} is making wonderful progress this week. She achieved {selectedStudent.readingWpm} words per minute on her story reading. Her teacher recommends practicing letter sounds together."
              </p>
            </div>
          </div>

          {/* Daily 2-Minute Verbal Game for Home */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Today's 2-Minute Home Game (No Materials Needed)</span>
            </span>

            <div className="p-3 bg-slate-900 rounded-lg text-xs text-slate-300 space-y-1.5 border border-slate-800">
              <h5 className="font-bold text-white text-xs">
                🎮 "Find the First Sound" Game
              </h5>
              <p className="text-slate-300 leading-relaxed">
                Ask your child: "Look around our kitchen. Can you find an item that starts with the sound /k/?" (e.g. Katori, Kela). High-five when they find it!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Official Government Report Modal */}
      {isReportModalOpen && (
        <OfficialReportModal
          students={students}
          competencies={competencies}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </div>
  );
};
