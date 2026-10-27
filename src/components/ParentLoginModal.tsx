import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  Phone, 
  ArrowRight, 
  ArrowLeft,
  X, 
  AlertCircle, 
  Sparkles,
  School,
  Lock
} from 'lucide-react';
import { Student } from '../types';
import { storage } from '../services/storage';

interface ParentLoginModalProps {
  onSuccess: (student: Student) => void;
  onOpenSchoolLogin: () => void;
  onClose: () => void;
}

const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 60;

export const ParentLoginModal: React.FC<ParentLoginModalProps> = ({
  onSuccess,
  onOpenSchoolLogin,
  onClose,
}) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockoutTimer > 0) {
      timer = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            setAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (lockoutTimer > 0) {
      setError(`Too many lookup attempts. Please wait ${lockoutTimer} seconds before trying again.`);
      return;
    }

    const clean = phone.replace(/\D/g, '').slice(-10);
    if (clean.length < 10) {
      setError("Please enter a valid 10-digit mobile number registered with your child's school.");
      return;
    }

    setIsSearching(true);

    try {
      const student = await storage.findStudentByParentPhone(clean);

      if (!student) {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);

        if (nextAttempts >= MAX_ATTEMPTS) {
          setLockoutTimer(COOLDOWN_SECONDS);
          setError(`Too many failed attempts. Lookup temporarily paused for ${COOLDOWN_SECONDS}s.`);
        } else {
          setError(
            `No student record linked to +91-${clean}. Please verify the registered mobile number with your school.`
          );
        }
        setIsSearching(false);
        return;
      }

      setAttempts(0);
      onSuccess(student);
    } catch {
      setError('Database connection error. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 text-slate-100 my-auto">
        
        {/* Navigation Bar / Back Button */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Back to Landing Page</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">Parent Portal</h2>
            <p className="text-xs text-amber-400 font-medium">Bilingual Home Micro-Activities & Growth Progress</p>
          </div>
        </div>

        {/* Info card */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 leading-relaxed flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 font-semibold">Zero-Login Barrier:</strong> Enter the mobile phone number you registered during school admission to instantly view daily WhatsApp-style practice activities.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Registered Parent Phone Number</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-slate-500 text-sm font-semibold select-none">+91</span>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                disabled={lockoutTimer > 0}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="98765 43210"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-14 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors font-mono disabled:opacity-50"
              />
            </div>
            <p className="text-[11px] text-slate-500">10-digit number without country code</p>
          </div>

          <button
            type="submit"
            disabled={isSearching || lockoutTimer > 0}
            className="w-full h-12 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            <span>
              {lockoutTimer > 0 
                ? `Locked (${lockoutTimer}s)` 
                : isSearching 
                  ? 'Locating Student Record...' 
                  : 'View Child Progress & Practice'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="pt-2 border-t border-slate-800 space-y-3 text-center text-xs">
          <div>
            <span className="text-slate-400">Are you a School Teacher or Admin? </span>
            <button
              type="button"
              onClick={onOpenSchoolLogin}
              className="text-amber-400 hover:text-amber-300 font-bold underline"
            >
              School Portal Sign In
            </button>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 text-xs flex items-center justify-center gap-1 mx-auto transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Landing Page</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};