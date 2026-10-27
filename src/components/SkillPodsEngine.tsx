import React, { useState } from 'react';
import { 
  Users, 
  Sparkles, 
  RotateCw, 
  Printer, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  ArrowRight,
  BookOpen,
  Calculator,
  Share2,
  Check,
  ChevronDown
} from 'lucide-react';
import { Student, SkillPod, MicroActivity } from '../types';

interface SkillPodsEngineProps {
  students: Student[];
  pods: SkillPod[];
  onAutoRegroup: () => void;
  onNavigateToHeatmap: () => void;
  recentGraduation?: { studentName: string; fromPod: string; toPod: string; domain: string } | null;
}

export const SkillPodsEngine: React.FC<SkillPodsEngineProps> = ({
  students,
  pods,
  onAutoRegroup,
  onNavigateToHeatmap,
  recentGraduation,
}) => {
  const [activeDomain, setActiveDomain] = useState<'reading' | 'math'>('reading');
  const [isRegrouping, setIsRegrouping] = useState<boolean>(false);
  const [selectedActivity, setSelectedActivity] = useState<MicroActivity | null>(null);
  const [completedActivities, setCompletedActivities] = useState<Record<string, boolean>>({
    'act-r1-1': true,
    'act-m1-1': true,
    'act-m3-1': true,
  });

  const domainPods = pods.filter(p => p.domain === activeDomain);

  // Trigger simulated regrouping animation
  const handleRegroupClick = () => {
    setIsRegrouping(true);
    setTimeout(() => {
      onAutoRegroup();
      setIsRegrouping(false);
    }, 1200);
  };

  const toggleActivityComplete = (actId: string) => {
    setCompletedActivities(prev => ({
      ...prev,
      [actId]: !prev[actId],
    }));
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Auto-Regroup Action */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Cross-Grade Dynamic Grouping
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Fluid FLN Grouping Engine
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1">
            Skill Pods & Micro-Activity Playbooks
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mt-0.5">
            Children are grouped by foundational competency rather than age/grade, removing stigma and targeting root learning gaps.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-auto-regroup"
            onClick={handleRegroupClick}
            disabled={isRegrouping}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-950/40 flex items-center gap-2 transition-all transform active:scale-95 disabled:opacity-60"
          >
            <RotateCw className={`w-4 h-4 ${isRegrouping ? 'animate-spin' : ''}`} />
            <span>{isRegrouping ? 'Recalculating Cohorts...' : 'Auto-Regroup Engine'}</span>
          </button>
        </div>
      </div>

      {/* Graduation Live Alert (if triggered from Step 1) */}
      {recentGraduation && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-teal-500/20 border border-amber-400/80 text-xs text-white flex items-center justify-between shadow-md animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 fill-current" />
            </span>
            <div>
              <span className="font-extrabold text-amber-300">Cohort Promotion Event: </span>
              <span>
                {recentGraduation.studentName} has graduated from{' '}
                <span className="font-bold text-rose-300">{recentGraduation.fromPod}</span> ➔{' '}
                <span className="font-bold text-emerald-300">{recentGraduation.toPod}</span>!
              </span>
            </div>
          </div>
          <button
            onClick={onNavigateToHeatmap}
            className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm whitespace-nowrap"
          >
            <span>See on Heatmap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Domain Switcher (Reading Pods vs Math Pods) */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveDomain('reading')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
              activeDomain === 'reading'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Reading Pods (3)</span>
          </button>

          <button
            onClick={() => setActiveDomain('math')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
              activeDomain === 'math'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Numeracy Pods (3)</span>
          </button>
        </div>

        {/* Timetable Suggestion Badge */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 font-mono">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Rotation: 2 × 15-min fluid periods daily</span>
        </div>
      </div>

      {/* Pods Grid: 3 Distinct Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {domainPods.map((pod) => {
          // Get students in this pod
          const podStudents = students.filter(s => 
            activeDomain === 'reading' ? s.readingPodId === pod.id : s.mathPodId === pod.id
          );

          return (
            <div
              key={pod.id}
              className={`bg-slate-900 border-2 ${pod.borderClass} rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl space-y-4`}
            >
              <div>
                {/* Pod Header */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      {pod.id} • {pod.badgeTitle}
                    </span>
                    <h3 className="text-lg font-black text-white mt-0.5">
                      {pod.name}
                    </h3>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-xs font-bold font-mono text-white border border-slate-700">
                    {podStudents.length} learners
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-2.5">
                  <span className="text-slate-400 font-medium">Focus: </span>
                  {pod.targetSkill}
                </p>

                {/* Cross-Grade Learner Chips */}
                <div className="mt-4 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Active Cohort ({podStudents.length} Learners):
                  </span>

                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-slate-950/60 rounded-xl border border-slate-800/80 min-h-[44px] items-center">
                    {podStudents.length === 0 ? (
                      <span className="text-[11px] text-slate-500 italic px-2">No learners assigned to this pod yet.</span>
                    ) : (
                      podStudents.map(student => (
                        <span
                          key={student.id}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${
                            recentGraduation?.studentName === student.name
                              ? 'bg-amber-400/20 border-amber-400 text-amber-200 animate-pulse font-bold'
                              : 'bg-slate-800 border-slate-700 text-slate-200'
                          }`}
                        >
                          <span>{student.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">Gr{student.grade}</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Micro-Activities for this Pod */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Resource-Light Activities:
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">10-15 Min</span>
                  </div>

                  <div className="space-y-2">
                    {pod.activities.map(act => {
                      const isCompleted = !!completedActivities[act.id];
                      return (
                        <div
                          key={act.id}
                          className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-1.5 text-xs hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-bold text-white text-xs leading-snug">
                              {act.title}
                            </h5>
                            <button
                              onClick={() => toggleActivityComplete(act.id)}
                              className={`p-1 rounded transition-colors ${
                                isCompleted
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                              title={isCompleted ? 'Mark as planned' : 'Mark as completed'}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <p className="text-[11px] text-slate-400">
                            <span className="text-amber-300/90 font-medium">Materials: </span>
                            {act.materials}
                          </p>

                          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/80">
                            <span>{act.durationMinutes} mins</span>
                            <button
                              onClick={() => setSelectedActivity(act)}
                              className="text-emerald-400 hover:underline font-medium"
                            >
                              View Playbook ➔
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Quick Card Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[11px]">{pod.levelDescriptor}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fluid Timetable & Printable Sheet Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
            <Printer className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">
              Printable Micro-Activity Sheets & Rotations
            </h4>
            <p className="text-xs text-slate-400">
              Ready for single-teacher multi-grade classrooms. Low-resource materials only (chalk, stones, slate).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (domainPods[0]?.activities[0]) {
                setSelectedActivity(domainPods[0].activities[0]);
              }
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Pod Cards</span>
          </button>

          <button
            id="btn-goto-heatmap"
            onClick={onNavigateToHeatmap}
            className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            <span>See Heatmap Color Shift (Step 3)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Micro-Activity Playbook Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-5 space-y-4 text-slate-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  FLN Micro-Activity Playbook
                </span>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  {selectedActivity.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="font-bold text-amber-300">Required Materials: </span>
                <span className="text-slate-300">{selectedActivity.materials}</span>
              </div>

              <div>
                <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-1.5">
                  Step-by-Step Instructions:
                </h5>
                <ol className="space-y-1.5 list-decimal list-inside text-slate-300 text-xs">
                  {selectedActivity.instructions.map((step, i) => (
                    <li key={i} className="leading-relaxed">{step}</li>
                  ))}
                </ol>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                <span className="font-bold">Learning Objective: </span>
                <span>{selectedActivity.learningObjective}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  toggleActivityComplete(selectedActivity.id);
                  setSelectedActivity(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark Completed & Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
