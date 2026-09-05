import { Candle } from "@/types/market";
import { calculateSMA } from "./sma";

export interface BollingerBandsResult {
  upper: number[];
  middle: number[];
  lower: number[];
  bandwidth: number[];
  latest: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
  };
}

export function calculateBollingerBands(
  candles: Candle[],
  period: number = 20,
  stdDevMultiplier: number = 2.0
): BollingerBandsResult | null {
  if (!candles || candles.length < period) {
    return null;
  }

  const smaValues = calculateSMA(candles, period);
  const len = smaValues.length;
  const upper: number[] = new Array(len);
  const middle: number[] = smaValues;
  const lower: number[] = new Array(len);
  const bandwidth: number[] = new Array(len);

  for (let i = 0; i < len; i++) {
    const mean = smaValues[i];
    let sumSquares = 0;
    const end = i + period;

    for (let j = i; j < end; j++) {
      const diff = candles[j].close - mean;
      sumSquares += diff * diff;
    }

    const variance = sumSquares / period;
    const stdDev = Math.sqrt(variance);

    const up = mean + stdDevMultiplier * stdDev;
    const low = mean - stdDevMultiplier * stdDev;
    const bw = mean > 0 ? (up - low) / mean : 0;

    upper[i] = up;
    lower[i] = low;
    bandwidth[i] = bw;
  }

  const latestIndex = len - 1;

  return {
    upper,
    middle,
    lower,
    bandwidth,
    latest: {
      upper: Number(upper[latestIndex].toFixed(5)),
      middle: Number(middle[latestIndex].toFixed(5)),
      lower: Number(lower[latestIndex].toFixed(5)),
      bandwidth: Number(bandwidth[latestIndex].toFixed(5)),
    },
  };
}
