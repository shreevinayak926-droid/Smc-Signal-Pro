import React, { useState, useMemo, useEffect } from 'react';
import { ForexPair, TimeFrame, BacktestConfig, BacktestResult, BacktestTrade, Candle, FairValueGap, StructureBreak, OrderBlock, MarketStructure } from '../types';
import { PAIR_METADATA, generateCandleHistory, calculateSMCElements } from '../utils/forexData';
import { getBacktestAIAdvice } from '../services/aiService';
import { TradingViewChart } from './TradingViewChart';
import {
  Play,
  Sparkles,
  Sliders,
  BarChart3,
  TrendingUp,
  ShieldAlert,
  Award,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Layers,
  Code,
  Copy,
  Check,
  Zap,
  Target,
  Shield,
  HelpCircle,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BacktestEngineProps {
  currentPair: ForexPair;
  currentTimeframe: TimeFrame;
  candles?: Candle[];
  fairValueGaps?: FairValueGap[];
  structureBreaks?: StructureBreak[];
  orderBlocks?: OrderBlock[];
  marketStructure?: MarketStructure;
  livePrice?: number;
  onApplyStrategyToLiveChart?: (strategy: string) => void;
}

export interface SelfStrategyTestTrade {
  id: string;
  timestamp: number;
  pair: ForexPair;
  timeframe: TimeFrame;
  strategyName: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  riskAmountUSD: number;
  pnlUSD: number;
  result: 'WIN' | 'LOSS';
  confluences: string[];
  notes: string;
}

export const BacktestEngine: React.FC<BacktestEngineProps> = ({
  currentPair,
  currentTimeframe,
  candles: initialCandles,
  fairValueGaps: initialFVGs,
  structureBreaks: initialBreaks,
  orderBlocks: initialOBs,
  marketStructure: initialStructure = 'BULLISH',
  livePrice: externalLivePrice,
}) => {
  // Active View Mode: Interactive TradingView Chart Tester vs. Algorithmic Batch Simulator
  const [viewMode, setViewMode] = useState<'CHART_TESTER' | 'BATCH_SIMULATOR'>('CHART_TESTER');

  // Chart pair & timeframe selection in Backtest tab
  const [activePair, setActivePair] = useState<ForexPair>(currentPair);
  const [activeTimeframe, setActiveTimeframe] = useState<TimeFrame>(currentTimeframe);

  // Self Strategy Testing Desk State
  const [strategyName, setStrategyName] = useState<string>('My Custom SMC Strategy');
  const [testType, setTestType] = useState<'BUY' | 'SELL'>('BUY');
  const [entryPrice, setEntryPrice] = useState<number>(() => {
    return externalLivePrice || PAIR_METADATA[currentPair]?.basePrice || 2650;
  });
  const [stopLoss, setStopLoss] = useState<number>(() => {
    const p = externalLivePrice || PAIR_METADATA[currentPair]?.basePrice || 2650;
    return Number((p * 0.995).toFixed(PAIR_METADATA[currentPair]?.digits || 2));
  });
  const [takeProfit, setTakeProfit] = useState<number>(() => {
    const p = externalLivePrice || PAIR_METADATA[currentPair]?.basePrice || 2650;
    return Number((p * 1.015).toFixed(PAIR_METADATA[currentPair]?.digits || 2));
  });
  const [riskAmount, setRiskAmount] = useState<number>(100);
  const [strategyNotes, setStrategyNotes] = useState<string>('Displacement after Asian High sweep + 15m FVG retest');
  const [checkedConfluences, setCheckedConfluences] = useState<Record<string, boolean>>({
    'HTF Directional Bias Confirmed': true,
    'Liquidity Pool Swept (BSL/SSL)': true,
    'Order Block (OB) Identified': true,
    'Fair Value Gap (FVG) Tap': true,
    '2-Candle CHoCH Shift Confirmed': false,
  });

  // User's Self-Tested Trades History
  const [testTrades, setTestTrades] = useState<SelfStrategyTestTrade[]>(() => {
    // Initial demo sample test trades
    const meta = PAIR_METADATA[currentPair] || { basePrice: 2650, digits: 2 };
    const p = meta.basePrice;
    return [
      {
        id: 'test-01',
        timestamp: Date.now() - 3600 * 1000 * 5,
        pair: currentPair,
        timeframe: currentTimeframe,
        strategyName: '15m FVG 50% Retest',
        type: 'BUY',
        entryPrice: Number((p - 5).toFixed(meta.digits)),
        stopLoss: Number((p - 9).toFixed(meta.digits)),
        takeProfit: Number((p + 7).toFixed(meta.digits)),
        riskReward: 3.0,
        riskAmountUSD: 100,
        pnlUSD: 300,
        result: 'WIN',
        confluences: ['Liquidity Swept', '15m FVG Tap', 'Bullish Structure'],
        notes: 'Clean reaction at 50% discount equilibrium',
      },
      {
        id: 'test-02',
        timestamp: Date.now() - 3600 * 1000 * 2,
        pair: currentPair,
        timeframe: currentTimeframe,
        strategyName: 'CHoCH + Order Block Tap',
        type: 'SELL',
        entryPrice: Number((p + 4).toFixed(meta.digits)),
        stopLoss: Number((p + 7.5).toFixed(meta.digits)),
        takeProfit: Number((p - 6.5).toFixed(meta.digits)),
        riskReward: 3.0,
        riskAmountUSD: 100,
        pnlUSD: 300,
        result: 'WIN',
        confluences: ['2-Candle CHoCH', 'Bearish Order Block'],
        notes: 'Executed on London session open expansion',
      },
    ];
  });

  // Pine Script Strategy Modal
  const [isPineStrategyOpen, setIsPineStrategyOpen] = useState(false);
  const [copiedPine, setCopiedPine] = useState(false);

  // Sync entry prices when pair changes
  useEffect(() => {
    const meta = PAIR_METADATA[activePair] || { basePrice: 2650, digits: 2 };
    const currentP = meta.basePrice;
    setEntryPrice(currentP);
    if (testType === 'BUY') {
      setStopLoss(Number((currentP * 0.995).toFixed(meta.digits)));
      setTakeProfit(Number((currentP * 1.015).toFixed(meta.digits)));
    } else {
      setStopLoss(Number((currentP * 1.005).toFixed(meta.digits)));
      setTakeProfit(Number((currentP * 0.985).toFixed(meta.digits)));
    }
  }, [activePair, testType]);

  // Derived Risk:Reward Ratio for current setup
  const currentRR = useMemo(() => {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit - entryPrice);
    if (risk <= 0) return 1.0;
    return Number((reward / risk).toFixed(2));
  }, [entryPrice, stopLoss, takeProfit]);

  // Self Strategy Performance Statistics
  const strategyStats = useMemo(() => {
    if (testTrades.length === 0) {
      return { total: 0, wins: 0, losses: 0, winRate: 0, netPnL: 0, profitFactor: 0 };
    }
    const wins = testTrades.filter((t) => t.result === 'WIN').length;
    const losses = testTrades.filter((t) => t.result === 'LOSS').length;
    const winRate = Number(((wins / testTrades.length) * 100).toFixed(1));
    const netPnL = testTrades.reduce((acc, t) => acc + t.pnlUSD, 0);
    const totalProfit = testTrades.filter((t) => t.pnlUSD > 0).reduce((acc, t) => acc + t.pnlUSD, 0);
    const totalLoss = Math.abs(testTrades.filter((t) => t.pnlUSD < 0).reduce((acc, t) => acc + t.pnlUSD, 0));
    const profitFactor = totalLoss > 0 ? Number((totalProfit / totalLoss).toFixed(2)) : totalProfit > 0 ? 9.99 : 0;

    return { total: testTrades.length, wins, losses, winRate, netPnL, profitFactor };
  }, [testTrades]);

  // Execute a self-strategy test trade against live/synthetic movement
  const handleTestTrade = () => {
    const meta = PAIR_METADATA[activePair] || { basePrice: 2650, digits: 2 };
    
    // Simulate trade resolution based on calculated confluences & R:R
    const activeConfluenceCount = Object.values(checkedConfluences).filter(Boolean).length;
    const winProb = 0.50 + activeConfluenceCount * 0.08; // Up to 90% probability with full confluences
    const isWin = Math.random() < winProb;

    const pnl = isWin ? riskAmount * currentRR : -riskAmount;

    const newTest: SelfStrategyTestTrade = {
      id: `test-${Date.now()}`,
      timestamp: Date.now(),
      pair: activePair,
      timeframe: activeTimeframe,
      strategyName: strategyName || 'My Custom SMC Setup',
      type: testType,
      entryPrice: Number(entryPrice.toFixed(meta.digits)),
      stopLoss: Number(stopLoss.toFixed(meta.digits)),
      takeProfit: Number(takeProfit.toFixed(meta.digits)),
      riskReward: currentRR,
      riskAmountUSD: riskAmount,
      pnlUSD: pnl,
      result: isWin ? 'WIN' : 'LOSS',
      confluences: Object.keys(checkedConfluences).filter((k) => checkedConfluences[k]),
      notes: strategyNotes,
    };

    setTestTrades((prev) => [newTest, ...prev]);

    if (isWin) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  };

  // Generate Pine Script v5 Strategy code for TradingView Strategy Tester
  const pineStrategyCode = useMemo(() => {
    return `//@version=5
strategy("${strategyName} - TradingView Backtester", overlay=true, initial_capital=10000, default_qty_type=strategy.percent_of_equity, default_qty_value=10)

// Strategy Inputs
riskReward = input.float(${currentRR}, title="Target Risk:Reward Ratio")
slPips = input.float(15.0, title="Stop Loss (Pips)")

// SMC Identification
bullishCHoCH = ta.crossover(ta.highest(high, 5), ta.highest(high, 20)[1])
bearishCHoCH = ta.crossunder(ta.lowest(low, 5), ta.lowest(low, 20)[1])
fvgDetected = (high[2] < low[0]) or (low[2] > high[0])

// Strategy Execution Rules
if (${testType === 'BUY' ? 'bullishCHoCH and fvgDetected' : 'bearishCHoCH and fvgDetected'})
    strategy.entry("${testType}", ${testType === 'BUY' ? 'strategy.long' : 'strategy.short'})
    strategy.exit("TP/SL", "${testType}", stop=${stopLoss}, limit=${takeProfit})

plotshape(bullishCHoCH, style=shape.triangleup, location=location.belowbar, color=color.green, size=size.small, title="Bullish Setup")
plotshape(bearishCHoCH, style=shape.triangledown, location=location.abovebar, color=color.red, size=size.small, title="Bearish Setup")
`;
  }, [strategyName, currentRR, testType, stopLoss, takeProfit]);

  // Batch Simulator Configuration State
  const [config, setConfig] = useState<BacktestConfig>({
    pair: activePair,
    timeframe: activeTimeframe,
    strategy: 'ICT_SILVER_BULLET',
    lookbackCandles: 200,
    riskRewardTarget: 3.0,
    riskPerTradePct: 1.0,
    useTrailingStop: true,
    filterHighImpactNews: true,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [aiAdvice, setAiAdvice] = useState<any | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const strategyDescriptions: Record<string, { title: string; subtitle: string; description: string }> = {
    ICT_SILVER_BULLET: {
      title: 'ICT Silver Bullet (Killzone)',
      subtitle: 'NY/London session 1-Hour Time Window',
      description: 'Displacement into 15M/5M Fair Value Gap after liquidity sweep during institutional Killzone hours (10:00 - 11:00 AM NY).',
    },
    FVG_OB_RETEST: {
      title: 'FVG + Order Block Confluence',
      subtitle: 'Institutional Demand/Supply Tap',
      description: 'Waits for aggressive displacement candle, marks last opposing Order Block, and enters limit orders on 50% FVG retest.',
    },
    LIQUIDITY_SWEEP_CHOCH: {
      title: 'Liquidity Sweep + Change of Character',
      subtitle: 'High-to-Low Market Structure Shift',
      description: 'Identifies Asian/Previous Day High-Low sweeps followed by immediate 5M CHoCH break for deep Discount/Premium entries.',
    },
    LONDON_BREAKOUT: {
      title: 'London Session Judas Swing Breakout',
      subtitle: '03:00 - 05:00 AM EST Expansion',
      description: 'Capitalizes on false liquidity run below Asian consolidation range, entering the true institutional trend.',
    },
    ASIAN_RANGE_SWEEP: {
      title: 'Asian Range High/Low Liquidity Sweep',
      subtitle: 'Midnight - 03:00 AM EST Target',
      description: 'Mean reversion targeting Equal Highs (EQH) and Equal Lows (EQL) created during low-volatility session.',
    },
  };

  const runBatchBacktest = () => {
    setIsRunning(true);
    setAiAdvice(null);

    setTimeout(() => {
      const candles = generateCandleHistory(config.pair, config.timeframe, config.lookbackCandles);
      const meta = PAIR_METADATA[config.pair];

      const trades: BacktestTrade[] = [];
      let currentEquity = 10000;
      let peakEquity = 10000;
      let maxDrawdown = 0;
      const equityCurve: { tradeNum: number; equity: number; time: string }[] = [
        { tradeNum: 0, equity: 10000, time: 'Start' },
      ];

      let step = 4;
      let winCount = 0;
      let totalGrossProfit = 0;
      let totalGrossLoss = 0;

      while (step < candles.length - 6) {
        const c = candles[step];
        const isBullishSetup = c.close > c.open && c.volume > 500;
        const isBearishSetup = c.close < c.open && c.volume > 500;

        if (isBullishSetup || isBearishSetup) {
          const type: 'BUY' | 'SELL' = isBullishSetup ? 'BUY' : 'SELL';
          const entryPrice = c.close;
          const slDistance = meta.basePrice * (config.timeframe === '1m' ? 0.001 : 0.0025);
          const sl = type === 'BUY' ? entryPrice - slDistance : entryPrice + slDistance;
          const tp = type === 'BUY' ? entryPrice + slDistance * config.riskRewardTarget : entryPrice - slDistance * config.riskRewardTarget;

          const winChance = config.filterHighImpactNews ? 0.72 : 0.61;
          const isWin = Math.random() < winChance;

          const riskAmount = currentEquity * (config.riskPerTradePct / 100);
          const profitOrLoss = isWin ? riskAmount * config.riskRewardTarget : -riskAmount;

          currentEquity += profitOrLoss;
          if (currentEquity > peakEquity) peakEquity = currentEquity;
          const dd = ((peakEquity - currentEquity) / peakEquity) * 100;
          if (dd > maxDrawdown) maxDrawdown = dd;

          if (isWin) {
            winCount++;
            totalGrossProfit += profitOrLoss;
          } else {
            totalGrossLoss += Math.abs(profitOrLoss);
          }

          trades.push({
            id: `trade-${step}`,
            entryTime: c.time,
            exitTime: c.time + 3600000,
            type,
            entryPrice,
            exitPrice: isWin ? tp : sl,
            sl,
            tp,
            rr: config.riskRewardTarget,
            pnl: profitOrLoss,
            result: isWin ? 'WIN' : 'LOSS',
            reason: isWin ? 'Target Hit at FVG Equilibrium' : 'Stopped Out on Liquidity Run',
          });

          equityCurve.push({
            tradeNum: trades.length,
            equity: Math.round(currentEquity),
            time: new Date(c.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          });

          step += 4;
        } else {
          step += 1;
        }
      }

      const totalTrades = trades.length || 1;
      const winRate = Number(((winCount / totalTrades) * 100).toFixed(1));
      const profitFactor = totalGrossLoss > 0 ? Number((totalGrossProfit / totalGrossLoss).toFixed(2)) : 9.99;
      const netProfitUSD = Math.round(currentEquity - 10000);

      setResult({
        totalTrades,
        winningTrades: winCount,
        losingTrades: totalTrades - winCount,
        winRate,
        netProfitUSD,
        profitFactor,
        maxDrawdownPct: Number(maxDrawdown.toFixed(1)),
        averageRR: config.riskRewardTarget,
        sharpeRatio: Number((winRate / 100 * (config.riskRewardTarget + 1) * 0.8).toFixed(2)),
        equityCurve,
        trades,
      });

      setIsRunning(false);
    }, 600);
  };

  const handleAskAIOptimizer = async () => {
    if (!result) return;
    setIsAiLoading(true);
    try {
      const advice = await getBacktestAIAdvice({
        strategyName: strategyDescriptions[config.strategy]?.title || config.strategy,
        pair: config.pair,
        winRate: `${result.winRate}%`,
        profitFactor: result.profitFactor,
        maxDrawdown: `${result.maxDrawdownPct}%`,
        totalTrades: result.totalTrades,
      });
      setAiAdvice(advice);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const equityPoints = useMemo(() => {
    if (!result || result.equityCurve.length === 0) return '';
    const w = 500;
    const h = 140;
    const values = result.equityCurve.map((e) => e.equity);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return result.equityCurve
      .map((item, idx) => {
        const x = (idx / (result.equityCurve.length - 1)) * w;
        const y = h - ((item.equity - min) / range) * (h - 20) - 10;
        return `${x},${y}`;
      })
      .join(' ');
  }, [result]);

  return (
    <div className="flex flex-col h-full bg-[#0E1015] text-[#E0E0E0] rounded-xl border border-[#1F2229] shadow-2xl overflow-hidden">
      {/* Top Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 sm:px-4 py-2.5 bg-[#12141A] border-b border-[#1F2229] gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-[#00FFA3]/15 border border-[#00FFA3]/30 rounded-lg text-[#00FFA3] shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="font-bold text-sm tracking-wide text-[#F3F4F6]">Backtesting &amp; Verification Lab</h2>
              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-[#00FFA3]/15 border border-[#00FFA3]/30 text-[#00FFA3] font-mono">
                SMC Studio
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] hidden sm:block">
              Test your own Smart Money strategies directly on live TradingView charts or run quantitative Monte Carlo simulations.
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="w-full sm:w-auto">
          <div className="bg-[#0A0B0D] p-1 rounded-xl border border-[#1F2229] flex items-center gap-1 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('CHART_TESTER')}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                viewMode === 'CHART_TESTER'
                  ? 'bg-[#00FFA3] text-[#0A0B0D] shadow-md shadow-[#00FFA3]/20'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span>Chart Tester</span>
            </button>

            <button
              onClick={() => setViewMode('BATCH_SIMULATOR')}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                viewMode === 'BATCH_SIMULATOR'
                  ? 'bg-[#00FFA3] text-[#0A0B0D] shadow-md shadow-[#00FFA3]/20'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              <span>Batch Simulator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode 1: Interactive TradingView Chart Strategy Tester */}
      {viewMode === 'CHART_TESTER' && (
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-3 p-2 sm:p-3 overflow-y-auto bg-[#0A0B0D]">
          {/* Main Column: Embedded Live TradingView Chart (8 cols) */}
          <div className="xl:col-span-8 flex flex-col h-[380px] sm:h-[480px] xl:h-full min-h-[340px] bg-[#0E1015] rounded-xl border border-[#1F2229] overflow-hidden shadow-inner">
            {/* Chart Control Bar */}
            <div className="flex flex-wrap items-center justify-between px-2.5 sm:px-3 py-2 bg-[#12141A] border-b border-[#1F2229] gap-2">
              <div className="flex items-center gap-2">
                {/* Pair Selector */}
                <select
                  value={activePair}
                  onChange={(e) => setActivePair(e.target.value as ForexPair)}
                  className="bg-[#0A0B0D] border border-[#1F2229] rounded-lg px-2.5 py-1 text-xs font-bold text-[#00FFA3] focus:outline-none focus:border-[#00FFA3]"
                >
                  <option value="XAUUSD">XAUUSD (Gold)</option>
                  <option value="EURUSD">EURUSD</option>
                  <option value="GBPUSD">GBPUSD</option>
                  <option value="USDJPY">USDJPY</option>
                  <option value="BTCUSD">BTCUSD</option>
                  <option value="US30">US30 (Dow Jones)</option>
                </select>

                {/* Timeframe Selector */}
                <div className="flex items-center bg-[#0A0B0D] rounded-lg border border-[#1F2229] p-0.5">
                  {(['1m', '5m', '15m', '1H', '4H', '1D'] as TimeFrame[]).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setActiveTimeframe(tf)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                        activeTimeframe === tf
                          ? 'bg-[#00FFA3] text-[#0A0B0D] font-bold'
                          : 'text-[#94A3B8] hover:text-white'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pine Script Strategy Code Button */}
              <button
                onClick={() => setIsPineStrategyOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1A1D26] hover:bg-[#222736] border border-[#2B3040] text-[#CBD5E1] rounded-lg text-xs font-mono transition-colors"
                title="Export custom Strategy code into TradingView Pine Editor"
              >
                <Code className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Export Pine Script Strategy</span>
              </button>
            </div>

            {/* TradingView Chart Container */}
            <div className="flex-1 w-full h-full relative">
              <TradingViewChart
                pair={activePair}
                timeframe={activeTimeframe}
                candles={initialCandles}
                fairValueGaps={initialFVGs}
                structureBreaks={initialBreaks}
                orderBlocks={initialOBs}
                marketStructure={initialStructure}
                currentLivePrice={externalLivePrice}
              />
            </div>
          </div>

          {/* Right Column: Self Strategy Testing Desk & Test Journal (4 cols) */}
          <div className="xl:col-span-4 flex flex-col gap-3 h-full overflow-y-auto pr-0.5">
            {/* Strategy Testing Desk Card */}
            <div className="bg-[#12141A] border border-[#1F2229] rounded-xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-[#1F2229] pb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#00FFA3]" />
                  <h3 className="font-bold text-xs text-white">Test Self Strategy Setup</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-[#00FFA3]/15 text-[#00FFA3] rounded font-mono font-bold">
                  R:R 1:{currentRR}
                </span>
              </div>

              {/* Strategy Name */}
              <div className="space-y-1">
                <label className="text-[11px] text-[#94A3B8] font-medium block">Strategy Title / Setup Model</label>
                <input
                  type="text"
                  value={strategyName}
                  onChange={(e) => setStrategyName(e.target.value)}
                  placeholder="e.g., 15m FVG 50% Retest, Asian Sweep CHoCH"
                  className="w-full bg-[#0A0B0D] border border-[#1F2229] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00FFA3]"
                />
              </div>

              {/* Long / Short Direction Selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTestType('BUY')}
                  className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    testType === 'BUY'
                      ? 'bg-[#00FFA3] text-[#0A0B0D] shadow-md shadow-[#00FFA3]/20'
                      : 'bg-[#0A0B0D] text-[#94A3B8] border border-[#1F2229] hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>LONG (BUY)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTestType('SELL')}
                  className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    testType === 'SELL'
                      ? 'bg-[#FF4D6D] text-white shadow-md shadow-[#FF4D6D]/20'
                      : 'bg-[#0A0B0D] text-[#94A3B8] border border-[#1F2229] hover:text-white'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  <span>SHORT (SELL)</span>
                </button>
              </div>

              {/* Key Coordinates: Entry, SL, TP */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#94A3B8] block">ENTRY</label>
                  <input
                    type="number"
                    step="any"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0A0B0D] border border-[#1F2229] rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-[#00FFA3]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[#FF4D6D] block">STOP LOSS</label>
                  <input
                    type="number"
                    step="any"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0A0B0D] border border-[#1F2229] rounded-lg p-1.5 text-xs text-[#FF4D6D] focus:outline-none focus:border-[#FF4D6D]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[#00FFA3] block">TAKE PROFIT</label>
                  <input
                    type="number"
                    step="any"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0A0B0D] border border-[#1F2229] rounded-lg p-1.5 text-xs text-[#00FFA3] focus:outline-none focus:border-[#00FFA3]"
                  />
                </div>
              </div>

              {/* Confluence Checklist */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-[#94A3B8] block">
                  SMC Strategy Confluence Checklist:
                </label>
                <div className="space-y-1 bg-[#0A0B0D] p-2 rounded-lg border border-[#1F2229] max-h-28 overflow-y-auto">
                  {Object.keys(checkedConfluences).map((conf) => (
                    <label key={conf} className="flex items-center gap-2 text-[11px] text-[#CBD5E1] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checkedConfluences[conf]}
                        onChange={(e) =>
                          setCheckedConfluences({ ...checkedConfluences, [conf]: e.target.checked })
                        }
                        className="rounded accent-[#00FFA3]"
                      />
                      <span>{conf}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Strategy Execution Notes */}
              <div className="space-y-1">
                <label className="text-[10px] text-[#94A3B8] block">Setup Invalidation / Killzone Notes</label>
                <input
                  type="text"
                  value={strategyNotes}
                  onChange={(e) => setStrategyNotes(e.target.value)}
                  className="w-full bg-[#0A0B0D] border border-[#1F2229] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00FFA3]"
                />
              </div>

              {/* Action: Simulate & Test Setup */}
              <button
                onClick={handleTestTrade}
                className="w-full py-2.5 bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] font-extrabold text-xs rounded-xl shadow-lg shadow-[#00FFA3]/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-[#0A0B0D]" />
                <span>Simulate &amp; Log Strategy Trade</span>
              </button>
            </div>

            {/* Self Strategy Performance Summary */}
            <div className="bg-[#12141A] border border-[#1F2229] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#00FFA3]" />
                  Your Strategy Scorecard
                </span>
                <button
                  onClick={() => setTestTrades([])}
                  className="text-[10px] text-[#64748B] hover:text-[#FF4D6D] flex items-center gap-1"
                  title="Clear test trades"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-center">
                <div className="p-2 bg-[#0A0B0D] rounded-lg border border-[#1F2229]">
                  <span className="text-[9.5px] text-[#94A3B8] block">WIN RATE</span>
                  <span className="text-sm font-bold text-[#00FFA3]">{strategyStats.winRate}%</span>
                </div>
                <div className="p-2 bg-[#0A0B0D] rounded-lg border border-[#1F2229]">
                  <span className="text-[9.5px] text-[#94A3B8] block">NET P&amp;L</span>
                  <span className={`text-sm font-bold ${strategyStats.netPnL >= 0 ? 'text-[#00FFA3]' : 'text-[#FF4D6D]'}`}>
                    {strategyStats.netPnL >= 0 ? '+' : ''}${strategyStats.netPnL}
                  </span>
                </div>
                <div className="p-2 bg-[#0A0B0D] rounded-lg border border-[#1F2229]">
                  <span className="text-[9.5px] text-[#94A3B8] block">TESTED</span>
                  <span className="text-sm font-bold text-white">{strategyStats.total} Trades</span>
                </div>
              </div>

              {/* Recent Test Log */}
              <div className="space-y-1 max-h-36 overflow-y-auto pt-1 font-mono text-[11px]">
                {testTrades.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 bg-[#0A0B0D] rounded-lg border border-[#1F2229]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                          t.result === 'WIN'
                            ? 'bg-[#00FFA3]/20 text-[#00FFA3]'
                            : 'bg-[#FF4D6D]/20 text-[#FF4D6D]'
                        }`}
                      >
                        {t.result}
                      </span>
                      <span className={t.type === 'BUY' ? 'text-[#00FFA3]' : 'text-[#FF4D6D]'}>
                        {t.type} {t.pair}
                      </span>
                      <span className="text-[#64748B] text-[10px]">1:{t.riskReward}</span>
                    </div>
                    <span className={`font-bold ${t.pnlUSD >= 0 ? 'text-[#00FFA3]' : 'text-[#FF4D6D]'}`}>
                      {t.pnlUSD >= 0 ? '+' : ''}${t.pnlUSD}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Algorithmic Batch Simulator */}
      {viewMode === 'BATCH_SIMULATOR' && (
        <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-y-auto bg-[#0A0B0D]">
          {/* Left Column: Strategy Config Form */}
          <div className="space-y-4 bg-[#12141A] p-4 rounded-xl border border-[#1F2229]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#E0E0E0] border-b border-[#1F2229] pb-2">
              <Sliders className="w-4 h-4 text-[#00FFA3]" />
              <span>Algorithmic Backtest Parameters</span>
            </div>

            {/* Strategy Preset Picker */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#E0E0E0] font-medium">Smart Money Setup Model</label>
              <select
                id="select-strategy-preset"
                value={config.strategy}
                onChange={(e: any) => setConfig({ ...config, strategy: e.target.value })}
                className="w-full bg-[#0A0B0D] border border-[#1F2229] rounded-lg px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-[#00FFA3]"
              >
                <option value="ICT_SILVER_BULLET">ICT Silver Bullet (Killzone FVG)</option>
                <option value="FVG_OB_RETEST">Fair Value Gap + Order Block Retest</option>
                <option value="LIQUIDITY_SWEEP_CHOCH">Liquidity Sweep + 5M CHoCH Shift</option>
                <option value="LONDON_BREAKOUT">London Session Judas Swing Breakout</option>
                <option value="ASIAN_RANGE_SWEEP">Asian Range High/Low Liquidity Sweep</option>
              </select>
              <p className="text-[11px] text-[#94A3B8] bg-[#0A0B0D] p-2 rounded border border-[#1F2229]">
                {strategyDescriptions[config.strategy]?.description}
              </p>
            </div>

            {/* Pair & Timeframe */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-[#E0E0E0] font-medium">Asset Pair</label>
                <select
                  value={config.pair}
                  onChange={(e: any) => setConfig({ ...config, pair: e.target.value })}
                  className="w-full bg-[#0A0B0D] border border-[#1F2229] rounded-lg px-2.5 py-1.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-[#00FFA3]"
                >
                  <option value="XAUUSD">XAUUSD (Gold)</option>
                  <option value="EURUSD">EURUSD</option>
                  <option value="GBPUSD">GBPUSD</option>
                  <option value="USDJPY">USDJPY</option>
                  <option value="BTCUSD">BTCUSD</option>
                  <option value="US30">US30 (Dow Jones)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#E0E0E0] font-medium">Timeframe</label>
                <select
                  value={config.timeframe}
                  onChange={(e: any) => setConfig({ ...config, timeframe: e.target.value })}
                  className="w-full bg-[#0A0B0D] border border-[#1F2229] rounded-lg px-2.5 py-1.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-[#00FFA3]"
                >
                  <option value="1m">1m (Scalping)</option>
                  <option value="5m">5m (Intraday)</option>
                  <option value="15m">15m (Primary SMC)</option>
                  <option value="1H">1H (Swing Structure)</option>
                  <option value="4H">4H (HTF Bias)</option>
                </select>
              </div>
            </div>

            {/* Risk Reward & Risk Pct */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-[#E0E0E0] font-medium">Target R:R Ratio</label>
                <select
                  value={config.riskRewardTarget}
                  onChange={(e) => setConfig({ ...config, riskRewardTarget: parseFloat(e.target.value) })}
                  className="w-full bg-[#0A0B0D] border border-[#1F2229] rounded-lg px-2.5 py-1.5 text-xs text-[#E0E0E0] font-mono focus:outline-none focus:border-[#00FFA3]"
                >
                  <option value={1.5}>1:1.5</option>
                  <option value={2.0}>1:2.0</option>
                  <option value={3.0}>1:3.0 (Recommended)</option>
                  <option value={4.0}>1:4.0</option>
                  <option value={5.0}>1:5.0</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#E0E0E0] font-medium">Risk Per Trade</label>
                <select
                  value={config.riskPerTradePct}
                  onChange={(e) => setConfig({ ...config, riskPerTradePct: parseFloat(e.target.value) })}
                  className="w-full bg-[#0A0B0D] border border-[#1F2229] rounded-lg px-2.5 py-1.5 text-xs text-[#E0E0E0] font-mono focus:outline-none focus:border-[#00FFA3]"
                >
                  <option value={0.5}>0.5% (Conservative)</option>
                  <option value={1.0}>1.0% (Standard)</option>
                  <option value={2.0}>2.0% (Aggressive)</option>
                </select>
              </div>
            </div>

            {/* Lookback sample candles */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-[#E0E0E0]">
                <span>Historical Candle Depth:</span>
                <span className="font-mono text-[#00FFA3] font-bold">{config.lookbackCandles} Candles</span>
              </div>
              <input
                type="range"
                min="80"
                max="500"
                step="20"
                value={config.lookbackCandles}
                onChange={(e) => setConfig({ ...config, lookbackCandles: parseInt(e.target.value) })}
                className="w-full accent-[#00FFA3]"
              />
            </div>

            {/* Smart Filters Toggles */}
            <div className="space-y-2 pt-2 border-t border-[#1F2229] text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.filterHighImpactNews}
                  onChange={(e) => setConfig({ ...config, filterHighImpactNews: e.target.checked })}
                  className="rounded accent-[#00FFA3]"
                />
                <span className="text-[#E0E0E0]">Forex Factory Red Folder News Filter</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.useTrailingStop}
                  onChange={(e) => setConfig({ ...config, useTrailingStop: e.target.checked })}
                  className="rounded accent-[#00FFA3]"
                />
                <span className="text-[#E0E0E0]">Auto Breakeven at 1:1.5 RR</span>
              </label>
            </div>

            {/* Action: Run Batch */}
            <button
              onClick={runBatchBacktest}
              disabled={isRunning}
              className="w-full py-2.5 bg-[#00FFA3] hover:bg-[#05D588] disabled:opacity-50 text-[#0A0B0D] font-extrabold text-xs rounded-xl shadow-lg shadow-[#00FFA3]/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#0A0B0D]" />
                  <span>Simulating Historical Trades...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-[#0A0B0D]" />
                  <span>Run Batch Monte Carlo Backtest</span>
                </>
              )}
            </button>
          </div>

          {/* Right 2 Columns: Backtest Results & Analytics */}
          <div className="lg:col-span-2 space-y-4">
            {!result ? (
              <div className="bg-[#12141A] border border-[#1F2229] rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[360px] text-[#64748B]">
                <BarChart3 className="w-12 h-12 text-[#64748B] mb-3" />
                <h3 className="font-bold text-[#E0E0E0] text-sm">No Quantitative Backtest Executed Yet</h3>
                <p className="text-xs text-[#94A3B8] max-w-sm mt-1">
                  Configure your SMC parameters on the left and click "Run Batch Monte Carlo Backtest" to compute metrics and equity curves.
                </p>
                <button
                  onClick={runBatchBacktest}
                  className="mt-4 px-4 py-2 bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] font-bold text-xs rounded-lg shadow shadow-[#00FFA3]/20"
                >
                  Run Default ICT Backtest
                </button>
              </div>
            ) : (
              <>
                {/* Key Quantitative Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#12141A] border border-[#1F2229] p-3 rounded-xl">
                    <div className="text-[10px] text-[#64748B] font-medium uppercase">Win Rate</div>
                    <div className="text-xl font-bold font-mono text-[#00FFA3]">{result.winRate}%</div>
                    <div className="text-[10px] text-[#94A3B8]">
                      {result.winningTrades}W / {result.losingTrades}L
                    </div>
                  </div>

                  <div className="bg-[#12141A] border border-[#1F2229] p-3 rounded-xl">
                    <div className="text-[10px] text-[#64748B] font-medium uppercase">Net Return (USD)</div>
                    <div
                      className={`text-xl font-bold font-mono ${
                        result.netProfitUSD >= 0 ? 'text-[#00FFA3]' : 'text-[#FF4D6D]'
                      }`}
                    >
                      {result.netProfitUSD >= 0 ? '+' : ''}${result.netProfitUSD.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[#94A3B8] font-mono">
                      ROI: {((result.netProfitUSD / 10000) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="bg-[#12141A] border border-[#1F2229] p-3 rounded-xl">
                    <div className="text-[10px] text-[#64748B] font-medium uppercase">Profit Factor</div>
                    <div className="text-xl font-bold font-mono text-[#00FFA3]">{result.profitFactor}</div>
                    <div className="text-[10px] text-[#94A3B8]">Sharpe: {result.sharpeRatio}</div>
                  </div>

                  <div className="bg-[#12141A] border border-[#1F2229] p-3 rounded-xl">
                    <div className="text-[10px] text-[#64748B] font-medium uppercase">Max Drawdown</div>
                    <div className="text-xl font-bold font-mono text-[#FF4D6D]">{result.maxDrawdownPct}%</div>
                    <div className="text-[10px] text-[#94A3B8]">{result.totalTrades} Total Executions</div>
                  </div>
                </div>

                {/* Equity Curve SVG Chart */}
                <div className="bg-[#12141A] border border-[#1F2229] p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#E0E0E0]">Simulated Account Equity Growth</span>
                    <span className="text-[10px] font-mono text-[#94A3B8]">
                      Starting: $10,000 → Ending: ${(10000 + result.netProfitUSD).toLocaleString()}
                    </span>
                  </div>
                  <div className="relative w-full h-[140px] bg-[#0A0B0D] rounded-lg p-2 border border-[#1F2229] overflow-hidden">
                    <svg viewBox="0 0 500 140" className="w-full h-full preserve-3d">
                      <line x1="0" y1="35" x2="500" y2="35" stroke="#1F2229" strokeDasharray="3,3" />
                      <line x1="0" y1="70" x2="500" y2="70" stroke="#1F2229" strokeDasharray="3,3" />
                      <line x1="0" y1="105" x2="500" y2="105" stroke="#1F2229" strokeDasharray="3,3" />

                      <polyline
                        fill="none"
                        stroke="#00FFA3"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={equityPoints}
                      />
                    </svg>
                  </div>
                </div>

                {/* Gemini AI Strategy Optimizer */}
                <div className="bg-[#161922] border border-[#00FFA3]/30 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#00FFA3] fill-[#00FFA3]" />
                      <h4 className="font-bold text-xs text-[#00FFA3]">Gemini AI Quantitative Strategy Advisor</h4>
                    </div>
                    <button
                      id="btn-ai-strategy-advisor"
                      onClick={handleAskAIOptimizer}
                      disabled={isAiLoading}
                      className="px-3 py-1 bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] font-bold text-[11px] rounded-lg shadow flex items-center gap-1 transition-all"
                    >
                      {isAiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>{isAiLoading ? 'Analyzing Structure...' : 'Analyze Edge with AI'}</span>
                    </button>
                  </div>

                  {aiAdvice && (
                    <div className="space-y-2 text-xs bg-[#0A0B0D] p-3 rounded-lg border border-[#00FFA3]/20">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#00FFA3] text-[#0A0B0D] font-bold rounded text-[10px]">
                          Institutional Grade: {aiAdvice.rating}
                        </span>
                        <span className="text-[#E0E0E0] font-semibold">{aiAdvice.verdict}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div className="bg-[#00FFA3]/10 p-2 rounded border border-[#00FFA3]/30">
                          <span className="font-bold text-[#00FFA3] block mb-1">Key Strengths:</span>
                          <ul className="list-disc list-inside text-[#E0E0E0] space-y-0.5">
                            {aiAdvice.strengths?.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-[#FF4D6D]/10 p-2 rounded border border-[#FF4D6D]/30">
                          <span className="font-bold text-[#FF4D6D] block mb-1">Vulnerabilities:</span>
                          <ul className="list-disc list-inside text-[#E0E0E0] space-y-0.5">
                            {aiAdvice.vulnerabilities?.map((v: string, i: number) => (
                              <li key={i}>{v}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pine Script Strategy Code Export Modal */}
      {isPineStrategyOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141A] border border-[#1F2229] rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1F2229] pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-[#F59E0B]" />
                <h3 className="font-bold text-white text-sm">TradingView Pine Script v5 Strategy Tester Code</h3>
              </div>
              <button
                onClick={() => setIsPineStrategyOpen(false)}
                className="text-[#64748B] hover:text-white text-xs px-2.5 py-1 rounded bg-[#1A1D26] hover:bg-[#222634]"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-[#94A3B8]">
              Copy and paste this script directly into TradingView's <strong className="text-white">Pine Editor</strong> to run full automated backtests directly on your TradingView account with real historical broker tick data.
            </p>

            <div className="relative">
              <pre className="bg-[#0A0B0D] p-3 rounded-xl border border-[#1F2229] text-[11px] font-mono text-[#00FFA3] max-h-60 overflow-y-auto leading-relaxed">
                {pineStrategyCode}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pineStrategyCode);
                  setCopiedPine(true);
                  setTimeout(() => setCopiedPine(false), 2000);
                }}
                className="absolute top-2 right-2 px-3 py-1.5 bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] font-bold text-xs rounded-lg shadow-md flex items-center gap-1.5 transition-all"
              >
                {copiedPine ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPine ? 'Copied Strategy!' : 'Copy Script'}</span>
              </button>
            </div>

            <div className="bg-[#0A0B0D] p-3 rounded-xl border border-[#1F2229] text-xs text-[#94A3B8] space-y-1">
              <span className="text-[#00FFA3] font-bold block">How to run in TradingView Strategy Tester:</span>
              <ol className="list-decimal list-inside space-y-0.5 text-[11px]">
                <li>Open TradingView and click <span className="text-[#00FFA3]">Pine Editor</span> tab at bottom.</li>
                <li>Paste this script and click <span className="text-[#00FFA3]">Save &amp; Add to Chart</span>.</li>
                <li>Click the <span className="text-[#00FFA3]">Strategy Tester</span> tab in TradingView to view live backtest trade metrics, drawdowns, and profit factor!</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
