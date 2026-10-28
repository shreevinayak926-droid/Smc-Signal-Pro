import React from 'react';
import { FairValueGap, StructureBreak, Candle } from '../../types';

interface ChartOverlayRendererProps {
  fairValueGaps: FairValueGap[];
  structureBreaks: StructureBreak[];
  visibleCandles: Candle[];
  allCandles: Candle[];
  panOffsetCandles: number;
  showFVG: boolean;
  showBOS: boolean;
  chartPadding: { top: number; right: number; bottom: number; left: number };
  plotWidth: number;
  plotHeight: number;
  candleWidth: number;
  digits: number;
  getX: (indexInVisible: number) => number;
  getY: (price: number) => number;
}

/**
 * ChartOverlayRenderer
 * 
 * Modular SVG overlay component for rendering:
 * 1. Fair Value Gaps (FVG) with dynamic horizontal momentum movement extension
 * 2. Change of Character (CHoCH) structural break lines and 2-candle confirmation badges
 * 3. Break of Structure (BOS) trend continuation markers
 */
export const ChartOverlayRenderer: React.FC<ChartOverlayRendererProps> = ({
  fairValueGaps,
  structureBreaks,
  visibleCandles,
  allCandles,
  panOffsetCandles,
  showFVG,
  showBOS,
  chartPadding,
  plotWidth,
  candleWidth,
  digits,
  getX,
  getY,
}) => {
  const visibleStartGlobalIndex = Math.max(0, allCandles.length - visibleCandles.length - panOffsetCandles);

  return (
    <g className="smc-overlays">
      {/* 1. Fair Value Gaps (FVG) with Dynamic Momentum Movement Extension */}
      {showFVG &&
        fairValueGaps.map((fvg) => {
          const y1 = getY(fvg.top);
          const y2 = getY(fvg.bottom);
          const yTop = Math.min(y1, y2);
          const yBottom = Math.max(y1, y2);
          const boxHeight = Math.max(3, yBottom - yTop);
          const isBullish = fvg.type === 'BULLISH';

          // Convert global candle indices to visible viewport coordinates
          const startVisibleIdx = fvg.startIndex - visibleStartGlobalIndex;
          const endVisibleIdx = (fvg.endIndex ?? allCandles.length - 1) - visibleStartGlobalIndex;

          // If entire FVG is to the left or right of visible viewport, bound appropriately
          let xStart = getX(startVisibleIdx) - candleWidth / 2;
          let xEnd = fvg.isActive
            ? chartPadding.left + plotWidth
            : getX(endVisibleIdx) + candleWidth / 2;

          // Clamping to chart plot bounds
          const minX = chartPadding.left;
          const maxX = chartPadding.left + plotWidth;

          // Skip if completely out of viewport horizontally
          if (xEnd < minX || xStart > maxX) return null;

          const renderX = Math.max(minX, xStart);
          const renderWidth = Math.max(candleWidth * 1.5, Math.min(maxX, xEnd) - renderX);

          const strokeColor = isBullish ? '#00FFA3' : '#FF4D6D';
          const badgeFill = isBullish ? '#064E3B' : '#881337';
          const badgeText = isBullish ? '#6EE7B7' : '#FDA4AF';
          const badgeBorder = isBullish ? '#059669' : '#E11D48';

          return (
            <g key={fvg.id} className="fvg-group">
              {/* FVG Box Area */}
              <rect
                x={renderX}
                y={yTop}
                width={renderWidth}
                height={boxHeight}
                fill={isBullish ? 'url(#bullishFVGGrad)' : 'url(#bearishFVGGrad)'}
                stroke={strokeColor}
                strokeWidth="1"
                strokeDasharray={fvg.isActive ? 'none' : '4,3'}
                rx="2"
                opacity={fvg.filled ? 0.35 : 0.85}
              />

              {/* 50% Mean Threshold (Midline) */}
              <line
                x1={renderX}
                y1={getY(fvg.midline)}
                x2={renderX + renderWidth}
                y2={getY(fvg.midline)}
                stroke={strokeColor}
                strokeWidth="0.8"
                strokeDasharray="3,3"
                opacity={0.7}
              />

              {/* FVG Info Badge */}
              <g transform={`translate(${Math.min(maxX - 105, Math.max(minX + 6, renderX + 6))}, ${yTop + 3})`}>
                <rect
                  x="0"
                  y="0"
                  width="98"
                  height="16"
                  fill={badgeFill}
                  stroke={badgeBorder}
                  strokeWidth="0.8"
                  rx="3"
                  opacity="0.92"
                />
                <text
                  x="49"
                  y="11.5"
                  textAnchor="middle"
                  fill={badgeText}
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {isBullish ? '+FVG' : '-FVG'} {fvg.isActive ? '• Active' : '• Mitigated'}
                </text>
              </g>
            </g>
          );
        })}

      {/* 2. CHoCH & BOS Structure Breaks */}
      {showBOS &&
        structureBreaks.map((sb) => {
          const yLevel = getY(sb.brokenLevel ?? sb.price);
          const isCHoCH = sb.type === 'CHoCH';
          const isBullish = sb.direction === 'BULLISH';

          // Index of broken swing point and confirmation candle
          const swingIdx = sb.brokenSwingIndex !== undefined ? sb.brokenSwingIndex - visibleStartGlobalIndex : 0;
          const confirmIdx = (sb.candle2Index ?? sb.index) - visibleStartGlobalIndex;

          const xSwing = Math.max(chartPadding.left, getX(swingIdx));
          const xConfirm = Math.min(chartPadding.left + plotWidth, getX(confirmIdx));

          if (isCHoCH) {
            // Enhanced 2-Candle CHoCH Display
            const chochColor = isBullish ? '#00FFA3' : '#FF4D6D';
            const chochBg = isBullish ? '#022C22' : '#4C0519';
            const chochBorder = isBullish ? '#00FFA3' : '#FF4D6D';

            return (
              <g key={sb.id} className="choch-overlay">
                {/* 1. Broken Swing Level Line */}
                <line
                  x1={xSwing}
                  y1={yLevel}
                  x2={xConfirm}
                  y2={yLevel}
                  stroke={chochColor}
                  strokeWidth="1.8"
                  strokeDasharray="5,3"
                />

                {/* Broken Level Anchor Node at the original swing pivot */}
                <circle cx={xSwing} cy={yLevel} r="3.5" fill={chochColor} />
                <circle cx={xConfirm} cy={yLevel} r="3.5" fill={chochColor} />

                {/* Label on the broken swing line */}
                <g transform={`translate(${xSwing + 8}, ${yLevel - 13})`}>
                  <rect
                    x="0"
                    y="0"
                    width="110"
                    height="14"
                    fill="#0A0B0D"
                    stroke={chochBorder}
                    strokeWidth="0.6"
                    rx="2"
                    opacity="0.85"
                  />
                  <text
                    x="55"
                    y="10.5"
                    textAnchor="middle"
                    fill={chochColor}
                    fontSize="8.5"
                    fontFamily="monospace"
                  >
                    Broken {isBullish ? 'High' : 'Low'}: {(sb.brokenLevel ?? sb.price).toFixed(digits)}
                  </text>
                </g>

                {/* 2. CHoCH 2-Candle Confirmation Marker at Candle 2 */}
                <g transform={`translate(${xConfirm - 55}, ${isBullish ? yLevel - 28 : yLevel + 12})`}>
                  <rect
                    x="0"
                    y="0"
                    width="110"
                    height="20"
                    fill={chochBg}
                    stroke={chochBorder}
                    strokeWidth="1.2"
                    rx="4"
                    className="shadow-lg"
                  />
                  <text
                    x="55"
                    y="13.5"
                    textAnchor="middle"
                    fill={chochColor}
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {isBullish ? '▲ +CHoCH (Bullish)' : '▼ -CHoCH (Bearish)'}
                  </text>
                </g>

                {/* Connector line down to confirmation candle */}
                <line
                  x1={xConfirm}
                  y1={yLevel}
                  x2={xConfirm}
                  y2={isBullish ? yLevel - 8 : yLevel + 8}
                  stroke={chochColor}
                  strokeWidth="1.5"
                />
              </g>
            );
          }

          // Standard BOS Continuation Marker
          const bosColor = isBullish ? '#38BDF8' : '#F59E0B';
          return (
            <g key={sb.id} className="bos-overlay">
              <line
                x1={xSwing}
                y1={yLevel}
                x2={xConfirm}
                y2={yLevel}
                stroke={bosColor}
                strokeWidth="1.2"
                strokeDasharray="3,3"
                opacity="0.8"
              />
              <g transform={`translate(${xConfirm - 35}, ${isBullish ? yLevel - 18 : yLevel + 6})`}>
                <rect
                  x="0"
                  y="0"
                  width="70"
                  height="15"
                  fill="#0F172A"
                  stroke={bosColor}
                  strokeWidth="0.8"
                  rx="3"
                />
                <text
                  x="35"
                  y="11"
                  textAnchor="middle"
                  fill={bosColor}
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {isBullish ? '+BOS' : '-BOS'}
                </text>
              </g>
            </g>
          );
        })}
    </g>
  );
};
