import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  ArrowRight, 
  ArrowLeft,
  X, 
  CheckCircle2, 
  Users, 
  MapPin, 
  FileText,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  RotateCcw
} from 'lucide-react';
import emailjs from '@emailjs/browser';
import { OrgType } from '../types';
import { storage } from '../services/storage';

interface SchoolRegisterModalProps {
  onClose: () => void;
  onSuccessRegistered: () => void;
  onOpenLogin: () => void;
}

// Cryptographically secure 6-digit OTP generator
const generateSecureOtp = (): string => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (100000 + (array[0] % 900000)).toString();
};

export const SchoolRegisterModal: React.FC<SchoolRegisterModalProps> = ({
  onClose,
  onSuccessRegistered,
  onOpenLogin,
}) => {
  // Step state: 'form' -> 'otp'
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [orgType, setOrgType] = useState<OrgType>('PRIMARY_SCHOOL');
  const [strengthPerGrade, setStrengthPerGrade] = useState('20-30');
  const [udiseCode, setUdiseCode] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');

  // OTP Verification States
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Using a ref to prevent any state desync during verification
  const activeOtpRef = useRef<string>('');

  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Mask email helper for notice (e.g. pr***l@gmail.com)
  const getMaskedEmail = (rawEmail: string) => {
    const [user, domain] = rawEmail.split('@');
    if (!domain) return rawEmail;
    if (user.length <= 2) return `${user}***@${domain}`;
    return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`;
  };

  // Dispatch OTP using EmailJS
  const dispatchEmailOtp = async (targetEmail: string, code: string) => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (serviceId && templateId && publicKey) {
      await emailjs.send(
        serviceId,
        templateId,
        {
          to_email: targetEmail,
          to_name: name || 'School Administrator',
          otp_code: code,
        },
        publicKey
      );
    } else {
      console.warn('EmailJS environment variables missing. Verify VITE_EMAILJS_* keys in .env');
    }
  };

  // Step 1: Validate details and send OTP
  const handleInitiateOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    if (cleanName.length < 3) {
      setError('Organisation name must be at least 3 characters long.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      setError('Please provide a valid official email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (!district.trim()) {
      setError('District is required.');
      return;
    }

    if (!state.trim()) {
      setError('State is required.');
      return;
    }

    setIsSendingOtp(true);

    try {
      const existing = await storage.getOrganizations();
      if (existing.some((o) => o.email.toLowerCase() === cleanEmail)) {
        setError('An organization is already registered with this email address.');
        setIsSendingOtp(false);
        return;
      }

      const newOtp = generateSecureOtp();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minute expiry

      setGeneratedOtp(newOtp);
      activeOtpRef.current = newOtp;
      setOtpExpiry(expiresAt);

      await dispatchEmailOtp(cleanEmail, newOtp);

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

      await dispatchEmailOtp(email.trim().toLowerCase(), newOtp);
      setResendTimer(30);
      setEnteredOtp('');
    } catch {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Strict OTP verification & submission
  const handleVerifyOtpAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEntered = enteredOtp.trim();
    if (cleanEntered.length !== 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }

    setIsVerifyingOtp(true);

    try {
      // 1. Check expiration
      if (otpExpiry && Date.now() > otpExpiry) {
        setError('This verification code has expired. Please tap "Resend Code".');
        setIsVerifyingOtp(false);
        return;
      }

      // 2. Strict OTP comparison (checks activeOtpRef and state)
      const expectedOtp = activeOtpRef.current || generatedOtp;
      if (!expectedOtp || cleanEntered !== expectedOtp) {
        setError('Incorrect verification code. Please check your email and enter the exact 6-digit code.');
        setIsVerifyingOtp(false);
        return;
      }

      // 3. Register organization once OTP matches strictly
      setIsSubmitting(true);

      await storage.registerOrganization({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        orgType,
        strengthPerGrade,
        udiseCode: udiseCode.trim() || undefined,
        district: district.trim(),
        state: state.trim(),
      });

      // Invalidate the OTP once verified successfully
      setGeneratedOtp('');
      activeOtpRef.current = '';
      setSubmittedSuccess(true);
    } catch {
      setError('Failed to submit registration. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-slate-100 my-auto">
        
        {/* Navigation Bar / Back Button */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <button
            type="button"
            onClick={step === 'otp' && !submittedSuccess ? () => setStep('form') : onClose}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>{step === 'otp' && !submittedSuccess ? 'Edit Details' : 'Back to Landing Page'}</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Account Registration
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {step === 'form' ? 'Register School / Tuition Center' : 'Verify Email Address'}
          </h2>
          <p className="text-xs text-slate-400">
            {step === 'form' 
              ? 'For Primary Schools (Grades 1–5) and local tuition centers.'
              : `Enter the 6-digit verification code sent to ${getMaskedEmail(email)}`}
          </p>
        </div>

        {submittedSuccess ? (
          <div className="p-6 bg-slate-950/90 rounded-2xl border border-emerald-500/30 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white">Account Created Successfully!</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                <strong className="text-white">{name}</strong> has been registered.
                <span className="block mt-2 font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/30 text-xs">
                  Status: PENDING ADMIN APPROVAL
                </span>
                <span className="block mt-1 text-[11px] text-slate-400">
                  As requested, all new school and tuition registrations are validated by the platform admin before first login.
                </span>
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLogin();
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow"
              >
                <span>Proceed to School Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        ) : step === 'otp' ? (
          /* STEP 2: Strict Email OTP Verification Screen */
          <form onSubmit={handleVerifyOtpAndRegister} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 leading-relaxed flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                OTP dispatched successfully to <strong className="font-mono text-white">{getMaskedEmail(email)}</strong>
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Enter 6-Digit Email OTP</label>
                <button
                  type="button"
                  disabled={resendTimer > 0 || isSendingOtp}
                  onClick={handleResendOtp}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 disabled:text-slate-500 flex items-center gap-1 font-medium transition-colors"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-lg tracking-[0.5em] text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
              <p className="text-[11px] text-slate-400 text-center">
                Please check your inbox or spam folder for the 6-digit verification code.
              </p>
            </div>

            <button
              type="submit"
              disabled={isVerifyingOtp || isSubmitting || enteredOtp.length !== 6}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              <span>{isVerifyingOtp || isSubmitting ? 'Verifying & Registering...' : 'Verify OTP & Complete Registration'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* STEP 1: Registration Form */
          <form onSubmit={handleInitiateOtp} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Org Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Organisation / School Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Adarsh Bal Vidya Mandir or Prerna Evening Tuition"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Org Type & Strength */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Organisation Type <span className="text-rose-400">*</span>
                </label>
                <select
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value as OrgType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="PRIMARY_SCHOOL">Primary School (Govt / Private)</option>
                  <option value="TUITION_CENTER">Local Tuition Center</option>
                  <option value="COMMUNITY_NGO">Community Learning Center / NGO</option>
                  <option value="PLAY_SCHOOL">Play School / Early Care</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Strength (per grade) <span className="text-rose-400">*</span>
                </label>
                <select
                  value={strengthPerGrade}
                  onChange={(e) => setStrengthPerGrade(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="5-15">5 – 15 students</option>
                  <option value="15-25">15 – 25 students</option>
                  <option value="25-40">25 – 40 students</option>
                  <option value="40+">40+ students</option>
                </select>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Official Account Email <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. principal@school.org or teacher@tuition.in"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Optional UDISE, District, State */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  UDISE+ <span className="text-[10px] text-slate-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={udiseCode}
                  onChange={(e) => setUdiseCode(e.target.value)}
                  placeholder="Optional code"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  District <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Jaipur"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  State <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Rajasthan"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
              🛡️ <strong>Admin Approval Policy:</strong> Once registered, the platform admin/owner approves your school before first login. Local tuitions do not require UDISE.
            </p>

            <button
              type="submit"
              disabled={isSendingOtp}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              <span>{isSendingOtp ? 'Sending Email Verification Code...' : 'Send Verification OTP'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 text-center text-xs space-y-2">
          <div>
            <span className="text-slate-400">Already registered? </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className="text-emerald-400 hover:text-emerald-300 font-bold"
            >
              Log in here
            </button>
          </div>
          <div>
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