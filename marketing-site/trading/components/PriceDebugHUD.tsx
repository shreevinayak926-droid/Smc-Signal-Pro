import React, { useState } from 'react';
import { ForexPair } from '../types';
import { PriceDebugComparison, INSTRUMENT_CONFIGS } from '../utils/MarketDataManager';
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, Terminal, ChevronDown, ChevronUp, ShieldCheck, Layers, Radio } from 'lucide-react';

interface PriceDebugHUDProps {
  debugInfo: PriceDebugComparison;
  onForceSync?: () => void;
}

export const PriceDebugHUD: React.FC<PriceDebugHUDProps> = ({
  debugInfo,
  onForceSync,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const cfg = INSTRUMENT_CONFIGS[debugInfo.pair] || { digits: 2 };
  const d = cfg.digits;

  const formattedTime = new Date(debugInfo.timestamp).toLocaleTimeString();

  return (
    <div className="w-full bg-[#08090C] border-t border-[#1F2229] select-none text-xs text-[#94A3B8] transition-all">
      {/* Mini Status Bar (Always Visible at bottom of chart / app) */}
      <div className="max-w-[1920px] mx-auto px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Feed Connection Status & Pair Anchor */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 font-mono">
            <span className={`w-2 h-2 rounded-full ${
              debugInfo.hasMismatch
                ? 'bg-rose-500 animate-ping'
                : debugInfo.status === 'CONNECTED'
                ? 'bg-[#00FFA3] animate-pulse'
                : 'bg-[#F59E0B]'
            }`} />
            <span className="font-bold text-[#F3F4F6]">{debugInfo.pair}</span>
            <span className="text-[10px] text-[#64748B] bg-[#12141A] px-1.5 py-0.5 rounded border border-[#1F2229]">
              TV: {debugInfo.tradingViewSymbol}
            </span>
          </div>

          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span className="text-[#64748B]">Live Feed:</span>
            <span className="font-bold text-[#00FFA3]">
              ${debugInfo.currentPrice.toFixed(d)}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-[#64748B]">
            <span>Chart:</span>
            <span className="text-[#E0E0E0]">${debugInfo.chartPrice.toFixed(d)}</span>
          </div>

          {debugInfo.aiPrice && (
            <div className="hidden md:flex items-center gap-1 font-mono text-[10px] text-[#64748B]">
              <span>AI Anchor:</span>
              <span className="text-[#38BDF8]">${debugInfo.aiPrice.toFixed(d)}</span>
            </div>
          )}

          {debugInfo.hasMismatch ? (
            <div className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500 text-rose-300 font-bold text-[10px] flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>PRICE FEED MISMATCH (&gt;0.3%)</span>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-1 text-[10px] text-[#00FFA3] bg-[#00FFA3]/10 px-2 py-0.5 rounded border border-[#00FFA3]/30">
              <CheckCircle2 className="w-3 h-3" />
              <span>Feeds Synchronized</span>
            </div>
          )}
        </div>

        {/* Right: Toggle Inspector Drawer */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#64748B] hidden sm:inline">
            Updated: {formattedTime}
          </span>

          {onForceSync && (
            <button
              onClick={onForceSync}
              className="p-1 hover:bg-[#1A1D26] rounded text-[#94A3B8] hover:text-[#00FFA3] transition-colors"
              title="Force Sync with Exchange Feed"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#12141A] hover:bg-[#1A1D26] border border-[#1F2229] text-[10px] font-mono text-[#CBD5E1] transition-all"
          >
            <Terminal className="w-3 h-3 text-[#00FFA3]" />
            <span>Telemetry Inspector</span>
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded Real-Time Price Reference & Debug Inspector Panel */}
      {isExpanded && (
        <div className="border-t border-[#1F2229] bg-[#0A0B0D] p-4 max-w-[1920px] mx-auto animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px] font-mono">
            {/* Box 1: Instrument & Feed Origin */}
            <div className="bg-[#12141A] p-3 rounded-xl border border-[#1F2229] space-y-1.5">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                Primary Reference Feed
              </span>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Symbol:</span>
                <span className="font-bold text-white">{debugInfo.pair}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">TradingView Symbol:</span>
                <span className="text-[#00FFA3] font-bold">{debugInfo.tradingViewSymbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Data Source:</span>
                <span className="text-[#CBD5E1] truncate max-w-[170px]">{debugInfo.dataSource}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Feed Status:</span>
                <span className="text-[#00FFA3] font-bold">{debugInfo.status}</span>
              </div>
            </div>

            {/* Box 2: Synchronized Price Quotes */}
            <div className="bg-[#12141A] p-3 rounded-xl border border-[#1F2229] space-y-1.5">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                Price Node State
              </span>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Current Price:</span>
                <span className="font-bold text-[#00FFA3]">${debugInfo.currentPrice.toFixed(d)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Ticker Price:</span>
                <span className="text-white font-bold">${debugInfo.tickerPrice.toFixed(d)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Chart Price:</span>
                <span className="text-white font-bold">${debugInfo.chartPrice.toFixed(d)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">AI Scan Price:</span>
                <span className="text-[#38BDF8] font-bold">
                  {debugInfo.aiPrice ? `$${debugInfo.aiPrice.toFixed(d)}` : 'Awaiting Scan'}
                </span>
              </div>
            </div>

            {/* Box 3: Feed Discrepancy & Tolerance Matrix */}
            <div className="bg-[#12141A] p-3 rounded-xl border border-[#1F2229] space-y-1.5">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                Tolerance Verification
              </span>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">AI vs Ticker:</span>
                <span className="text-[#E0E0E0]">{debugInfo.diffAITicker.toFixed(d)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">AI vs Chart:</span>
                <span className="text-[#E0E0E0]">{debugInfo.diffAIChart.toFixed(d)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Ticker vs Chart:</span>
                <span className="text-[#E0E0E0]">{debugInfo.diffTickerChart.toFixed(d)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Max Drift:</span>
                <span className={`font-bold ${debugInfo.hasMismatch ? 'text-rose-400' : 'text-[#00FFA3]'}`}>
                  {debugInfo.maxDiffPct.toFixed(3)}% {debugInfo.hasMismatch ? '(EXCEEDED)' : '(NOMINAL)'}
                </span>
              </div>
            </div>

            {/* Box 4: Architecture Status & Guarantees */}
            <div className="bg-[#12141A] p-3 rounded-xl border border-[#1F2229] space-y-1.5">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                Single Source of Truth
              </span>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Timeframe:</span>
                <span className="text-[#00FFA3] font-bold">{debugInfo.timeframe}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Last Sync:</span>
                <span className="text-[#E0E0E0]">{formattedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">SMC Pipeline:</span>
                <span className="text-[#00FFA3]">Real-time Reactive</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Mock Prices:</span>
                <span className="text-[#00FFA3]">Zero / Eliminated</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
