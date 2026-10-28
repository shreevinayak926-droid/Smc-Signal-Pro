import { Candle, StructureBreak, MarketStructure } from '../../types';
import { MarketStructureManager } from './MarketStructureManager';

/**
 * Custom CHoCH (Change of Character) Detector
 * 
 * Strict Two-Candle Close Structure Break Rules:
 * 
 * 1. Bullish Structure -> Bearish CHoCH:
 *    - Market is in BULLISH structure.
 *    - Identifies most recent swing Low of bullish structure.
 *    - Candle 1 Close < Last Bullish Structure Low
 *    - AND Candle 2 Close < Last Bullish Structure Low
 *    - AND Candle 2 Close < Candle 1 Close
 *    - Confirms Bearish CHoCH at Candle 2, updates structure state to BEARISH.
 * 
 * 2. Bearish Structure -> Bullish CHoCH:
 *    - Market is in BEARISH structure.
 *    - Identifies most recent swing High of bearish structure.
 *    - Candle 1 Close > Last Bearish Structure High
 *    - AND Candle 2 Close > Last Bearish Structure High
 *    - AND Candle 2 Close > Candle 1 Close
 *    - Confirms Bullish CHoCH at Candle 2, updates structure state to BULLISH.
 */
export class CHoCHDetector {
  /**
   * Detects all confirmed CHoCH events across the candle history
   */
  public static detectCHoCH(candles: Candle[]): {
    structureBreaks: StructureBreak[];
    currentStructure: MarketStructure;
  } {
    const breaks: StructureBreak[] = [];
    if (!candles || candles.length < 6) {
      return { structureBreaks: breaks, currentStructure: 'BULLISH' };
    }

    const structureManager = new MarketStructureManager('BULLISH');
    const { swingHighs, swingLows } = structureManager.identifySwingPoints(candles, 2);

    // Determine initial structure based on early price action
    if (candles[0] && candles[Math.min(5, candles.length - 1)]) {
      const initialUp = candles[Math.min(5, candles.length - 1)].close >= candles[0].open;
      structureManager.setStructure(initialUp ? 'BULLISH' : 'BEARISH');
    }

    // Set to avoid duplicate CHoCH signals from the exact same swing level
    const brokenSwingKeys = new Set<string>();

    // Process candles sequentially to maintain authentic chronological structure state
    for (let i = 4; i < candles.length; i++) {
      const c1Index = i - 1;
      const c2Index = i;
      const c1 = candles[c1Index];
      const c2 = candles[c2Index];
      const currentStructure = structureManager.getStructure();

      if (currentStructure === 'BULLISH') {
        // Find most recent swing Low established before candle 1
        const relevantSwingLows = swingLows.filter((sl) => sl.index < c1Index);
        if (relevantSwingLows.length > 0) {
          const lastBullishLow = relevantSwingLows[relevantSwingLows.length - 1];
          const swingKey = `low-${lastBullishLow.index}-${lastBullishLow.price}`;

          if (!brokenSwingKeys.has(swingKey)) {
            // Check Bearish CHoCH conditions:
            // 1. Candle 1 Close < Last Bullish Structure Low
            // 2. Candle 2 Close < Last Bullish Structure Low
            // 3. Candle 2 Close < Candle 1 Close (continuing downward confirmation)
            const c1Breaks = c1.close < lastBullishLow.price;
            const c2Breaks = c2.close < lastBullishLow.price;
            const c2Continues = c2.close < c1.close;

            if (c1Breaks && c2Breaks && c2Continues) {
              brokenSwingKeys.add(swingKey);

              breaks.push({
                id: `choch-bearish-${c2Index}-${c2.time}`,
                type: 'CHoCH',
                direction: 'BEARISH',
                price: lastBullishLow.price,
                index: c2Index,
                label: '-CHoCH (Bearish Character Change)',
                brokenSwingIndex: lastBullishLow.index,
                brokenLevel: lastBullishLow.price,
                candle1Index: c1Index,
                candle2Index: c2Index,
                candle1Close: c1.close,
                candle2Close: c2.close,
                confirmed: true,
              });

              // Update market structure state to BEARISH
              structureManager.setStructure('BEARISH');
            }
          }
        }
      } else {
        // Market is in BEARISH structure -> Check for Bullish CHoCH
        // Find most recent swing High established before candle 1
        const relevantSwingHighs = swingHighs.filter((sh) => sh.index < c1Index);
        if (relevantSwingHighs.length > 0) {
          const lastBearishHigh = relevantSwingHighs[relevantSwingHighs.length - 1];
          const swingKey = `high-${lastBearishHigh.index}-${lastBearishHigh.price}`;

          if (!brokenSwingKeys.has(swingKey)) {
            // Check Bullish CHoCH conditions:
            // 1. Candle 1 Close > Last Bearish Structure High
            // 2. Candle 2 Close > Last Bearish Structure High
            // 3. Candle 2 Close > Candle 1 Close (continuing upward confirmation)
            const c1Breaks = c1.close > lastBearishHigh.price;
            const c2Breaks = c2.close > lastBearishHigh.price;
            const c2Continues = c2.close > c1.close;

            if (c1Breaks && c2Breaks && c2Continues) {
              brokenSwingKeys.add(swingKey);

              breaks.push({
                id: `choch-bullish-${c2Index}-${c2.time}`,
                type: 'CHoCH',
                direction: 'BULLISH',
                price: lastBearishHigh.price,
                index: c2Index,
                label: '+CHoCH (Bullish Character Change)',
                brokenSwingIndex: lastBearishHigh.index,
                brokenLevel: lastBearishHigh.price,
                candle1Index: c1Index,
                candle2Index: c2Index,
                candle1Close: c1.close,
                candle2Close: c2.close,
                confirmed: true,
              });

              // Update market structure state to BULLISH
              structureManager.setStructure('BULLISH');
            }
          }
        }
      }
    }

    // Also detect standard BOS (Break of Structure) when trend continues in the same direction
    for (let s = 1; s < swingHighs.length; s++) {
      const prevHigh = swingHighs[s - 1];
      const currHigh = swingHighs[s];
      if (currHigh.price > prevHigh.price) {
        breaks.push({
          id: `bos-high-${currHigh.index}`,
          type: 'BOS',
          direction: 'BULLISH',
          price: prevHigh.price,
          index: currHigh.index,
          label: '+BOS (Structure Continuation)',
          brokenSwingIndex: prevHigh.index,
          brokenLevel: prevHigh.price,
        });
      }
    }

    for (let s = 1; s < swingLows.length; s++) {
      const prevLow = swingLows[s - 1];
      const currLow = swingLows[s];
      if (currLow.price < prevLow.price) {
        breaks.push({
          id: `bos-low-${currLow.index}`,
          type: 'BOS',
          direction: 'BEARISH',
          price: prevLow.price,
          index: currLow.index,
          label: '-BOS (Structure Continuation)',
          brokenSwingIndex: prevLow.index,
          brokenLevel: prevLow.price,
        });
      }
    }

    return {
      structureBreaks: breaks,
      currentStructure: structureManager.getStructure(),
    };
  }
}
