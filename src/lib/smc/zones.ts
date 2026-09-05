import { Candle } from "@/types/market";
import { SMCZone } from "@/types/smc";

export function detectFairValueGaps(candles: Candle[]): SMCZone[] {
  if (!candles || candles.length < 3) return [];
  const zones: SMCZone[] = [];

  for (let i = 2; i < candles.length; i++) {
    const c1 = candles[i - 2];
    const c2 = candles[i - 1];
    const c3 = candles[i];

    // Bullish FVG: Candle 1 High < Candle 3 Low
    if (c1.high < c3.low && c2.close > c2.open) {
      const high = c3.low;
      const low = c1.high;

      let mitigated = false;
      let mitigationTime: number | undefined;
      for (let k = i + 1; k < candles.length; k++) {
        if (candles[k].low <= high) {
          mitigated = true;
          mitigationTime = candles[k].time;
          break;
        }
      }

      zones.push({
        id: `fvg_bull_${c2.time}`,
        type: "FAIR_VALUE_GAP",
        direction: "BULLISH",
        high,
        low,
        startTime: c2.time,
        mitigated,
        mitigationTime,
      });
    }

    // Bearish FVG: Candle 1 Low > Candle 3 High
    if (c1.low > c3.high && c2.close < c2.open) {
      const high = c1.low;
      const low = c3.high;

      let mitigated = false;
      let mitigationTime: number | undefined;
      for (let k = i + 1; k < candles.length; k++) {
        if (candles[k].high >= low) {
          mitigated = true;
          mitigationTime = candles[k].time;
          break;
        }
      }

      zones.push({
        id: `fvg_bear_${c2.time}`,
        type: "FAIR_VALUE_GAP",
        direction: "BEARISH",
        high,
        low,
        startTime: c2.time,
        mitigated,
        mitigationTime,
      });
    }
  }

  return zones;
}

export function detectOrderBlocks(candles: Candle[]): SMCZone[] {
  if (!candles || candles.length < 5) return [];
  const zones: SMCZone[] = [];

  for (let i = 1; i < candles.length - 2; i++) {
    const obCandle = candles[i];
    const next1 = candles[i + 1];
    const next2 = candles[i + 2];

    const bodySize = Math.abs(obCandle.close - obCandle.open);
    const displacementBullish = next1.close > obCandle.high && next2.close > next1.high;
    const displacementBearish = next1.close < obCandle.low && next2.close < next1.low;

    // Bullish Order Block
    if (obCandle.close < obCandle.open && displacementBullish && bodySize > 0) {
      const high = obCandle.high;
      const low = obCandle.low;

      let mitigated = false;
      let mitigationTime: number | undefined;
      for (let k = i + 3; k < candles.length; k++) {
        if (candles[k].low <= high) {
          mitigated = true;
          mitigationTime = candles[k].time;
          break;
        }
      }

      zones.push({
        id: `ob_bull_${obCandle.time}`,
        type: "ORDER_BLOCK",
        direction: "BULLISH",
        high,
        low,
        startTime: obCandle.time,
        mitigated,
        mitigationTime,
      });
    }

    // Bearish Order Block
    if (obCandle.close > obCandle.open && displacementBearish && bodySize > 0) {
      const high = obCandle.high;
      const low = obCandle.low;

      let mitigated = false;
      let mitigationTime: number | undefined;
      for (let k = i + 3; k < candles.length; k++) {
        if (candles[k].high >= low) {
          mitigated = true;
          mitigationTime = candles[k].time;
          break;
        }
      }

      zones.push({
        id: `ob_bear_${obCandle.time}`,
        type: "ORDER_BLOCK",
        direction: "BEARISH",
        high,
        low,
        startTime: obCandle.time,
        mitigated,
        mitigationTime,
      });
    }
  }

  return zones;
}

export function calculatePremiumDiscount(candles: Candle[]): {
  equilibriumPrice: number;
  currentRange: { high: number; low: number };
  premiumZone: SMCZone;
  discountZone: SMCZone;
} {
  if (!candles || candles.length === 0) {
    return {
      equilibriumPrice: 0,
      currentRange: { high: 0, low: 0 },
      premiumZone: {
        id: "premium_zone",
        type: "PREMIUM_ZONE",
        direction: "BEARISH",
        high: 0,
        low: 0,
        startTime: 0,
        mitigated: false,
      },
      discountZone: {
        id: "discount_zone",
        type: "DISCOUNT_ZONE",
        direction: "BULLISH",
        high: 0,
        low: 0,
        startTime: 0,
        mitigated: false,
      },
    };
  }

  let rangeHigh = candles[0].high;
  let rangeLow = candles[0].low;

  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    if (c.high > rangeHigh) rangeHigh = c.high;
    if (c.low < rangeLow) rangeLow = c.low;
  }

  const eq = (rangeHigh + rangeLow) / 2;
  const latestTime = candles[candles.length - 1].time;

  return {
    equilibriumPrice: Number(eq.toFixed(5)),
    currentRange: { high: rangeHigh, low: rangeLow },
    premiumZone: {
      id: `premium_${latestTime}`,
      type: "PREMIUM_ZONE",
      direction: "BEARISH",
      high: rangeHigh,
      low: eq,
      startTime: latestTime,
      mitigated: false,
    },
    discountZone: {
      id: `discount_${latestTime}`,
      type: "DISCOUNT_ZONE",
      direction: "BULLISH",
      high: eq,
      low: rangeLow,
      startTime: latestTime,
      mitigated: false,
    },
  };
}
