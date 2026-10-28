import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Calculator, 
  History, 
  AlertCircle, 
  Sparkles, 
  Layers,
  Pencil,
  Trash2,
  Phone,
  AlertTriangle
} from 'lucide-react';
import { Student, SkillPod, ReadingLevel } from '../types';
import { aiService } from '../services/aiService';

interface StudentDrawerProps {
  student: Student | null;
  pods: SkillPod[];
  onClose: () => void;
  onStartWeeklyCheck: (studentId: string, domain?: 'both' | 'reading' | 'math') => void;
  onReassignPod: (studentId: string, domain: 'reading' | 'math', newPodId: any) => void;
  onEditStudent?: (student: Student) => void;
  onDeleteStudent?: (studentId: string) => void;
}

export const StudentDrawer: React.FC<StudentDrawerProps> = ({
  student,
  pods,
  onClose,
  onStartWeeklyCheck,
  onReassignPod,
  onEditStudent,
  onDeleteStudent,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!student) return null;

  const currentReadingPod = pods.find(p => p.id === student.readingPodId);
  const currentMathPod = pods.find(p => p.id === student.mathPodId);

  const getReadingColor = (level: ReadingLevel) => {
    switch (level) {
      case 'PRE_WORD': return 'text-rose-400 bg-rose-500/20 border-rose-500/40';
      case 'WORD': return 'text-amber-400 bg-amber-500/20 border-amber-500/40';
      case 'SENTENCE': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'GRADE_LEVEL': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';
    }
  };

  const handleConfirmDelete = () => {
    if (onDeleteStudent) {
      onDeleteStudent(student.id);
    }
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
        <div 
          className="bg-slate-900 border border-slate-700 w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                {student.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-extrabold text-white">{student.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold">
                    Roll #{student.rollNo}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                    Grade {student.grade}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                    Sec {student.section || 'A'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 font-mono text-slate-300">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    +91 {student.parentPhone}
                  </span>
                  <span>•</span>
                  <span>Gender: {student.gender === 'F' ? 'Female' : 'Male'}</span>
                  <span>•</span>
                  <span>Last Assessed: <span className="text-slate-200">{student.lastAssessedDate}</span></span>
                </div>
              </div>
            </div>

            {/* Action Toolbar */}
            <div className="flex items-center gap-1.5 shrink-0">
              {onEditStudent && (
                <button
                  onClick={() => onEditStudent(student)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold border border-slate-700"
                  title="Edit student details"
                >
                  <Pencil className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              )}

              {onDeleteStudent && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 rounded-lg transition-colors border border-slate-700 hover:border-rose-800"
                  title="Delete student"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1 text-xs sm:text-sm">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  onClose();
                  onStartWeeklyCheck(student.id, 'reading');
                }}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95 text-xs sm:text-sm"
              >
                <BookOpen className="w-4 h-4" />
                <span>Launch Oral Reading Check</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onStartWeeklyCheck(student.id, 'math');
                }}
                className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95 text-xs sm:text-sm"
              >
                <Calculator className="w-4 h-4" />
                <span>Launch Mental Math Check</span>
              </button>
            </div>

            {/* Current Diagnostic Level Badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-slate-300">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    Oral Reading Level
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getReadingColor(student.readingLevel)}`}>
                    {student.readingLevel.replace('_', ' ')}
                  </span>
                  <span className="text-base font-extrabold font-mono text-white">
                    {student.readingWpm} <span className="text-xs font-normal text-slate-400">WPM</span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Decoding Accuracy:</span>
                  <span className="font-mono text-emerald-400 font-bold">{student.readingAccuracy}%</span>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-slate-300">
                    <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                    Numeracy Band
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    {student.mathLevel.replace('_', ' ')}
                  </span>
                  <span className="text-base font-extrabold font-mono text-white">
                    {(student.mathLatencyMs / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-400">sec</span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Mental Math Speed:</span>
                  <span className="font-mono text-indigo-400 font-bold">
                    {student.mathLatencyMs < 3500 ? 'Fast' : 'Needs Practice'}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Skill Pods Assignment & Override */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Assigned Skill Pods (Cross-Grade Cohorts)</span>
                </div>
                <span className="text-[10px] text-slate-400">Teacher 1-Tap Override</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-900/90 border border-slate-700 p-2.5 rounded-lg space-y-1.5">
                  <label className="text-[11px] text-slate-400 font-medium block">Reading Pod:</label>
                  <select
                    value={student.readingPodId}
                    onChange={(e) => onReassignPod(student.id, 'reading', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="R1">R1: Sound Sleuths (Pre-Word / Phonics)</option>
                    <option value="R2">R2: Word Builders (Word Fluency)</option>
                    <option value="R3">R3: Story Explorers (Grade Level)</option>
                  </select>
                  <p className="text-[10px] text-emerald-400">
                    Focus: {currentReadingPod?.targetSkill || 'Phonics'}
                  </p>
                </div>

                <div className="bg-slate-900/90 border border-slate-700 p-2.5 rounded-lg space-y-1.5">
                  <label className="text-[11px] text-slate-400 font-medium block">Math Pod:</label>
                  <select
                    value={student.mathPodId}
                    onChange={(e) => onReassignPod(student.id, 'math', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="M1">M1: Number Friends (Count to 20)</option>
                    <option value="M2">M2: Pattern Masters (Basic Ops)</option>
                    <option value="M3">M3: Borrowing Detectives (Regrouping)</option>
                  </select>
                  <p className="text-[10px] text-indigo-400">
                    Focus: {currentMathPod?.targetSkill || 'Operations'}
                  </p>
                </div>
              </div>
            </div>

            {/* Diagnostic Flags */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Diagnostic Flags & Cognitive Gaps</span>
              </h4>
              
              <div className="space-y-1.5">
                {student.phoneticFlags.map((flag, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{flag}</span>
                  </div>
                ))}
                {student.mathFlags.map((flag, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Dynamic Step Calibration */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Next Dynamic Quest (Calibrated)</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Gradual Step
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-emerald-400">Oral Reading:</strong> {aiService.calculateNextReadingTier(student).reason}
              </p>
              <p className="text-xs text-indigo-300 leading-relaxed pt-1.5 border-t border-slate-800/80">
                <strong className="text-indigo-400">Mental Math:</strong> {aiService.calculateNextMathTier(student).reason}
              </p>
            </div>

            {/* Assessment History */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>Assessment History Trajectory</span>
              </h4>

              {student.history.length > 0 ? (
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
                  {student.history.map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/80 last:border-0">
                      <span className="text-slate-400 font-mono">{rec.date}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-400 font-bold">
                          {rec.readingWpm} WPM ({rec.readingAccuracy}%)
                        </span>
                        <span className="text-slate-500">|</span>
                        <span className="font-mono text-indigo-400">
                          {(rec.mathLatencyMs / 1000).toFixed(1)}s Math
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-2 bg-slate-950/40 rounded-lg">
                  No past check sessions recorded yet. Run the first Weekly Check above!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inline Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl text-slate-100 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white">Delete Student Record?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to remove <strong className="text-white">{student.name}</strong> (Roll #{student.rollNo})? All diagnostic records, assessments, and pod allocations will be permanently deleted.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};