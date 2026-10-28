'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const TradingApp = dynamic(() => import('@/trading/TradingApp'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0A0B0D] flex flex-col items-center justify-center text-white gap-3 select-none">
      <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-rose-400 font-mono tracking-widest uppercase">Verifying Administrator Access...</p>
    </div>
  ),
});

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('smc_user_session') : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.role === 'ADMIN') {
          setIsAdmin(true);
          return;
        }
      }
      // No active admin session found -> redirect to login
      setIsAdmin(false);
      router.replace('/login');
    } catch {
      setIsAdmin(false);
      router.replace('/login');
    }
  }, [router]);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#0A0B0D] flex flex-col items-center justify-center text-white gap-3 select-none">
        <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-rose-400 font-mono tracking-widest uppercase">Verifying Administrator Access...</p>
      </div>
    );
  }

  // Not an authorized admin -> Block completely while router redirects
  if (!isAdmin) {
    return null;
  }

  return <TradingApp initialRoute="ADMIN_PORTAL" />;
}
