import { Candle } from "@/types/market";

export function calculateEMA(candles: Candle[], period: number): number[] {
  if (!candles || candles.length < period || period <= 0) {
    return [];
  }

  const result: number[] = [];
  const k = 2 / (period + 1);

  // Initial SMA as the first EMA seed
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  let prevEma = sum / period;
  result.push(prevEma);

  for (let i = period; i < candles.length; i++) {
    const currentClose = candles[i].close;
    const currentEma = currentClose * k + prevEma * (1 - k);
    result.push(currentEma);
    prevEma = currentEma;
  }

  return result;
}

export function calculateEMAFromValues(values: number[], period: number): number[] {
  if (!values || values.length < period || period <= 0) {
    return [];
  }

  const result: number[] = [];
  const k = 2 / (period + 1);

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  let prevEma = sum / period;
  result.push(prevEma);

  for (let i = period; i < values.length; i++) {
    const currentEma = values[i] * k + prevEma * (1 - k);
    result.push(currentEma);
    prevEma = currentEma;
  }

  return result;
}

export function getLatestEMA(candles: Candle[], period: number): number | null {
  const values = calculateEMA(candles, period);
  return values.length > 0 ? values[values.length - 1] : null;
}
