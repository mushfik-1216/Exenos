import { Candle } from "@/types/market";
import { calculateEMA, calculateEMAFromValues } from "./ema";

export interface MACDResult {
  macdLine: number[];
  signalLine: number[];
  histogram: number[];
  latest: {
    macd: number;
    signal: number;
    histogram: number;
  };
}

export function calculateMACD(
  candles: Candle[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult | null {
  if (!candles || candles.length < slowPeriod + signalPeriod) {
    return null;
  }

  const fastEma = calculateEMA(candles, fastPeriod);
  const slowEma = calculateEMA(candles, slowPeriod);

  // Align fast EMA and slow EMA
  const offset = slowPeriod - fastPeriod;
  const macdLine: number[] = [];

  for (let i = 0; i < slowEma.length; i++) {
    macdLine.push(fastEma[i + offset] - slowEma[i]);
  }

  const signalLine = calculateEMAFromValues(macdLine, signalPeriod);
  const sigOffset = signalPeriod - 1;
  const histogram: number[] = [];

  for (let i = 0; i < signalLine.length; i++) {
    const macdVal = macdLine[i + sigOffset];
    const sigVal = signalLine[i];
    histogram.push(macdVal - sigVal);
  }

  const latestMacd = macdLine[macdLine.length - 1] || 0;
  const latestSignal = signalLine[signalLine.length - 1] || 0;
  const latestHist = histogram[histogram.length - 1] || 0;

  return {
    macdLine,
    signalLine,
    histogram,
    latest: {
      macd: Number(latestMacd.toFixed(6)),
      signal: Number(latestSignal.toFixed(6)),
      histogram: Number(latestHist.toFixed(6)),
    },
  };
}
