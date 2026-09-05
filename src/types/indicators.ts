export interface IndicatorConfig {
  emaPeriods: number[]; // e.g. [9, 21, 50, 200]
  smaPeriods: number[]; // e.g. [20, 50, 200]
  rsiPeriod: number; // e.g. 14
  macdFast: number; // e.g. 12
  macdSlow: number; // e.g. 26
  macdSignal: number; // e.g. 9
  atrPeriod: number; // e.g. 14
  bbPeriod: number; // e.g. 20
  bbStdDev: number; // e.g. 2.0
  adxPeriod: number; // e.g. 14
}

export interface EMAPoint {
  time: number;
  period: number;
  value: number;
}

export interface RSIPoint {
  time: number;
  value: number;
}

export interface MACDPoint {
  time: number;
  macd: number;
  signal: number;
  histogram: number;
}

export interface ATRPoint {
  time: number;
  value: number;
}

export interface VWAPPoint {
  time: number;
  value: number;
}

export interface BollingerBandsPoint {
  time: number;
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
}

export interface ADXPoint {
  time: number;
  adx: number;
  plusDI: number;
  minusDI: number;
}

export interface TechnicalIndicatorsResult {
  ema: Record<number, number>; // period -> latest value
  sma: Record<number, number>;
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  atr: number;
  vwap?: number;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  adx: {
    adx: number;
    plusDI: number;
    minusDI: number;
  };
}
