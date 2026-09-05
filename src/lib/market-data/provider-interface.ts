import { Candle, Quote, SupportedSymbol, Timeframe, ProviderName, ProviderMetadata } from "@/types/market";

export interface ProviderResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: ProviderMetadata;
}

export interface IMarketDataProvider {
  readonly name: ProviderName;
  readonly priority: number;
  
  isAvailable(): Promise<boolean>;
  
  getCandles(
    symbol: SupportedSymbol,
    timeframe: Timeframe,
    limit?: number
  ): Promise<ProviderResult<Candle[]>>;
  
  getQuote(symbol: SupportedSymbol): Promise<ProviderResult<Quote>>;
}
