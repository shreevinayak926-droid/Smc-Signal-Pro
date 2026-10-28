'use client';

import dynamic from 'next/dynamic';

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
  return <TradingApp initialRoute="TRADER" />;
}
