import { Candle } from "@/types/market";

export function calculateATR(candles: Candle[], period: number = 14): number[] {
  if (!candles || candles.length <= period || period <= 0) {
    return [];
  }

  const trs: number[] = [];

  // First candle True Range is High - Low
  trs.push(candles[0].high - candles[0].low);

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prevClose = candles[i - 1].close;
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prevClose),
      Math.abs(current.low - prevClose)
    );
    trs.push(tr);
  }

  const atrValues: number[] = [];
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  atrValues.push(atr);

  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
    atrValues.push(atr);
  }

  return atrValues;
}

export function getLatestATR(candles: Candle[], period: number = 14): number | null {
  const values = calculateATR(candles, period);
  return values.length > 0 ? values[values.length - 1] : null;
}
