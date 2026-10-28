'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { TrendingUp, Eye, EyeOff } from 'lucide-react';
import { supabaseAuthService } from '@/trading/services/supabaseAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) return setError('Please enter your email address.');
    if (!password) return setError('Please enter your password.');

    setLoading(true);
    try {
      const res = await supabaseAuthService.login(email.trim(), password);

      if (!res.success || !res.user) {
        setError(res.message || 'Login failed. Please verify your credentials.');
        return;
      }

      // Check user role
      if (res.user.role === 'ADMIN') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-black text-white">Welcome Back</h1>
          <p className="text-sm text-gray-500 mt-1">Enter your credentials to access your account</p>
        </div>

        <div className="glass-card p-7">
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-gray-400 mb-1.5">Email Address</label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 input-dark text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-xs font-semibold text-gray-400">Password</label>
                <Link href="/forgot-password" className="text-xs text-[#00FFA3]/70 hover:text-[#00FFA3] transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
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

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-800/40 rounded-lg">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              id="login-submit-btn"
              disabled={loading}
              className="w-full py-3.5 text-sm font-bold rounded-xl btn-primary disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#00FFA3] font-semibold hover:underline">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
