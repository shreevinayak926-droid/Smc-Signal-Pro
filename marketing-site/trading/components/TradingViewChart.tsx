import React, { useEffect, useRef, useState, memo, useCallback } from 'react';
import { ForexPair, TimeFrame, FairValueGap, StructureBreak, OrderBlock, MarketStructure, Candle, Position } from '../types';
import { PAIR_METADATA } from '../utils/forexData';
import { ConnectionStatus } from '../utils/MarketDataManager';
import {
  Activity,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Layers,
  Code,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  PanelRight,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  AlertTriangle,
  WifiOff,
} from 'lucide-react';

export interface TradingViewChartProps {
  pair: ForexPair;
  timeframe: TimeFrame;
  autosize?: boolean;
  candles?: Candle[];
  fairValueGaps?: FairValueGap[];
  structureBreaks?: StructureBreak[];
  orderBlocks?: OrderBlock[];
  marketStructure?: MarketStructure;
  activePositions?: Position[];
  onTimeframeChange?: (tf: TimeFrame) => void;
  onOpenAIScan?: () => void;
  onPlaceQuickOrder?: (type: 'BUY' | 'SELL', price: number) => void;
  livePrice?: number;
  currentLivePrice?: number;
  onSyncLiveFeed?: () => void;
  onToggleTradePanel?: () => void;
  isTradePanelOpen?: boolean;
  fvgConfig?: any;
  chochConfig?: any;
  isPaidUser?: boolean;
  onOpenUpgradeModal?: () => void;
  feedStatus?: ConnectionStatus;
}

// Map pair to authentic TradingView symbol across global exchanges
export const TRADINGVIEW_SYMBOLS: Record<ForexPair, string> = {
  XAUUSD: 'OANDA:XAUUSD',
  EURUSD: 'FX:EURUSD',
  GBPUSD: 'FX:GBPUSD',
  USDJPY: 'FX:USDJPY',
  BTCUSD: 'BINANCE:BTCUSDT',
  US30: 'FOREXCOM:DJI',
};

// Internal display symbol (bare pair name) for each TradingView symbol
export const TV_SYMBOL_TO_PAIR: Record<string, ForexPair> = {
  'OANDA:XAUUSD': 'XAUUSD',
  'FX:EURUSD': 'EURUSD',
  'FX:GBPUSD': 'GBPUSD',
  'FX:USDJPY': 'USDJPY',
  'BINANCE:BTCUSDT': 'BTCUSD',
  'FOREXCOM:DJI': 'US30',
  // Also match bare symbols that TradingView may emit in postMessages
  'XAUUSD': 'XAUUSD',
  'EURUSD': 'EURUSD',
  'GBPUSD': 'GBPUSD',
  'USDJPY': 'USDJPY',
  'BTCUSDT': 'BTCUSD',
  'DJI': 'US30',
};

// Map timeframe to TradingView resolution
export const TRADINGVIEW_INTERVALS: Record<TimeFrame, string> = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '1H': '60',
  '4H': '240',
  '1D': 'D',
};

export const TradingViewChart: React.FC<TradingViewChartProps> = memo(({
  pair,
  timeframe,
  candles = [],
  fairValueGaps = [],
  structureBreaks = [],
  orderBlocks = [],
  marketStructure = 'BULLISH',
  activePositions = [],
  onTimeframeChange,
  onOpenAIScan,
  onPlaceQuickOrder,
  livePrice: externalLivePrice,
  onSyncLiveFeed,
  onToggleTradePanel,
  isTradePanelOpen = true,
  fvgConfig,
  chochConfig,
  isPaidUser = false,
  onOpenUpgradeModal,
  feedStatus = 'CONNECTED',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const tvWidgetId = useRef(`tradingview_${Math.random().toString(36).substring(2, 9)}`);

  // Admin Dynamic Feature Rules
  const fvgAllowed = (fvgConfig?.enabled ?? true) && (!fvgConfig?.vipOnly || isPaidUser);
  const chochAllowed = (chochConfig?.enabled ?? true) && (!chochConfig?.vipOnly || isPaidUser);

  // SMC Overlay Toggles on TradingView Chart (Default OFF for clean initial chart load)
  const [showFVG, setShowFVG] = useState(false);
  const [showCHoCH, setShowCHoCH] = useState(false);
  const [isOverlayPanelOpen, setIsOverlayPanelOpen] = useState(true);
  const [isPineScriptModalOpen, setIsPineScriptModalOpen] = useState(false);
  const [copiedPine, setCopiedPine] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  const meta = PAIR_METADATA[pair] || { name: pair, digits: 2, basePrice: 2000 };
  const currentPrice = externalLivePrice && externalLivePrice > 0 ? externalLivePrice : meta.basePrice;
  const symbol = TRADINGVIEW_SYMBOLS[pair] || 'OANDA:XAUUSD';
  const interval = TRADINGVIEW_INTERVALS[timeframe] || '15';

  // Manual Trigger Live Sync
  const triggerSync = useCallback(async () => {
    setIsSyncing(true);
    if (onSyncLiveFeed) {
      onSyncLiveFeed();
    }
    setLastSyncTime(new Date());
    setTimeout(() => {
      setIsSyncing(false);
    }, 450);
  }, [onSyncLiveFeed]);

  // Fullscreen toggler
  const toggleFullscreen = useCallback(() => {
    setIsFullScreen((prev) => {
      const next = !prev;
      if (next) {
        if (chartWrapperRef.current && chartWrapperRef.current.requestFullscreen) {
          chartWrapperRef.current.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
      return next;
    });
  }, []);

  // Listen to browser fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Initialize Official TradingView Advanced Real-time Chart Widget
  // Starts completely CLEAN without auto-applied MA 9, RSI 14, or Volume studies unless toggled!
  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    currentContainer.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.id = tvWidgetId.current;
    widgetContainer.style.width = '100%';
    widgetContainer.style.height = '100%';
    currentContainer.appendChild(widgetContainer);

    // Build dynamic studies array based on user button activation
    const activeStudies: string[] = [];
    if (showFVG) {
      activeStudies.push('STD;Fair Value Gap');
    }
    if (showCHoCH) {
      activeStudies.push('STD;CHoCH');
    }

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof (window as any).TradingView !== 'undefined' && document.getElementById(tvWidgetId.current)) {
        new (window as any).TradingView.widget({
          container_id: tvWidgetId.current,
          autosize: true,
          symbol: symbol,
          interval: interval,
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#0E1015',
          enable_publishing: false,
          allow_symbol_change: false,
          save_image: false,
          hide_side_toolbar: isMobile,
          withdateranges: !isMobile,
          details: false, // Prevents huge right-side blank watchlist on mobile
          hotlist: false,
          calendar: false,
          studies: activeStudies, // Clean by default
          overrides: {
            'mainSeriesProperties.candleStyle.upColor': '#00FFA3',
            'mainSeriesProperties.candleStyle.downColor': '#FF4D6D',
            'mainSeriesProperties.candleStyle.drawWick': true,
            'mainSeriesProperties.candleStyle.drawBorder': true,
            'mainSeriesProperties.candleStyle.borderColor': '#00FFA3',
            'mainSeriesProperties.candleStyle.borderUpColor': '#00FFA3',
            'mainSeriesProperties.candleStyle.borderDownColor': '#FF4D6D',
            'mainSeriesProperties.candleStyle.wickUpColor': '#00FFA3',
            'mainSeriesProperties.candleStyle.wickDownColor': '#FF4D6D',
            'paneProperties.background': '#0A0B0D',
            'paneProperties.vertGridProperties.color': '#181B22',
            'paneProperties.horzGridProperties.color': '#181B22',
            'scalesProperties.textColor': '#94A3B8',
            'scalesProperties.backgroundColor': '#0E1015',
          },
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, [symbol, interval, showFVG, showCHoCH]);

  // Filter Active FVGs and CHoCH breaks
  const activeFVGs = fairValueGaps.filter((fvg) => !fvg.filled || fvg.isActive);
  const chochBreaks = structureBreaks.filter((sb) => sb.type === 'CHoCH');
  const recentCHoCH = chochBreaks.length > 0 ? chochBreaks[chochBreaks.length - 1] : null;

  // Pine Script for TradingView SMC integration — Nephew_Sam FVG & First CHoCH Indicator
  const pineScriptCode = fvgConfig?.pineScriptCode || `//@version=5
indicator("Fair Value Gap [Nephew_Sam] & CHoCH", overlay=true)

// 1. Fair Value Gap (FVG Engine by Nephew_Sam)
fvgThreshold = input.float(3.5, "Min Gap Pips")
bullishFVG = low[2] > high[0] and close[1] > open[1]
bearishFVG = high[2] < low[0] and close[1] < open[1]

if (bullishFVG)
    box.new(left=bar_index-2, top=low[2], right=bar_index+5, bottom=high[0], border_color=color.rgb(0, 255, 163), bgcolor=color.rgb(0, 255, 163, 85))

if (bearishFVG)
    box.new(left=bar_index-2, top=low[0], right=bar_index+5, bottom=high[2], border_color=color.rgb(255, 77, 109), bgcolor=color.rgb(255, 77, 109, 85))

// 2. CHoCH - Change of Character (TradingView Library)
swingHigh = ta.highest(high, 5)[1]
swingLow = ta.lowest(low, 5)[1]

bearishCHoCH = close[1] < swingLow and close < swingLow
bullishCHoCH = close[1] > swingHigh and close > swingHigh

plotshape(bullishCHoCH, title="+CHoCH", location=location.belowbar, color=color.green, style=shape.labelup, text="+CHoCH")
plotshape(bearishCHoCH, title="-CHoCH", location=location.abovebar, color=color.red, style=shape.labeldown, text="-CHoCH")
`;

  const copyPineScript = () => {
    navigator.clipboard.writeText(pineScriptCode);
    setCopiedPine(true);
    setTimeout(() => setCopiedPine(false), 2000);
  };

  const timeframes: TimeFrame[] = ['1m', '5m', '15m', '1H', '4H', '1D'];

  return (
    <div
      ref={chartWrapperRef}
      className={`relative w-full max-w-full h-full flex flex-col bg-[#0A0B0D] rounded-xl border border-[#1F2229] shadow-2xl overflow-hidden transition-all ${
        isFullScreen ? 'fixed inset-0 z-50 w-screen h-screen rounded-none border-none' : ''
      }`}
    >
      {/* Top Header Control Ribbon */}
      <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 bg-[#12141A] border-b border-[#1F2229] gap-1.5 sm:gap-2 text-xs text-[#94A3B8] w-full overflow-x-auto no-scrollbar touch-pan-x">
        {/* Left: Stream Info, Real-time Price & Timeframe Selector */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Pair Badge & Live Price from TradingView */}
          <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0A0B0D] border ${
            feedStatus === 'DISCONNECTED'
              ? 'border-rose-500/60 shadow-sm shadow-rose-950/50'
              : feedStatus === 'STALE'
              ? 'border-amber-500/60 shadow-sm shadow-amber-950/50'
              : 'border-[#1F2229]'
          }`}>
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                feedStatus === 'DISCONNECTED'
                  ? 'bg-rose-500'
                  : feedStatus === 'STALE'
                  ? 'bg-amber-400'
                  : 'bg-[#00FFA3]'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                feedStatus === 'DISCONNECTED'
                  ? 'bg-rose-500'
                  : feedStatus === 'STALE'
                  ? 'bg-amber-400'
                  : 'bg-[#00FFA3]'
              }`}></span>
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-sm text-[#F3F4F6]">{pair}</span>
              <span className={`font-mono text-xs font-bold ${
                feedStatus === 'DISCONNECTED'
                  ? 'text-rose-400'
                  : feedStatus === 'STALE'
                  ? 'text-amber-400'
                  : 'text-[#00FFA3]'
              }`}>
                ${currentPrice.toFixed(meta.digits)}
              </span>
            </div>
            <span className="hidden sm:inline text-[10px] font-mono text-[#64748B] px-1.5 py-0.5 rounded bg-[#161922]">
              {symbol}
            </span>
            {feedStatus === 'STALE' && (
              <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" /> STALE
              </span>
            )}
            {feedStatus === 'DISCONNECTED' && (
              <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-0.5">
                <WifiOff className="w-2.5 h-2.5" /> OFFLINE
              </span>
            )}
          </div>

          {/* Timeframe Selector Ribbon */}
          {onTimeframeChange && (
            <div className="flex items-center bg-[#0A0B0D] p-0.5 rounded-lg border border-[#1F2229]">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => onTimeframeChange(tf)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-all ${
                    timeframe === tf
                      ? 'bg-[#00FFA3] text-[#0A0B0D] shadow-sm font-bold'
                      : 'text-[#94A3B8] hover:text-[#E0E0E0] hover:bg-[#1F2229]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}

          {/* Live Feed Status & Manual Sync */}
          <div className="flex items-center gap-1.5 bg-[#0A0B0D] border border-[#1F2229] px-2 py-1 rounded-lg text-[11px]">
            <span className="flex items-center gap-1 font-mono text-[10px] text-[#00FFA3]">
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline text-[#94A3B8]">Live:</span>
              <span className="px-1 rounded bg-[#00FFA3]/20 font-semibold">2s</span>
            </span>
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="text-[10px] text-[#38BDF8] hover:text-[#7DD3FC] underline cursor-pointer ml-1"
              title="Refresh candles"
            >
              Sync
            </button>
          </div>
        </div>

        {/* Right: Quick Buy/Sell Buttons, Overlays, AI Scan, Fullscreen & Collapse Trade Panel */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {/* Quick Buy & Quick Sell Order Triggers */}
          <div className="flex items-center gap-1 bg-[#0A0B0D] p-0.5 rounded-lg border border-[#1F2229]">
            <button
              id="tv-quick-buy-btn"
              onClick={() => {
                if (onPlaceQuickOrder) {
                  onPlaceQuickOrder('BUY', currentPrice);
                } else if (onToggleTradePanel && !isTradePanelOpen) {
                  onToggleTradePanel();
                }
              }}
              className="px-2.5 py-1 rounded bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] font-mono font-bold text-[11px] flex items-center gap-1 shadow-sm transition-transform active:scale-95"
              title={`Buy ${pair} at $${currentPrice.toFixed(meta.digits)}`}
            >
              <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
              <span>BUY</span>
            </button>
            <button
              id="tv-quick-sell-btn"
              onClick={() => {
                if (onPlaceQuickOrder) {
                  onPlaceQuickOrder('SELL', currentPrice);
                } else if (onToggleTradePanel && !isTradePanelOpen) {
                  onToggleTradePanel();
                }
              }}
              className="px-2.5 py-1 rounded bg-[#FF4D6D] hover:bg-[#E11D48] text-white font-mono font-bold text-[11px] flex items-center gap-1 shadow-sm transition-transform active:scale-95"
              title={`Sell ${pair} at $${currentPrice.toFixed(meta.digits)}`}
            >
              <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
              <span>SELL</span>
            </button>
          </div>

          {/* AI Scan Trigger */}
          {onOpenAIScan && (
            <button
              id="ai-chart-scan-btn"
              onClick={onOpenAIScan}
              className="px-2.5 py-1 bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] font-bold rounded-lg shadow-md shadow-[#00FFA3]/15 flex items-center gap-1.5 transition-all transform active:scale-95 text-[11px]"
            >
              <Sparkles className="w-3.5 h-3.5 fill-[#0A0B0D]" />
              <span className="hidden sm:inline">AI Scan</span>
            </button>
          )}

          {/* Toggle Trade Column CTA */}
          {onToggleTradePanel && (
            <button
              id="btn-toggle-trade-column"
              onClick={onToggleTradePanel}
              title={isTradePanelOpen ? "Collapse Buy/Sell Panel (Maximize TradingView Chart)" : "Open Buy/Sell Panel"}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border transition-all ${
                isTradePanelOpen
                  ? 'bg-[#1F2229] border-[#00FFA3]/40 text-[#00FFA3]'
                  : 'bg-[#00FFA3]/15 border-[#00FFA3]/50 text-[#00FFA3] hover:bg-[#00FFA3]/25'
              }`}
            >
              <PanelRight className="w-3.5 h-3.5" />
              <span>{isTradePanelOpen ? 'Hide Trade' : 'Trade (Buy/Sell)'}</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            id="btn-chart-fullscreen"
            onClick={toggleFullscreen}
            title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen TradingView Chart"}
            className="p-1.5 bg-[#12141A] hover:bg-[#1A1D26] border border-[#1F2229] hover:border-[#00FFA3]/50 text-[#94A3B8] hover:text-[#00FFA3] rounded-lg transition-all"
          >
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5 text-[#00FFA3]" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Synchronized SMC Live HUD & Detection Feed (Collapsible Heads-Up Overlay) */}
      {isOverlayPanelOpen && (
        <div className="bg-[#0D0F14] border-b border-[#1F2229] px-3 py-1.5 flex items-center justify-between gap-3 text-[11px] overflow-x-auto">
          {/* Active FVG Badges */}
          {showFVG && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[#64748B] text-[10px] uppercase font-bold flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#00FFA3]" />
                Live FVGs ({activeFVGs.length}):
              </span>
              {activeFVGs.length > 0 ? (
                activeFVGs.slice(-3).map((fvg) => {
                  const isBull = fvg.type === 'BULLISH';
                  return (
                    <div
                      key={fvg.id}
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border ${
                        isBull
                          ? 'bg-[#064E3B]/40 text-[#00FFA3] border-[#059669]/40'
                          : 'bg-[#881337]/40 text-[#FF4D6D] border-[#E11D48]/40'
                      }`}
                    >
                      <span className="font-bold">{isBull ? '+FVG' : '-FVG'}</span>
                      <span className="opacity-90">{fvg.top.toFixed(meta.digits)} ↔ {fvg.bottom.toFixed(meta.digits)}</span>
                      <span className="text-[9px] opacity-75">MT: {fvg.midline.toFixed(meta.digits)}</span>
                      {fvg.isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-pulse" />}
                    </div>
                  );
                })
              ) : (
                <span className="text-[#64748B] text-[10px] italic">No active imbalances</span>
              )}
            </div>
          )}

          {/* Active CHoCH Badges */}
          {showCHoCH && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[#64748B] text-[10px] uppercase font-bold flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#38BDF8]" />
                Structure Shifts:
              </span>
              {recentCHoCH ? (
                <div
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border ${
                    recentCHoCH.direction === 'BULLISH'
                      ? 'bg-[#064E3B]/40 text-[#00FFA3] border-[#059669]/40'
                      : 'bg-[#881337]/40 text-[#FF4D6D] border-[#E11D48]/40'
                  }`}
                >
                  <span className="font-bold">
                    {recentCHoCH.direction === 'BULLISH' ? '▲ +CHoCH Bullish Shift' : '▼ -CHoCH Bearish Shift'}
                  </span>
                  <span className="opacity-80">
                    Broken: {(recentCHoCH.brokenLevel ?? recentCHoCH.price).toFixed(meta.digits)}
                  </span>
                  <span className="text-[#38BDF8] text-[9.5px]">2-Candle Close Confirmed</span>
                </div>
              ) : (
                <span className="text-[#64748B] text-[10px] italic">Structure holding {marketStructure}</span>
              )}
            </div>
          )}

          {/* Last Sync Timestamp Indicator */}
          <div className="text-[10px] font-mono text-[#64748B] shrink-0 ml-auto flex items-center gap-1">
            <span>TV Synced: {lastSyncTime.toLocaleTimeString()}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3]" />
          </div>
        </div>
      )}

      {/* TradingView Interactive Chart Container */}
      <div
        ref={containerRef}
        className="tradingview-widget-container flex-1 w-full h-full relative min-h-[280px] sm:min-h-[380px] lg:min-h-[500px]"
        style={{ minHeight: 'clamp(280px, 45vh, 600px)' }}
      />

      {/* Pine Script Integration Modal */}
      {isPineScriptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141A] border border-[#1F2229] rounded-xl max-w-xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1F2229] pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-[#00FFA3]" />
                <h3 className="font-bold text-white text-sm">TradingView Pine Script - FVG & CHoCH</h3>
              </div>
              <button
                onClick={() => setIsPineScriptModalOpen(false)}
                className="text-[#64748B] hover:text-white text-xs px-2 py-1 rounded bg-[#1A1D26]"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Copy this official Pine Script v5 code and paste it into your TradingView <strong>Pine Editor</strong> tab to plot the exact same 3-candle FVG boxes and 2-candle CHoCH signals inside native TradingView desktop or mobile!
            </p>

            <div className="relative">
              <pre className="bg-[#0A0B0D] border border-[#1F2229] rounded-lg p-3 text-[11px] font-mono text-[#00FFA3] max-h-56 overflow-y-auto select-all">
                {pineScriptCode}
              </pre>
              <button
                onClick={copyPineScript}
                className="absolute top-2 right-2 px-3 py-1.5 bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] font-bold rounded text-xs flex items-center gap-1.5 shadow-md"
              >
                {copiedPine ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedPine ? 'Copied!' : 'Copy Script'}
              </button>
            </div>

            <div className="bg-[#0A0B0D] p-3 rounded-lg border border-[#1F2229] text-[11px] text-[#94A3B8] space-y-1">
              <p className="font-semibold text-white">How to apply in TradingView:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-[#64748B]">
                <li>Open TradingView chart and click <span className="text-[#00FFA3]">Pine Editor</span> at the bottom.</li>
                <li>Paste this script and click <span className="text-[#00FFA3]">Add to chart</span>.</li>
                <li>Both FVG boxes and 2-candle CHoCH markers will be rendered live on TradingView.</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

TradingViewChart.displayName = 'TradingViewChart';
