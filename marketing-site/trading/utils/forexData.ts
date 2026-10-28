import { Candle, ForexPair, TimeFrame, OrderBlock, FairValueGap, StructureBreak, LiquidityLevel, MarketStructure } from '../types';
import { FVGDetector } from './smc/FVGDetector';
import { CHoCHDetector } from './smc/CHoCHDetector';

export const PAIR_METADATA: Record<string, {
  name: string;
  basePrice: number;
  pipSize: number;
  digits: number;
  spread: number;
  contractSize: number;
  category: 'Metals' | 'Major FX' | 'Crypto' | 'Indices';
}> = {
  XAUUSD: {
    name: 'Gold / US Dollar',
    basePrice: 4697.70,
    pipSize: 0.10,
    digits: 2,
    spread: 0.15,
    contractSize: 100, // 1 lot = 100 oz
    category: 'Metals',
  },
  EURUSD: {
    name: 'Euro / US Dollar',
    basePrice: 1.16798,
    pipSize: 0.0001,
    digits: 5,
    spread: 0.00008,
    contractSize: 100000,
    category: 'Major FX',
  },
  GBPUSD: {
    name: 'British Pound / US Dollar',
    basePrice: 1.36436,
    pipSize: 0.0001,
    digits: 5,
    spread: 0.00012,
    contractSize: 100000,
    category: 'Major FX',
  },
  USDJPY: {
    name: 'US Dollar / Japanese Yen',
    basePrice: 158.906,
    pipSize: 0.01,
    digits: 3,
    spread: 0.012,
    contractSize: 100000,
    category: 'Major FX',
  },
  AUDUSD: {
    name: 'Australian Dollar / US Dollar',
    basePrice: 0.65420,
    pipSize: 0.0001,
    digits: 5,
    spread: 0.00014,
    contractSize: 100000,
    category: 'Major FX',
  },
  USDCAD: {
    name: 'US Dollar / Canadian Dollar',
    basePrice: 1.37850,
    pipSize: 0.0001,
    digits: 5,
    spread: 0.00015,
    contractSize: 100000,
    category: 'Major FX',
  },
  USDCHF: {
    name: 'US Dollar / Swiss Franc',
    basePrice: 0.89240,
    pipSize: 0.0001,
    digits: 5,
    spread: 0.00015,
    contractSize: 100000,
    category: 'Major FX',
  },
  NZDUSD: {
    name: 'New Zealand Dollar / US Dollar',
    basePrice: 0.60120,
    pipSize: 0.0001,
    digits: 5,
    spread: 0.00018,
    contractSize: 100000,
    category: 'Major FX',
  },
  EURJPY: {
    name: 'Euro / Japanese Yen',
    basePrice: 164.250,
    pipSize: 0.01,
    digits: 3,
    spread: 0.015,
    contractSize: 100000,
    category: 'Major FX',
  },
  GBPJPY: {
    name: 'British Pound / Japanese Yen',
    basePrice: 195.800,
    pipSize: 0.01,
    digits: 3,
    spread: 0.018,
    contractSize: 100000,
    category: 'Major FX',
  },
  BTCUSD: {
    name: 'Bitcoin / US Dollar',
    basePrice: 77106.92,
    pipSize: 1.00,
    digits: 2,
    spread: 5.00,
    contractSize: 1,
    category: 'Crypto',
  },
  ETHUSD: {
    name: 'Ethereum / US Dollar',
    basePrice: 3450.50,
    pipSize: 0.10,
    digits: 2,
    spread: 0.50,
    contractSize: 1,
    category: 'Crypto',
  },
  US30: {
    name: 'Dow Jones Industrial 30',
    basePrice: 53277.01,
    pipSize: 1.00,
    digits: 2,
    spread: 2.50,
    contractSize: 10,
    category: 'Indices',
  },
  NAS100: {
    name: 'Nasdaq 100 Index',
    basePrice: 19840.20,
    pipSize: 1.00,
    digits: 2,
    spread: 1.50,
    contractSize: 10,
    category: 'Indices',
  },
};

// Generate realistic candle series with SMC structure anchored to real live price
export function generateCandleHistory(pair: ForexPair, timeframe: TimeFrame, count: number = 80, customBasePrice?: number): Candle[] {
  const meta = PAIR_METADATA[pair] || PAIR_METADATA['EURUSD'];
  const targetBase = customBasePrice && customBasePrice > 0 ? customBasePrice : meta.basePrice;
  const candles: Candle[] = [];
  const now = Date.now();
  
  const tfMinutes: Record<TimeFrame, number> = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '1H': 60,
    '4H': 240,
    '1D': 1440,
  };
  
  const intervalMs = tfMinutes[timeframe] * 60 * 1000;
  let currentPrice = targetBase * (1 + (Math.random() - 0.5) * 0.002);
  
  // Create waves to simulate institutional trends & liquidity sweeps
  let trend: 'UP' | 'DOWN' = 'UP';
  let trendCount = 0;
  
  for (let i = count - 1; i >= 0; i--) {
    const time = now - i * intervalMs;
    
    // Switch trend periodically for market structure shifts (MSS)
    trendCount++;
    if (trendCount > 12 + Math.floor(Math.random() * 8)) {
      trend = trend === 'UP' ? 'DOWN' : 'UP';
      trendCount = 0;
    }
    
    const volatility = targetBase * (timeframe === '1m' ? 0.0006 : timeframe === '5m' ? 0.0012 : timeframe === '15m' ? 0.0022 : 0.004);
    const bias = trend === 'UP' ? 0.0003 : -0.0003;
    
    const delta = (Math.random() - 0.48 + bias) * volatility;
    const open = currentPrice;
    let close = open + delta;
    
    // Occasional aggressive institutional displacement candle
    const isDisplacement = i % 14 === 0;
    if (isDisplacement) {
      close = open + (trend === 'UP' ? 1.8 : -1.8) * volatility;
    }
    
    const high = Math.max(open, close) + Math.random() * volatility * 0.6;
    const low = Math.min(open, close) - Math.random() * volatility * 0.6;
    const volume = Math.floor(200 + Math.random() * 800 + (isDisplacement ? 1200 : 0));
    
    candles.push({
      time,
      open: Number(open.toFixed(meta.digits)),
      high: Number(high.toFixed(meta.digits)),
      low: Number(low.toFixed(meta.digits)),
      close: Number(close.toFixed(meta.digits)),
      volume,
    });
    
    currentPrice = close;
  }
  
  return candles;
}

// Compute Smart Money Concepts (SMC) markers: Order Blocks, FVGs, BOS/CHoCH, Liquidity
export function calculateSMCElements(candles: Candle[], timeframe: TimeFrame): {
  orderBlocks: OrderBlock[];
  fairValueGaps: FairValueGap[];
  structureBreaks: StructureBreak[];
  liquidityLevels: LiquidityLevel[];
  marketStructure: MarketStructure;
} {
  const orderBlocks: OrderBlock[] = [];
  const liquidityLevels: LiquidityLevel[] = [];

  if (candles.length < 5) {
    return { orderBlocks, fairValueGaps: [], structureBreaks: [], liquidityLevels, marketStructure: 'BULLISH' };
  }

  // 1. Modular FVG Detection with dynamic movement extension logic
  const fairValueGaps = FVGDetector.detectFVGs(candles, timeframe);

  // 2. Modular CHoCH Detection with strict 2-candle close rule & MarketStructureManager
  const { structureBreaks, currentStructure } = CHoCHDetector.detectCHoCH(candles);

  // 3. Detect Order Blocks (The last opposing candle before an aggressive displacement)
  for (let i = 2; i < candles.length - 2; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const next1 = candles[i + 1];
    const next2 = candles[i + 2];

    // Bullish OB: Bearish candle followed by strong upward impulse that breaks previous high
    const isStrongUpDisplacement = (next1.close - next1.open > (curr.high - curr.low) * 1.3) ||
                                  (next2.close - next2.open > (curr.high - curr.low) * 1.3);
    if (curr.close < curr.open && isStrongUpDisplacement) {
      let mitigated = false;
      for (let k = i + 2; k < candles.length; k++) {
        if (candles[k].low <= curr.low) {
          mitigated = true;
          break;
        }
      }

      orderBlocks.push({
        id: `ob-bull-${i}`,
        type: 'BULLISH',
        top: Math.max(curr.open, curr.close),
        bottom: curr.low,
        startIndex: i,
        mitigated,
        timeframe,
        strength: (next1.volume > curr.volume * 1.5) ? 'STRONG' : 'MODERATE',
      });
    }

    // Bearish OB: Bullish candle followed by strong downward displacement
    const isStrongDownDisplacement = (next1.open - next1.close > (curr.high - curr.low) * 1.3) ||
                                    (next2.open - next2.close > (curr.high - curr.low) * 1.3);
    if (curr.close > curr.open && isStrongDownDisplacement) {
      let mitigated = false;
      for (let k = i + 2; k < candles.length; k++) {
        if (candles[k].high >= curr.high) {
          mitigated = true;
          break;
        }
      }

      orderBlocks.push({
        id: `ob-bear-${i}`,
        type: 'BEARISH',
        top: curr.high,
        bottom: Math.min(curr.open, curr.close),
        startIndex: i,
        mitigated,
        timeframe,
        strength: (next1.volume > curr.volume * 1.5) ? 'STRONG' : 'MODERATE',
      });
    }
  }

  // 4. Calculate Swing Highs/Lows for Major Liquidity Pools
  const swingHighs: { index: number; price: number }[] = [];
  const swingLows: { index: number; price: number }[] = [];

  for (let i = 2; i < candles.length - 2; i++) {
    const isHigh = candles[i].high > candles[i - 1].high &&
                   candles[i].high > candles[i - 2].high &&
                   candles[i].high > candles[i + 1].high &&
                   candles[i].high > candles[i + 2].high;

    const isLow = candles[i].low < candles[i - 1].low &&
                  candles[i].low < candles[i - 2].low &&
                  candles[i].low < candles[i + 1].low &&
                  candles[i].low < candles[i + 2].low;

    if (isHigh) swingHighs.push({ index: i, price: candles[i].high });
    if (isLow) swingLows.push({ index: i, price: candles[i].low });
  }

  if (swingHighs.length > 0) {
    const highest = swingHighs.reduce((max, h) => h.price > max.price ? h : max, swingHighs[0]);
    liquidityLevels.push({
      id: 'bsl-pool-1',
      type: 'BUY_SIDE',
      price: highest.price,
      swept: candles[candles.length - 1].high >= highest.price,
      label: 'BSL (Buy-Side Liquidity Pool)',
    });
  }

  if (swingLows.length > 0) {
    const lowest = swingLows.reduce((min, l) => l.price < min.price ? l : min, swingLows[0]);
    liquidityLevels.push({
      id: 'ssl-pool-1',
      type: 'SELL_SIDE',
      price: lowest.price,
      swept: candles[candles.length - 1].low <= lowest.price,
      label: 'SSL (Sell-Side Liquidity Pool)',
    });
  }

  return {
    orderBlocks: orderBlocks.slice(-10),
    fairValueGaps: fairValueGaps.slice(-12),
    structureBreaks: structureBreaks.slice(-10),
    liquidityLevels,
    marketStructure: currentStructure,
  };
}

/**
 * Subtle institutional audio chime for order execution / alert notifications
 */
export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio context might be restricted before user gesture — silently ignore
  }
}
