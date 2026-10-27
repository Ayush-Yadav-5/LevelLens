import React from 'react';
import { 
  Sparkles, 
  X, 
  Mic, 
  Users, 
  LayoutGrid, 
  FileCheck, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { ActiveTab } from '../types';

interface GoldenPathModalProps {
  currentStep: number;
  onSelectStep: (stepNumber: number, targetTab: ActiveTab) => void;
  onClose: () => void;
}

export const GoldenPathModal: React.FC<GoldenPathModalProps> = ({
  currentStep,
  onSelectStep,
  onClose,
}) => {
  const steps = [
    {
      step: 1,
      title: 'The Stealth Check ("Reading Quest")',
      tab: 'weekly-check' as ActiveTab,
      icon: Mic,
      tag: 'Voice Diagnostic Engine',
      description: 'Run oral reading diagnostic on any enrolled student. Click "Simulate Child Audio" or speak into mic; words highlight green in real-time, WPM & accuracy calculated.',
      buttonLabel: 'Launch Step 1 (Weekly Check)',
    },
    {
      step: 2,
      title: 'Live Re-Clustering ("Skill Pods Engine")',
      tab: 'pods' as ActiveTab,
      icon: Users,
      tag: 'Dynamic Cohorts',
      description: 'Watch the student graduate from Sound Sleuths ➔ Word Builders. See cross-grade pods (Grades 1-5) update with 10-minute low-resource micro-activities.',
      buttonLabel: 'Inspect Step 2 (Skill Pods)',
    },
    {
      step: 3,
      title: 'Classroom Heatmap ("Class Map View")',
      tab: 'class-map' as ActiveTab,
      icon: LayoutGrid,
      tag: 'Seating Heatmap',
      description: 'The 6×5 classroom desk grid updates colors live. Red desks represent pre-readers needing immediate intervention, shifting to green as pods remediate.',
      buttonLabel: 'View Step 3 (Classroom Heatmap)',
    },
    {
      step: 4,
      title: 'The Administrative Win ("NIPUN FLN Report")',
      tab: 'compliance' as ActiveTab,
      icon: FileCheck,
      tag: 'Government Compliance',
      description: '1-Click generates an official Ministry of Education NIPUN Bharat FLN compliance report with competency codes, PDF print format, and parent IVR audio generator.',
      buttonLabel: 'Open Step 4 (FLN Compliance)',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-5 sm:p-6 space-y-5 text-slate-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  Judges Walkthrough
                </span>
                <span className="text-xs text-slate-400">3-Minute Hackathon Demo Flow</span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">
                The Golden Path Sequence
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          {steps.map((s) => {
            const Icon = s.icon;
            const isCurrent = currentStep === s.step;

            return (
              <div
                key={s.step}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-slate-800 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      isCurrent ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {s.step}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-white text-sm">
                          {s.title}
                        </h4>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          {s.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {s.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSelectStep(s.step, s.tab);
                      onClose();
                    }}
                    className="shrink-0 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-sm transition-all whitespace-nowrap"
                  >
                    <span>Jump</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Tip: Tap "Simulate Child Audio" inside Step 1 for instant acoustic demo</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
