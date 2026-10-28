import React, { useState } from 'react';
import { User } from '../types';
import { supabaseAuthService } from '../services/supabaseAuth';
import { Shield, Lock, User as UserIcon, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (user: User, token: string) => void;
  onNavigateToTrader: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onNavigateToTrader,
}) => {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanId = adminId.trim();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      setErrorMsg('Please enter both your Admin ID / Email and Password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await supabaseAuthService.login(cleanId, cleanPass);

      if (!res.success || !res.user) {
        setErrorMsg(res.message || 'Invalid administrator credentials.');
        setIsLoading(false);
        return;
      }

      if (res.user.role !== 'ADMIN') {
        setErrorMsg('Access Denied: This account does not possess administrator privileges.');
        setIsLoading(false);
        return;
      }

      // Ensure user role is updated to ADMIN in current state
      const adminUser: User = {
        ...res.user,
        role: 'ADMIN',
        permissions: {
          ...res.user.permissions,
          tradingAccess: true,
          buyAccess: true,
          sellAccess: true,
          fvgAccess: true,
          chochAccess: true,
          aiScanAccess: true,
          pineScriptAccess: true,
          tradingViewAccess: true,
          indicatorAccess: true,
          marketDataAccess: true,
          vipFeatures: true,
          advancedAnalysis: true,
          adminAccess: true,
        },
      };

      onLoginSuccess(adminUser, res.token || adminUser.token || '');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication error during admin login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] flex flex-col items-center justify-center p-4 selection:bg-[#FF4D6D] selection:text-white relative overflow-hidden">
      {/* Background Glow Overlay */}
      <div className="absolute w-[600px] h-[600px] bg-[#FF4D6D]/5 rounded-full blur-[140px] pointer-events-none -top-40 -left-40" />
      <div className="absolute w-[600px] h-[600px] bg-[#00FFA3]/5 rounded-full blur-[140px] pointer-events-none -bottom-40 -right-40" />

      {/* Admin Login Card */}
      <div className="w-full max-w-md bg-[#0E1015] border border-[#1F2229] rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FF4D6D]/15 border border-[#FF4D6D]/40 text-[#FF4D6D] shadow-lg shadow-[#FF4D6D]/10">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#F3F4F6] tracking-wide mt-2">ADMIN PORTAL</h1>
          <p className="text-xs text-[#94A3B8]">Restricted access. Authorized System Administrator Portal only.</p>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-3 bg-[#FF4D6D]/15 border border-[#FF4D6D]/40 rounded-xl text-xs text-[#FF4D6D] flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider block">Admin ID / Email</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-[#64748B]" />
              <input
                type="email"
                required
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="admin@smcsignal.pro"
                className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl pl-10 pr-4 py-3 text-xs text-[#E0E0E0] placeholder-[#64748B] focus:outline-none focus:border-[#FF4D6D] focus:ring-1 focus:ring-[#FF4D6D] transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider block">Admin Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-[#64748B]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl pl-10 pr-4 py-3 text-xs text-[#E0E0E0] placeholder-[#64748B] focus:outline-none focus:border-[#FF4D6D] focus:ring-1 focus:ring-[#FF4D6D] transition-all font-mono"
              />
            </div>
          </div>

          {/* Login Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-[#FF4D6D] to-[#E63946] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-[#FF4D6D]/20 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-pulse">Authenticating Admin Session...</span>
            ) : (
              <>
                <span>LOGIN TO ADMIN PORTAL</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Back to Trader App link */}
        <div className="text-center pt-2 border-t border-[#1F2229]">
          <button
            onClick={onNavigateToTrader}
            className="text-xs text-[#94A3B8] hover:text-[#00FFA3] transition-colors cursor-pointer"
          >
            ← Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
