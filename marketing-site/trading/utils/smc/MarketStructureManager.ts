import { Candle, MarketStructure, SwingPoint } from '../../types';

/**
 * MarketStructureManager
 * 
 * Responsible for:
 * 1. Identifying swing Highs and Lows (pivots) across the candle sequence.
 * 2. Maintaining the active market structure state ('BULLISH' | 'BEARISH').
 * 3. Tracking the key structure levels (Last Bullish Swing Low, Last Bearish Swing High).
 */
export class MarketStructureManager {
  private currentStructure: MarketStructure = 'BULLISH';
  private swingHighs: SwingPoint[] = [];
  private swingLows: SwingPoint[] = [];

  constructor(initialStructure: MarketStructure = 'BULLISH') {
    this.currentStructure = initialStructure;
  }

  /**
   * Detects swing highs and lows using a multi-bar fractal lookback.
   * Swing High: candle high is greater than left (lookback) and right (lookback) candle highs.
   * Swing Low: candle low is lower than left (lookback) and right (lookback) candle lows.
   */
  public identifySwingPoints(candles: Candle[], lookback: number = 2): { swingHighs: SwingPoint[]; swingLows: SwingPoint[] } {
    this.swingHighs = [];
    this.swingLows = [];

    if (!candles || candles.length < lookback * 2 + 1) {
      return { swingHighs: this.swingHighs, swingLows: this.swingLows };
    }

    for (let i = lookback; i < candles.length - lookback; i++) {
      const current = candles[i];
      let isHigh = true;
      let isLow = true;

      for (let offset = 1; offset <= lookback; offset++) {
        if (candles[i - offset].high >= current.high || candles[i + offset].high > current.high) {
          isHigh = false;
        }
        if (candles[i - offset].low <= current.low || candles[i + offset].low < current.low) {
          isLow = false;
        }
      }

      if (isHigh) {
        this.swingHighs.push({
          index: i,
          type: 'HIGH',
          price: current.high,
          time: current.time,
        });
      }

      if (isLow) {
        this.swingLows.push({
          index: i,
          type: 'LOW',
          price: current.low,
          time: current.time,
        });
      }
    }

    return { swingHighs: this.swingHighs, swingLows: this.swingLows };
  }

  /**
   * Returns the most recent swing Low prior to a given candle index.
   */
  public getLastSwingLowBefore(index: number): SwingPoint | null {
    const validLows = this.swingLows.filter((sl) => sl.index < index);
    if (validLows.length === 0) return null;
    return validLows[validLows.length - 1];
  }

  /**
   * Returns the most recent swing High prior to a given candle index.
   */
  public getLastSwingHighBefore(index: number): SwingPoint | null {
    const validHighs = this.swingHighs.filter((sh) => sh.index < index);
    if (validHighs.length === 0) return null;
    return validHighs[validHighs.length - 1];
  }

  /**
   * Get current market structure
   */
  public getStructure(): MarketStructure {
    return this.currentStructure;
  }

  /**
   * Set/update market structure
   */
  public setStructure(structure: MarketStructure): void {
    this.currentStructure = structure;
  }
}
