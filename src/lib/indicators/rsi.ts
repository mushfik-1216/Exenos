import { Candle } from "@/types/market";

export function calculateRSI(candles: Candle[], period: number = 14): number[] {
  if (!candles || candles.length <= period || period <= 0) {
    return [];
  }

  const rsiValues: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  const firstRS = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsiValues.push(100 - 100 / (1 + firstRS));

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    if (avgLoss === 0) {
      rsiValues.push(100);
    } else {
      const rs = avgGain / avgLoss;
      const rsi = 100 - 100 / (1 + rs);
      rsiValues.push(rsi);
    }
  }

  return rsiValues;
}

export function getLatestRSI(candles: Candle[], period: number = 14): number | null {
  const values = calculateRSI(candles, period);
  return values.length > 0 ? values[values.length - 1] : null;
}
