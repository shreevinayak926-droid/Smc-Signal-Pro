import { Candle, FairValueGap, TimeFrame } from '../../types';

/**
 * Custom Fair Value Gap (FVG) Detector
 * 
 * Implements 3-candle imbalance detection with dynamic movement extension:
 * - Bullish FVG: Candle 1 Low > Candle 3 High (Candle 2 bullish displacement)
 * - Bearish FVG: Candle 1 High < Candle 3 Low (Candle 2 bearish displacement)
 * - Movement logic: Continues horizontally along the same momentum movement
 *   until that movement ends or reverses.
 */
export class FVGDetector {
  /**
   * Detects all Fair Value Gaps in a given candle sequence with continuous movement tracking
   */
  public static detectFVGs(candles: Candle[], timeframe: TimeFrame): FairValueGap[] {
    const fvgs: FairValueGap[] = [];
    if (!candles || candles.length < 3) return fvgs;

    // Track existing identified 3-candle start indices to avoid duplicates
    const detectedPatterns = new Set<string>();

    for (let i = 0; i <= candles.length - 3; i++) {
      const c1Index = i;
      const c2Index = i + 1;
      const c3Index = i + 2;

      const c1 = candles[c1Index];
      const c2 = candles[c2Index];
      const c3 = candles[c3Index];

      const patternKey = `${c1.time}_${c2.time}_${c3.time}`;
      if (detectedPatterns.has(patternKey)) continue;

      // 1. BULLISH FVG:
      // - Candle 2 represents bullish displacement / momentum
      // - Candle 1 Low > Candle 3 High
      const isBullishDisplacement = c2.close > c2.open;
      const isBullishGap = c1.low > c3.high;

      if (isBullishDisplacement && isBullishGap) {
        detectedPatterns.add(patternKey);
        const top = c1.low;
        const bottom = c3.high;
        const midline = (top + bottom) / 2;

        // Dynamic Movement Extension Logic:
        // Start = Candle 1 (c1Index)
        // Extend box to the right along the same bullish momentum.
        // Stop extending when the bullish movement ends or reverses.
        let endIndex = c3Index;
        let isMovementActive = true;
        let filled = false;

        for (let j = c3Index + 1; j < candles.length; j++) {
          const currentCandle = candles[j];
          const prevCandle = candles[j - 1];

          // Check if gap is mitigated / filled (price penetrates through the gap)
          if (currentCandle.low <= bottom) {
            filled = true;
          }

          // Bullish movement ending / reversal conditions:
          // 1. Candle closes below previous candle's low (break of immediate momentum)
          // 2. Or candle closes below the FVG top with strong bearish body
          // 3. Or a clear bearish reversal candle occurs (bearish body > average range)
          const closesBelowPrevLow = currentCandle.close < prevCandle.low;
          const isBearishReversal = currentCandle.close < currentCandle.open && 
                                    (currentCandle.open - currentCandle.close) > (prevCandle.high - prevCandle.low) * 0.8;
          const breaksBelowGap = currentCandle.close < bottom;

          if (closesBelowPrevLow || isBearishReversal || breaksBelowGap) {
            // Movement ends / reverses at this candle
            endIndex = j;
            isMovementActive = false;
            break;
          } else {
            // Bullish momentum continues -> extend box
            endIndex = j;
          }
        }

        fvgs.push({
          id: `fvg-bull-${c1Index}-${c1.time}`,
          type: 'BULLISH',
          top,
          bottom,
          midline,
          startIndex: c1Index,
          endIndex: isMovementActive ? candles.length - 1 : endIndex,
          candle1Index: c1Index,
          candle2Index: c2Index,
          candle3Index: c3Index,
          isActive: isMovementActive,
          filled,
          timeframe,
        });
      }

      // 2. BEARISH FVG:
      // - Candle 2 represents bearish displacement / momentum
      // - Candle 1 High < Candle 3 Low
      const isBearishDisplacement = c2.close < c2.open;
      const isBearishGap = c1.high < c3.low;

      if (isBearishDisplacement && isBearishGap) {
        detectedPatterns.add(patternKey);
        const top = c3.low;
        const bottom = c1.high;
        const midline = (top + bottom) / 2;

        // Dynamic Movement Extension Logic:
        // Start = Candle 1 (c1Index)
        // Extend box to the right along the same bearish momentum.
        // Stop extending when the bearish movement ends or reverses.
        let endIndex = c3Index;
        let isMovementActive = true;
        let filled = false;

        for (let j = c3Index + 1; j < candles.length; j++) {
          const currentCandle = candles[j];
          const prevCandle = candles[j - 1];

          // Check if gap is mitigated / filled
          if (currentCandle.high >= top) {
            filled = true;
          }

          // Bearish movement ending / reversal conditions:
          // 1. Candle closes above previous candle's high (break of immediate downward momentum)
          // 2. Or candle closes above the FVG bottom with strong bullish body
          // 3. Or a clear bullish reversal candle occurs
          const closesAbovePrevHigh = currentCandle.close > prevCandle.high;
          const isBullishReversal = currentCandle.close > currentCandle.open && 
                                    (currentCandle.close - currentCandle.open) > (prevCandle.high - prevCandle.low) * 0.8;
          const breaksAboveGap = currentCandle.close > top;

          if (closesAbovePrevHigh || isBullishReversal || breaksAboveGap) {
            // Movement ends / reverses at this candle
            endIndex = j;
            isMovementActive = false;
            break;
          } else {
            // Bearish momentum continues -> extend box
            endIndex = j;
          }
        }

        fvgs.push({
          id: `fvg-bear-${c1Index}-${c1.time}`,
          type: 'BEARISH',
          top,
          bottom,
          midline,
          startIndex: c1Index,
          endIndex: isMovementActive ? candles.length - 1 : endIndex,
          candle1Index: c1Index,
          candle2Index: c2Index,
          candle3Index: c3Index,
          isActive: isMovementActive,
          filled,
          timeframe,
        });
      }
    }

    return fvgs;
  }
}
