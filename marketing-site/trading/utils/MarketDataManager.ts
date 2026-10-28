import { ForexPair, TimeFrame, Candle, OrderBlock, FairValueGap, StructureBreak, LiquidityLevel, MarketStructure, PairTickerInfo } from '../types';
import { calculateSMCElements, generateCandleHistory } from './forexData';

export interface InstrumentConfig {
  pair: ForexPair;
  name: string;
  tradingViewSymbol: string;
  digits: number;
  pipSize: number;
  spread: number;
  contractSize: number;
  category: 'Metals' | 'Major FX' | 'Crypto' | 'Indices';
}

export const INSTRUMENT_CONFIGS: Record<ForexPair, InstrumentConfig> = {
  XAUUSD: {
    pair: 'XAUUSD',
    name: 'Gold / US Dollar',
    tradingViewSymbol: 'OANDA:XAUUSD',
    digits: 2,
    pipSize: 0.10,
    spread: 0.15,
    contractSize: 100,
    category: 'Metals',
  },
  EURUSD: {
    pair: 'EURUSD',
    name: 'Euro / US Dollar',
    tradingViewSymbol: 'FX:EURUSD',
    digits: 5,
    pipSize: 0.0001,
    spread: 0.00008,
    contractSize: 100000,
    category: 'Major FX',
  },
  GBPUSD: {
    pair: 'GBPUSD',
    name: 'British Pound / US Dollar',
    tradingViewSymbol: 'FX:GBPUSD',
    digits: 5,
    pipSize: 0.0001,
    spread: 0.00012,
    contractSize: 100000,
    category: 'Major FX',
  },
  USDJPY: {
    pair: 'USDJPY',
    name: 'US Dollar / Japanese Yen',
    tradingViewSymbol: 'FX:USDJPY',
    digits: 3,
    pipSize: 0.01,
    spread: 0.012,
    contractSize: 100000,
    category: 'Major FX',
  },
  BTCUSD: {
    pair: 'BTCUSD',
    name: 'Bitcoin / US Dollar',
    tradingViewSymbol: 'BINANCE:BTCUSDT',
    digits: 2,
    pipSize: 1.00,
    spread: 5.00,
    contractSize: 1,
    category: 'Crypto',
  },
  US30: {
    pair: 'US30',
    name: 'Dow Jones Industrial 30',
    tradingViewSymbol: 'FOREXCOM:DJI',
    digits: 2,
    pipSize: 1.00,
    spread: 2.50,
    contractSize: 10,
    category: 'Indices',
  },
};

export type ConnectionStatus = 'CONNECTED' | 'SYNCING' | 'STALE' | 'DISCONNECTED';

export interface MarketState {
  pair: ForexPair;
  tradingViewSymbol: string;
  currentPrice: number;
  mid: number;
  bid: number;
  ask: number;
  priceType: 'mid' | 'bid' | 'ask' | 'last';
  change24h: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  timestamp: number;
  timeframe: TimeFrame;
  candles: Candle[];
  orderBlocks: OrderBlock[];
  fairValueGaps: FairValueGap[];
  structureBreaks: StructureBreak[];
  liquidityLevels: LiquidityLevel[];
  marketStructure: MarketStructure;
  status: ConnectionStatus;
  dataSource: string;
  aiPrice: number | null;
  aiTimestamp: number | null;
  aiSetup: any | null;
}

export interface PriceDebugComparison {
  pair: ForexPair;
  tradingViewSymbol: string;
  dataSource: string;
  currentPrice: number;
  tickerPrice: number;
  chartPrice: number;
  aiPrice: number | null;
  timestamp: number;
  timeframe: TimeFrame;
  status: ConnectionStatus;
  diffAITicker: number;
  diffAIChart: number;
  diffTickerChart: number;
  maxDiffPct: number;
  hasMismatch: boolean;
}

type MarketListener = (states: Record<ForexPair, MarketState>) => void;

class MarketDataManagerService {
  private states: Record<ForexPair, MarketState>;
  private listeners: Set<MarketListener> = new Set();
  private isInitialized = false;

  constructor() {
    const pairs: ForexPair[] = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD', 'US30'];
    const initialStates = {} as Record<ForexPair, MarketState>;

    pairs.forEach((p) => {
      const cfg = INSTRUMENT_CONFIGS[p];
      initialStates[p] = {
        pair: p,
        tradingViewSymbol: cfg.tradingViewSymbol,
        currentPrice: 0,
        mid: 0,
        bid: 0,
        ask: 0,
        priceType: 'mid',
        change24h: 0,
        changePercent: 0,
        high24h: 0,
        low24h: 0,
        timestamp: Date.now(),
        timeframe: '15m',
        candles: [],
        orderBlocks: [],
        fairValueGaps: [],
        structureBreaks: [],
        liquidityLevels: [],
        marketStructure: 'BULLISH',
        status: 'SYNCING',
        dataSource: 'Centralized Market Feed (OANDA Compatible Spot Mid)',
        aiPrice: null,
        aiTimestamp: null,
        aiSetup: null,
      };
    });

    this.states = initialStates;
  }

  public getStates(): Record<ForexPair, MarketState> {
    this.checkStaleData();
    return this.states;
  }

  public getState(pair: ForexPair): MarketState {
    this.checkStaleData();
    return this.states[pair];
  }

  private checkStaleData() {
    const now = Date.now();
    (Object.keys(this.states) as ForexPair[]).forEach((p) => {
      const s = this.states[p];
      if (s.timestamp) {
        const elapsed = now - s.timestamp;
        if (elapsed > 30000) {
          s.status = 'DISCONNECTED';
        } else if (elapsed > 12000) {
          s.status = 'STALE';
        }
      }
    });
  }

  public setConnectionStatus(pair: ForexPair, status: ConnectionStatus) {
    if (this.states[pair]) {
      this.states[pair].status = status;
      this.notifyListeners();
    }
  }

  public updateLivePrices(prices: Record<ForexPair, number>, tickers?: Record<ForexPair, PairTickerInfo>, source?: string) {
    const now = Date.now();
    let updated = false;

    (Object.keys(prices) as ForexPair[]).forEach((pair) => {
      const p = prices[pair];
      if (p && p > 0) {
        const state = this.states[pair];
        const cfg = INSTRUMENT_CONFIGS[pair];
        const halfSpread = (cfg.spread * cfg.pipSize) / 2;

        // Strictly update live price state (independent of candle bar OHLC)
        state.currentPrice = p;
        state.mid = p;
        state.bid = Number((p - halfSpread).toFixed(cfg.digits));
        state.ask = Number((p + halfSpread).toFixed(cfg.digits));
        state.priceType = 'mid';
        state.timestamp = now;
        state.status = 'CONNECTED';
        if (source) state.dataSource = source;

        if (tickers && tickers[pair]) {
          const t = tickers[pair];
          state.change24h = t.change24h;
          state.changePercent = t.changePercent;
          state.high24h = t.high24h;
          state.low24h = t.low24h;
        }

        updated = true;
      }
    });

    if (updated) {
      this.isInitialized = true;
      this.notifyListeners();
    }
  }

  public setCandles(pair: ForexPair, timeframe: TimeFrame, candles: Candle[]) {
    const state = this.states[pair];
    if (!state) return;

    state.timeframe = timeframe;
    state.candles = candles;

    if (candles.length > 0) {
      const latestCandle = candles[candles.length - 1];
      if (!state.currentPrice || state.currentPrice === 0) {
        state.currentPrice = latestCandle.close;
      }
      state.timestamp = latestCandle.time || Date.now();
    }

    // Calculate SMC Elements strictly from this unified candle feed
    const smc = calculateSMCElements(candles, timeframe);
    state.orderBlocks = smc.orderBlocks;
    state.fairValueGaps = smc.fairValueGaps;
    state.structureBreaks = smc.structureBreaks;
    state.liquidityLevels = smc.liquidityLevels;
    state.marketStructure = smc.marketStructure;

    this.notifyListeners();
  }

  public recordAIScan(pair: ForexPair, price: number, setup: any) {
    const state = this.states[pair];
    if (!state) return;

    state.aiPrice = price;
    state.aiTimestamp = Date.now();
    state.aiSetup = setup;
    this.notifyListeners();
  }

  public invalidateAIScanIfStale(pair: ForexPair, currentLivePrice: number): boolean {
    const state = this.states[pair];
    if (!state || !state.aiPrice) return false;

    const priceDiffPct = Math.abs(currentLivePrice - state.aiPrice) / state.aiPrice * 100;
    const isOld = state.aiTimestamp ? Date.now() - state.aiTimestamp > 5 * 60 * 1000 : true;

    if (priceDiffPct > 0.4 || isOld) {
      // Invalidate stale AI setup
      state.aiSetup = null;
      this.notifyListeners();
      return true;
    }
    return false;
  }

  public getDebugComparison(pair: ForexPair): PriceDebugComparison {
    const state = this.states[pair];
    const tickerPrice = state.currentPrice;
    const chartPrice = state.candles.length > 0 ? state.candles[state.candles.length - 1].close : tickerPrice;
    const aiPrice = state.aiPrice || null;

    const diffTickerChart = Math.abs(tickerPrice - chartPrice);
    const diffAITicker = aiPrice ? Math.abs(aiPrice - tickerPrice) : 0;
    const diffAIChart = aiPrice ? Math.abs(aiPrice - chartPrice) : 0;

    const base = tickerPrice > 0 ? tickerPrice : 1;
    const diffTickerChartPct = (diffTickerChart / base) * 100;
    const diffAITickerPct = aiPrice ? (diffAITicker / base) * 100 : 0;
    const diffAIChartPct = aiPrice ? (diffAIChart / base) * 100 : 0;

    const maxDiffPct = Math.max(diffTickerChartPct, diffAITickerPct, diffAIChartPct);
    const hasMismatch = maxDiffPct > 0.3; // Alert if difference exceeds 0.3%

    return {
      pair,
      tradingViewSymbol: state.tradingViewSymbol,
      dataSource: state.dataSource,
      currentPrice: tickerPrice,
      tickerPrice,
      chartPrice,
      aiPrice,
      timestamp: state.timestamp,
      timeframe: state.timeframe,
      status: state.status,
      diffAITicker,
      diffAIChart,
      diffTickerChart,
      maxDiffPct,
      hasMismatch,
    };
  }

  public subscribe(listener: MarketListener): () => void {
    this.listeners.add(listener);
    // Immediate callback with current snapshot
    listener(this.states);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener({ ...this.states });
      } catch (err) {
        console.error('MarketDataManager listener error:', err);
      }
    });
  }
}

export const MarketDataManager = new MarketDataManagerService();
