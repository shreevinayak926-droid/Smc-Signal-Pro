'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabaseClient';

const TradingApp = dynamic(() => import('@/trading/TradingApp'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0A0B0D] flex flex-col items-center justify-center text-white gap-3 select-none">
      <div className="w-10 h-10 border-2 border-[#00FFA3] border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-gray-400 font-mono tracking-widest uppercase">Initializing SMC Signal Pro Terminal...</p>
    </div>
  ),
});

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const verifyAccess = async () => {
      try {
        // 1. Check local session
        const stored = typeof window !== 'undefined' ? localStorage.getItem('smc_user_session') : null;
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) {
            if (isMounted) setIsAuthenticated(true);
            return;
          }
        }

        // 2. Check Supabase auth session
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          if (isMounted) setIsAuthenticated(true);
          return;
        }

        // 3. Not signed in -> Immediately redirect to Login
        if (isMounted) {
          setIsAuthenticated(false);
          router.replace('/login');
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
          router.replace('/login');
        }
      }
    };

    verifyAccess();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#0A0B0D] flex flex-col items-center justify-center text-white gap-3 select-none">
        <div className="w-10 h-10 border-2 border-[#00FFA3] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-400 font-mono tracking-widest uppercase">Checking Authentication...</p>
      </div>
    );
  }

  // Not authenticated -> Block render completely while router redirects
  if (!isAuthenticated) {
    return null;
  }

  return <TradingApp initialRoute="TRADER" />;
}
