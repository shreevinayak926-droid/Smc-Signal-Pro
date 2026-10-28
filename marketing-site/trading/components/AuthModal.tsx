import React, { useState } from 'react';
import { User } from '../types';
import { supabaseAuthService } from '../services/supabaseAuth';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  LogIn,
  UserPlus,
  Shield,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User, token: string) => void;
  targetTabName?: string;
  initialMode?: 'LOGIN' | 'SIGNUP' | 'FORGOT_REQUEST' | 'UPDATE_PASSWORD';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  targetTabName,
  initialMode = 'LOGIN',
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT_REQUEST' | 'UPDATE_PASSWORD' | 'VERIFY_NOTICE'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Sync mode with initialMode when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (initialMode) {
        setMode(initialMode);
      }
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Handle Login or Initial Registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'SIGNUP') {
        const res = await supabaseAuthService.register(email, password, name);
        if (res.success) {
          if (res.needsEmailVerification || !res.token) {
            setMode('VERIFY_NOTICE');
            setSuccessMsg(res.message || 'Verification link sent to your email!');
          } else if (res.user && res.token) {
            setSuccessMsg(res.message || 'Account created successfully!');
            setTimeout(() => {
              onLoginSuccess(res.user!, res.token!);
              onClose();
            }, 600);
          }
        } else {
          setError(res.message || 'Registration failed.');
        }
      } else if (mode === 'LOGIN') {
        const res = await supabaseAuthService.login(email, password);
        if (res.success && res.user && res.token) {
          setSuccessMsg(res.message || 'Welcome back!');
          setTimeout(() => {
            onLoginSuccess(res.user!, res.token!);
            onClose();
          }, 600);
        } else {
          setError(res.message || 'Authentication failed.');
        }
      }
    } catch (err: any) {
      console.error('[AuthModal Exception]:', err);
      setError(err?.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend Verification Email
  const handleResendVerification = async () => {
    if (!email.trim()) {
      setError('Please provide your registered email address.');
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setIsResending(true);
    try {
      const res = await supabaseAuthService.resendVerificationEmail(email.trim());
      if (res.success) {
        setSuccessMsg(res.message || 'Verification link resent to your email!');
      } else {
        setError(res.message || 'Failed to resend verification link.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error resending verification link.');
    } finally {
      setIsResending(false);
    }
  };

  // Handle Update Password (Password Reset Finalize)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanPass = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanPass || cleanPass.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (cleanPass !== cleanConfirm) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await supabaseAuthService.updatePassword(cleanPass);
      if (res.success) {
        setSuccessMsg(res.message || 'Password updated successfully! Please sign in with your new password.');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setMode('LOGIN');
          if (window.location.hash.includes('reset-password')) {
            window.location.hash = '';
          }
        }, 1500);
      } else {
        setError(res.message || 'Failed to update password.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password Request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your account email address.');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await supabaseAuthService.forgotPassword(email);
      if (res.success) {
        setSuccessMsg(res.message || 'Password reset link sent to your email.');
      } else {
        setError(res.message || 'Failed to send password reset email.');
      }
    } catch (err: any) {
      setError(err?.message || 'Password reset error.');
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthNavVisible = mode === 'LOGIN' || mode === 'SIGNUP';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0E1015] border border-[#1F2229] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-[#1F2229] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00FFA3]/15 border border-[#00FFA3]/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#00FFA3]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F3F4F6]">
                {mode === 'LOGIN'
                  ? 'Sign In to Account'
                  : mode === 'SIGNUP'
                  ? 'Create Your Account'
                  : mode === 'VERIFY_NOTICE'
                  ? 'Verify Your Email'
                  : mode === 'UPDATE_PASSWORD'
                  ? 'Set New Password'
                  : 'Reset Password'}
              </h3>
              <p className="text-xs text-[#94A3B8]">
                {targetTabName
                  ? `Log in to access ${targetTabName}`
                  : 'Supabase Institutional Suite'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#94A3B8] hover:text-[#E0E0E0] hover:bg-[#12141A] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        {isAuthNavVisible && (
          <div className="flex bg-[#12141A] border-b border-[#1F2229] p-1">
            <button
              onClick={() => {
                setMode('LOGIN');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'LOGIN'
                  ? 'bg-[#1F2229] text-[#00FFA3] shadow'
                  : 'text-[#94A3B8] hover:text-[#E0E0E0]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('SIGNUP');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'SIGNUP'
                  ? 'bg-[#1F2229] text-[#00FFA3] shadow'
                  : 'text-[#94A3B8] hover:text-[#E0E0E0]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register (24h Free Trial)
            </button>
          </div>
        )}

        {/* Feedback Notices */}
        {error && (
          <div className="mx-5 mt-4 p-3 bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 rounded-xl flex items-start gap-2.5 text-xs text-[#FF4D6D]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <div>{error}</div>
              {error.toLowerCase().includes('not confirmed') && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('VERIFY_NOTICE');
                    handleResendVerification();
                  }}
                  className="mt-1.5 text-[11px] text-[#00FFA3] hover:underline font-bold block cursor-pointer"
                >
                  Click here to resend verification email →
                </button>
              )}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mx-5 mt-4 p-3 bg-[#00FFA3]/10 border border-[#00FFA3]/30 rounded-xl flex items-start gap-2.5 text-xs text-[#00FFA3]">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* 1. EMAIL VERIFICATION NOTICE VIEW */}
        {mode === 'VERIFY_NOTICE' ? (
          <div className="p-6 space-y-4 overflow-y-auto text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[#00FFA3]/15 border border-[#00FFA3]/30 flex items-center justify-center text-[#00FFA3]">
              <Mail className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-base font-bold text-[#F3F4F6]">Check Your Email Inbox</h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                We sent a confirmation link to <strong className="text-[#00FFA3] font-mono">{email}</strong>.
              </p>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Please open your email client, check your <span className="text-[#E0E0E0] font-semibold">Inbox &amp; Spam/Junk folder</span>, and click the confirmation link to activate your account.
              </p>
            </div>

            <div className="p-3 bg-[#12141A] border border-[#1F2229] rounded-xl text-left space-y-1.5 text-xs text-[#94A3B8]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00FFA3] shrink-0" />
                <span>Verification activates your 24-Hour Pro Trial.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00FFA3] shrink-0" />
                <span>Once confirmed, return here to Sign In.</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={isResending}
                onClick={handleResendVerification}
                className="w-full py-2.5 bg-[#1F2229] hover:bg-[#2A2E39] text-[#00FFA3] border border-[#00FFA3]/30 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isResending ? (
                  <span className="w-4 h-4 border-2 border-[#00FFA3] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend Verification Email</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('LOGIN');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="w-full py-2 text-xs text-[#94A3B8] hover:text-[#E0E0E0] flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>
          </div>
        ) : mode === 'UPDATE_PASSWORD' ? (
          /* 2. UPDATE PASSWORD FORM (RESET FINALIZE) */
          <form onSubmit={handleUpdatePassword} className="p-5 space-y-4 overflow-y-auto">
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Enter and confirm your new password to complete account recovery.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#94A3B8]">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#64748B]" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="•••••••••••• (min 6 characters)"
                  className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl pl-9 pr-4 py-2 text-sm text-[#E0E0E0] placeholder-[#64748B] focus:outline-none focus:border-[#00FFA3]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#94A3B8]">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#64748B]" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl pl-9 pr-4 py-2 text-sm text-[#E0E0E0] placeholder-[#64748B] focus:outline-none focus:border-[#00FFA3]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#00FFA3] hover:bg-[#00E08F] text-[#0A0B0D] font-bold rounded-xl text-xs transition-all shadow-lg shadow-[#00FFA3]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-[#0A0B0D] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Save New Password</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setError(null);
                setSuccessMsg(null);
              }}
              className="w-full py-2 text-xs text-[#94A3B8] hover:text-[#E0E0E0] flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </button>
          </form>
        ) : mode === 'FORGOT_REQUEST' ? (
          /* 3. FORGOT PASSWORD REQUEST FORM */
          <form onSubmit={handleForgotPassword} className="p-5 space-y-4 overflow-y-auto">
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Enter your registered account email and Supabase will send you a secure password reset link.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#94A3B8]">Registered Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#64748B]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@example.com"
                  className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl pl-9 pr-4 py-2 text-sm text-[#E0E0E0] placeholder-[#64748B] focus:outline-none focus:border-[#00FFA3]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#00FFA3] hover:bg-[#00E08F] text-[#0A0B0D] font-bold rounded-xl text-xs transition-all shadow-lg shadow-[#00FFA3]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-[#0A0B0D] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Send Reset Email</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setError(null);
                setSuccessMsg(null);
              }}
              className="w-full py-2 text-xs text-[#94A3B8] hover:text-[#E0E0E0] flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </button>
          </form>
        ) : (
          /* 4. LOGIN & SIGNUP FORM */
          <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto">
            {mode === 'SIGNUP' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#94A3B8]">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-[#64748B]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Trader Name"
                    className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl pl-9 pr-4 py-2 text-sm text-[#E0E0E0] placeholder-[#64748B] focus:outline-none focus:border-[#00FFA3]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#94A3B8]">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#64748B]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@example.com"
                  className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl pl-9 pr-4 py-2 text-sm text-[#E0E0E0] placeholder-[#64748B] focus:outline-none focus:border-[#00FFA3]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#94A3B8]">Password</label>
                {mode === 'LOGIN' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('FORGOT_REQUEST');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-[#00FFA3] hover:underline font-semibold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#64748B]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl pl-9 pr-4 py-2 text-sm text-[#E0E0E0] placeholder-[#64748B] focus:outline-none focus:border-[#00FFA3]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#00FFA3] hover:bg-[#00E08F] text-[#0A0B0D] font-bold rounded-xl text-sm transition-all shadow-lg shadow-[#00FFA3]/20 flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-[#0A0B0D] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{mode === 'LOGIN' ? 'LOG IN TO ACCOUNT' : 'CREATE ACCOUNT & ACTIVATE 24H PRO'}</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
