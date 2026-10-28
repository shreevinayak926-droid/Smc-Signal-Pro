import React, { useState, useEffect } from 'react';
import { SMCSignal, ForexPair, TimeFrame } from '../types';
import { PAIR_METADATA } from '../utils/forexData';
import { MarketDataManager } from '../utils/MarketDataManager';
import { generateSMCSignalFromChart } from '../utils/smc/SignalGenerator';
import { isSupabaseConfigured } from '../services/supabase';
import { supabaseSubscribeToSignals, supabaseGetAllSignals, LiveSignalRecord } from '../services/supabaseDb';
import { Zap, Target, Shield, ArrowUpRight, ArrowDownRight, Layers, Sparkles, Filter, Lock, Unlock, RefreshCw, BarChart2 } from 'lucide-react';

const calculateRiskReward = (
  entry?: number,
  sl?: number,
  tp?: number,
  type: 'BUY' | 'SELL' = 'BUY'
): string => {
  if (!entry || !sl || !tp) return '1:3.0';
  const risk = type === 'BUY' ? entry - sl : sl - entry;
  const reward = type === 'BUY' ? tp - entry : entry - tp;
  const validRisk = risk <= 0 ? Math.abs(entry - sl) : risk;
  const validReward = reward <= 0 ? Math.abs(tp - entry) : reward;
  if (validRisk === 0) return '1:1.0';
  const r = validReward / validRisk;
  return !isFinite(r) || isNaN(r) ? '1:3.0' : `1:${r.toFixed(1)}`;
};

interface SignalsHubProps {
  onLoadSignalToTrade: (signal: SMCSignal) => void;
  onOpenUpgradeModal: () => void;
  userTier: string;
  livePrices?: Record<ForexPair, number>;
  customSignals?: SMCSignal[];
  activePair?: ForexPair;
}

export const SignalsHub: React.FC<SignalsHubProps> = ({
  onLoadSignalToTrade,
  onOpenUpgradeModal,
  userTier,
  livePrices,
  customSignals = [],
  activePair = 'XAUUSD',
}) => {
  const [signals, setSignals] = useState<SMCSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pairFilter, setPairFilter] = useState<string>('ALL');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch signals published by Admin from Supabase Database
  const fetchSignals = async (showLoading = false) => {
    if (showLoading && signals.length === 0) {
      setIsLoading(true);
    }
    try {
      const dbSignals = await supabaseGetAllSignals();
      if (dbSignals && dbSignals.length > 0) {
        const mapped: SMCSignal[] = dbSignals.map((s) => ({
          id: s.id,
          pair: s.pair as ForexPair,
          type: s.type,
          timeframe: (s.timeframe || '15m') as TimeFrame,
          entryPrice: s.entry,
          stopLoss: s.sl,
          takeProfit1: s.tp1,
          takeProfit2: s.tp2 || s.tp1,
          riskReward: calculateRiskReward(s.entry, s.sl, s.tp1, s.type),
          confluenceScore: s.confidence || 88,
          strategy: s.smcReason || 'Admin Institutional SMC Setup',
          confluences: [],
          marketPhase: 'TREND_CONTINUATION',
          status: s.status === 'CLOSED' ? 'CLOSED' : 'ACTIVE',
          timestamp: s.timestamp,
          tierRequired: 'INSTITUTIONAL_VIP',
          analysis: s.smcReason || 'Official SMC signal published by desk administrator.',
        }));
        setSignals(mapped);
      } else {
        // Only show signals added by Admin — no fake synthetic fallback
        setSignals([]);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.warn('Supabase signals fetch error:', err);
      setSignals([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Subscribe to Supabase real-time signals published by Admin
    let unsubSupabase: (() => void) | null = null;
    if (isSupabaseConfigured()) {
      unsubSupabase = supabaseSubscribeToSignals((dbSignals: LiveSignalRecord[]) => {
        if (dbSignals && dbSignals.length > 0) {
          const mapped: SMCSignal[] = dbSignals.map((s) => ({
            id: s.id,
            pair: s.pair as ForexPair,
            type: s.type,
            timeframe: (s.timeframe || '15m') as TimeFrame,
            entryPrice: s.entry,
            stopLoss: s.sl,
            takeProfit1: s.tp1,
            takeProfit2: s.tp2 || s.tp1,
            riskReward: calculateRiskReward(s.entry, s.sl, s.tp1, s.type),
            confluenceScore: s.confidence || 88,
            strategy: s.smcReason || 'Admin Institutional SMC Setup',
            confluences: [],
            marketPhase: 'TREND_CONTINUATION',
            status: s.status === 'CLOSED' ? 'CLOSED' : 'ACTIVE',
            timestamp: s.timestamp,
            tierRequired: 'INSTITUTIONAL_VIP',
            analysis: s.smcReason || 'Official SMC signal published by desk administrator.',
          }));
          setSignals(mapped);
          setLastUpdated(new Date());
          setIsLoading(false);
        } else {
          setSignals([]);
        }
      });
    }

    // 2. Initial fetch & background refresh
    fetchSignals(true);
    const intervalTimer = setInterval(() => fetchSignals(false), 20 * 1000);

    return () => {
      clearInterval(intervalTimer);
      if (unsubSupabase) unsubSupabase();
    };
  }, []);

  // Combine fetched signals with any custom signals (preventing ID duplicates)
  const combinedSignals = [...customSignals, ...signals].filter(
    (s, idx, self) => idx === self.findIndex((t) => t.id === s.id)
  );

  const filtered = combinedSignals.filter((s) => {
    if (pairFilter === 'ALL') return true;
    return s.pair === pairFilter;
  });

  const isTierAllowed = (requiredTier: string) => {
    if (userTier === 'INSTITUTIONAL_VIP') return true;
    if (userTier === 'PRO_TRADER' && requiredTier !== 'INSTITUTIONAL_VIP') return true;
    if (userTier === 'FREE_TRIAL' && requiredTier === 'FREE_TRIAL') return true;
    return false;
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#0E1015] text-[#E0E0E0] rounded-xl border border-[#1F2229] shadow-2xl overflow-hidden">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#12141A] border-b border-[#1F2229] gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#00FFA3] fill-[#00FFA3]" />
            <h2 className="font-bold text-sm tracking-wide text-[#F3F4F6]">Institutional SMC Signal Hub</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00FFA3]/15 border border-[#00FFA3]/30 text-[#00FFA3] font-mono">
              High Confluence Algorithmic Engine
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Automated Order Block &amp; Fair Value Gap triggers with mathematical Risk-to-Reward confirmation.
          </p>
        </div>

        {/* Pair Filter & Quick Sync Action */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] font-mono bg-[#0A0B0D] px-2.5 py-1 rounded-lg border border-[#1F2229]">
            <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" />
            <span className="text-[#00FFA3] font-semibold">{filtered.length} Active Plans</span>
          </div>

          <select
            value={pairFilter}
            onChange={(e) => setPairFilter(e.target.value)}
            className="bg-[#0A0B0D] border border-[#1F2229] rounded-lg px-3 py-1.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-[#00FFA3]"
          >
            <option value="ALL">All Pairs</option>
            <option value="XAUUSD">XAUUSD (Gold)</option>
            <option value="BTCUSD">BTCUSD (Bitcoin)</option>
            <option value="US30">US30 (Dow Jones)</option>
            <option value="EURUSD">EURUSD</option>
            <option value="GBPUSD">GBPUSD</option>
            <option value="USDJPY">USDJPY</option>
            <option value="AUDUSD">AUDUSD</option>
            <option value="USDCAD">USDCAD</option>
            <option value="USDCHF">USDCHF</option>
            <option value="NZDUSD">NZDUSD</option>
            <option value="EURJPY">EURJPY</option>
            <option value="GBPJPY">GBPJPY</option>
            <option value="ETHUSD">ETHUSD</option>
            <option value="NAS100">NAS100</option>
          </select>

          <button
            onClick={() => fetchSignals(false)}
            title="Sync Latest Signals"
            className="p-2 bg-[#1A1D26] hover:bg-[#222634] rounded-lg border border-[#1F2229] text-[#E0E0E0] flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-[#00FFA3]" />
            <span className="hidden md:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* Signals List */}
      <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-4">
        {isLoading && signals.length === 0 ? (
          <div className="text-center py-16 text-[#64748B] text-xs flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#00FFA3]" />
            <span className="text-sm text-[#F3F4F6] font-semibold">Connecting to Supabase Live SMC Desk...</span>
            <span className="text-xs text-[#94A3B8]">Retrieving administrator-published trade setups</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[#12141A]/60 border border-[#1F2229] rounded-2xl space-y-3 max-w-md mx-auto my-8">
            <div className="w-12 h-12 rounded-2xl bg-[#00FFA3]/10 border border-[#00FFA3]/30 text-[#00FFA3] flex items-center justify-center mx-auto">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-[#F3F4F6]">No Admin Signals Published Yet</h4>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Official institutional SMC setups will appear here automatically in real-time as soon as the administrator publishes them from the Admin Panel.
            </p>
          </div>
        ) : (
          filtered.map((sig) => {
            const meta = PAIR_METADATA[sig.pair] || { digits: 2, pipSize: 0.01 };
            const activeLive = livePrices?.[sig.pair] || sig.entryPrice;
            const isBuy = sig.type === 'BUY';
            const allowed = isTierAllowed(sig.tierRequired);

            return (
              <div
                key={sig.id}
                className={`rounded-xl p-4 border transition-all ${
                  !allowed
                    ? 'bg-[#12141A]/50 border-[#1F2229] opacity-90'
                    : isBuy
                    ? 'bg-[#12141A] border-[#00FFA3]/30 hover:border-[#00FFA3]/60'
                    : 'bg-[#12141A] border-[#FF4D6D]/30 hover:border-[#FF4D6D]/60'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border flex items-center justify-center ${
                      isBuy ? 'bg-[#00FFA3]/15 border-[#00FFA3]/30 text-[#00FFA3]' : 'bg-[#FF4D6D]/15 border-[#FF4D6D]/30 text-[#FF4D6D]'
                    }`}>
                      {isBuy ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-[#F3F4F6]">{sig.pair}</h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isBuy ? 'bg-[#00FFA3] text-[#0A0B0D]' : 'bg-[#FF4D6D] text-white'
                        }`}>
                          {sig.type}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-[#0A0B0D] text-[#94A3B8] font-mono border border-[#1F2229]">
                          {sig.timeframe}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#00FFA3] bg-[#00FFA3]/10 px-2 py-0.5 rounded border border-[#00FFA3]/30">
                          {sig.confluenceScore}% Win Rate
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8]">
                          {sig.marketPhase}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-[#94A3B8]">
                        <span className="text-[#E0E0E0] font-semibold">{sig.strategy}</span>
                        <span>•</span>
                        <span className="text-[#00FFA3] font-mono">Target R:R {sig.riskReward}</span>
                      </div>
                    </div>
                  </div>

                  {/* Load on Chart or Unlock CTA */}
                  <div>
                    {allowed ? (
                      <button
                        id={`btn-load-sig-${sig.id}`}
                        onClick={() => onLoadSignalToTrade(sig)}
                        className="px-4 py-2 bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] font-bold text-xs rounded-xl shadow-lg shadow-[#00FFA3]/20 flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
                      >
                        <Layers className="w-4 h-4" />
                        <span>Load on Chart &amp; Trade</span>
                      </button>
                    ) : (
                      <button
                        id={`btn-unlock-tier-${sig.id}`}
                        onClick={onOpenUpgradeModal}
                        className="px-4 py-2 bg-[#1A1D26] hover:bg-[#222634] text-[#FBBF24] border border-[#F59E0B]/40 font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Unlock ({sig.tierRequired === 'PRO_TRADER' ? 'Pro Plan' : 'VIP Plan'})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Price Coordinates Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 p-3 bg-[#0A0B0D] rounded-lg border border-[#1F2229] font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-[#64748B] block">ENTRY PRICE</span>
                    <span className="text-[#E0E0E0] font-bold">{sig.entryPrice.toFixed(meta.digits)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#38BDF8] block">LIVE MARKET PRICE</span>
                    <span className="text-[#38BDF8] font-bold">
                      {activeLive.toFixed(meta.digits)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#FF4D6D] block">STOP LOSS (SL)</span>
                    <span className="text-[#FF4D6D] font-bold">{sig.stopLoss.toFixed(meta.digits)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#00FFA3] block">TAKE PROFIT 1</span>
                    <span className="text-[#00FFA3] font-bold">{sig.takeProfit1.toFixed(meta.digits)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#38BDF8] block">TAKE PROFIT 2</span>
                    <span className="text-[#38BDF8] font-bold">{sig.takeProfit2.toFixed(meta.digits)}</span>
                  </div>
                </div>

                {/* Trade Plan Analysis Breakdown */}
                {sig.analysis && (
                  <div className="mt-2.5 p-2 bg-[#161922] rounded-lg border border-[#1F2229] text-xs text-[#94A3B8]">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#00FFA3] mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Institutional Trade Plan Overview:</span>
                    </div>
                    <p className="text-[11px] text-[#E0E0E0] leading-relaxed italic">
                      "{sig.analysis}"
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
