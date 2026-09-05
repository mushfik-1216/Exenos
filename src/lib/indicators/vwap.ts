import { Candle } from "@/types/market";

export function calculateVWAP(candles: Candle[]): number[] {
  if (!candles || candles.length === 0) {
    return [];
  }

  const vwapValues: number[] = [];
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;

  for (const candle of candles) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    const volume = candle.volume > 0 ? candle.volume : 1; // Safeguard if volume is 0
    cumulativeTPV += typicalPrice * volume;
    cumulativeVolume += volume;

    vwapValues.push(cumulativeTPV / cumulativeVolume);
  }

  return vwapValues;
}

export function getLatestVWAP(candles: Candle[]): number | null {
  const values = calculateVWAP(candles);
  return values.length > 0 ? values[values.length - 1] : null;
}
