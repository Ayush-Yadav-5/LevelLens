import React, { useState } from 'react';
import { 
  UserCheck, 
  X, 
  Save, 
  AlertCircle, 
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Student, PrimaryGrade, ReadingLevel, MathLevel } from '../types';

interface EditStudentModalProps {
  student: Student;
  onUpdateStudent: (updatedStudent: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onClose: () => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  student,
  onUpdateStudent,
  onDeleteStudent,
  onClose,
}) => {
  const [name, setName] = useState(student.name);
  const [rollNo, setRollNo] = useState(student.rollNo);
  const [grade, setGrade] = useState<PrimaryGrade>(student.grade);
  const [section, setSection] = useState(student.section || 'A');
  const [gender, setGender] = useState<'F' | 'M'>(student.gender === 'M' ? 'M' : 'F');
  const [parentPhone, setParentPhone] = useState(student.parentPhone || '');
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>(student.readingLevel);
  const [mathLevel, setMathLevel] = useState<MathLevel>(student.mathLevel);
  const [readingPodId, setReadingPodId] = useState<'R1' | 'R2' | 'R3'>(student.readingPodId);
  const [mathPodId, setMathPodId] = useState<'M1' | 'M2' | 'M3'>(student.mathPodId);
  const [error, setError] = useState<string | null>(null);

  // Inline delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide student full name.');
      return;
    }

    const cleanPhone = parentPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }

    const updated: Student = {
      ...student,
      name: name.trim(),
      rollNo: Number(rollNo),
      grade,
      section,
      gender,
      parentPhone: cleanPhone,
      readingLevel,
      mathLevel,
      readingPodId,
      mathPodId,
    };

    onUpdateStudent(updated);
    onClose();
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDeleteStudent(student.id);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
        <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 text-slate-100 my-auto">
          
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  Primary Roster (Grades 1–5)
                </span>
                <h2 className="text-xl font-black text-white mt-0.5">Edit Student Details</h2>
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

            {/* Parent Phone */}
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

            {/* Reading & Math Levels */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Reading Level</label>
                <select
                  value={readingLevel}
                  onChange={(e) => {
                    const val = e.target.value as ReadingLevel;
                    setReadingLevel(val);
                    if (val === 'PRE_WORD') setReadingPodId('R1');
                    else if (val === 'WORD') setReadingPodId('R2');
                    else setReadingPodId('R3');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="PRE_WORD">Pre-Word (Sound Sleuths)</option>
                  <option value="WORD">Word Level (Word Builders)</option>
                  <option value="SENTENCE">Sentence Level</option>
                  <option value="GRADE_LEVEL">Grade Level (Story Explorers)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Math Level</label>
                <select
                  value={mathLevel}
                  onChange={(e) => {
                    const val = e.target.value as MathLevel;
                    setMathLevel(val);
                    if (val === 'COUNT_20') setMathPodId('M1');
                    else if (val === 'PATTERN_OPS') setMathPodId('M2');
                    else setMathPodId('M3');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="COUNT_20">Count &lt; 20 (Number Friends)</option>
                  <option value="PATTERN_OPS">Basic Ops (Pattern Masters)</option>
                  <option value="BORROW_OPS">Regrouping (Borrow Detectives)</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>

              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
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