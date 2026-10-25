export type ReadingLevel = 'PRE_WORD' | 'WORD' | 'SENTENCE' | 'GRADE_LEVEL';
export type MathLevel = 'COUNT_20' | 'PATTERN_OPS' | 'BORROW_OPS';

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
  name: string;
  rollNo: number;
  grade: 2 | 3 | 4;
  gender: 'F' | 'M';
  avatarSeed: string;
  seatingRow: number; // 0 to 4 (5 rows)
  seatingCol: number; // 0 to 5 (6 columns)
  readingLevel: ReadingLevel;
  mathLevel: MathLevel;
  readingWpm: number;
  readingAccuracy: number;
  mathLatencyMs: number;
  readingPodId: 'R1' | 'R2' | 'R3';
  mathPodId: 'M1' | 'M2' | 'M3';
  lastAssessedDate: string;
  assessedThisWeek: boolean;
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

export type ActiveTab = 'class-map' | 'weekly-check' | 'pods' | 'compliance';
