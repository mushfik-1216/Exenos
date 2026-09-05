import { Timeframe } from "@/types/market";

export interface TimeframeConfig {
  id: Timeframe;
  label: string;
  minutes: number;
  seconds: number;
  tradingViewInterval: string;
  yahooInterval: string;
}

export const TIMEFRAMES: Record<Timeframe, TimeframeConfig> = {
  "1m": {
    id: "1m",
    label: "1 Minute",
    minutes: 1,
    seconds: 60,
    tradingViewInterval: "1",
    yahooInterval: "1m",
  },
  "5m": {
    id: "5m",
    label: "5 Minutes",
    minutes: 5,
    seconds: 300,
    tradingViewInterval: "5",
    yahooInterval: "5m",
  },
  "15m": {
    id: "15m",
    label: "15 Minutes",
    minutes: 15,
    seconds: 900,
    tradingViewInterval: "15",
    yahooInterval: "15m",
  },
  "30m": {
    id: "30m",
    label: "30 Minutes",
    minutes: 30,
    seconds: 1800,
    tradingViewInterval: "30",
    yahooInterval: "30m",
  },
  "1h": {
    id: "1h",
    label: "1 Hour",
    minutes: 60,
    seconds: 3600,
    tradingViewInterval: "60",
    yahooInterval: "1h",
  },
  "4h": {
    id: "4h",
    label: "4 Hours",
    minutes: 240,
    seconds: 14400,
    tradingViewInterval: "240",
    yahooInterval: "1h", // reconstructed or resampled
  },
  "1D": {
    id: "1D",
    label: "1 Day",
    minutes: 1440,
    seconds: 86400,
    tradingViewInterval: "D",
    yahooInterval: "1d",
  },
};

export const TIMEFRAME_LIST = Object.keys(TIMEFRAMES) as Timeframe[];
