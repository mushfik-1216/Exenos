export type MarketCategory = "forex" | "metals" | "crypto" | "indices";

export type SupportedSymbol =
  | "EURUSD"
  | "GBPUSD"
  | "USDJPY"
  | "AUDUSD"
  | "USDCHF"
  | "USDCAD"
  | "NZDUSD"
  | "XAUUSD"
  | "BTCUSD"
  | "ETHUSD"
  | "NAS100"
  | "US30";

export type Timeframe = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1D";

export type ProviderName = "Twelve Data" | "Yahoo Finance" | "Alpha Vantage";

export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Quote {
  symbol: SupportedSymbol;
  price: number;
  bid?: number;
  ask?: number;
  change24h?: number;
  changePercent24h?: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  timestamp: number;
}

export interface ProviderMetadata {
  provider: ProviderName;
  timestamp: string;
  symbol: SupportedSymbol;
  latencyMs?: number;
  timeframe?: Timeframe;
}

export interface MarketDataResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: ProviderMetadata;
}
