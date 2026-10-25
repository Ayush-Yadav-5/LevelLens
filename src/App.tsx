import React, { useState, useEffect } from 'react';
import { 
  Student, 
  SkillPod, 
  ActiveTab, 
  ReadingLevel, 
  MathLevel,
  FLNCompetency 
} from './types';
import { 
  INITIAL_STUDENTS, 
  INITIAL_PODS, 
  FLN_COMPETENCIES 
} from './data/mockData';
import { HeaderNavbar } from './components/HeaderNavbar';
import { ClassMap } from './components/ClassMap';
import { StudentDrawer } from './components/StudentDrawer';
import { StealthAssessment } from './components/StealthAssessment';
import { SkillPodsEngine } from './components/SkillPodsEngine';
import { ComplianceDashboard } from './components/ComplianceDashboard';
import { GoldenPathModal } from './components/GoldenPathModal';

export default function App() {
  // Local storage persistence for offline-first state
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('levellens_students_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_STUDENTS;
  });

  const [pods, setPods] = useState<SkillPod[]>(() => {
    try {
      const saved = localStorage.getItem('levellens_pods_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_PODS;
  });

  const [competencies, setCompetencies] = useState<FLNCompetency[]>(FLN_COMPETENCIES);
  const [activeTab, setActiveTab] = useState<ActiveTab>('class-map');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeAssessmentStudentId, setActiveAssessmentStudentId] = useState<string | null>('std-1'); // Aisha Patel by default
  const [isTabletView, setIsTabletView] = useState<boolean>(false);
  const [goldenPathStep, setGoldenPathStep] = useState<number>(1);
  const [isGoldenPathModalOpen, setIsGoldenPathModalOpen] = useState<boolean>(false);
  const [recentGraduation, setRecentGraduation] = useState<{
    studentName: string;
    fromPod: string;
    toPod: string;
    domain: string;
  } | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('levellens_students_v1', JSON.stringify(students));
      localStorage.setItem('levellens_pods_v1', JSON.stringify(pods));
    } catch {
      // ignore
    }
  }, [students, pods]);

  // Recalculate competency percentages when students state changes
  useEffect(() => {
    const total = students.length;
    if (total === 0) return;

    setCompetencies(prev => prev.map(comp => {
      let achieved = 0;
      if (comp.code === 'L2.1') {
        achieved = students.filter(s => s.readingAccuracy >= 70).length;
      } else if (comp.code === 'L2.4') {
        achieved = students.filter(s => s.readingLevel !== 'PRE_WORD').length;
      } else if (comp.code === 'L3.1') {
        achieved = students.filter(s => s.readingLevel === 'GRADE_LEVEL').length;
      } else if (comp.code === 'M2.1') {
        achieved = students.filter(s => s.mathLevel !== 'COUNT_20').length;
      } else if (comp.code === 'M3.1') {
        achieved = students.filter(s => s.mathLevel === 'PATTERN_OPS' || s.mathLevel === 'BORROW_OPS').length;
      } else if (comp.code === 'M3.2') {
        achieved = students.filter(s => s.mathLevel === 'BORROW_OPS').length;
      }
      const pct = Math.round((achieved / total) * 100);
      return {
        ...comp,
        achievedPercent: pct,
        status: pct >= 75 ? 'On Track' : pct >= 50 ? 'In Progress' : 'Critical Gap',
      };
    }));
  }, [students]);

  // Handle Assessment Completion (The Golden Trigger)
  const handleCompleteAssessment = (
    studentId: string, 
    results: {
      wpm: number;
      accuracy: number;
      readingLevel: ReadingLevel;
      mathAccuracy: number;
      mathLatencyMs: number;
      mathLevel: MathLevel;
      graduated: boolean;
      fromPod: string;
      toPod: string;
    }
  ) => {
    const targetStudent = students.find(s => s.id === studentId);
    if (!targetStudent) return;

    const newReadingPodId = results.graduated ? 'R2' : targetStudent.readingPodId;

    const updatedStudents = students.map(s => {
      if (s.id !== studentId) return s;

      const newHistoryItem = {
        id: `h-${Date.now()}`,
        date: 'Today',
        readingWpm: results.wpm,
        readingAccuracy: results.accuracy,
        readingLevel: results.readingLevel,
        mathAccuracy: results.mathAccuracy,
        mathLatencyMs: results.mathLatencyMs,
        mathLevel: results.mathLevel,
      };

      return {
        ...s,
        readingWpm: results.wpm,
        readingAccuracy: results.accuracy,
        readingLevel: results.readingLevel,
        mathLatencyMs: results.mathLatencyMs,
        mathLevel: results.mathLevel,
        readingPodId: newReadingPodId,
        assessedThisWeek: true,
        lastAssessedDate: 'Today',
        history: [newHistoryItem, ...s.history],
      };
    });

    setStudents(updatedStudents);

    if (results.graduated) {
      setRecentGraduation({
        studentName: targetStudent.name,
        fromPod: results.fromPod,
        toPod: results.toPod,
        domain: 'reading',
      });
      setGoldenPathStep(2);
    }
  };

  // Re-assign a student's pod manually
  const handleReassignPod = (
    studentId: string, 
    domain: 'reading' | 'math', 
    newPodId: 'R1' | 'R2' | 'R3' | 'M1' | 'M2' | 'M3'
  ) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      return domain === 'reading' 
        ? { ...s, readingPodId: newPodId as 'R1' | 'R2' | 'R3' }
        : { ...s, mathPodId: newPodId as 'M1' | 'M2' | 'M3' };
    }));
  };

  // Dynamic Auto-Regroup Algorithm
  const handleAutoRegroup = () => {
    const updated = students.map(s => {
      let rPod: 'R1' | 'R2' | 'R3' = 'R1';
      if (s.readingLevel === 'GRADE_LEVEL' || s.readingLevel === 'SENTENCE') {
        rPod = 'R3';
      } else if (s.readingLevel === 'WORD') {
        rPod = 'R2';
      }

      let mPod: 'M1' | 'M2' | 'M3' = 'M1';
      if (s.mathLevel === 'BORROW_OPS') {
        mPod = 'M3';
      } else if (s.mathLevel === 'PATTERN_OPS') {
        mPod = 'M2';
      }

      return {
        ...s,
        readingPodId: rPod,
        mathPodId: mPod,
      };
    });

    setStudents(updated);
  };

  // Reset demo back to clean initial state
  const handleResetDemoData = () => {
    localStorage.removeItem('levellens_students_v1');
    localStorage.removeItem('levellens_pods_v1');
    setStudents(INITIAL_STUDENTS);
    setPods(INITIAL_PODS);
    setRecentGraduation(null);
    setGoldenPathStep(1);
    setSelectedStudentId(null);
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* simulated Android Tablet Wrapper or fluid width */}
      <div className={`flex-1 flex flex-col ${isTabletView ? 'max-w-5xl mx-auto my-3 md:my-6 rounded-3xl overflow-hidden border-8 border-slate-800 shadow-2xl bg-slate-950 ring-1 ring-slate-700/60' : 'w-full'}`}>
        {/* Navigation & Status Header */}
        <HeaderNavbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          goldenPathStep={goldenPathStep}
          onStartGoldenPath={() => setIsGoldenPathModalOpen(true)}
          onResetData={handleResetDemoData}
          isTabletView={isTabletView}
          onToggleTabletView={() => setIsTabletView(prev => !prev)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'class-map' && (
            <ClassMap
              students={students}
              onSelectStudent={(id) => setSelectedStudentId(id)}
              onStartWeeklyCheck={(id) => {
                setActiveAssessmentStudentId(id);
                setActiveTab('weekly-check');
              }}
            />
          )}

          {activeTab === 'weekly-check' && (
            <StealthAssessment
              students={students}
              initialStudentId={activeAssessmentStudentId}
              onCompleteAssessment={handleCompleteAssessment}
              onNavigateToPods={() => {
                setActiveTab('pods');
                setGoldenPathStep(2);
              }}
            />
          )}

          {activeTab === 'pods' && (
            <SkillPodsEngine
              students={students}
              pods={pods}
              onAutoRegroup={handleAutoRegroup}
              onNavigateToHeatmap={() => {
                setActiveTab('class-map');
                setGoldenPathStep(3);
              }}
              recentGraduation={recentGraduation}
            />
          )}

          {activeTab === 'compliance' && (
            <ComplianceDashboard
              students={students}
              competencies={competencies}
            />
          )}
        </main>

        {/* Diagnostic Drawer */}
        {selectedStudent && (
          <StudentDrawer
            student={selectedStudent}
            pods={pods}
            onClose={() => setSelectedStudentId(null)}
            onStartWeeklyCheck={(id) => {
              setActiveAssessmentStudentId(id);
              setActiveTab('weekly-check');
            }}
            onReassignPod={handleReassignPod}
          />
        )}

        {/* Golden Path Sequence Walkthrough Modal */}
        {isGoldenPathModalOpen && (
          <GoldenPathModal
            currentStep={goldenPathStep}
            onSelectStep={(stepNumber, targetTab) => {
              setGoldenPathStep(stepNumber);
              setActiveTab(targetTab);
            }}
            onClose={() => setIsGoldenPathModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
