import React, { useState, useEffect } from 'react';
import { ForexPair, Position, AccountState, PairTickerInfo } from '../types';
import { PAIR_METADATA } from '../utils/forexData';
import { ConnectionStatus } from '../utils/MarketDataManager';
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Layers,
  History,
  Activity,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  X,
  Minimize2,
  PanelRightClose,
  WifiOff,
  Search,
  Filter,
} from 'lucide-react';

interface PaperTradePanelProps {
  pair: ForexPair;
  currentPrice: number;
  account: AccountState;
  onOpenPosition: (order: {
    pair: ForexPair;
    type: 'BUY' | 'SELL';
    lotSize: number;
    sl: number;
    tp: number;
  }) => void;
  onClosePosition: (id: string) => void;
  onSetBreakeven: (id: string) => void;
  onClosePartial: (id: string, fraction: number) => void;
  onResetAccount: () => void;
  onCollapse?: () => void;
  initialOrderType?: 'BUY' | 'SELL';
  onOrderPlaced?: () => void;
  feedStatus?: ConnectionStatus;
  onSelectPair?: (pair: ForexPair) => void;
  pairPrices?: Record<ForexPair, number>;
  pairTickers?: Record<ForexPair, PairTickerInfo>;
}

const POPULAR_PAIRS: ForexPair[] = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD', 'US30'];

export const PaperTradePanel: React.FC<PaperTradePanelProps> = ({
  pair,
  currentPrice,
  account,
  onOpenPosition,
  onClosePosition,
  onSetBreakeven,
  onClosePartial,
  onResetAccount,
  onCollapse,
  initialOrderType,
  onOrderPlaced,
  feedStatus = 'CONNECTED',
  onSelectPair,
  pairPrices,
  pairTickers,
}) => {
  // Active selected pair — defaults to prop, can be dynamically selected by user
  const [activePair, setActivePair] = useState<ForexPair>(pair);
  const [isPairDropdownOpen, setIsPairDropdownOpen] = useState(false);
  const [pairSearch, setPairSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'Metals' | 'Major FX' | 'Crypto' | 'Indices'>('ALL');
  const [positionFilter, setPositionFilter] = useState<'ALL' | 'CURRENT'>('ALL');

  // Synchronize if parent switches pair
  useEffect(() => {
    setActivePair(pair);
  }, [pair]);

  const handleSelectPair = (newPair: ForexPair) => {
    setActivePair(newPair);
    setIsPairDropdownOpen(false);
    if (onSelectPair) {
      onSelectPair(newPair);
    }
  };

  const activePrice =
    pairPrices && pairPrices[activePair] !== undefined
      ? pairPrices[activePair]
      : activePair === pair
      ? currentPrice
      : PAIR_METADATA[activePair]?.basePrice || currentPrice;

  const [activeTab, setActiveTab] = useState<'NEW_ORDER' | 'OPEN_POSITIONS' | 'HISTORY'>('NEW_ORDER');
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>(initialOrderType || 'BUY');
  const [lotSize, setLotSize] = useState<number>(1.0);
  const [riskRewardPreset, setRiskRewardPreset] = useState<number>(3); // 1:3 default
  
  const meta = PAIR_METADATA[activePair] || { digits: 2, pipSize: 0.01, contractSize: 100, basePrice: activePrice, category: 'Metals' as const };

  // Update orderType if initialOrderType changes from external trigger (e.g. quick buy/sell click)
  useEffect(() => {
    if (initialOrderType) {
      setOrderType(initialOrderType);
    }
  }, [initialOrderType]);

  // Default SL and TP calculation based on active pair volatility
  const defaultPipOffset =
    activePair === 'XAUUSD'
      ? 8.0
      : activePair === 'BTCUSD'
      ? 1200
      : activePair === 'US30'
      ? 80
      : meta.digits === 3
      ? 0.25
      : 0.0025;
  
  const [slPrice, setSlPrice] = useState<number>(() => {
    return orderType === 'BUY' ? activePrice - defaultPipOffset : activePrice + defaultPipOffset;
  });

  const [tpPrice, setTpPrice] = useState<number>(() => {
    const risk = defaultPipOffset;
    return orderType === 'BUY' ? activePrice + risk * riskRewardPreset : activePrice - risk * riskRewardPreset;
  });

  // Keep SL and TP aligned when activePrice shifts or activePair changes
  useEffect(() => {
    const risk = defaultPipOffset;
    if (orderType === 'BUY') {
      setSlPrice(Number((activePrice - risk).toFixed(meta.digits)));
      setTpPrice(Number((activePrice + risk * riskRewardPreset).toFixed(meta.digits)));
    } else {
      setSlPrice(Number((activePrice + risk).toFixed(meta.digits)));
      setTpPrice(Number((activePrice - risk * riskRewardPreset).toFixed(meta.digits)));
    }
  }, [activePair, activePrice, orderType, riskRewardPreset, meta.digits, defaultPipOffset]);

  // Re-calculate when switching BUY / SELL or RR preset
  const applyRRPreset = (rr: number, type: 'BUY' | 'SELL' = orderType) => {
    setRiskRewardPreset(rr);
    const slDist = Math.abs(activePrice - slPrice) || defaultPipOffset;
    if (type === 'BUY') {
      const newSL = activePrice - slDist;
      setSlPrice(Number(newSL.toFixed(meta.digits)));
      setTpPrice(Number((activePrice + slDist * rr).toFixed(meta.digits)));
    } else {
      const newSL = activePrice + slDist;
      setSlPrice(Number(newSL.toFixed(meta.digits)));
      setTpPrice(Number((activePrice - slDist * rr).toFixed(meta.digits)));
    }
  };

  const handleTypeChange = (type: 'BUY' | 'SELL') => {
    setOrderType(type);
    applyRRPreset(riskRewardPreset, type);
  };

  // Margin & Risk estimations
  const requiredMargin = (activePrice * meta.contractSize * lotSize) / account.leverage;
  const pipDistanceSL = Math.abs(activePrice - slPrice) / meta.pipSize;
  const pipDistanceTP = Math.abs(tpPrice - activePrice) / meta.pipSize;
  
  const estimatedRiskUSD = (pipDistanceSL * meta.pipSize * meta.contractSize * lotSize);
  const estimatedRewardUSD = (pipDistanceTP * meta.pipSize * meta.contractSize * lotSize);

  const handleExecute = () => {
    if (account.freeMargin < requiredMargin) {
      alert('Insufficient Free Margin for this lot size. Reduce lot size or adjust leverage.');
      return;
    }
    onOpenPosition({
      pair: activePair,
      type: orderType,
      lotSize,
      sl: Number(slPrice.toFixed(meta.digits)),
      tp: Number(tpPrice.toFixed(meta.digits)),
    });
    if (onOrderPlaced) {
      onOrderPlaced();
    }
  };

  const allPairsList = Object.keys(PAIR_METADATA) as ForexPair[];
  const filteredPairs = allPairsList.filter((p) => {
    const pMeta = PAIR_METADATA[p];
    if (categoryFilter !== 'ALL' && pMeta.category !== categoryFilter) return false;
    if (pairSearch.trim()) {
      const query = pairSearch.toLowerCase().trim();
      return p.toLowerCase().includes(query) || pMeta.name.toLowerCase().includes(query);
    }
    return true;
  });

  const openPositions = account.positions.filter((p) => p.status === 'OPEN');
  const displayedPositions = positionFilter === 'CURRENT'
    ? openPositions.filter((p) => p.pair === activePair)
    : openPositions;
  const totalOpenPnL = openPositions.reduce((acc, p) => acc + p.pnl, 0);

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#0E1015] text-[#E0E0E0] rounded-xl border border-[#1F2229] shadow-2xl overflow-hidden relative">
      {/* Top Header with Interactive Pair Selector & Controls */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-[#161922] border-b border-[#1F2229] shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${
            feedStatus === 'DISCONNECTED'
              ? 'bg-rose-500'
              : feedStatus === 'STALE'
              ? 'bg-amber-400 animate-ping'
              : 'bg-[#00FFA3] animate-pulse'
          }`} />

          {/* Interactive Pair Selector Trigger */}
          <div className="relative">
            <button
              id="btn-select-pair-dropdown"
              onClick={() => setIsPairDropdownOpen(!isPairDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0A0B0D] hover:bg-[#12141A] border border-[#1F2229] hover:border-[#00FFA3]/50 transition-all cursor-pointer group"
              title="Click to choose a different pair to trade"
            >
              <span className="font-extrabold text-xs text-[#F3F4F6] group-hover:text-[#00FFA3] tracking-wide">
                {activePair}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1F2229] text-[#94A3B8] font-mono hidden sm:inline">
                {meta.category || 'Asset'}
              </span>
              <span className={`text-[11px] font-mono font-bold ${
                feedStatus === 'DISCONNECTED'
                  ? 'text-rose-400'
                  : feedStatus === 'STALE'
                  ? 'text-amber-400'
                  : 'text-[#00FFA3]'
              }`}>
                ${activePrice.toFixed(meta.digits)}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform ${isPairDropdownOpen ? 'rotate-180 text-[#00FFA3]' : ''}`} />
            </button>

            {/* Dropdown Menu for All Pairs */}
            {isPairDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 z-50 w-72 sm:w-80 bg-[#0E1015] border border-[#1F2229] rounded-xl shadow-2xl p-2.5 space-y-2 animate-fadeIn backdrop-blur-md">
                <div className="flex items-center justify-between pb-1 border-b border-[#1F2229]">
                  <span className="text-[11px] font-bold text-[#F3F4F6] flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#00FFA3]" /> Select Instrument to Trade
                  </span>
                  <button
                    onClick={() => setIsPairDropdownOpen(false)}
                    className="text-[#94A3B8] hover:text-[#E0E0E0] p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Search Box */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={pairSearch}
                    onChange={(e) => setPairSearch(e.target.value)}
                    placeholder="Search pair or asset name..."
                    className="w-full bg-[#12141A] border border-[#1F2229] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-[#00FFA3]"
                    autoFocus
                  />
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-[10px]">
                  {(['ALL', 'Metals', 'Major FX', 'Crypto', 'Indices'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap transition-colors ${
                        categoryFilter === cat
                          ? 'bg-[#00FFA3] text-[#0A0B0D]'
                          : 'bg-[#12141A] text-[#94A3B8] hover:text-[#E0E0E0]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Pairs List */}
                <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                  {filteredPairs.map((p) => {
                    const pMeta = PAIR_METADATA[p];
                    const pPrice = (pairPrices && pairPrices[p]) || pMeta.basePrice;
                    const pTicker = pairTickers && pairTickers[p];
                    const isSelected = p === activePair;

                    return (
                      <button
                        key={p}
                        onClick={() => handleSelectPair(p)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all text-left ${
                          isSelected
                            ? 'bg-[#00FFA3]/15 border border-[#00FFA3]/40 text-[#00FFA3]'
                            : 'hover:bg-[#161922] text-[#E0E0E0]'
                        }`}
                      >
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{p}</span>
                            <span className="text-[9px] px-1 rounded bg-[#1F2229] text-[#94A3B8] font-normal">
                              {pMeta.category}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#64748B] truncate max-w-[150px]">{pMeta.name}</div>
                        </div>

                        <div className="text-right font-mono">
                          <div className={`font-bold ${isSelected ? 'text-[#00FFA3]' : 'text-[#F3F4F6]'}`}>
                            ${pPrice.toFixed(pMeta.digits)}
                          </div>
                          {pTicker && (
                            <div className={`text-[10px] ${pTicker.changePercent >= 0 ? 'text-[#00FFA3]' : 'text-[#FF4D6D]'}`}>
                              {pTicker.changePercent >= 0 ? '+' : ''}{pTicker.changePercent.toFixed(2)}%
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {onCollapse && (
          <button
            id="btn-collapse-trade-panel"
            onClick={onCollapse}
            title="Collapse / Close Trade Panel to maximize chart view"
            className="p-1 rounded-md text-[#94A3B8] hover:text-[#00FFA3] hover:bg-[#1F2229] transition-colors flex items-center gap-1 text-[11px] cursor-pointer shrink-0"
          >
            <span className="hidden sm:inline text-[10px]">Collapse</span>
            <PanelRightClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Instrument Switcher Ribbon */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D0F14] border-b border-[#1F2229] overflow-x-auto no-scrollbar shrink-0 text-xs">
        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
          Pair:
        </span>
        {POPULAR_PAIRS.map((p) => {
          const isCurrent = p === activePair;
          const pPrice = (pairPrices && pairPrices[p]) || PAIR_METADATA[p]?.basePrice || 0;
          const pMeta = PAIR_METADATA[p] || { digits: 2 };
          return (
            <button
              key={p}
              onClick={() => handleSelectPair(p)}
              className={`px-2 py-1 rounded-md font-mono text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-[#00FFA3] text-[#0A0B0D] shadow-sm'
                  : 'bg-[#12141A] text-[#94A3B8] hover:text-[#E0E0E0] hover:bg-[#1A1D26] border border-[#1F2229]'
              }`}
            >
              <span>{p}</span>
              <span className={`text-[10px] ${isCurrent ? 'text-[#0A0B0D]/80 font-semibold' : 'text-[#64748B]'}`}>
                ${pPrice.toFixed(pMeta.digits)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Account Metric Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#12141A] border-b border-[#1F2229] text-xs shrink-0">
        <div className="bg-[#0A0B0D] p-2 rounded-lg border border-[#1F2229]">
          <div className="text-[10px] text-[#64748B] font-medium uppercase tracking-wider">Balance</div>
          <div className="text-sm font-bold font-mono text-[#F3F4F6]">${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-[#0A0B0D] p-2 rounded-lg border border-[#1F2229]">
          <div className="text-[10px] text-[#64748B] font-medium uppercase tracking-wider">Equity</div>
          <div className={`text-sm font-bold font-mono ${account.equity >= account.balance ? 'text-[#00FFA3]' : 'text-[#FF4D6D]'}`}>
            ${account.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-[#0A0B0D] p-2 rounded-lg border border-[#1F2229]">
          <div className="text-[10px] text-[#64748B] font-medium uppercase tracking-wider">Floating P&L</div>
          <div className={`text-sm font-bold font-mono ${totalOpenPnL >= 0 ? 'text-[#00FFA3]' : 'text-[#FF4D6D]'}`}>
            {totalOpenPnL >= 0 ? '+' : ''}${totalOpenPnL.toFixed(2)}
          </div>
        </div>
        <div className="bg-[#0A0B0D] p-2 rounded-lg border border-[#1F2229]">
          <div className="text-[10px] text-[#64748B] font-medium uppercase tracking-wider">Free Margin</div>
          <div className="text-sm font-bold font-mono text-[#E0E0E0]">${account.freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-[#1F2229] bg-[#0A0B0D] px-3 pt-2 gap-1 text-xs shrink-0">
        <button
          id="tab-new-order"
          onClick={() => setActiveTab('NEW_ORDER')}
          className={`pb-2 px-3 font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'NEW_ORDER' ? 'border-[#00FFA3] text-[#00FFA3]' : 'border-transparent text-[#94A3B8] hover:text-[#E0E0E0]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Trade Execution
        </button>
        <button
          id="tab-open-positions"
          onClick={() => setActiveTab('OPEN_POSITIONS')}
          className={`pb-2 px-3 font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'OPEN_POSITIONS' ? 'border-[#00FFA3] text-[#00FFA3]' : 'border-transparent text-[#94A3B8] hover:text-[#E0E0E0]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Open Orders ({openPositions.length})
        </button>
        <button
          id="tab-history"
          onClick={() => setActiveTab('HISTORY')}
          className={`pb-2 px-3 font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'HISTORY' ? 'border-[#00FFA3] text-[#00FFA3]' : 'border-transparent text-[#94A3B8] hover:text-[#E0E0E0]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          History ({account.history.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto space-y-4">
        {activeTab === 'NEW_ORDER' && (
          <div className="space-y-4 pb-6">
            {/* BUY / SELL Direction Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-select-buy"
                onClick={() => handleTypeChange('BUY')}
                className={`py-3 rounded-xl font-bold flex flex-col items-center justify-center transition-all border cursor-pointer ${
                  orderType === 'BUY'
                    ? 'bg-[#00FFA3] border-[#00FFA3] text-[#0A0B0D] shadow-lg shadow-[#00FFA3]/20'
                    : 'bg-[#12141A] border-[#1F2229] text-[#94A3B8] hover:border-[#00FFA3]/40 hover:text-[#00FFA3]'
                }`}
              >
                <div className="flex items-center gap-1 text-sm">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>BUY / LONG</span>
                </div>
                <span className="text-[11px] font-mono opacity-90">{currentPrice.toFixed(meta.digits)}</span>
              </button>

              <button
                id="btn-select-sell"
                onClick={() => handleTypeChange('SELL')}
                className={`py-3 rounded-xl font-bold flex flex-col items-center justify-center transition-all border cursor-pointer ${
                  orderType === 'SELL'
                    ? 'bg-[#FF4D6D] border-[#FF4D6D] text-white shadow-lg shadow-[#FF4D6D]/20'
                    : 'bg-[#12141A] border-[#1F2229] text-[#94A3B8] hover:border-[#FF4D6D]/40 hover:text-[#FF4D6D]'
                }`}
              >
                <div className="flex items-center gap-1 text-sm">
                  <ArrowDownRight className="w-4 h-4" />
                  <span>SELL / SHORT</span>
                </div>
                <span className="text-[11px] font-mono opacity-90">{currentPrice.toFixed(meta.digits)}</span>
              </button>
            </div>

            {/* Lot Size Selector */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="text-[#E0E0E0] font-medium">Position Size (Lots)</label>
                <span className="text-[#64748B] font-mono">1 Lot = {meta.contractSize.toLocaleString()} Units</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="input-lot-size"
                  type="number"
                  step="0.1"
                  min="0.01"
                  max="50"
                  value={lotSize}
                  onChange={(e) => setLotSize(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                  className="flex-1 bg-[#0A0B0D] border border-[#1F2229] rounded-lg px-3 py-2 text-sm font-mono font-bold text-[#F3F4F6] focus:outline-none focus:border-[#00FFA3]"
                />
                <div className="flex gap-1">
                  {[0.1, 0.5, 1.0, 2.0, 5.0].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setLotSize(v)}
                      className={`px-2 py-1 text-[10px] font-mono rounded border transition-all cursor-pointer ${
                        lotSize === v ? 'bg-[#00FFA3]/15 border-[#00FFA3] text-[#00FFA3]' : 'bg-[#12141A] border-[#1F2229] text-[#94A3B8] hover:bg-[#1A1D26]'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Risk-Reward Presets */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="text-[#E0E0E0] font-medium">Smart Money R:R Confluence</label>
                <span className="text-[#00FFA3] font-mono text-[11px]">Target 1:{riskRewardPreset}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[1.5, 2.0, 3.0, 4.5].map((rr) => (
                  <button
                    key={rr}
                    type="button"
                    onClick={() => applyRRPreset(rr)}
                    className={`py-1.5 rounded text-xs font-mono font-bold transition-all border cursor-pointer ${
                      riskRewardPreset === rr
                        ? 'bg-[#00FFA3] border-[#00FFA3] text-[#0A0B0D] shadow-sm'
                        : 'bg-[#12141A] border-[#1F2229] text-[#94A3B8] hover:bg-[#1A1D26] hover:text-[#E0E0E0]'
                    }`}
                  >
                    1:{rr}
                  </button>
                ))}
              </div>
            </div>

            {/* Stop Loss & Take Profit Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-[#FF4D6D] font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Stop Loss (SL)
                </label>
                <input
                  id="input-sl-price"
                  type="number"
                  step={meta.pipSize}
                  value={slPrice}
                  onChange={(e) => setSlPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0A0B0D] border border-[#1F2229] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#FF4D6D] focus:outline-none focus:border-[#FF4D6D]"
                />
                <div className="text-[10px] text-[#64748B] font-mono">
                  Risk: <span className="text-[#FF4D6D]">-${estimatedRiskUSD.toFixed(2)}</span> ({pipDistanceSL.toFixed(0)} pips)
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#00FFA3] font-medium flex items-center gap-1">
                  <Target className="w-3 h-3" /> Take Profit (TP)
                </label>
                <input
                  id="input-tp-price"
                  type="number"
                  step={meta.pipSize}
                  value={tpPrice}
                  onChange={(e) => setTpPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0A0B0D] border border-[#1F2229] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#00FFA3] focus:outline-none focus:border-[#00FFA3]"
                />
                <div className="text-[10px] text-[#64748B] font-mono">
                  Reward: <span className="text-[#00FFA3]">+${estimatedRewardUSD.toFixed(2)}</span> ({pipDistanceTP.toFixed(0)} pips)
                </div>
              </div>
            </div>

            {/* Margin Requirement Summary */}
            <div className="bg-[#0A0B0D] rounded-lg p-2.5 border border-[#1F2229] text-[11px] space-y-1 text-[#94A3B8]">
              <div className="flex justify-between">
                <span>Estimated Required Margin:</span>
                <span className="font-mono text-[#F3F4F6]">${requiredMargin.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Leverage:</span>
                <span className="font-mono text-[#00FFA3]">1:{account.leverage}</span>
              </div>
            </div>

            {/* Execute Order CTA */}
            <div className="pt-2">
              <button
                id="btn-execute-paper-trade"
                onClick={handleExecute}
                className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                  orderType === 'BUY'
                    ? 'bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] shadow-[#00FFA3]/20'
                    : 'bg-[#FF4D6D] hover:bg-[#E11D48] text-white shadow-[#FF4D6D]/20'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>PLACE {orderType} ORDER ({lotSize} LOTS)</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'OPEN_POSITIONS' && (
          <div className="space-y-3">
            {openPositions.length > 0 && (
              <div className="flex items-center justify-between pb-1 text-xs">
                <span className="font-bold text-[#94A3B8] text-[11px] uppercase tracking-wider">
                  Active Positions ({displayedPositions.length})
                </span>
                <div className="flex items-center gap-1 bg-[#0A0B0D] p-0.5 rounded-lg border border-[#1F2229] text-[10px]">
                  <button
                    onClick={() => setPositionFilter('ALL')}
                    className={`px-2 py-0.5 rounded font-bold transition-colors ${
                      positionFilter === 'ALL'
                        ? 'bg-[#00FFA3] text-[#0A0B0D]'
                        : 'text-[#94A3B8] hover:text-[#E0E0E0]'
                    }`}
                  >
                    All ({openPositions.length})
                  </button>
                  <button
                    onClick={() => setPositionFilter('CURRENT')}
                    className={`px-2 py-0.5 rounded font-bold transition-colors ${
                      positionFilter === 'CURRENT'
                        ? 'bg-[#00FFA3] text-[#0A0B0D]'
                        : 'text-[#94A3B8] hover:text-[#E0E0E0]'
                    }`}
                  >
                    {activePair} ({openPositions.filter((p) => p.pair === activePair).length})
                  </button>
                </div>
              </div>
            )}

            {displayedPositions.length === 0 ? (
              <div className="text-center py-10 text-[#64748B] text-xs">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#64748B]" />
                <p>
                  {positionFilter === 'CURRENT'
                    ? `No open positions for ${activePair}.`
                    : 'No active open positions for this session.'}
                </p>
                <button
                  onClick={() => setActiveTab('NEW_ORDER')}
                  className="mt-3 px-3 py-1 bg-[#12141A] hover:bg-[#1A1D26] text-[#E0E0E0] border border-[#1F2229] rounded text-xs cursor-pointer"
                >
                  Create New Order
                </button>
              </div>
            ) : (
              displayedPositions.map((pos) => {
                const posMeta = PAIR_METADATA[pos.pair] || meta;
                return (
                  <div
                    key={pos.id}
                    className="bg-[#12141A] rounded-xl p-3 border border-[#1F2229] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pos.type === 'BUY' ? 'bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/40' : 'bg-[#FF4D6D]/15 text-[#FF4D6D] border border-[#FF4D6D]/40'
                        }`}>
                          {pos.type}
                        </span>
                        <span className="font-bold text-xs text-[#F3F4F6]">{pos.pair}</span>
                        <span className="text-[11px] font-mono text-[#94A3B8]">{pos.lotSize} Lots</span>
                      </div>
                      <div className={`font-mono font-bold text-sm ${pos.pnl >= 0 ? 'text-[#00FFA3]' : 'text-[#FF4D6D]'}`}>
                        {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-[#0A0B0D] p-2 rounded-lg text-[#94A3B8] border border-[#1F2229]">
                      <div>
                        <span className="block text-[9px] text-[#64748B]">ENTRY</span>
                        {pos.entryPrice.toFixed(posMeta.digits)}
                      </div>
                      <div>
                        <span className="block text-[9px] text-[#64748B]">SL</span>
                        <span className="text-[#FF4D6D]">{pos.sl.toFixed(posMeta.digits)}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-[#64748B]">TP</span>
                        <span className="text-[#00FFA3]">{pos.tp.toFixed(posMeta.digits)}</span>
                      </div>
                    </div>

                    {/* Actions for active trade */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        id={`btn-be-${pos.id}`}
                        onClick={() => onSetBreakeven(pos.id)}
                        title="Move SL to Entry Price (Risk-Free)"
                        className="flex-1 py-1 bg-[#1A1D26] hover:bg-[#222634] text-[#E0E0E0] border border-[#1F2229] rounded text-[11px] font-medium transition-all cursor-pointer"
                      >
                        Set Breakeven
                      </button>
                      <button
                        id={`btn-close-50-${pos.id}`}
                        onClick={() => onClosePartial(pos.id, 0.5)}
                        title="Take Partial 50% Profit"
                        className="px-2 py-1 bg-[#1A1D26] hover:bg-[#222634] text-[#00FFA3] border border-[#1F2229] rounded text-[11px] font-medium transition-all cursor-pointer"
                      >
                        50% Partial
                      </button>
                      <button
                        id={`btn-close-${pos.id}`}
                        onClick={() => onClosePosition(pos.id)}
                        className="px-3 py-1 bg-[#FF4D6D]/80 hover:bg-[#FF4D6D] text-white rounded text-[11px] font-bold transition-all cursor-pointer"
                      >
                        Close Market
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'HISTORY' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs pb-1">
              <span className="text-[#94A3B8]">Past Verified Paper Trades</span>
              <button
                id="btn-reset-demo"
                onClick={onResetAccount}
                className="text-[10px] text-[#64748B] hover:text-[#00FFA3] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Reset Balance
              </button>
            </div>
            {account.history.length === 0 ? (
              <div className="text-center py-8 text-[#64748B] text-xs">
                No past closed trades.
              </div>
            ) : (
              account.history.slice(-10).reverse().map((h) => (
                <div
                  key={h.id}
                  className="bg-[#12141A] rounded-lg p-2 border border-[#1F2229] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className={h.type === 'BUY' ? 'text-[#00FFA3] font-bold' : 'text-[#FF4D6D] font-bold'}>
                        {h.type} {h.pair}
                      </span>
                      <span className="text-[10px] text-[#64748B]">{h.lotSize}L</span>
                    </div>
                    <div className="text-[10px] text-[#64748B]">
                      Reason: <span className="text-[#E0E0E0] font-semibold">{h.closeReason || 'TP'}</span> • {new Date(h.closeTime || h.openTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className={`font-mono font-bold ${h.pnl >= 0 ? 'text-[#00FFA3]' : 'text-[#FF4D6D]'}`}>
                    {h.pnl >= 0 ? '+' : ''}${h.pnl.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
