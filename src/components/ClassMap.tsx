import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Calculator, 
  Sparkles,
  ChevronRight,
  UserPlus,
  Users,
  Layers,
  Zap,
  X
} from 'lucide-react';
import { Student, ReadingLevel, MathLevel, PrimaryGrade } from '../types';

interface ClassMapProps {
  students: Student[];
  onSelectStudent: (id: string) => void;
  onStartWeeklyCheck: (id: string, domain?: 'reading' | 'math') => void;
  onOpenAddStudent?: () => void;
}

const POD_NAMES: Record<string, string> = {
  R1: 'Sound Sleuths',
  R2: 'Word Builders',
  R3: 'Story Explorers',
  M1: 'Number Friends',
  M2: 'Pattern Masters',
  M3: 'Borrowing Detectives',
};

// Check if student has been assessed this week for a specific subject
export const isReadingAssessed = (s: Student): boolean => {
  if (typeof s.assessedReadingThisWeek === 'boolean') return s.assessedReadingThisWeek;
  return Boolean(s.assessedThisWeek && (s.readingWpm > 0 || s.readingAccuracy > 0));
};

export const isMathAssessed = (s: Student): boolean => {
  if (typeof s.assessedMathThisWeek === 'boolean') return s.assessedMathThisWeek;
  return Boolean(s.assessedThisWeek && s.mathLatencyMs > 0);
};

export const ClassMap: React.FC<ClassMapProps> = ({
  students,
  onSelectStudent,
  onStartWeeklyCheck,
  onOpenAddStudent,
}) => {
  const [activeSubject, setActiveSubject] = useState<'reading' | 'math'>('reading');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReadingFilter, setSelectedReadingFilter] = useState<'ALL' | ReadingLevel>('ALL');
  const [selectedMathFilter, setSelectedMathFilter] = useState<'ALL' | MathLevel>('ALL');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<'ALL' | PrimaryGrade>('ALL');

  // Reading Stats
  const totalStudents = students.length;
  const assessedReadingCount = students.filter(isReadingAssessed).length;
  const assessedMathCount = students.filter(isMathAssessed).length;
  const gradeLevelCount = students.filter(s => s.readingLevel === 'GRADE_LEVEL').length;
  const preWordCount = students.filter(s => s.readingLevel === 'PRE_WORD').length;
  const avgReadingWpm = totalStudents > 0 
    ? Math.round(students.reduce((acc, s) => acc + (s.readingWpm || 0), 0) / totalStudents) 
    : 0;

  // Math Stats
  const borrowOpsCount = students.filter(s => s.mathLevel === 'BORROW_OPS').length;
  const patternOpsCount = students.filter(s => s.mathLevel === 'PATTERN_OPS').length;
  const count20Count = students.filter(s => s.mathLevel === 'COUNT_20').length;
  const avgMathLatency = totalStudents > 0
    ? (students.reduce((acc, s) => acc + (s.mathLatencyMs || 0), 0) / totalStudents / 1000).toFixed(1)
    : '0.0';

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            s.rollNo.toString().includes(searchQuery);
      const matchesGrade = selectedGradeFilter === 'ALL' || s.grade === selectedGradeFilter;
      
      if (activeSubject === 'reading') {
        const matchesReading = selectedReadingFilter === 'ALL' || s.readingLevel === selectedReadingFilter;
        return matchesSearch && matchesGrade && matchesReading;
      } else {
        const matchesMath = selectedMathFilter === 'ALL' || s.mathLevel === selectedMathFilter;
        return matchesSearch && matchesGrade && matchesMath;
      }
    });
  }, [students, searchQuery, selectedReadingFilter, selectedMathFilter, selectedGradeFilter, activeSubject]);

  // Visual helper for Reading level styling
  const getReadingLevelBadge = (level: ReadingLevel) => {
    switch (level) {
      case 'PRE_WORD':
        return {
          label: 'Pre-Word',
          bg: 'bg-rose-500/15',
          text: 'text-rose-400',
          border: 'border-rose-500/50',
          dot: 'bg-rose-500',
          podName: 'R1 Sound Sleuths',
        };
      case 'WORD':
        return {
          label: 'Word',
          bg: 'bg-amber-500/15',
          text: 'text-amber-400',
          border: 'border-amber-500/50',
          dot: 'bg-amber-500',
          podName: 'R2 Word Builders',
        };
      case 'SENTENCE':
        return {
          label: 'Sentence',
          bg: 'bg-yellow-500/15',
          text: 'text-yellow-300',
          border: 'border-yellow-500/50',
          dot: 'bg-yellow-400',
          podName: 'R3 Story Explorers',
        };
      case 'GRADE_LEVEL':
        return {
          label: 'Grade Level',
          bg: 'bg-emerald-500/15',
          text: 'text-emerald-300',
          border: 'border-emerald-500/50',
          dot: 'bg-emerald-400',
          podName: 'R3 Story Explorers',
        };
    }
  };

  // Visual helper for Math level styling
  const getMathLevelBadge = (level: MathLevel) => {
    switch (level) {
      case 'COUNT_20':
        return { 
          label: 'Count ≤ 20', 
          bg: 'bg-rose-500/15',
          text: 'text-rose-400', 
          border: 'border-rose-500/50',
          dot: 'bg-rose-500',
          podName: 'M1 Number Friends',
        };
      case 'PATTERN_OPS':
        return { 
          label: 'Basic Ops', 
          bg: 'bg-amber-500/15',
          text: 'text-amber-300', 
          border: 'border-amber-500/50',
          dot: 'bg-amber-500',
          podName: 'M2 Pattern Masters',
        };
      case 'BORROW_OPS':
        return { 
          label: 'Regrouping', 
          bg: 'bg-emerald-500/15',
          text: 'text-emerald-300', 
          border: 'border-emerald-500/50',
          dot: 'bg-emerald-400',
          podName: 'M3 Borrowing Detectives',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Classroom Subject Switcher Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Subject View:
          </span>
          <div className="inline-flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              id="btn-view-english"
              onClick={() => setActiveSubject('reading')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                activeSubject === 'reading'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>English (Reading & Fluency)</span>
            </button>

            <button
              id="btn-view-maths"
              onClick={() => setActiveSubject('math')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                activeSubject === 'math'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Mathematics (Mental Ops & Latency)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active: {activeSubject === 'reading' ? 'Oral Fluency Heatmap' : 'Numeracy Speed Heatmap'}</span>
        </div>
      </div>

      {/* Top Classroom Metric Cards (Tailored by Active Subject) */}
      {activeSubject === 'reading' ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 animate-in fade-in duration-200">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Weekly Oral Checks</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-white">{assessedReadingCount}</span>
              <span className="text-xs text-slate-400">/ {totalStudents} completed</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${totalStudents > 0 ? (assessedReadingCount / totalStudents) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>At Grade Level</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-emerald-400">
                {totalStudents > 0 ? Math.round((gradeLevelCount / totalStudents) * 100) : 0}%
              </span>
              <span className="text-xs text-slate-400">({gradeLevelCount} students)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Target: &gt;75% NIPUN FLN</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Pre-Word (Priority)</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-rose-400">{preWordCount}</span>
              <span className="text-xs text-slate-400">need phonics pod</span>
            </div>
            <p className="text-[11px] text-rose-300/80 mt-1">Sound Sleuths (R1)</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Class Avg Speed</span>
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-white font-mono">{avgReadingWpm}</span>
              <span className="text-xs text-slate-400">words / min</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">FLN Benchmark: 30–45 WPM</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 animate-in fade-in duration-200">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Weekly Math Checks</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-white">{assessedMathCount}</span>
              <span className="text-xs text-slate-400">/ {totalStudents} completed</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${totalStudents > 0 ? (assessedMathCount / totalStudents) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Mastery: Regrouping</span>
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-emerald-400">
                {totalStudents > 0 ? Math.round((borrowOpsCount / totalStudents) * 100) : 0}%
              </span>
              <span className="text-xs text-slate-400">({borrowOpsCount} students)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Borrowing Detectives (M3)</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Count ≤ 20 (Priority)</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-rose-400">{count20Count}</span>
              <span className="text-xs text-slate-400">need ten-frame support</span>
            </div>
            <p className="text-[11px] text-rose-300/80 mt-1">Number Friends (M1)</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Avg Mental Latency</span>
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-white font-mono">{avgMathLatency}s</span>
              <span className="text-xs text-slate-400">per response</span>
            </div>
            <p className="text-[11px] text-indigo-300/80 mt-1">Target: &lt;4.0s mental ops</p>
          </div>
        </div>
      )}

      {/* Classroom Heatmap Legend, Add Student & Filters - Responsive 2-Tier Layout */}
      <div className="bg-slate-800/95 border border-slate-700/80 rounded-2xl p-3 sm:p-4 space-y-3 shadow-md">
        {/* Tier 1: Responsive Search, Count Badge & Enroll Student Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Box with Fluid Width & Clear button */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search student name or roll #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Counter and Enroll Student Button */}
          <div className="flex items-center gap-2 justify-between sm:justify-end shrink-0">
            <span className="text-[11px] font-mono text-slate-400 px-2.5 py-1 bg-slate-900/80 border border-slate-700/60 rounded-lg">
              Showing <span className="text-white font-bold">{filteredStudents.length}</span> of {totalStudents}
            </span>

            {onOpenAddStudent && (
              <button
                onClick={onOpenAddStudent}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Enroll Student</span>
              </button>
            )}
          </div>
        </div>

        {/* Tier 2: Level Filters (Left) & Grade 1-5 Filter (Right) */}
        <div className="pt-2.5 border-t border-slate-700/60 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Dynamic Level Filters for Active Subject with Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs no-scrollbar min-w-0">
            <span className="text-slate-400 text-[11px] font-semibold mr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3 text-emerald-400" />
              <span>{activeSubject === 'reading' ? 'Reading Band:' : 'Math Band:'}</span>
            </span>

            {activeSubject === 'reading' ? (
              <>
                <button
                  onClick={() => setSelectedReadingFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                    selectedReadingFilter === 'ALL'
                      ? 'bg-slate-700 text-white shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  All ({totalStudents})
                </button>
                <button
                  onClick={() => setSelectedReadingFilter('PRE_WORD')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all ${
                    selectedReadingFilter === 'PRE_WORD'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-rose-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  Pre-Word
                </button>
                <button
                  onClick={() => setSelectedReadingFilter('WORD')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all ${
                    selectedReadingFilter === 'WORD'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-amber-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  Word
                </button>
                <button
                  onClick={() => setSelectedReadingFilter('SENTENCE')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all ${
                    selectedReadingFilter === 'SENTENCE'
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-yellow-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                  Sentence
                </button>
                <button
                  onClick={() => setSelectedReadingFilter('GRADE_LEVEL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all ${
                    selectedReadingFilter === 'GRADE_LEVEL'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-emerald-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  Grade Level
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setSelectedMathFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                    selectedMathFilter === 'ALL'
                      ? 'bg-slate-700 text-white shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  All ({totalStudents})
                </button>
                <button
                  onClick={() => setSelectedMathFilter('COUNT_20')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all ${
                    selectedMathFilter === 'COUNT_20'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-rose-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  Count ≤ 20
                </button>
                <button
                  onClick={() => setSelectedMathFilter('PATTERN_OPS')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all ${
                    selectedMathFilter === 'PATTERN_OPS'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-amber-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  Basic Ops
                </button>
                <button
                  onClick={() => setSelectedMathFilter('BORROW_OPS')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all ${
                    selectedMathFilter === 'BORROW_OPS'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-emerald-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  Regrouping
                </button>
              </>
            )}
          </div>

          {/* Grade 1-5 Filter for Primary Schools */}
          <div className="flex items-center gap-1 text-xs shrink-0 flex-wrap">
            <span className="text-slate-400 text-[11px] font-semibold mr-1">Grade:</span>
            {(['ALL', 1, 2, 3, 4, 5] as const).map(gr => (
              <button
                key={gr}
                onClick={() => setSelectedGradeFilter(gr as 'ALL' | PrimaryGrade)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedGradeFilter === gr
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-900 border border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                {gr === 'ALL' ? 'All' : `Gr ${gr}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Classroom Seating Grid Visual (Teacher Blackboard at Top) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative min-h-[320px]">
        {/* Simulated Teacher Blackboard / Stage Front */}
        <div className="w-full max-w-md mx-auto mb-5 py-1.5 px-4 bg-slate-800/80 rounded-lg border border-slate-700/80 text-center shadow-inner">
          <div className="text-[11px] font-mono tracking-widest text-emerald-400 font-bold uppercase flex items-center justify-center gap-2">
            <span>════</span>
            <span>TEACHER DESK & CHALKBOARD (FRONT)</span>
            <span>════</span>
          </div>
        </div>

        {/* Empty Roster State */}
        {students.length === 0 ? (
          <div className="py-12 px-4 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Your Classroom Roster is Empty</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Add students from Grades 1 to 5 to start running stealth voice diagnostics and fluid grouping pods.
              </p>
            </div>
            <div className="flex items-center justify-center pt-2">
              {onOpenAddStudent && (
                <button
                  onClick={onOpenAddStudent}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Enroll First Student</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Student Desk Heatmap Grid - Fluid Breakpoints */
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {filteredStudents.map((student) => {
              const readingBadge = getReadingLevelBadge(student.readingLevel);
              const mathBadge = getMathLevelBadge(student.mathLevel);

              // Use active subject to dictate desk primary border and prominent chip
              const isReadingMode = activeSubject === 'reading';
              const borderStyle = isReadingMode ? readingBadge.border : mathBadge.border;

              return (
                <div
                  key={student.id}
                  id={`desk-${student.id}`}
                  onClick={() => onSelectStudent(student.id)}
                  className={`group relative bg-slate-800/90 rounded-xl p-3 border-2 ${borderStyle} hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-950/40 hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between`}
                >
                  {/* Desk Card Header */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        R#{student.rollNo} • Gr {student.grade}
                      </span>
                      {isReadingMode ? (
                        isReadingAssessed(student) ? (
                          <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 font-semibold" title="Oral check completed this week">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Oral Done</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] text-amber-400 font-medium" title="Oral check pending this week">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>Oral Due</span>
                          </span>
                        )
                      ) : (
                        isMathAssessed(student) ? (
                          <span className="inline-flex items-center gap-1 text-[9px] text-indigo-400 font-semibold" title="Math check completed this week">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            <span>Math Done</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] text-amber-400 font-medium" title="Math check pending this week">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>Math Due</span>
                          </span>
                        )
                      )}
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-emerald-300">
                      {student.name}
                    </h4>
                  </div>

                  {/* Metrics & Badges (Dynamically prioritized based on activeSubject) */}
                  <div className="mt-2.5 space-y-1.5">
                    {isReadingMode ? (
                      <>
                        {/* Primary Reading Badge */}
                        <div className={`flex items-center justify-between px-2 py-0.5 rounded text-[10px] font-bold ${readingBadge.bg} ${readingBadge.text}`}>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-2.5 h-2.5" />
                            {readingBadge.label}
                          </span>
                          <span className="font-mono">{student.readingWpm} wpm</span>
                        </div>

                        {/* Secondary Math Indicator */}
                        <div className="flex items-center justify-between text-[10px] px-1 text-slate-300">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Calculator className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[70px]">{mathBadge.label}</span>
                          </span>
                          <span className="font-mono text-slate-400">{(student.mathLatencyMs / 1000).toFixed(1)}s</span>
                        </div>

                        {/* Pod Badge */}
                        <div className="text-[9px] px-1 text-slate-400 flex items-center gap-1 truncate font-mono">
                          <Layers className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{student.readingPodId}: {POD_NAMES[student.readingPodId] || 'Reading Pod'}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Primary Math Badge */}
                        <div className={`flex items-center justify-between px-2 py-0.5 rounded text-[10px] font-bold ${mathBadge.bg} ${mathBadge.text}`}>
                          <span className="flex items-center gap-1">
                            <Calculator className="w-2.5 h-2.5" />
                            {mathBadge.label}
                          </span>
                          <span className="font-mono">{(student.mathLatencyMs / 1000).toFixed(1)}s</span>
                        </div>

                        {/* Secondary Reading Indicator */}
                        <div className="flex items-center justify-between text-[10px] px-1 text-slate-300">
                          <span className="flex items-center gap-1 text-slate-400">
                            <BookOpen className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[70px]">{readingBadge.label}</span>
                          </span>
                          <span className="font-mono text-slate-400">{student.readingWpm} wpm</span>
                        </div>

                        {/* Pod Badge */}
                        <div className="text-[9px] px-1 text-slate-400 flex items-center gap-1 truncate font-mono">
                          <Layers className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                          <span className="truncate">{student.mathPodId}: {POD_NAMES[student.mathPodId] || 'Math Pod'}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Hover / Active Drill-Down Cue */}
                  <div className="mt-2 pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400 group-hover:text-emerald-300">
                    <span>View Diagnostic</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Classroom Legend (Dynamically tailored for English vs Maths) */}
        {students.length > 0 && (
          <div className="mt-6 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
            {activeSubject === 'reading' ? (
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-semibold text-slate-300 text-xs">Reading Heatmap Key:</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500" />
                  <span>Red = Pre-Word (&lt;25 WPM)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                  <span>Orange = Word (25-35 WPM)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-yellow-400" />
                  <span>Yellow = Sentence (35-45 WPM)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-400" />
                  <span>Green = Grade Level (45+ WPM)</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-semibold text-slate-300 text-xs">Numeracy Heatmap Key:</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500" />
                  <span>Red = Count ≤ 20 (Target: 1-to-1 correspondence)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                  <span>Orange = Basic Ops (Addition & Subtraction within 20)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-400" />
                  <span>Green = Regrouping & Borrowing (Two-digit fast operations)</span>
                </div>
              </div>
            )}

            <div className="text-[11px] text-slate-500 font-mono">
              Primary Grades 1–5 Composite • Tap any student to inspect or start Weekly Check
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
