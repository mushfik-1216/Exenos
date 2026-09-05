import { Candle } from "@/types/market";

export function calculateSMA(candles: Candle[], period: number): number[] {
  if (!candles || candles.length < period || period <= 0) {
    return [];
  }

  const result: number[] = [];
  let sum = 0;

  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  result.push(sum / period);

  for (let i = period; i < candles.length; i++) {
    sum += candles[i].close - candles[i - period].close;
    result.push(sum / period);
  }

  return result;
}

export function getLatestSMA(candles: Candle[], period: number): number | null {
  const values = calculateSMA(candles, period);
  return values.length > 0 ? values[values.length - 1] : null;
}
