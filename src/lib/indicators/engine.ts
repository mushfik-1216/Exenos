import { Candle } from "@/types/market";
import { TechnicalIndicatorsResult, IndicatorConfig } from "@/types/indicators";
import { getLatestEMA } from "./ema";
import { getLatestSMA } from "./sma";
import { getLatestRSI } from "./rsi";
import { calculateMACD } from "./macd";
import { getLatestATR } from "./atr";
import { getLatestVWAP } from "./vwap";
import { calculateBollingerBands } from "./bollinger-bands";
import { calculateADX } from "./adx";

const DEFAULT_CONFIG: IndicatorConfig = {
  emaPeriods: [9, 21, 50, 200],
  smaPeriods: [20, 50, 200],
  rsiPeriod: 14,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  atrPeriod: 14,
  bbPeriod: 20,
  bbStdDev: 2.0,
  adxPeriod: 14,
};

export class TechnicalAnalysisEngine {
  static calculateAll(
    candles: Candle[],
    config: Partial<IndicatorConfig> = {}
  ): TechnicalIndicatorsResult {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    // 1. EMAs
    const emaMap: Record<number, number> = {};
    for (const period of cfg.emaPeriods) {
      const val = getLatestEMA(candles, period);
      if (val !== null) emaMap[period] = Number(val.toFixed(5));
    }

    // 2. SMAs
    const smaMap: Record<number, number> = {};
    for (const period of cfg.smaPeriods) {
      const val = getLatestSMA(candles, period);
      if (val !== null) smaMap[period] = Number(val.toFixed(5));
    }

    // 3. RSI
    const rsiVal = getLatestRSI(candles, cfg.rsiPeriod);
    const rsi = rsiVal !== null ? Number(rsiVal.toFixed(2)) : 50;

    // 4. MACD
    const macdResult = calculateMACD(candles, cfg.macdFast, cfg.macdSlow, cfg.macdSignal);
    const macd = macdResult
      ? macdResult.latest
      : { macd: 0, signal: 0, histogram: 0 };

    // 5. ATR
    const atrVal = getLatestATR(candles, cfg.atrPeriod);
    const atr = atrVal !== null ? Number(atrVal.toFixed(5)) : 0.001;

    // 6. VWAP
    const vwapVal = getLatestVWAP(candles);
    const vwap = vwapVal !== null ? Number(vwapVal.toFixed(5)) : undefined;

    // 7. Bollinger Bands
    const bbResult = calculateBollingerBands(candles, cfg.bbPeriod, cfg.bbStdDev);
    const bollingerBands = bbResult
      ? {
          upper: bbResult.latest.upper,
          middle: bbResult.latest.middle,
          lower: bbResult.latest.lower,
        }
      : {
          upper: candles.length > 0 ? candles[candles.length - 1].close * 1.01 : 0,
          middle: candles.length > 0 ? candles[candles.length - 1].close : 0,
          lower: candles.length > 0 ? candles[candles.length - 1].close * 0.99 : 0,
        };

    // 8. ADX
    const adxResult = calculateADX(candles, cfg.adxPeriod);
    const adx = adxResult
      ? adxResult.latest
      : { adx: 20, plusDI: 20, minusDI: 20 };

    return {
      ema: emaMap,
      sma: smaMap,
      rsi,
      macd,
      atr,
      vwap,
      bollingerBands,
      adx,
    };
  }
}
