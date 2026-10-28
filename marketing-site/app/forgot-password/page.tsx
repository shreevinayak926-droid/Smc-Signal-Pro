'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { TrendingUp, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) return setError('Please enter your email address.');

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/login`,
        }
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSent(true);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
            <div className="w-10 h-10 bg-[#0E1015] border border-[#00FFA3]/30 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#00FFA3]" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none text-left">
              <span className="text-lg font-black text-white tracking-wider">SMC</span>
              <span className="text-[9px] font-bold text-[#00FFA3] tracking-[0.2em] uppercase">SIGNAL PRO</span>
            </div>
          </Link>
          <h1 className="text-2xl font-black text-white">Reset Your Password</h1>
          <p className="text-sm text-gray-500 mt-1">We will send a reset link to your email</p>
        </div>

        {sent ? (
          <div className="glass-card p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#00FFA3]/10 border border-[#00FFA3]/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-7 h-7 text-[#00FFA3]" />
            </div>
            <h2 className="text-xl font-black text-white mb-3">Reset Email Sent</h2>
            <p className="text-sm text-gray-400 mb-2 leading-relaxed">
              If an account exists for <strong className="text-white">{email}</strong>, you will receive a password reset link shortly.
            </p>
            <p className="text-xs text-gray-600 mb-7">Check your spam folder if you don&apos;t see it within a few minutes.</p>
            <Link
              href="/login"
              className="block w-full py-3 text-sm font-bold rounded-xl btn-primary text-center"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <div className="glass-card p-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-xs font-semibold text-gray-400 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    id="reset-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 input-dark text-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-900/20 border border-red-800/40 rounded-lg">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                id="reset-submit-btn"
                disabled={loading}
                className="w-full py-3.5 text-sm font-bold rounded-xl btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending Reset Link…' : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-5 flex justify-center">
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
