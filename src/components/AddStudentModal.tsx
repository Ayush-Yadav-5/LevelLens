import React, { useState } from 'react';
import { 
  UserPlus, 
  X, 
  ArrowRight, 
  AlertCircle, 
  Phone, 
  Hash, 
  User, 
  GraduationCap
} from 'lucide-react';
import { Student, PrimaryGrade, ReadingLevel, MathLevel } from '../types';

interface AddStudentModalProps {
  orgId: string;
  existingCount: number;
  onSaveStudent: (student: Student) => void;
  onClose: () => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  orgId,
  existingCount,
  onSaveStudent,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState(existingCount + 1);
  const [grade, setGrade] = useState<PrimaryGrade>(1);
  const [section, setSection] = useState('A');
  const [gender, setGender] = useState<'F' | 'M'>('F');
  const [parentPhone, setParentPhone] = useState('');
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>('PRE_WORD');
  const [mathLevel, setMathLevel] = useState<MathLevel>('COUNT_20');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter the student full name.');
      return;
    }

    const cleanPhone = parentPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      setError('Please provide a 10-digit mobile number for parent login & SMS dispatch.');
      return;
    }

    // Determine initial pods based on level
    let readingPodId: 'R1' | 'R2' | 'R3' = 'R1';
    if (readingLevel === 'WORD') readingPodId = 'R2';
    if (readingLevel === 'SENTENCE' || readingLevel === 'GRADE_LEVEL') readingPodId = 'R3';

    let mathPodId: 'M1' | 'M2' | 'M3' = 'M1';
    if (mathLevel === 'PATTERN_OPS') mathPodId = 'M2';
    if (mathLevel === 'BORROW_OPS') mathPodId = 'M3';

    // Calculate seating row and col (5 rows, 6 cols max 30)
    const seatingRow = Math.floor(existingCount / 6) % 5;
    const seatingCol = existingCount % 6;

    const newStudent: Student = {
      id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orgId,
      name: name.trim(),
      rollNo: Number(rollNo),
      grade,
      section,
      gender,
      avatarSeed: name.trim(),
      parentPhone: cleanPhone,
      seatingRow,
      seatingCol,
      readingLevel,
      mathLevel,
      readingWpm: readingLevel === 'PRE_WORD' ? 10 : readingLevel === 'WORD' ? 24 : 38,
      readingAccuracy: readingLevel === 'PRE_WORD' ? 50 : readingLevel === 'WORD' ? 75 : 90,
      mathLatencyMs: mathLevel === 'COUNT_20' ? 4500 : mathLevel === 'PATTERN_OPS' ? 2600 : 1600,
      readingPodId,
      mathPodId,
      lastAssessedDate: 'Just added',
      assessedThisWeek: false,
      history: [],
      phoneticFlags: readingLevel === 'PRE_WORD' ? ['initial akshar recognition'] : [],
      mathFlags: mathLevel === 'COUNT_20' ? ['counting to 20'] : [],
    };

    onSaveStudent(newStudent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 text-slate-100 my-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Primary Roster (Grades 1–5)
              </span>
              <h2 className="text-xl font-black text-white mt-0.5">Enroll New Student</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Name & Roll No */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-300">Student Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pooja Meena"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Roll No</label>
              <input
                type="number"
                required
                min={1}
                value={rollNo}
                onChange={(e) => setRollNo(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Grade, Section, Gender */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Primary Grade</label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value) as PrimaryGrade)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value={1}>Grade 1</option>
                <option value={2}>Grade 2</option>
                <option value={3}>Grade 3</option>
                <option value={4}>Grade 4</option>
                <option value={5}>Grade 5</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="A">Sec A</option>
                <option value="B">Sec B</option>
                <option value="C">Sec C</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'F' | 'M')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="F">Female</option>
                <option value="M">Male</option>
              </select>
            </div>
          </div>

          {/* Parent Phone Number */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Parent Mobile (for Login & IVR)</label>
              <span className="text-[10px] text-amber-400 font-mono">10 digits</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-mono text-slate-500">+91</span>
              <input
                type="tel"
                required
                maxLength={10}
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-2.5 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Initial Baseline Assessment Levels */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Initial Reading Level</label>
              <select
                value={readingLevel}
                onChange={(e) => setReadingLevel(e.target.value as ReadingLevel)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="PRE_WORD">Pre-Word (Sound Sleuths)</option>
                <option value="WORD">Word Level (Word Builders)</option>
                <option value="SENTENCE">Sentence Level</option>
                <option value="GRADE_LEVEL">Grade Level (Story Explorers)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Initial Math Level</label>
              <select
                value={mathLevel}
                onChange={(e) => setMathLevel(e.target.value as MathLevel)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="COUNT_20">Count &lt; 20 (Number Friends)</option>
                <option value="PATTERN_OPS">Basic Ops (Pattern Masters)</option>
                <option value="BORROW_OPS">Regrouping (Borrow Detectives)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all mt-2"
          >
            <span>Save & Add to Classroom Map</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
