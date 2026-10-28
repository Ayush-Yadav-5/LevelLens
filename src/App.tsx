import React, { useState, useEffect } from 'react';
import { 
  Student, 
  SkillPod, 
  ActiveTab, 
  ReadingLevel, 
  MathLevel, 
  FLNCompetency, 
  Organization, 
  ParentSession, 
  AdminUser 
} from './types';
import { 
  INITIAL_PODS, 
  FLN_COMPETENCIES 
} from './data/mockData';
import { storage } from './services/storage';
import { HeaderNavbar } from './components/HeaderNavbar';
import { ClassMap } from './components/ClassMap';
import { StudentDrawer } from './components/StudentDrawer';
import { StealthAssessment } from './components/StealthAssessment';
import { SkillPodsEngine } from './components/SkillPodsEngine';
import { ComplianceDashboard } from './components/ComplianceDashboard';
import { GoldenPathModal } from './components/GoldenPathModal';
import { SchoolLoginModal } from './components/SchoolLoginModal';
import { SchoolRegisterModal } from './components/SchoolRegisterModal';
import { AdminApprovalModal } from './components/AdminApprovalModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ParentLoginModal } from './components/ParentLoginModal';
import { ParentPortalView } from './components/ParentPortalView';
import { AddStudentModal } from './components/AddStudentModal';
import { EditStudentModal } from './components/EditStudentModal';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { Lock } from 'lucide-react';

export default function App() {
  // --- MUTUALLY EXCLUSIVE SESSION STATES ---
  // 1. School Session: active when an approved school or tuition center logs in
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);

  // 2. Admin / Owner Session: active when an administrator or owner logs in
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);

  // 3. Parent Session: active when a parent looks up their child by mobile phone
  const [parentSession, setParentSession] = useState<ParentSession | null>(null);

  // Modals state
  const [isSchoolLoginOpen, setIsSchoolLoginOpen] = useState<boolean>(false);
  const [isSchoolRegisterOpen, setIsSchoolRegisterOpen] = useState<boolean>(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isParentLoginOpen, setIsParentLoginOpen] = useState<boolean>(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState<boolean>(false);
  const [isGoldenPathModalOpen, setIsGoldenPathModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Forgot password modal state (tracks whether it's for 'school' or 'admin')
  const [forgotPasswordState, setForgotPasswordState] = useState<{
    isOpen: boolean;
    type: 'school' | 'admin';
  }>({
    isOpen: false,
    type: 'school',
  });

  // Students & Pods for active school organization
  const [students, setStudents] = useState<Student[]>([]);
  const [pods, setPods] = useState<SkillPod[]>(INITIAL_PODS);
  const [competencies, setCompetencies] = useState<FLNCompetency[]>(FLN_COMPETENCIES);
  const [activeTab, setActiveTab] = useState<ActiveTab>('class-map');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeAssessmentStudentId, setActiveAssessmentStudentId] = useState<string | null>(null);
  const [assessmentDomain, setAssessmentDomain] = useState<'both' | 'reading' | 'math'>('both');
  const [goldenPathStep, setGoldenPathStep] = useState<number>(1);
  const [recentGraduation, setRecentGraduation] = useState<{
    studentName: string;
    fromPod: string;
    toPod: string;
    domain: string;
  } | null>(null);

  // Purge any stale demo keys and force logged-out state on mount
  useEffect(() => {
    try {
      localStorage.removeItem('levellens_active_org_v3');
      localStorage.removeItem('levellens_active_org_v2');
      localStorage.removeItem('levellens_active_org_v1');
    } catch {
      // ignore
    }
  }, []);

  // Strict Sign-Out Function that clears all session types and returns to landing page
  const handleSignOutAll = () => {
    setCurrentOrg(null);
    setCurrentAdmin(null);
    setParentSession(null);
    setIsSchoolLoginOpen(false);
    setIsSchoolRegisterOpen(false);
    setIsAdminLoginOpen(false);
    setIsParentLoginOpen(false);
    setForgotPasswordState((prev) => ({ ...prev, isOpen: false }));
    setSelectedStudentId(null);
    setActiveAssessmentStudentId(null);
    setEditingStudent(null);
    setStudents([]);
    try {
      localStorage.removeItem('levellens_active_org_v3');
    } catch {
      // ignore
    }
  };

  // Load students strictly when a school organization is active
  useEffect(() => {
    if (!currentOrg) {
      setStudents([]);
      return;
    }

    const fetchOrgStudents = async () => {
      const list = await storage.getStudents(currentOrg.id);
      // Auto-heal any historical records corrupted by the previous math/reading test graduation bug
      const sanitized = list.map(student => {
        if (student.readingWpm === 0 && student.readingAccuracy === 0 && student.readingLevel === 'WORD' && student.readingPodId === 'R2') {
          return {
            ...student,
            readingLevel: 'PRE_WORD' as const,
            readingPodId: 'R1' as const,
            mathPodId: ((student.mathAccuracy ?? 0) >= 60 || student.mathLatencyMs > 0) && student.mathPodId === 'M1' ? 'M2' as const : student.mathPodId,
            mathLevel: ((student.mathAccuracy ?? 0) >= 60 || student.mathLatencyMs > 0) && student.mathLevel === 'COUNT_20' ? 'PATTERN_OPS' as const : student.mathLevel,
            assessedReadingThisWeek: false,
            assessedMathThisWeek: Boolean(student.mathLatencyMs > 0 || (student.mathAccuracy ?? 0) > 0),
          };
        }
        return student;
      });

      setStudents(sanitized);
      if (sanitized.length > 0) {
        setActiveAssessmentStudentId(sanitized[0].id);
      } else {
        setActiveAssessmentStudentId(null);
      }
    };

    fetchOrgStudents();
  }, [currentOrg]);

  // Recalculate competency percentages when students state changes
  useEffect(() => {
    const total = students.length;
    if (total === 0) {
      setCompetencies(prev => prev.map(c => ({ ...c, achievedPercent: 0, status: 'In Progress' })));
      return;
    }

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

  // Handle Assessment Completion
  const handleCompleteAssessment = async (
    studentId: string, 
    results: {
      domain: 'reading' | 'math' | 'both';
      wpm: number;
      accuracy: number;
      readingLevel: ReadingLevel;
      mathAccuracy: number;
      mathLatencyMs: number;
      mathLevel: MathLevel;
      graduated: boolean;
      promotedDomain?: 'reading' | 'math';
      fromPod: string;
      toPod: string;
      newReadingPodId?: 'R1' | 'R2' | 'R3';
      newMathPodId?: 'M1' | 'M2' | 'M3';
    }
  ) => {
    const targetStudent = students.find(s => s.id === studentId);
    if (!targetStudent) return;

    let updatedReadingPodId = targetStudent.readingPodId;
    let updatedMathPodId = targetStudent.mathPodId;

    if (results.domain === 'reading' || results.domain === 'both') {
      if (results.newReadingPodId) {
        updatedReadingPodId = results.newReadingPodId;
      } else if (results.readingLevel === 'GRADE_LEVEL' || results.readingLevel === 'SENTENCE' || results.wpm >= 40) {
        updatedReadingPodId = 'R3';
      } else if (results.readingLevel === 'WORD' || results.wpm >= 25) {
        updatedReadingPodId = 'R2';
      } else {
        updatedReadingPodId = 'R1';
      }
    }

    if (results.domain === 'math' || results.domain === 'both') {
      if (results.newMathPodId) {
        updatedMathPodId = results.newMathPodId;
      } else if (results.mathLevel === 'BORROW_OPS' || results.mathAccuracy >= 90) {
        updatedMathPodId = 'M3';
      } else if (results.mathLevel === 'PATTERN_OPS' || results.mathAccuracy >= 60) {
        updatedMathPodId = 'M2';
      } else {
        updatedMathPodId = 'M1';
      }
    }

    const newHistoryItem = {
      id: `h-${Date.now()}`,
      date: 'Today',
      readingWpm: results.domain === 'math' ? targetStudent.readingWpm : results.wpm,
      readingAccuracy: results.domain === 'math' ? targetStudent.readingAccuracy : results.accuracy,
      readingLevel: results.domain === 'math' ? targetStudent.readingLevel : results.readingLevel,
      mathAccuracy: results.domain === 'reading' ? (targetStudent.mathAccuracy || 80) : results.mathAccuracy,
      mathLatencyMs: results.domain === 'reading' ? targetStudent.mathLatencyMs : results.mathLatencyMs,
      mathLevel: results.domain === 'reading' ? targetStudent.mathLevel : results.mathLevel,
    };

    const isReadingEvaluated = results.domain === 'reading' || results.domain === 'both';
    const isMathEvaluated = results.domain === 'math' || results.domain === 'both';

    const updatedStudent: Student = {
      ...targetStudent,
      readingWpm: results.domain === 'math' ? targetStudent.readingWpm : results.wpm,
      readingAccuracy: isReadingEvaluated ? results.accuracy : targetStudent.readingAccuracy,
      readingLevel: isReadingEvaluated ? results.readingLevel : targetStudent.readingLevel,
      mathAccuracy: isMathEvaluated ? results.mathAccuracy : targetStudent.mathAccuracy,
      mathLatencyMs: isMathEvaluated ? results.mathLatencyMs : targetStudent.mathLatencyMs,
      mathLevel: isMathEvaluated ? results.mathLevel : targetStudent.mathLevel,
      readingPodId: updatedReadingPodId,
      mathPodId: updatedMathPodId,
      assessedThisWeek: true,
      assessedReadingThisWeek: isReadingEvaluated ? true : targetStudent.assessedReadingThisWeek,
      assessedMathThisWeek: isMathEvaluated ? true : targetStudent.assessedMathThisWeek,
      lastAssessedDate: 'Today',
      history: [newHistoryItem, ...targetStudent.history],
    };

    await storage.saveStudent(updatedStudent);
    setStudents(prev => prev.map(s => s.id === studentId ? updatedStudent : s));

    if (results.graduated) {
      setRecentGraduation({
        studentName: targetStudent.name,
        fromPod: results.fromPod,
        toPod: results.toPod,
        domain: results.promotedDomain || (results.domain === 'math' ? 'math' : 'reading'),
      });
      setGoldenPathStep(2);
    }
  };

  // Re-assign student pod manually
  const handleReassignPod = async (
    studentId: string, 
    domain: 'reading' | 'math', 
    newPodId: 'R1' | 'R2' | 'R3' | 'M1' | 'M2' | 'M3'
  ) => {
    const target = students.find(s => s.id === studentId);
    if (!target) return;

    const updated: Student = domain === 'reading' 
      ? { ...target, readingPodId: newPodId as 'R1' | 'R2' | 'R3' }
      : { ...target, mathPodId: newPodId as 'M1' | 'M2' | 'M3' };

    await storage.saveStudent(updated);
    setStudents(prev => prev.map(s => s.id === studentId ? updated : s));
  };

  // Dynamic Auto-Regroup Algorithm
  const handleAutoRegroup = async () => {
    const updated = students.map(s => {
      let rPod: 'R1' | 'R2' | 'R3' = 'R1';
      if (s.readingLevel === 'GRADE_LEVEL' || s.readingLevel === 'SENTENCE' || (s.readingWpm && s.readingWpm >= 40)) {
        rPod = 'R3';
      } else if (s.readingLevel === 'WORD' || (s.readingWpm && s.readingWpm >= 25)) {
        rPod = 'R2';
      }

      let mPod: 'M1' | 'M2' | 'M3' = 'M1';
      if (s.mathLevel === 'BORROW_OPS' || (s.mathAccuracy && s.mathAccuracy >= 90 && s.mathLatencyMs <= 6000)) {
        mPod = 'M3';
      } else if (s.mathLevel === 'PATTERN_OPS' || (s.mathAccuracy && s.mathAccuracy >= 60)) {
        mPod = 'M2';
      }

      return {
        ...s,
        readingPodId: rPod,
        mathPodId: mPod,
      };
    });

    for (const student of updated) {
      await storage.saveStudent(student);
    }
    setStudents(updated);
  };

  // Save new student from AddStudentModal
  const handleSaveStudent = async (newStudent: Student) => {
    await storage.saveStudent(newStudent);
    setStudents(prev => [...prev, newStudent]);
    if (!activeAssessmentStudentId) {
      setActiveAssessmentStudentId(newStudent.id);
    }
  };

  // Update existing student details
  const handleUpdateStudent = async (updatedStudent: Student) => {
    await storage.updateStudent(updatedStudent);
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    if (selectedStudentId === updatedStudent.id) {
      setSelectedStudentId(updatedStudent.id);
    }
  };

  // Delete student from roster
  const handleDeleteStudent = async (studentId: string) => {
    await storage.deleteStudent(studentId);
    setStudents(prev => prev.filter(s => s.id !== studentId));
    if (selectedStudentId === studentId) {
      setSelectedStudentId(null);
    }
    if (activeAssessmentStudentId === studentId) {
      setActiveAssessmentStudentId(null);
    }
    if (editingStudent?.id === studentId) {
      setEditingStudent(null);
    }
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* 
        ========================================================================
        CASE A: DEDICATED ADMIN / OWNER WORKSPACE
        Rendered exclusively when an administrator or owner is authenticated.
        Zero cross-access: completely separate from school classroom accounts.
        ========================================================================
      */}
      {currentAdmin ? (
        <AdminApprovalModal
          adminUser={currentAdmin}
          onClose={handleSignOutAll}
          onLogoutAdmin={handleSignOutAll}
        />
      ) : (
        /* 
          ========================================================================
          CASE B & C: SCHOOL WORKSPACE OR PARENT PORTAL OR LANDING PAGE
          ========================================================================
        */
        <div className="flex-1 flex flex-col w-full">
          {/* Header Navbar */}
          <HeaderNavbar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            goldenPathStep={goldenPathStep}
            onStartGoldenPath={() => setIsGoldenPathModalOpen(true)}
            organization={currentOrg}
            onLogout={handleSignOutAll}
            onOpenSchoolLogin={() => {
              handleSignOutAll();
              setIsSchoolLoginOpen(true);
            }}
            onOpenSchoolRegister={() => {
              handleSignOutAll();
              setIsSchoolRegisterOpen(true);
            }}
            onOpenParentLogin={() => {
              handleSignOutAll();
              setIsParentLoginOpen(true);
            }}
            onOpenAddStudent={currentOrg ? () => setIsAddStudentOpen(true) : undefined}
          />

          {/* Main Content Area */}
          <main className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto pb-8">
            {/* 1. Parent Portal View */}
            {parentSession ? (
              <ParentPortalView
                student={parentSession.student}
                pods={pods}
                onLogout={handleSignOutAll}
              />
            ) : currentOrg ? (
              /* 2. Primary School Teacher Workspace (Guarded by school login) */
              <>
                {activeTab === 'class-map' && (
                  <ClassMap
                    students={students}
                    onSelectStudent={(id) => setSelectedStudentId(id)}
                    onStartWeeklyCheck={(id, domain) => {
                      setActiveAssessmentStudentId(id);
                      if (domain) setAssessmentDomain(domain);
                      setActiveTab('weekly-check');
                    }}
                    onOpenAddStudent={() => setIsAddStudentOpen(true)}
                  />
                )}

                {activeTab === 'weekly-check' && (
                  <StealthAssessment
                    students={students}
                    initialStudentId={activeAssessmentStudentId || students[0]?.id}
                    initialDomain={assessmentDomain}
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
                    organization={currentOrg}
                  />
                )}
              </>
            ) : (
              /* 3. Logged-Out Landing Page Gate */
              <div className="py-16 px-4 max-w-xl mx-auto text-center space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                  <span className="text-2xl font-black">LL</span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white">Welcome to LevelLens</h2>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                    The foundational literacy & numeracy operating system for Primary Schools (Grades 1–5) and local tuition centers.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto pt-2">
                  <button
                    onClick={() => setIsSchoolLoginOpen(true)}
                    className="p-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                  >
                    <span>School / Tuition Login</span>
                  </button>
                  <button
                    onClick={() => setIsSchoolRegisterOpen(true)}
                    className="p-4 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <span>Register Organisation</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-900 flex items-center justify-center gap-4 text-xs">
                  <button
                    onClick={() => setIsParentLoginOpen(true)}
                    className="text-amber-400 hover:text-amber-300 font-medium underline"
                  >
                    Parent Portal (Mobile Bypass)
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* Footer */}
          <footer className="mt-auto py-3.5 px-4 sm:px-6 border-t border-slate-900 bg-slate-950 text-slate-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-2 text-[11px]">
              <span>LevelLens Primary OS • NIPUN FLN Standard</span>
              <span className="text-slate-800">|</span>
              <span className="text-slate-500">Grades 1–5</span>
            </div>

            {!currentOrg && !parentSession && (
              <div>
                <button
                  onClick={() => setIsAdminLoginOpen(true)}
                  className="text-slate-600 hover:text-slate-400 flex items-center gap-1 transition-colors text-[11px]"
                  title="Restricted Staff & Admin sign-in"
                >
                  <Lock className="w-3 h-3" />
                  <span>Staff / Admin Portal</span>
                </button>
              </div>
            )}
          </footer>

          {/* Student Diagnostic Drawer */}
          {selectedStudent && (
            <StudentDrawer
              student={selectedStudent}
              pods={pods}
              onClose={() => setSelectedStudentId(null)}
              onStartWeeklyCheck={(id, domain) => {
                setActiveAssessmentStudentId(id);
                if (domain) setAssessmentDomain(domain);
                setActiveTab('weekly-check');
              }}
              onReassignPod={handleReassignPod}
              onEditStudent={(studentToEdit) => setEditingStudent(studentToEdit)}
              onDeleteStudent={handleDeleteStudent}
            />
          )}

          {/* Edit Student Modal */}
          {editingStudent && (
            <EditStudentModal
              student={editingStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onClose={() => setEditingStudent(null)}
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

          {/* School Login Modal */}
          {isSchoolLoginOpen && (
            <SchoolLoginModal
              onSuccess={(org) => {
                handleSignOutAll();
                setCurrentOrg(org);
              }}
              onOpenRegister={() => {
                setIsSchoolLoginOpen(false);
                setIsSchoolRegisterOpen(true);
              }}
              onOpenParentLogin={() => {
                setIsSchoolLoginOpen(false);
                setIsParentLoginOpen(true);
              }}
              onOpenForgotPassword={() => {
                setIsSchoolLoginOpen(false);
                setForgotPasswordState({ isOpen: true, type: 'school' });
              }}
              onClose={() => setIsSchoolLoginOpen(false)}
            />
          )}

          {/* School / Tuition Register Modal */}
          {isSchoolRegisterOpen && (
            <SchoolRegisterModal
              onClose={() => setIsSchoolRegisterOpen(false)}
              onSuccessRegistered={() => {
                setIsSchoolRegisterOpen(false);
                setIsSchoolLoginOpen(true);
              }}
              onOpenLogin={() => {
                setIsSchoolRegisterOpen(false);
                setIsSchoolLoginOpen(true);
              }}
            />
          )}

          {/* Admin Login Modal */}
          {isAdminLoginOpen && (
            <AdminLoginModal
              onSuccess={(admin) => {
                handleSignOutAll();
                setCurrentAdmin(admin);
              }}
              onOpenForgotPassword={() => {
                setIsAdminLoginOpen(false);
                setForgotPasswordState({ isOpen: true, type: 'admin' });
              }}
              onClose={() => setIsAdminLoginOpen(false)}
            />
          )}

          {/* Forgot Password Modal (Shared for School and Admin) */}
          {forgotPasswordState.isOpen && (
            <ForgotPasswordModal
              accountType={forgotPasswordState.type}
              onClose={() => setForgotPasswordState(prev => ({ ...prev, isOpen: false }))}
              onOpenLogin={() => {
                const targetType = forgotPasswordState.type;
                setForgotPasswordState(prev => ({ ...prev, isOpen: false }));
                if (targetType === 'admin') {
                  setIsAdminLoginOpen(true);
                } else {
                  setIsSchoolLoginOpen(true);
                }
              }}
            />
          )}

          {/* Parent Login Modal */}
          {isParentLoginOpen && (
            <ParentLoginModal
              onSuccess={(student) => {
                handleSignOutAll();
                setParentSession({ student });
                setIsParentLoginOpen(false);
              }}
              onClose={() => setIsParentLoginOpen(false)}
              onOpenSchoolLogin={() => {
                setIsParentLoginOpen(false);
                setIsSchoolLoginOpen(true);
              }}
            />
          )}

          {/* Add Student Modal */}
          {isAddStudentOpen && currentOrg && (
            <AddStudentModal
              orgId={currentOrg.id}
              existingCount={students.length}
              onSaveStudent={handleSaveStudent}
              onClose={() => setIsAddStudentOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}