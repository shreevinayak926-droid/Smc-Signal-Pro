import React, { useState, useEffect } from 'react';
import { SocialTrader, ForexPair } from '../types';
import { supabaseGetSocialTraders } from '../services/supabaseDb';
import { Users, Award, TrendingUp, ShieldCheck, CheckCircle2, Copy, Sparkles, Flame, Eye, ArrowUpRight, Check, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SocialDashboardProps {
  onCopyTrader: (trader: SocialTrader) => void;
  onSelectPair?: (pair: ForexPair) => void;
}

const DEFAULT_TRADERS: SocialTrader[] = [
  {
    id: 'trader-1',
    name: 'Alexander Vance',
    handle: '@vance_institutional',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    rank: 1,
    badge: 'INSTITUTIONAL',
    verifiedWinRate: '88.4%',
    monthlyROI: '+46.2%',
    totalProfitUSD: '$184,200',
    copiersCount: 1420,
    favoritePair: 'XAUUSD',
    riskScore: 'LOW',
    strategyDescription: 'Specialized in London/NY Killzone Spot Gold liquidity sweeps, FVG mitigations, and 1:3+ R:R setups.',
    equityHistory: [10000, 11200, 12500, 14200, 15800, 18400],
    currentOpenTrades: 2,
  },
  {
    id: 'trader-2',
    name: 'Marcus Sterling',
    handle: '@sterling_smc',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    rank: 2,
    badge: 'PROP_FUNDED',
    verifiedWinRate: '84.1%',
    monthlyROI: '+38.5%',
    totalProfitUSD: '$128,450',
    copiersCount: 980,
    favoritePair: 'EURUSD',
    riskScore: 'LOW',
    strategyDescription: 'M15/H1 Market Structure shifts with Order Block mitigation entries on major Forex currencies.',
    equityHistory: [10000, 10800, 11500, 12200, 12845],
    currentOpenTrades: 1,
  },
  {
    id: 'trader-3',
    name: 'Quantum Algo Alpha',
    handle: '@quantum_algo',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=250',
    rank: 3,
    badge: 'ALGO_BOT',
    verifiedWinRate: '91.2%',
    monthlyROI: '+52.8%',
    totalProfitUSD: '$312,800',
    copiersCount: 2340,
    favoritePair: 'BTCUSD',
    riskScore: 'LOW',
    strategyDescription: 'High-frequency institutional volume profiling and Fair Value Gap imbalances on Crypto & Forex.',
    equityHistory: [10000, 12000, 15000, 21000, 31280],
    currentOpenTrades: 3,
  },
];

export const SocialDashboard: React.FC<SocialDashboardProps> = ({
  onCopyTrader,
  onSelectPair,
}) => {
  const [traders, setTraders] = useState<SocialTrader[]>(DEFAULT_TRADERS);
  const [copiedTraderIds, setCopiedTraderIds] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filterBadge, setFilterBadge] = useState<string>('ALL');

  useEffect(() => {
    const fetchTraders = async () => {
      setIsLoading(true);
      try {
        const dbTraders = await supabaseGetSocialTraders();
        if (dbTraders && dbTraders.length > 0) {
          setTraders(dbTraders);
        } else {
          setTraders(DEFAULT_TRADERS);
        }
      } catch (err) {
        console.warn('Supabase leaderboard fetch error:', err);
        setTraders(DEFAULT_TRADERS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTraders();
  }, []);

  const handleCopy = (trader: SocialTrader) => {
    const isCurrentlyCopied = copiedTraderIds[trader.id];
    setCopiedTraderIds((prev) => ({
      ...prev,
      [trader.id]: !isCurrentlyCopied,
    }));

    if (!isCurrentlyCopied) {
      onCopyTrader(trader);
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
      });
    }
  };

  const badgeLabels: Record<string, { label: string; color: string }> = {
    INSTITUTIONAL: { label: 'Institutional Desk', color: 'bg-[#A855F7]/15 text-[#C084FC] border-[#A855F7]/30' },
    PROP_FUNDED: { label: 'Prop Funded $200k', color: 'bg-[#00FFA3]/15 text-[#00FFA3] border-[#00FFA3]/30' },
    ALGO_BOT: { label: 'Autonomous Algo Bot', color: 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30' },
    SMC_MASTER: { label: 'SMC Master Verified', color: 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/30' },
  };

  const filtered = traders.filter((t) => {
    if (filterBadge === 'ALL') return true;
    return t.badge === filterBadge;
  });

  return (
    <div className="flex flex-col h-full bg-[#0E1015] text-[#E0E0E0] rounded-xl border border-[#1F2229] shadow-2xl overflow-hidden">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#12141A] border-b border-[#1F2229] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00FFA3]" />
            <h2 className="font-bold text-sm tracking-wide text-[#F3F4F6]">Live Social Strategy Leaderboard</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00FFA3]/15 border border-[#00FFA3]/30 text-[#00FFA3] font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-ping" />
              Real-Time Tracking
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Follow verified Smart Money Concept traders and algorithmic systems with 1-click paper trade signal mirroring.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-[#0A0B0D] p-0.5 rounded-lg border border-[#1F2229] text-xs">
          <button
            onClick={() => setFilterBadge('ALL')}
            className={`px-3 py-1 rounded text-[11px] font-medium transition-all ${
              filterBadge === 'ALL' ? 'bg-[#00FFA3] text-[#0A0B0D] font-bold' : 'text-[#94A3B8] hover:text-[#E0E0E0]'
            }`}
          >
            All Traders
          </button>
          <button
            onClick={() => setFilterBadge('INSTITUTIONAL')}
            className={`px-3 py-1 rounded text-[11px] font-medium transition-all ${
              filterBadge === 'INSTITUTIONAL' ? 'bg-[#A855F7] text-white font-bold' : 'text-[#94A3B8] hover:text-[#E0E0E0]'
            }`}
          >
            Institutional
          </button>
          <button
            onClick={() => setFilterBadge('ALGO_BOT')}
            className={`px-3 py-1 rounded text-[11px] font-medium transition-all ${
              filterBadge === 'ALGO_BOT' ? 'bg-[#38BDF8] text-[#0A0B0D] font-bold' : 'text-[#94A3B8] hover:text-[#E0E0E0]'
            }`}
          >
            Algo Bots
          </button>
        </div>
      </div>

      {/* Leaderboard Cards Grid */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-[#64748B] text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#00FFA3]" />
            <span>Loading verified Smart Money traders...</span>
          </div>
        ) : (
          filtered.map((trader) => {
            const isCopied = copiedTraderIds[trader.id];

            return (
              <div
                key={trader.id}
                className="bg-[#12141A] rounded-xl p-4 border border-[#1F2229] hover:border-[#2A2E39] transition-all shadow-md space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <div className="w-8 h-8 rounded-full bg-[#00FFA3]/10 border border-[#00FFA3]/30 flex items-center justify-center font-mono font-bold text-[#00FFA3] text-sm">
                      #{trader.rank}
                    </div>

                    <img
                      src={trader.avatar}
                      alt={trader.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#1F2229] shadow"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-[#F3F4F6]">{trader.name}</h4>
                        <span className="text-xs text-[#64748B] font-mono">{trader.handle}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeLabels[trader.badge]?.color}`}>
                          {badgeLabels[trader.badge]?.label}
                        </span>
                        <span className="text-[11px] text-[#94A3B8] flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#64748B]" />
                          {trader.copiersCount.toLocaleString()} Active Copiers
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Copy Strategy Action */}
                  <button
                    id={`btn-copy-trader-${trader.id}`}
                    onClick={() => handleCopy(trader)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow ${
                      isCopied
                        ? 'bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] border border-[#00FFA3] shadow-[#00FFA3]/30'
                        : 'bg-[#1A1D26] hover:bg-[#222634] text-[#00FFA3] border border-[#00FFA3]/40'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4 text-[#0A0B0D]" />
                        <span>Mirroring Strategy</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Paper Trades</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Strategy Methodology Description */}
                <p className="text-xs text-[#E0E0E0] leading-relaxed bg-[#0A0B0D] p-2.5 rounded-lg border border-[#1F2229]">
                  <span className="text-[#00FFA3] font-semibold">Core Strategy:</span> {trader.strategyDescription}
                </p>

                {/* Quantitative Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
                  <div className="bg-[#0A0B0D] p-2 rounded-lg border border-[#1F2229]">
                    <span className="text-[10px] text-[#64748B] block">VERIFIED WIN RATE</span>
                    <span className="font-bold font-mono text-[#00FFA3] text-sm">{trader.verifiedWinRate}</span>
                  </div>

                  <div className="bg-[#0A0B0D] p-2 rounded-lg border border-[#1F2229]">
                    <span className="text-[10px] text-[#64748B] block">30D ROI</span>
                    <span className="font-bold font-mono text-[#00FFA3] text-sm">{trader.monthlyROI}</span>
                  </div>

                  <div className="bg-[#0A0B0D] p-2 rounded-lg border border-[#1F2229]">
                    <span className="text-[10px] text-[#64748B] block">TOTAL PROFIT</span>
                    <span className="font-bold font-mono text-[#00FFA3] text-sm">{trader.totalProfitUSD}</span>
                  </div>

                  <div className="bg-[#0A0B0D] p-2 rounded-lg border border-[#1F2229]">
                    <span className="text-[10px] text-[#64748B] block">PRIMARY ASSET</span>
                    <span className="font-bold font-mono text-[#E0E0E0] text-sm">{trader.favoritePair}</span>
                  </div>

                  <div className="bg-[#0A0B0D] p-2 rounded-lg border border-[#1F2229]">
                    <span className="text-[10px] text-[#64748B] block">OPEN TRADES NOW</span>
                    <span className="font-bold font-mono text-[#38BDF8] text-sm">{trader.currentOpenTrades} Active</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
