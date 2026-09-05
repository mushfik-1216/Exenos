import { Candle } from "@/types/market";

export interface ADXResult {
  adx: number[];
  plusDI: number[];
  minusDI: number[];
  latest: {
    adx: number;
    plusDI: number;
    minusDI: number;
  };
}

export function calculateADX(candles: Candle[], period: number = 14): ADXResult | null {
  if (!candles || candles.length <= period * 2) {
    return null;
  }

  const tr: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];

    const trueRange = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    );
    tr.push(trueRange);

    const upMove = current.high - prev.high;
    const downMove = prev.low - current.low;

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  // Smooth TR, +DM, -DM using Wilder's smoothing
  let smoothTR = tr.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0);

  const plusDIList: number[] = [];
  const minusDIList: number[] = [];
  const dxList: number[] = [];

  const initialPlusDI = smoothTR === 0 ? 0 : (smoothPlusDM / smoothTR) * 100;
  const initialMinusDI = smoothTR === 0 ? 0 : (smoothMinusDM / smoothTR) * 100;
  plusDIList.push(initialPlusDI);
  minusDIList.push(initialMinusDI);

  const initialSumDI = initialPlusDI + initialMinusDI;
  const initialDX = initialSumDI === 0 ? 0 : (Math.abs(initialPlusDI - initialMinusDI) / initialSumDI) * 100;
  dxList.push(initialDX);

  for (let i = period; i < tr.length; i++) {
    smoothTR = smoothTR - smoothTR / period + tr[i];
    smoothPlusDM = smoothPlusDM - smoothPlusDM / period + plusDM[i];
    smoothMinusDM = smoothMinusDM - smoothMinusDM / period + minusDM[i];

    const pDI = smoothTR === 0 ? 0 : (smoothPlusDM / smoothTR) * 100;
    const mDI = smoothTR === 0 ? 0 : (smoothMinusDM / smoothTR) * 100;

    plusDIList.push(pDI);
    minusDIList.push(mDI);

    const sumDI = pDI + mDI;
    const dx = sumDI === 0 ? 0 : (Math.abs(pDI - mDI) / sumDI) * 100;
    dxList.push(dx);
  }

  // Calculate ADX from DX list
  if (dxList.length < period) {
    return null;
  }

  const adxList: number[] = [];
  let adx = dxList.slice(0, period).reduce((a, b) => a + b, 0) / period;
  adxList.push(adx);

  for (let i = period; i < dxList.length; i++) {
    adx = (adx * (period - 1) + dxList[i]) / period;
    adxList.push(adx);
  }

  const latestIndex = adxList.length - 1;
  const latestDIIndex = plusDIList.length - 1;

  return {
    adx: adxList,
    plusDI: plusDIList,
    minusDI: minusDIList,
    latest: {
      adx: Number(adxList[latestIndex].toFixed(2)),
      plusDI: Number(plusDIList[latestDIIndex].toFixed(2)),
      minusDI: Number(minusDIList[latestDIIndex].toFixed(2)),
    },
  };
}
