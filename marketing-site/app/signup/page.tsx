'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { TrendingUp, Eye, EyeOff, CheckCircle, Mail } from 'lucide-react';
import { supabaseAuthService } from '@/trading/services/supabaseAuth';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Please enter your full name.');
    if (!form.email.trim()) return setError('Please enter your email address.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const res = await supabaseAuthService.register(
        form.name.trim(),
        form.email.trim().toLowerCase(),
        form.password
      );

      if (!res.success) {
        setError(res.message || 'Failed to create account. Please try again.');
        return;
      }

      // If email verification is enforced
      if (res.needsEmailVerification) {
        setSuccess(true);
        return;
      }

      // If direct access is granted (no email verification block or already verified)
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center p-4">
        <div className="glass-card p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#00FFA3]/10 border border-[#00FFA3]/20 flex items-center justify-center mx-auto mb-5">
            <Mail className="w-8 h-8 text-[#00FFA3]" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">Check Your Email</h1>
          <p className="text-gray-400 mb-2 text-sm leading-relaxed">
            We sent a verification link to <strong className="text-white">{form.email}</strong>.
          </p>
          <p className="text-gray-500 text-sm mb-7 leading-relaxed">
            Click the link in the email to verify your account, then return here to log in and access the trading dashboard.
          </p>
          <div className="space-y-3">
            <Link href="/login" className="block w-full py-3 text-sm font-bold rounded-xl btn-primary text-center">
              Go to Login
            </Link>
            <Link href="/" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Return to Home
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
