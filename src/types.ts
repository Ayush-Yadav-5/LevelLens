export type ReadingLevel = 'PRE_WORD' | 'WORD' | 'SENTENCE' | 'GRADE_LEVEL';
export type MathLevel = 'COUNT_20' | 'PATTERN_OPS' | 'BORROW_OPS';

export type PrimaryGrade = 1 | 2 | 3 | 4 | 5;

export type OrgType = 
  | 'PRIMARY_SCHOOL' 
  | 'TUITION_CENTER' 
  | 'COMMUNITY_NGO' 
  | 'PLAY_SCHOOL';

export type OrgStatus = 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';

export interface Organization {
  id: string;
  email: string;
  password?: string;
  name: string;
  orgType: OrgType;
  strengthPerGrade: string; // e.g. "15-25"
  udiseCode?: string; // Optional for primary schools / tuition centers
  district: string;
  state: string;
  status: OrgStatus;
  createdAt: string;
}

export interface AssessmentRecord {
  id: string;
  date: string;
  readingWpm: number;
  readingAccuracy: number;
  readingLevel: ReadingLevel;
  mathAccuracy: number;
  mathLatencyMs: number;
  mathLevel: MathLevel;
  notes?: string;
}

export interface Student {
  id: string;
  orgId?: string;
  name: string;
  rollNo: number;
  grade: PrimaryGrade;
  section?: string;
  gender: 'F' | 'M';
  avatarSeed: string;
  parentPhone?: string; // 10-digit mobile number for parent login
  seatingRow: number; // 0 to 4 (5 rows)
  seatingCol: number; // 0 to 5 (6 columns)
  readingLevel: ReadingLevel;
  mathLevel: MathLevel;
  readingWpm: number;
  readingAccuracy: number;
  mathAccuracy?: number;
  mathLatencyMs: number;
  readingPodId: 'R1' | 'R2' | 'R3';
  mathPodId: 'M1' | 'M2' | 'M3';
  lastAssessedDate: string;
  assessedThisWeek: boolean;
  assessedReadingThisWeek?: boolean;
  assessedMathThisWeek?: boolean;
  history: AssessmentRecord[];
  phoneticFlags: string[];
  mathFlags: string[];
}

export interface SkillPod {
  id: 'R1' | 'R2' | 'R3' | 'M1' | 'M2' | 'M3';
  domain: 'reading' | 'math';
  name: string;
  badgeTitle: string;
  levelDescriptor: string;
  targetSkill: string;
  colorClass: string;
  bgLightClass: string;
  borderClass: string;
  studentsCount: number;
  activities: MicroActivity[];
}

export interface MicroActivity {
  id: string;
  title: string;
  durationMinutes: number;
  materials: string; // low-resource: "chalk, floor, stones"
  instructions: string[];
  learningObjective: string;
  status?: 'suggested' | 'planned' | 'completed';
}

export interface FLNCompetency {
  code: string;
  grade: number;
  domain: 'Reading' | 'Numeracy';
  description: string;
  benchmark: string;
  targetLevel: ReadingLevel | MathLevel;
  achievedPercent: number; // calculated from class
  status: 'Critical Gap' | 'In Progress' | 'On Track';
}

export type ActiveTab = 'class-map' | 'weekly-check' | 'pods' | 'compliance' | 'parent-portal' | 'admin-panel';

export interface ParentSession {
  phone: string;
  student: Student;
  verified: boolean;
}

export type AdminRole = 'OWNER' | 'ADMIN';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: AdminRole;
  createdAt: string;
}
