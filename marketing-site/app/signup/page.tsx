'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { TrendingUp, Eye, EyeOff, CheckCircle, Mail, ExternalLink, RefreshCw } from 'lucide-react';
import { supabaseAuthService } from '@/trading/services/supabaseAuth';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Please enter your full name.');
    if (!form.email.trim()) return setError('Please enter your email address.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');

    setLoading(true);
    try {
      // NOTE: Signature is (email, password, name)
      const res = await supabaseAuthService.register(
        form.email.trim().toLowerCase(),
        form.password,
        form.name.trim()
      );

      if (!res.success) {
        setError(res.message || 'Failed to create account. Please try again.');
        return;
      }

      // If email verification is pending or sent
      if (res.needsEmailVerification || !res.user?.emailVerified) {
        setSuccess(true);
        return;
      }

      // If direct access is granted
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!form.email || resending) return;
    setResending(true);
    setResendStatus(null);
    try {
      const res = await supabaseAuthService.resendVerificationEmail(form.email.trim().toLowerCase());
      if (res.success) {
        setResendStatus('Verification email resent successfully! Check your inbox.');
      } else {
        setResendStatus(res.message || 'Could not resend email. Please try again shortly.');
      }
    } catch {
      setResendStatus('Failed to resend email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00FFA3]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative glass-card p-8 sm:p-10 max-w-lg w-full text-center border border-[#00FFA3]/30 shadow-2xl shadow-[#00FFA3]/10">
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-[#00FFA3]/20 to-[#00FFA3]/5 border-2 border-[#00FFA3]/40 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#00FFA3]/20">
            <Mail className="w-10 h-10 text-[#00FFA3]" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#00FFA3] flex items-center justify-center shadow-md">
              <CheckCircle className="w-4 h-4 text-black" />
            </div>
          </div>

          <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase text-[#00FFA3] bg-[#00FFA3]/10 rounded-full border border-[#00FFA3]/20 mb-3">
            Action Required
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
            Verification Email Sent!
          </h1>

          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            We&apos;ve sent an activation link to:
          </p>
          <div className="bg-[#12141A] border border-gray-800 rounded-xl px-4 py-2.5 mb-5 inline-block max-w-full">
            <span className="text-[#00FFA3] font-bold text-sm tracking-wide break-all">
              {form.email}
            </span>
          </div>

          <p className="text-gray-400 text-xs sm:text-sm mb-6 leading-relaxed">
            Please open the email from <strong className="text-white">smcsignalpro@gmail.com</strong> (SMC Signal Pro) and click the confirmation link to activate your account and start your 24-hour trial.
          </p>

          {/* Useful Tips */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-300/90 text-left mb-6">
            <p className="font-semibold mb-0.5">Haven&apos;t received it yet?</p>
            <p className="text-gray-400">
              Please check your <strong>Spam</strong> or <strong>Junk</strong> folder. Sometimes emails take 1-2 minutes to arrive.
            </p>
          </div>

          {resendStatus && (
            <div className="mb-5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
              {resendStatus}
            </div>
          )}

          <div className="space-y-3">
            {form.email.includes('@gmail.com') ? (
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 text-sm font-bold rounded-xl btn-primary flex items-center justify-center gap-2"
              >
                Open Gmail Inbox
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <Link
                href="/login"
                className="block w-full py-3.5 px-4 text-sm font-bold rounded-xl btn-primary text-center"
              >
                Proceed to Login
              </Link>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="flex-1 py-2.5 px-3 rounded-xl border border-gray-800 hover:border-gray-700 bg-[#12141A] text-xs font-semibold text-gray-300 hover:text-white transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin text-[#00FFA3]' : ''}`} />
                {resending ? 'Sending...' : 'Resend Email'}
              </button>

              <Link
                href="/login"
                className="flex-1 py-2.5 px-3 rounded-xl border border-gray-800 hover:border-gray-700 bg-[#12141A] text-xs font-semibold text-gray-300 hover:text-white transition text-center"
              >
                Go to Login
              </Link>
            </div>

            <Link href="/" className="block pt-2 text-xs text-gray-500 hover:text-gray-400 transition-colors">
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3.5 group mb-5">
            <div className="relative w-12 h-12 flex-shrink-0">
              <div className="absolute inset-0 bg-[#00FFA3]/30 rounded-2xl blur-md group-hover:bg-[#00FFA3]/50 transition-all duration-300" />
              <div className="relative w-12 h-12 bg-[#0E1015] border-2 border-[#00FFA3]/40 rounded-2xl flex items-center justify-center shadow-lg shadow-[#00FFA3]/20 group-hover:border-[#00FFA3] group-hover:scale-105 transition-all">
                <TrendingUp className="w-6.5 h-6.5 text-[#00FFA3]" strokeWidth={2.75} />
              </div>
            </div>
            <div className="flex flex-col leading-none text-left">
              <span className="text-2xl font-black text-white tracking-wider">SMC</span>
              <span className="text-[10px] font-black text-[#00FFA3] tracking-[0.25em] uppercase mt-1">SIGNAL PRO</span>
            </div>
          </Link>
          <h1 className="text-2xl font-black text-white">Create Your Account</h1>
          <p className="text-sm text-gray-500 mt-1">Start trading smarter — it&apos;s free</p>
        </div>

        <div className="glass-card p-7">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="signup-name" className="block text-xs font-semibold text-gray-400 mb-1.5">Full Name</label>
              <input
                id="signup-name"
                type="text"
                required
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
                className="w-full px-4 py-3 input-dark text-sm"
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-xs font-semibold text-gray-400 mb-1.5">Email Address</label>
              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full px-4 py-3 input-dark text-sm"
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-xs font-semibold text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-3 pr-11 input-dark text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="signup-confirm" className="block text-xs font-semibold text-gray-400 mb-1.5">Confirm Password</label>
              <input
                id="signup-confirm"
                type={showPw ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                placeholder="Re-enter your password"
                className="w-full px-4 py-3 input-dark text-sm"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-800/40 rounded-lg">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Benefits */}
            <div className="flex flex-col gap-1.5 pt-1">
              {['Live multi-timeframe charts', 'Forex Factory economic calendar', 'No credit card required'].map((b) => (
                <div key={b} className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle className="w-3.5 h-3.5 text-[#00FFA3] flex-shrink-0" />
                  {b}
                </div>
              ))}
            </div>

            <button
              type="submit"
              id="signup-submit-btn"
              disabled={loading}
              className="w-full py-3.5 text-sm font-bold rounded-xl btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account…' : 'Create Free Account'}
            </button>
          </form>

          <p className="text-xs text-gray-600 text-center mt-5 leading-relaxed">
            By creating an account you agree to our{' '}
            <Link href="/terms" className="text-[#00FFA3]/80 hover:text-[#00FFA3]">Terms of Service</Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-[#00FFA3]/80 hover:text-[#00FFA3]">Privacy Policy</Link>.
          </p>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-[#00FFA3] font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
