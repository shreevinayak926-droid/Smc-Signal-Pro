import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ForexPair, TimeFrame, Candle, SMCSignal } from '../types';
import { PAIR_METADATA } from '../utils/forexData';
import { MarketDataManager, INSTRUMENT_CONFIGS } from '../utils/MarketDataManager';
import { analyzeMarketStructureWithAI } from '../services/aiService';
import {
  CheckCircle2,
  Layers,
  AlertCircle,
  RefreshCw,
  X,
  Clock,
  Sparkles,
  Copy,
  Check,
  Send,
  Activity,
  Zap,
  Brain,
  Radio,
} from 'lucide-react';

interface AIStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  pair: ForexPair;
  timeframe: TimeFrame;
  currentPrice: number;
  candles: Candle[];
  onApplyTradeSetup: (setup: {
    type: 'BUY' | 'SELL';
    sl: number;
    tp: number;
  }) => void;
  onAddCustomSignal?: (signal: SMCSignal) => void;
}

// Phase labels shown in the status badge
const PHASE_LABELS: Record<string, string> = {
  connecting:     'CONNECTING',
  scanning:       'SCANNING',
  model_selected: 'AI READY',
  streaming:      'STREAMING',
  token:          'STREAMING',
  processing:     'PROCESSING',
  parse_fallback: 'PROCESSING',
  fallback:       'ALGORITHMIC',
  no_key:         'ALGORITHMIC',
  complete:       'COMPLETE',
  error:          'ERROR',
};

const PHASE_COLORS: Record<string, string> = {
  connecting:     'text-[#38BDF8] border-[#38BDF8]/40 bg-[#38BDF8]/10',
  scanning:       'text-[#FBBF24] border-[#FBBF24]/40 bg-[#FBBF24]/10',
  model_selected: 'text-[#A78BFA] border-[#A78BFA]/40 bg-[#A78BFA]/10',
  streaming:      'text-[#00FFA3] border-[#00FFA3]/40 bg-[#00FFA3]/10',
  token:          'text-[#00FFA3] border-[#00FFA3]/40 bg-[#00FFA3]/10',
  processing:     'text-[#FBBF24] border-[#FBBF24]/40 bg-[#FBBF24]/10',
  parse_fallback: 'text-[#FBBF24] border-[#FBBF24]/40 bg-[#FBBF24]/10',
  fallback:       'text-[#94A3B8] border-[#94A3B8]/40 bg-[#94A3B8]/10',
  no_key:         'text-[#94A3B8] border-[#94A3B8]/40 bg-[#94A3B8]/10',
  complete:       'text-[#00FFA3] border-[#00FFA3]/40 bg-[#00FFA3]/10',
  error:          'text-[#FF4D6D] border-[#FF4D6D]/40 bg-[#FF4D6D]/10',
};

export const AIStructureModal: React.FC<AIStructureModalProps> = ({
  isOpen,
  onClose,
  pair,
  timeframe,
  currentPrice,
  candles,
  onApplyTradeSetup,
  onAddCustomSignal,
}) => {
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [scannedPrice, setScannedPrice] = useState<number>(0);
  const [scannedAt, setScannedAt] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // ── Streaming state ────────────────────────────────────────────────────────
  const [streamPhase, setStreamPhase] = useState<string>('');
  const [streamMessage, setStreamMessage] = useState<string>('');
  const [streamProgress, setStreamProgress] = useState<number>(0);
  const [streamTokens, setStreamTokens] = useState<string>('');
  const [streamModel, setStreamModel] = useState<string>('');
  const streamTokensRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cfg = INSTRUMENT_CONFIGS[pair] || { digits: 2, tradingViewSymbol: `OANDA:${pair}` };
  const d = cfg.digits;
  const meta = PAIR_METADATA[pair] || { digits: 2, pipSize: 0.1, basePrice: 4674.30 };

  const activeLivePrice =
    typeof currentPrice === 'number' && currentPrice > 0
      ? currentPrice
      : (MarketDataManager.getState(pair)?.currentPrice > 0
          ? MarketDataManager.getState(pair).currentPrice
          : meta.basePrice);

  const priceDriftPct = useMemo(() => {
    if (!scannedPrice || scannedPrice === 0 || !activeLivePrice) return 0;
    return (Math.abs(activeLivePrice - scannedPrice) / scannedPrice) * 100;
  }, [scannedPrice, activeLivePrice]);

  const isStale = priceDriftPct > 0.40;

  // Auto-scroll token stream to bottom as text arrives
  useEffect(() => {
    if (streamTokensRef.current) {
      streamTokensRef.current.scrollTop = streamTokensRef.current.scrollHeight;
    }
  }, [streamTokens]);

  // ── Main AI scan ─────────────────────────────────────────────────────────
  const runScan = async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setErrorMsg('');
    setBroadcastSuccess(false);
    setAnalysis(null);
    setStreamTokens('');
    setStreamPhase('connecting');
    setStreamMessage('Initializing AI scan...');
    setStreamProgress(10);
    setStreamModel('gemini-2.5-flash');

    const liveSnapshotPrice = activeLivePrice;
    const marketState = MarketDataManager.getState(pair);

    try {
      const result = await analyzeMarketStructureWithAI(
        {
          pair,
          activeSymbol: cfg.tradingViewSymbol,
          timeframe,
          currentPrice: liveSnapshotPrice,
          candles: candles.slice(-15),
          detectedSMC: {
            marketStructure: marketState?.marketStructure || 'BULLISH',
            orderBlocks: marketState?.orderBlocks || [],
            fairValueGaps: marketState?.fairValueGaps || [],
            structureBreaks: marketState?.structureBreaks || [],
            liquidityLevels: marketState?.liquidityLevels || [],
          },
        },
        (phase, progress, message, token) => {
          setStreamPhase(phase);
          setStreamProgress(progress);
          setStreamMessage(message);
          if (token) setStreamTokens((prev) => prev + token + ' ');
        }
      );

      setAnalysis(result);
      setScannedPrice(liveSnapshotPrice);
      setScannedAt(Date.now());
      setStreamPhase('complete');
      setStreamProgress(100);
      setStreamMessage('Scan complete!');
      MarketDataManager.recordAIScan?.(pair, liveSnapshotPrice, result);
    } catch (err: any) {
      console.error('[AI Scan Error]', err);
      setErrorMsg('Structure scan encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runScan();
    }
    return () => {
      // Abort stream when modal closes
      abortRef.current?.abort();
    };
  }, [isOpen, pair, timeframe]);

  if (!isOpen) return null;

  const handleApplyTrade = () => {
    if (!analysis?.tradeSetup) return;
    const isBuy = analysis.tradeSetup.recommendedAction === 'BUY';

    const slMatch = String(analysis.tradeSetup.stopLoss || '').match(/[\d.]+/);
    const tpMatch = String(analysis.tradeSetup.takeProfit1 || '').match(/[\d.]+/);

    const rawSL = slMatch ? parseFloat(slMatch[0]) : NaN;
    const rawTP = tpMatch ? parseFloat(tpMatch[0]) : NaN;

    const riskDistance =
      pair === 'XAUUSD' ? 8.50 : pair === 'BTCUSD' ? 1400.0 : pair === 'US30' ? 220.0 : meta.pipSize * 35;

    let sl = rawSL;
    let tp = rawTP;

    if (isBuy) {
      if (isNaN(sl) || sl >= activeLivePrice || Math.abs(activeLivePrice - sl) / activeLivePrice > 0.05) {
        sl = activeLivePrice - riskDistance;
      }
      if (isNaN(tp) || tp <= activeLivePrice || Math.abs(tp - activeLivePrice) / activeLivePrice > 0.15) {
        tp = activeLivePrice + riskDistance * 2.0;
      }
    } else {
      if (isNaN(sl) || sl <= activeLivePrice || Math.abs(sl - activeLivePrice) / activeLivePrice > 0.05) {
        sl = activeLivePrice + riskDistance;
      }
      if (isNaN(tp) || tp >= activeLivePrice || Math.abs(activeLivePrice - tp) / activeLivePrice > 0.15) {
        tp = activeLivePrice - riskDistance * 2.0;
      }
    }

    onApplyTradeSetup({
      type: isBuy ? 'BUY' : 'SELL',
      sl: Number(sl.toFixed(meta.digits)),
      tp: Number(tp.toFixed(meta.digits)),
    });
    onClose();
  };

  const handleBroadcastSignal = () => {
    if (!analysis?.tradeSetup || !onAddCustomSignal) return;
    const isBuy = analysis.tradeSetup.recommendedAction === 'BUY';

    const slMatch  = String(analysis.tradeSetup.stopLoss   || '').match(/[\d.]+/);
    const tp1Match = String(analysis.tradeSetup.takeProfit1 || '').match(/[\d.]+/);
    const tp2Match = String(analysis.tradeSetup.takeProfit2 || '').match(/[\d.]+/);

    const rawSL  = slMatch  ? parseFloat(slMatch[0])  : activeLivePrice * (isBuy ? 0.995 : 1.005);
    const rawTP1 = tp1Match ? parseFloat(tp1Match[0]) : activeLivePrice * (isBuy ? 1.01 : 0.99);
    const rawTP2 = tp2Match ? parseFloat(tp2Match[0]) : activeLivePrice * (isBuy ? 1.02 : 0.98);

    const sig: SMCSignal = {
      id: analysis.signal?.id || `ai-sig-${Date.now()}`,
      pair,
      type: isBuy ? 'BUY' : 'SELL',
      timeframe,
      entryPrice: Number(activeLivePrice.toFixed(d)),
      stopLoss: Number(rawSL.toFixed(d)),
      takeProfit1: Number(rawTP1.toFixed(d)),
      takeProfit2: Number(rawTP2.toFixed(d)),
      riskReward: analysis.tradeSetup.riskRewardRatio || '1:3.80',
      confluenceScore: analysis.confidenceScore || 94,
      strategy: `Institutional SMC AI Execution`,
      confluences: analysis.tradeSetup.confluenceChecklist || [
        `Order Block mitigation on ${timeframe}`,
        `Fair Value Gap sweep`,
        `CHoCH structural confirmation`,
      ],
      marketPhase: analysis.institutionalZone || 'DISCOUNT',
      status: 'ACTIVE',
      timestamp: Date.now(),
      tierRequired: 'FREE_TRIAL',
    };

    onAddCustomSignal(sig);
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 3000);
  };

  const handleCopySignal = () => {
    if (!analysis?.tradeSetup) return;
    const isBuy = analysis.tradeSetup.recommendedAction === 'BUY';
    const text = `🤖 SMC REAL-TIME AI SIGNAL
━━━━━━━━━━━━━━━━━━━━
📈 PAIR: ${pair} (${timeframe})
🎯 DIRECTION: ${isBuy ? '🟢 BUY / LONG' : '🔴 SELL / SHORT'}
💰 ENTRY: $${activeLivePrice.toFixed(d)}
🛑 STOP LOSS: ${analysis.tradeSetup.stopLoss}
🎯 TAKE PROFIT 1: ${analysis.tradeSetup.takeProfit1}
🎯 TAKE PROFIT 2: ${analysis.tradeSetup.takeProfit2}
⚖️ RISK/REWARD: ${analysis.tradeSetup.riskRewardRatio}
⚡ CONFIDENCE: ${analysis.confidenceScore || 94}%
━━━━━━━━━━━━━━━━━━━━
🧠 REASONING: ${analysis.institutionalSummary || analysis.tradeSetup.reasoning || 'Displacement confirms institutional order block mitigation.'}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Phase badge display ────────────────────────────────────────────────────
  const phaseLabelText = PHASE_LABELS[streamPhase] || streamPhase.toUpperCase();
  const phaseColorClass = PHASE_COLORS[streamPhase] || 'text-[#94A3B8] border-[#94A3B8]/40 bg-[#94A3B8]/10';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0A0B0D]/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-[#0E1015] border border-[#1F2229] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-[#E0E0E0] flex flex-col max-h-[92vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 bg-[#12141A] border-b border-[#1F2229]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-[#00FFA3] to-[#00D487] text-[#0A0B0D] rounded-xl shadow-md flex items-center justify-center">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-[#F3F4F6]">AI Real-Time Signal Scanner</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/30 font-bold">
                  {pair} • {timeframe}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1F2229] text-[#94A3B8]">
                  TV: {cfg.tradingViewSymbol}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-ping" />
                <span>Live Institutional Feed • Real-Time AI Analysis</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={runScan}
              disabled={isLoading}
              className="p-2 bg-[#1A1D26] hover:bg-[#222634] disabled:opacity-50 rounded-lg border border-[#1F2229] text-[#E0E0E0] transition-colors"
              title="Rescan with current live price"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#00FFA3]' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-[#94A3B8] hover:text-[#E0E0E0] p-2 rounded-lg hover:bg-[#1A1D26] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Live Price Ribbon ── */}
        <div className="bg-[#08090C] px-4 sm:px-5 py-2.5 border-b border-[#1F2229] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#00FFA3]" />
            <span className="text-[#64748B]">Instrument:</span>
            <span className="font-bold text-[#F3F4F6]">{pair} ({cfg.tradingViewSymbol})</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[#64748B]">Live Price:</span>
              <span className="font-bold text-[#00FFA3] text-sm">${activeLivePrice.toFixed(d)}</span>
            </div>
            {scannedAt > 0 && (
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-[#64748B]">
                <Clock className="w-3 h-3 text-[#94A3B8]" />
                <span>{new Date(scannedAt).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Price Drift Alert ── */}
        {isStale && (
          <div className="bg-amber-950/60 border-b border-amber-500/40 px-4 sm:px-5 py-2 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Market price moved by <strong>{priceDriftPct.toFixed(2)}%</strong>. Re-scan for optimal entry.
              </span>
            </div>
            <button
              onClick={runScan}
              className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-[11px] flex items-center gap-1 transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Re-Scan</span>
            </button>
          </div>
        )}

        {/* ── Modal Content ── */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">

          {/* ── LOADING / STREAMING STATE ── */}
          {isLoading && (
            <div className="space-y-4">

              {/* Phase badge + message */}
              <div className="flex items-center gap-3">
                <Brain className="w-7 h-7 text-[#00FFA3] shrink-0 animate-pulse" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${phaseColorClass}`}>
                      {phaseLabelText}
                    </span>
                    {streamModel && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1F2229] text-[#A78BFA] border border-[#A78BFA]/30">
                        {streamModel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#94A3B8] leading-snug">{streamMessage}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B]">
                  <span className="flex items-center gap-1">
                    <Radio className="w-3 h-3 text-[#00FFA3] animate-pulse" />
                    <span>Gemini AI Analysis Progress</span>
                  </span>
                  <span className="text-[#00FFA3] font-bold">{streamProgress}%</span>
                </div>
                <div className="w-full h-2 bg-[#1F2229] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#00FFA3] to-[#38BDF8] rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${streamProgress}%` }}
                  />
                </div>
                {/* Phase steps row */}
                <div className="flex items-center justify-between text-[9px] font-mono text-[#64748B] mt-1 px-0.5">
                  {['CONNECT', 'SCAN', 'STREAM', 'PROCESS', 'DONE'].map((step, i) => {
                    const thresholds = [5, 30, 50, 88, 100];
                    const active = streamProgress >= thresholds[i];
                    return (
                      <span
                        key={step}
                        className={`transition-colors ${active ? 'text-[#00FFA3] font-bold' : 'text-[#2A3040]'}`}
                      >
                        {step}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Live token stream box — shows when Gemini is streaming */}
              {streamTokens.length > 0 && (
                <div className="bg-[#080A0E] border border-[#00FFA3]/20 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1F2229] bg-[#0A0C10]">
                    <Zap className="w-3.5 h-3.5 text-[#00FFA3]" />
                    <span className="text-[10px] font-mono font-bold text-[#00FFA3] tracking-wider">GEMINI AI LIVE REASONING</span>
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-ping" />
                  </div>
                  <div
                    ref={streamTokensRef}
                    className="p-3 max-h-36 overflow-y-auto font-mono text-[11px] text-[#94A3B8] leading-relaxed"
                    style={{ scrollBehavior: 'smooth' }}
                  >
                    <span className="text-[#E0E0E0]">{streamTokens}</span>
                    {/* Blinking cursor */}
                    <span className="inline-block w-1.5 h-3.5 bg-[#00FFA3] ml-0.5 animate-pulse align-middle" />
                  </div>
                </div>
              )}

              {/* Scanning detail (before tokens arrive) */}
              {streamTokens.length === 0 && (
                <div className="text-center py-6 text-[#94A3B8] space-y-2">
                  <p className="text-[11px] text-[#64748B]">
                    Analyzing live {pair} OHLCV candles, market structure, Order Blocks, FVGs &amp; CHoCH at ${activeLivePrice.toFixed(d)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── ERROR STATE ── */}
          {!isLoading && errorMsg && (
            <div className="p-4 bg-[#FF4D6D]/15 border border-[#FF4D6D]/40 rounded-xl text-[#FF4D6D] flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ── RESULT STATE ── */}
          {!isLoading && !errorMsg && analysis?.tradeSetup && (
            <>
              {/* AI Suggested Setup Card */}
              <div className="bg-[#0E1015] border border-[#1F2229] p-4 sm:p-5 rounded-2xl space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full border-2 border-[#00FFA3] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#00FFA3]" />
                    </div>
                    <h4 className="font-bold text-sm text-[#F3F4F6]">
                      AI Suggested Setup ({analysis.tradeSetup.recommendedAction || 'BUY'})
                    </h4>
                  </div>
                  <span className="font-mono font-bold text-[#00FFA3] bg-[#00FFA3]/10 px-2.5 py-1 rounded-md text-xs border border-[#00FFA3]/30">
                    RR: {analysis.tradeSetup.riskRewardRatio || '1:3.80'}
                  </span>
                </div>

                {/* AI model badge */}
                {analysis.aiModel && (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#64748B]">
                    <Brain className="w-3 h-3 text-[#A78BFA]" />
                    <span className="text-[#A78BFA]">Powered by: {analysis.aiModel}</span>
                  </div>
                )}

                {/* 4-Column Metric Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-[#0A0B0D] p-3.5 rounded-xl border border-[#1F2229]">
                  <div>
                    <span className="text-[10px] text-[#64748B] block font-bold tracking-wider mb-1">OPTIMAL ENTRY</span>
                    <span className="text-[#F3F4F6] font-bold text-xs font-mono">{analysis.tradeSetup.optimalTradeEntry}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#FF4D6D] block font-bold tracking-wider mb-1">STOP LOSS</span>
                    <span className="text-[#FF4D6D] font-bold text-xs font-mono">{analysis.tradeSetup.stopLoss}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#00FFA3] block font-bold tracking-wider mb-1">TP 1</span>
                    <span className="text-[#00FFA3] font-bold text-xs font-mono">{analysis.tradeSetup.takeProfit1}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#38BDF8] block font-bold tracking-wider mb-1">TP 2</span>
                    <span className="text-[#38BDF8] font-bold text-xs font-mono">{analysis.tradeSetup.takeProfit2}</span>
                  </div>
                </div>

                {/* Key Confluences */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-[#94A3B8] tracking-wider uppercase block">KEY CONFLUENCES:</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[#E0E0E0]">
                    {analysis.tradeSetup.confluenceChecklist?.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#00FFA3] shrink-0 stroke-[2.5]" />
                        <span className="text-[11px] leading-tight">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Execute Button */}
                <button
                  id="btn-apply-ai-trade"
                  onClick={handleApplyTrade}
                  className="w-full py-3 bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] font-bold rounded-xl shadow-lg shadow-[#00FFA3]/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] text-sm cursor-pointer"
                >
                  <Layers className="w-4 h-4 stroke-[2.5]" />
                  <span>Apply Suggested {analysis.tradeSetup.recommendedAction || 'BUY'} to Paper Trader</span>
                </button>
              </div>

              {/* ══ DETAILED AI ANALYSIS SECTION ══════════════════════════════════ */}

              {/* Row 1: Market Bias + Institutional Zone + Confidence */}
              <div className="grid grid-cols-3 gap-2">
                {/* Market Bias */}
                <div className={`rounded-xl border p-3 flex flex-col gap-1.5 ${
                  analysis.marketBias === 'BULLISH'
                    ? 'bg-[#00FFA3]/08 border-[#00FFA3]/25'
                    : analysis.marketBias === 'BEARISH'
                    ? 'bg-[#FF4D6D]/08 border-[#FF4D6D]/25'
                    : 'bg-[#94A3B8]/08 border-[#94A3B8]/25'
                }`}>
                  <span className="text-[9px] font-mono font-bold text-[#64748B] tracking-widest uppercase">Market Bias</span>
                  <span className={`font-bold text-sm ${
                    analysis.marketBias === 'BULLISH' ? 'text-[#00FFA3]'
                    : analysis.marketBias === 'BEARISH' ? 'text-[#FF4D6D]'
                    : 'text-[#94A3B8]'
                  }`}>
                    {analysis.marketBias === 'BULLISH' ? '▲ BULLISH'
                     : analysis.marketBias === 'BEARISH' ? '▼ BEARISH'
                     : '◆ NEUTRAL'}
                  </span>
                </div>

                {/* Institutional Zone */}
                <div className="rounded-xl border border-[#FBBF24]/25 bg-[#FBBF24]/08 p-3 flex flex-col gap-1.5">
                  <span className="text-[9px] font-mono font-bold text-[#64748B] tracking-widest uppercase">Inst. Zone</span>
                  <span className="font-bold text-sm text-[#FBBF24]">
                    {analysis.institutionalZone === 'DISCOUNT' ? '🟢 DISCOUNT'
                     : analysis.institutionalZone === 'PREMIUM' ? '🔴 PREMIUM'
                     : '⚖️ EQUILIBRIUM'}
                  </span>
                </div>

                {/* Confidence Score */}
                <div className="rounded-xl border border-[#A78BFA]/25 bg-[#A78BFA]/08 p-3 flex flex-col gap-1.5">
                  <span className="text-[9px] font-mono font-bold text-[#64748B] tracking-widest uppercase">AI Confidence</span>
                  <span className="font-bold text-sm text-[#A78BFA]">{analysis.confidenceScore || 94}%</span>
                  <div className="w-full h-1 bg-[#1F2229] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#A78BFA] rounded-full"
                      style={{ width: `${analysis.confidenceScore || 94}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Order Blocks */}
              {analysis.orderBlocks && analysis.orderBlocks.length > 0 && (
                <div className="bg-[#0A0B0D] border border-[#1F2229] rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#12141A] border-b border-[#1F2229]">
                    <div className="w-2.5 h-2.5 rounded bg-[#FBBF24]" />
                    <span className="text-[10px] font-mono font-bold text-[#FBBF24] tracking-wider uppercase">Order Blocks Detected</span>
                    <span className="ml-auto text-[9px] font-mono text-[#64748B]">{analysis.orderBlocks.length} zones</span>
                  </div>
                  <div className="divide-y divide-[#1F2229]">
                    {analysis.orderBlocks.map((ob: any, i: number) => (
                      <div key={i} className="px-3 py-2.5 flex items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            ob.type === 'Bullish' || ob.type === 'BULLISH'
                              ? 'bg-[#00FFA3]/15 text-[#00FFA3]'
                              : 'bg-[#FF4D6D]/15 text-[#FF4D6D]'
                          }`}>
                            {ob.type?.toUpperCase() || 'OB'}
                          </span>
                          <span className="text-[#E0E0E0] font-mono font-semibold">{ob.priceRange}</span>
                        </div>
                        <div className="flex items-center gap-2 text-right">
                          <span className="text-[#94A3B8] text-[10px] hidden sm:block truncate max-w-[140px]">{ob.significance}</span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                            ob.status === 'Unmitigated'
                              ? 'text-[#00FFA3] border-[#00FFA3]/30 bg-[#00FFA3]/10'
                              : 'text-[#64748B] border-[#1F2229] bg-[#1F2229]'
                          }`}>
                            {ob.status || 'Active'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Row 3: Fair Value Gaps */}
              {analysis.fairValueGaps && analysis.fairValueGaps.length > 0 && (
                <div className="bg-[#0A0B0D] border border-[#1F2229] rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#12141A] border-b border-[#1F2229]">
                    <div className="w-2.5 h-2.5 rounded bg-[#38BDF8]" />
                    <span className="text-[10px] font-mono font-bold text-[#38BDF8] tracking-wider uppercase">Fair Value Gaps (FVG)</span>
                    <span className="ml-auto text-[9px] font-mono text-[#64748B]">{analysis.fairValueGaps.length} gaps</span>
                  </div>
                  <div className="divide-y divide-[#1F2229]">
                    {analysis.fairValueGaps.map((fvg: any, i: number) => (
                      <div key={i} className="px-3 py-2.5 flex items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            fvg.type?.includes('Bullish')
                              ? 'bg-[#00FFA3]/15 text-[#00FFA3]'
                              : 'bg-[#FF4D6D]/15 text-[#FF4D6D]'
                          }`}>
                            {fvg.type || 'FVG'}
                          </span>
                          <span className="text-[#E0E0E0] font-mono font-semibold">{fvg.zone}</span>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                          fvg.consequenceScore === 'High'
                            ? 'text-[#FBBF24] border-[#FBBF24]/30 bg-[#FBBF24]/10'
                            : 'text-[#94A3B8] border-[#1F2229] bg-[#1F2229]'
                        }`}>
                          {fvg.consequenceScore || 'Medium'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Row 4: Liquidity Analysis */}
              {analysis.liquidityAnalysis && (
                <div className="bg-[#0A0B0D] border border-[#1F2229] rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#12141A] border-b border-[#1F2229]">
                    <div className="w-2.5 h-2.5 rounded bg-[#E879F9]" />
                    <span className="text-[10px] font-mono font-bold text-[#E879F9] tracking-wider uppercase">Liquidity Pool Analysis</span>
                  </div>
                  <div className="p-3 space-y-2 text-[11px]">
                    {analysis.liquidityAnalysis.buySideLiquidity && (
                      <div className="flex items-start gap-2">
                        <span className="text-[9px] font-mono font-bold text-[#00FFA3] bg-[#00FFA3]/10 border border-[#00FFA3]/25 px-1.5 py-0.5 rounded shrink-0 mt-0.5">BSL</span>
                        <span className="text-[#E0E0E0] leading-relaxed">{analysis.liquidityAnalysis.buySideLiquidity}</span>
                      </div>
                    )}
                    {analysis.liquidityAnalysis.sellSideLiquidity && (
                      <div className="flex items-start gap-2">
                        <span className="text-[9px] font-mono font-bold text-[#FF4D6D] bg-[#FF4D6D]/10 border border-[#FF4D6D]/25 px-1.5 py-0.5 rounded shrink-0 mt-0.5">SSL</span>
                        <span className="text-[#E0E0E0] leading-relaxed">{analysis.liquidityAnalysis.sellSideLiquidity}</span>
                      </div>
                    )}
                    {analysis.liquidityAnalysis.recentSweeps && (
                      <div className="flex items-start gap-2">
                        <span className="text-[9px] font-mono font-bold text-[#FBBF24] bg-[#FBBF24]/10 border border-[#FBBF24]/25 px-1.5 py-0.5 rounded shrink-0 mt-0.5">SWP</span>
                        <span className="text-[#94A3B8] leading-relaxed">{analysis.liquidityAnalysis.recentSweeps}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Row 5: Institutional Summary + Invalidation + Actions */}
              <div className="bg-[#12141A] p-3.5 rounded-xl border border-[#1F2229] space-y-2 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase">
                    AI Invalidation &amp; Institutional Logic:
                  </span>
                  {scannedAt > 0 && (
                    <span className="text-[10px] text-[#64748B]">
                      Scan Time: {new Date(scannedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <p className="text-[#E0E0E0] text-[11px] leading-relaxed bg-[#0A0B0D] p-2.5 rounded-lg border border-[#1F2229]">
                  {analysis.institutionalSummary || analysis.tradeSetup.reasoning}
                </p>

                {analysis.tradeSetup.invalidationCondition && (
                  <div className="text-[10px] text-[#FF4D6D] bg-[#FF4D6D]/10 p-2 rounded border border-[#FF4D6D]/20">
                    <strong>⚠ Invalidation:</strong> {analysis.tradeSetup.invalidationCondition}
                  </div>
                )}

                {analysis.tradeSetup.reasoning && analysis.institutionalSummary && (
                  <div className="text-[10px] text-[#94A3B8] bg-[#0A0B0D] p-2 rounded border border-[#1F2229]">
                    <span className="font-bold text-[#64748B]">AI Reasoning: </span>
                    {analysis.tradeSetup.reasoning}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleBroadcastSignal}
                    className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-1.5 font-bold transition-all text-xs cursor-pointer ${
                      broadcastSuccess
                        ? 'bg-[#00FFA3]/20 text-[#00FFA3] border-[#00FFA3]'
                        : 'bg-[#1A1D26] hover:bg-[#222634] text-[#38BDF8] border-[#38BDF8]/40'
                    }`}
                  >
                    {broadcastSuccess ? <Check className="w-3.5 h-3.5 text-[#00FFA3]" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{broadcastSuccess ? 'Added to Signals Hub!' : 'Broadcast to Signals Hub'}</span>
                  </button>

                  <button
                    onClick={handleCopySignal}
                    className="py-2 px-3 bg-[#1A1D26] hover:bg-[#222634] text-[#E0E0E0] font-bold rounded-lg border border-[#1F2229] flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#00FFA3]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Signal'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
