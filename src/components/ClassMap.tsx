import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  BookOpen, 
  Calculator, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Student, ReadingLevel, MathLevel } from '../types';

interface ClassMapProps {
  students: Student[];
  onSelectStudent: (id: string) => void;
  onStartWeeklyCheck: (id: string) => void;
}

export const ClassMap: React.FC<ClassMapProps> = ({
  students,
  onSelectStudent,
  onStartWeeklyCheck,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReadingFilter, setSelectedReadingFilter] = useState<'ALL' | ReadingLevel>('ALL');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<'ALL' | number>('ALL');

  // Stats
  const totalStudents = students.length;
  const assessedCount = students.filter(s => s.assessedThisWeek).length;
  const gradeLevelCount = students.filter(s => s.readingLevel === 'GRADE_LEVEL').length;
  const preWordCount = students.filter(s => s.readingLevel === 'PRE_WORD').length;

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            s.rollNo.toString().includes(searchQuery);
      const matchesReading = selectedReadingFilter === 'ALL' || s.readingLevel === selectedReadingFilter;
      const matchesGrade = selectedGradeFilter === 'ALL' || s.grade === selectedGradeFilter;
      return matchesSearch && matchesReading && matchesGrade;
    });
  }, [students, searchQuery, selectedReadingFilter, selectedGradeFilter]);

  // Visual helper for level styling
  const getReadingLevelBadge = (level: ReadingLevel) => {
    switch (level) {
      case 'PRE_WORD':
        return {
          label: 'Pre-Word',
          bg: 'bg-rose-500/15',
          text: 'text-rose-400',
          border: 'border-rose-500/50',
          ring: 'ring-rose-500/30',
          dot: 'bg-rose-500',
        };
      case 'WORD':
        return {
          label: 'Word',
          bg: 'bg-amber-500/15',
          text: 'text-amber-400',
          border: 'border-amber-500/50',
          ring: 'ring-amber-500/30',
          dot: 'bg-amber-500',
        };
      case 'SENTENCE':
        return {
          label: 'Sentence',
          bg: 'bg-yellow-500/15',
          text: 'text-yellow-300',
          border: 'border-yellow-500/50',
          ring: 'ring-yellow-500/30',
          dot: 'bg-yellow-400',
        };
      case 'GRADE_LEVEL':
        return {
          label: 'Grade Level',
          bg: 'bg-emerald-500/15',
          text: 'text-emerald-300',
          border: 'border-emerald-500/50',
          ring: 'ring-emerald-500/30',
          dot: 'bg-emerald-400',
        };
    }
  };

  const getMathLevelBadge = (level: MathLevel) => {
    switch (level) {
      case 'COUNT_20':
        return { label: 'Count ≤ 20', color: 'bg-rose-500', text: 'text-rose-300' };
      case 'PATTERN_OPS':
        return { label: 'Basic Ops', color: 'bg-amber-500', text: 'text-amber-300' };
      case 'BORROW_OPS':
        return { label: 'Borrowing', color: 'bg-emerald-500', text: 'text-emerald-300' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Classroom Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Weekly Checks</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-white">{assessedCount}</span>
            <span className="text-xs text-slate-400">/ {totalStudents} completed</span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${(assessedCount / totalStudents) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>At Grade Level</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-emerald-400">{Math.round((gradeLevelCount / totalStudents) * 100)}%</span>
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
          <p className="text-[11px] text-rose-300/80 mt-1">Assigned to Sound Sleuths</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Grouping Status</span>
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] rounded font-mono">LIVE</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-indigo-300">6 Pods</span>
            <span className="text-xs text-slate-400">active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Fluid 30-min rotations</p>
        </div>
      </div>

      {/* Classroom Heatmap Legend & Filters */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search student or roll #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Reading Level Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Reading:
          </span>
          <button
            onClick={() => setSelectedReadingFilter('ALL')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              selectedReadingFilter === 'ALL'
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All ({totalStudents})
          </button>
          <button
            onClick={() => setSelectedReadingFilter('PRE_WORD')}
            className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              selectedReadingFilter === 'PRE_WORD'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Pre-Word
          </button>
          <button
            onClick={() => setSelectedReadingFilter('WORD')}
            className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              selectedReadingFilter === 'WORD'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Word
          </button>
          <button
            onClick={() => setSelectedReadingFilter('SENTENCE')}
            className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              selectedReadingFilter === 'SENTENCE'
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                : 'text-slate-400 hover:text-yellow-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            Sentence
          </button>
          <button
            onClick={() => setSelectedReadingFilter('GRADE_LEVEL')}
            className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              selectedReadingFilter === 'GRADE_LEVEL'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Grade Level
          </button>
        </div>

        {/* Grade Filter */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-400 text-[11px] mr-1">Grade:</span>
          {(['ALL', 2, 3, 4] as const).map(gr => (
            <button
              key={gr}
              onClick={() => setSelectedGradeFilter(gr)}
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                selectedGradeFilter === gr
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {gr === 'ALL' ? 'All' : `Gr ${gr}`}
            </button>
          ))}
        </div>
      </div>

      {/* Classroom Seating Grid Visual (Teacher Blackboard at Top) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative">
        {/* Simulated Teacher Blackboard / Stage Front */}
        <div className="w-full max-w-md mx-auto mb-5 py-1.5 px-4 bg-slate-800/80 rounded-lg border border-slate-700/80 text-center shadow-inner">
          <div className="text-[11px] font-mono tracking-widest text-emerald-400 font-bold uppercase flex items-center justify-center gap-2">
            <span>════</span>
            <span>TEACHER DESK & CHALKBOARD (FRONT)</span>
            <span>════</span>
          </div>
        </div>

        {/* Student Desk Heatmap Grid: 6 Columns × 5 Rows */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3">
          {filteredStudents.map((student) => {
            const readingBadge = getReadingLevelBadge(student.readingLevel);
            const mathBadge = getMathLevelBadge(student.mathLevel);
            const isHero = student.id === 'std-1'; // Aisha Patel

            return (
              <div
                key={student.id}
                id={`desk-${student.id}`}
                onClick={() => onSelectStudent(student.id)}
                className={`group relative bg-slate-800/90 rounded-xl p-3 border-2 ${readingBadge.border} hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-950/40 hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between ${
                  isHero ? 'ring-2 ring-amber-400/80 shadow-md shadow-amber-950/50' : ''
                }`}
              >
                {/* Hero Student Marker */}
                {isHero && (
                  <div className="absolute -top-2.5 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter flex items-center gap-0.5 shadow">
                    <Sparkles className="w-2.5 h-2.5 fill-current" /> Demo
                  </div>
                )}

                {/* Desk Card Header */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      R#{student.rollNo} • Gr {student.grade}
                    </span>
                    {student.assessedThisWeek ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" title="Assessed this week" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Weekly check pending" />
                    )}
                  </div>

                  <h4 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-emerald-300">
                    {student.name}
                  </h4>
                </div>

                {/* Metrics & Badges */}
                <div className="mt-2.5 space-y-1.5">
                  {/* Reading Level Badge */}
                  <div className={`flex items-center justify-between px-2 py-0.5 rounded text-[10px] font-bold ${readingBadge.bg} ${readingBadge.text}`}>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-2.5 h-2.5" />
                      {readingBadge.label}
                    </span>
                    <span className="font-mono">{student.readingWpm} wpm</span>
                  </div>

                  {/* Math Level Indicator */}
                  <div className="flex items-center justify-between text-[10px] px-1 text-slate-300">
                    <span className="flex items-center gap-1">
                      <Calculator className="w-2.5 h-2.5 text-slate-400" />
                      <span className="truncate max-w-[70px]">{mathBadge.label}</span>
                    </span>
                    <span className="font-mono text-slate-400">{(student.mathLatencyMs / 1000).toFixed(1)}s</span>
                  </div>
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

        {/* Bottom Classroom Legend */}
        <div className="mt-6 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-slate-300 text-xs">Heatmap Key:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-500" />
              <span>Red = Pre-Word</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-500" />
              <span>Orange = Word</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-yellow-400" />
              <span>Yellow = Sentence</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-400" />
              <span>Green = Grade Level</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            6×5 Classroom Desks • Tap any student to inspect or start Weekly Check
          </div>
        </div>
      </div>
    </div>
  );
};
