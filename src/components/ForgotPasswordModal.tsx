import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  KeyRound, 
  RotateCcw,
  ShieldCheck,
  School
} from 'lucide-react';
import emailjs from '@emailjs/browser';
import { storage } from '../services/storage';

export interface ForgotPasswordModalProps {
  accountType: 'school' | 'admin';
  onClose: () => void;
  onOpenLogin: () => void;
}

// Cryptographically secure 6-digit OTP generator
const generateSecureOtp = (): string => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (100000 + (array[0] % 900000)).toString();
};

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  accountType,
  onClose,
  onOpenLogin,
}) => {
  // Step state: 'email' -> 'otp' -> 'reset' -> 'success'
  const [step, setStep] = useState<'email' | 'otp' | 'reset' | 'success'>('email');

  // Input states
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Verification States
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeOtpRef = useRef<string>('');

  const isAdmin = accountType === 'admin';
  const themeColor = isAdmin ? 'indigo' : 'emerald';

  // Resend countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  const getMaskedEmail = (rawEmail: string) => {
    const [user, domain] = rawEmail.split('@');
    if (!domain) return rawEmail;
    if (user.length <= 2) return `${user}***@${domain}`;
    return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`;
  };

  // Dispatch OTP using EmailJS
  const dispatchEmailOtp = async (targetEmail: string, code: string, recipientName: string) => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (serviceId && templateId && publicKey) {
      await emailjs.send(
        serviceId,
        templateId,
        {
          to_email: targetEmail,
          to_name: recipientName || (isAdmin ? 'Administrator' : 'School Official'),
          otp_code: code,
          purpose: 'Password Reset',
        },
        publicKey
      );
    } else {
      console.warn('EmailJS environment variables missing. Verify VITE_EMAILJS_* keys in .env');
    }
  };

  // Step 1: Validate email existence & dispatch OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please provide a valid official email address.');
      return;
    }

    setIsSendingOtp(true);

    try {
      let resolvedName = '';

      if (isAdmin) {
        const admin = await storage.findAdminByEmail(cleanEmail);
        if (!admin) {
          setError('No administrator account found with this email address.');
          setIsSendingOtp(false);
          return;
        }
        resolvedName = admin.name;
      } else {
        const school = await storage.findSchoolByEmail(cleanEmail);
        if (!school) {
          setError('No registered school or tuition center found with this email.');
          setIsSendingOtp(false);
          return;
        }
        resolvedName = school.name;
      }

      setUserName(resolvedName);

      const newOtp = generateSecureOtp();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      setGeneratedOtp(newOtp);
      activeOtpRef.current = newOtp;
      setOtpExpiry(expiresAt);

      await dispatchEmailOtp(cleanEmail, newOtp, resolvedName);

      setStep('otp');
      setResendTimer(30);
      setEnteredOtp('');
    } catch (err) {
      console.error(err);
      setError('Failed to dispatch verification email. Please check your connection.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError(null);
    setIsSendingOtp(true);

    try {
      const newOtp = generateSecureOtp();
      const expiresAt = Date.now() + 10 * 60 * 1000;

      setGeneratedOtp(newOtp);
      activeOtpRef.current = newOtp;
      setOtpExpiry(expiresAt);

      await dispatchEmailOtp(email.trim().toLowerCase(), newOtp, userName);
      setResendTimer(30);
      setEnteredOtp('');
    } catch {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Validate entered OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEntered = enteredOtp.trim();
    if (cleanEntered.length !== 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }

    setIsVerifyingOtp(true);

    if (otpExpiry && Date.now() > otpExpiry) {
      setError('This verification code has expired. Please tap "Resend Code".');
      setIsVerifyingOtp(false);
      return;
    }

    const expectedOtp = activeOtpRef.current || generatedOtp;
    if (!expectedOtp || cleanEntered !== expectedOtp) {
      setError('Incorrect verification code. Please check your email and try again.');
      setIsVerifyingOtp(false);
      return;
    }

    setIsVerifyingOtp(false);
    setStep('reset');
  };

  // Step 3: Save new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const success = isAdmin
        ? await storage.resetAdminPassword(cleanEmail, newPassword)
        : await storage.resetSchoolPassword(cleanEmail, newPassword);

      if (!success) {
        setError('Failed to update password. Please check your account status.');
        setIsSubmitting(false);
        return;
      }

      setGeneratedOtp('');
      activeOtpRef.current = '';
      setStep('success');
    } catch {
      setError('An error occurred during password reset. Please try again.');
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
            onClick={step === 'otp' ? () => setStep('email') : onClose}
            className={`flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-slate-800`}
          >
            <ArrowLeft className={`w-4 h-4 ${isAdmin ? 'text-indigo-400' : 'text-emerald-400'}`} />
            <span>{step === 'otp' ? 'Back to Email' : 'Back to Landing Page'}</span>
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
          <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center font-black shadow-lg ${
            isAdmin 
              ? 'bg-indigo-500/20 text-indigo-400 shadow-indigo-950/50' 
              : 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/20'
          }`}>
            {isAdmin ? <ShieldCheck className="w-7 h-7" /> : <School className="w-7 h-7" />}
          </div>
          <div>
            <span className={`text-[10px] font-bold tracking-widest uppercase font-mono px-2 py-0.5 rounded border ${
              isAdmin 
                ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' 
                : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            }`}>
              {isAdmin ? 'Staff & Admin Portal' : 'School & Tuition Portal'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">Reset Password</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {step === 'email' && `Enter your registered ${isAdmin ? 'admin' : 'school'} email to receive a verification OTP.`}
              {step === 'otp' && `Enter the 6-digit code dispatched to ${getMaskedEmail(email)}`}
              {step === 'reset' && 'Create and verify your new account password.'}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="leading-relaxed">
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* STEP 1: Enter Email */}
        {step === 'email' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                {isAdmin ? 'Administrator Email Address' : 'Registered School Email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isAdmin ? 'admin@levellens.org' : 'principal@school.org'}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors ${
                    isAdmin ? 'focus:border-indigo-500' : 'focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSendingOtp}
              className={`w-full h-12 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 ${
                isAdmin 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25' 
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              <span>{isSendingOtp ? 'Sending Verification Code...' : 'Send Verification OTP'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: Strict OTP Entry */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex items-center gap-2.5 ${
              isAdmin 
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${isAdmin ? 'text-indigo-400' : 'text-emerald-400'}`} />
              <span>
                Verification code dispatched to <strong className="font-mono text-white">{getMaskedEmail(email)}</strong>
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Enter 6-Digit Email OTP</label>
                <button
                  type="button"
                  disabled={resendTimer > 0 || isSendingOtp}
                  onClick={handleResendOtp}
                  className={`text-[11px] disabled:text-slate-500 flex items-center gap-1 font-medium transition-colors ${
                    isAdmin ? 'text-indigo-400 hover:text-indigo-300' : 'text-emerald-400 hover:text-emerald-300'
                  }`}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend Code'}</span>
                </button>
              </div>

              <input
                type="text"
                autoFocus
                required
                maxLength={6}
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-lg tracking-[0.5em] text-white placeholder-slate-600 focus:outline-none transition-colors font-mono ${
                  isAdmin ? 'focus:border-indigo-500' : 'focus:border-emerald-500'
                }`}
              />
              <p className="text-[11px] text-slate-400 text-center">
                Please check your inbox and spam folder for the code.
              </p>
            </div>

            <button
              type="submit"
              disabled={isVerifyingOtp || enteredOtp.length !== 6}
              className={`w-full h-12 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 ${
                isAdmin 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25' 
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              <span>{isVerifyingOtp ? 'Verifying OTP...' : 'Verify OTP'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 3: Create New Password */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors ${
                    isAdmin ? 'focus:border-indigo-500' : 'focus:border-emerald-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors ${
                    isAdmin ? 'focus:border-indigo-500' : 'focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full h-12 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 ${
                isAdmin 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25' 
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>{isSubmitting ? 'Updating Password...' : 'Save New Password'}</span>
            </button>
          </form>
        )}

        {/* STEP 4: Success Message */}
        {step === 'success' && (
          <div className="p-6 bg-slate-950/90 rounded-2xl border border-slate-800 text-center space-y-4">
            <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${
              isAdmin ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">Password Reset Successfully</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your credentials have been updated. You can now log into your account.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className={`w-full h-11 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow ${
                isAdmin 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25' 
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              <span>Back to Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 space-y-2 text-center text-xs">
          <div>
            <span className="text-slate-400">Remembered your credentials? </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className={`font-bold underline ${
                isAdmin ? 'text-indigo-400 hover:text-indigo-300' : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};