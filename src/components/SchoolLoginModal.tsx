import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  ArrowRight, 
  ArrowLeft,
  X,
  ShieldCheck, 
  PhoneCall, 
  AlertCircle,
  School,
  UserCheck
} from 'lucide-react';
import { Organization } from '../types';
import { storage } from '../services/storage';

interface SchoolLoginModalProps {
  onSuccess: (org: Organization) => void;
  onOpenRegister: () => void;
  onOpenParentLogin: () => void;
  onClose: () => void;
}

export const SchoolLoginModal: React.FC<SchoolLoginModalProps> = ({
  onSuccess,
  onOpenRegister,
  onOpenParentLogin,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your registered email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const org = await storage.authenticateSchool(cleanEmail, password);

      if (!org) {
        setError('Invalid credentials or unregistered school. Please verify your email and password.');
        setIsSubmitting(false);
        return;
      }

      if (org.status === 'PENDING_APPROVAL') {
        setError(`"${org.name}" is currently PENDING ADMIN APPROVAL. The platform administrator must validate your registration before first login.`);
        setIsSubmitting(false);
        return;
      }

      if (org.status === 'REJECTED') {
        setError('This organization account was rejected by the administrator.');
        setIsSubmitting(false);
        return;
      }

      // Successful login
      onSuccess(org);
    } catch {
      setError('An unexpected error occurred during login. Please try again.');
    } finally {
      setIsSubmitting(false);
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
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
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
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20">
            <School className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">LevelLens Classroom</h2>
            <p className="text-xs text-emerald-400 font-medium">Primary Schools & Tuition Centers (Grades 1–5)</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="leading-relaxed">
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Registered School Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. principal@school.org"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Signing In...' : 'Log in as School / Tuition'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-800 space-y-3 text-center text-xs">
          <div>
            <span className="text-slate-400">First time using LevelLens? </span>
            <button
              type="button"
              onClick={onOpenRegister}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline"
            >
              Register Organization
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 text-slate-500">
            <button
              type="button"
              onClick={onOpenParentLogin}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span>Parent Portal (Bypass Login)</span>
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