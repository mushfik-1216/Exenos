import { Candle } from "@/types/market";
import { SwingPoint, SwingType } from "@/types/smc";

export function detectSwingPoints(candles: Candle[], lookback: number = 3): SwingPoint[] {
  if (!candles || candles.length < lookback * 2 + 1) {
    return [];
  }

  const rawSwings: { index: number; type: "HIGH" | "LOW"; price: number; time: number }[] = [];

  for (let i = lookback; i < candles.length - lookback; i++) {
    const current = candles[i];
    let isHigh = true;
    let isLow = true;

    for (let j = 1; j <= lookback; j++) {
      if (candles[i - j].high >= current.high || candles[i + j].high > current.high) {
        isHigh = false;
      }
      if (candles[i - j].low <= current.low || candles[i + j].low < current.low) {
        isLow = false;
      }
    }

    if (isHigh) {
      rawSwings.push({ index: i, type: "HIGH", price: current.high, time: current.time });
    } else if (isLow) {
      rawSwings.push({ index: i, type: "LOW", price: current.low, time: current.time });
    }
  }

  // Classify HH, HL, LH, LL
  const swings: SwingPoint[] = [];
  let prevHigh: SwingPoint | null = null;
  let prevLow: SwingPoint | null = null;

  for (let k = 0; k < rawSwings.length; k++) {
    const s = rawSwings[k];
    let swingType: SwingType;

    if (s.type === "HIGH") {
      if (!prevHigh) {
        swingType = "HH";
      } else {
        swingType = s.price > prevHigh.price ? "HH" : "LH";
      }
      const point: SwingPoint = {
        id: `swing_h_${s.time}`,
        type: swingType,
        price: s.price,
        time: s.time,
        index: s.index,
      };
      swings.push(point);
      prevHigh = point;
    } else {
      if (!prevLow) {
        swingType = "LL";
      } else {
        swingType = s.price > prevLow.price ? "HL" : "LL";
      }
      const point: SwingPoint = {
        id: `swing_l_${s.time}`,
        type: swingType,
        price: s.price,
        time: s.time,
        index: s.index,
      };
      swings.push(point);
      prevLow = point;
    }
  }

  return swings;
}
