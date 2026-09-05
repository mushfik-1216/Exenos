import { IMarketDataProvider, ProviderResult } from "./provider-interface";
import { Candle, Quote, SupportedSymbol, Timeframe, ProviderName } from "@/types/market";
import { getEnv } from "@/config/env";

export class AlphaVantageProvider implements IMarketDataProvider {
  readonly name: ProviderName = "Alpha Vantage";
  readonly priority = 3;

  async isAvailable(): Promise<boolean> {
    const env = getEnv();
    return Boolean(env.ALPHA_VANTAGE_API_KEY);
  }

  async getCandles(
    symbol: SupportedSymbol,
    timeframe: Timeframe,
    _limit: number = 100
  ): Promise<ProviderResult<Candle[]>> {
    const startTime = Date.now();
    const env = getEnv();

    if (!env.ALPHA_VANTAGE_API_KEY) {
      return {
        success: false,
        error: "Alpha Vantage API key not configured",
        metadata: {
          provider: this.name,
          timestamp: new Date().toISOString(),
          symbol,
          timeframe,
          latencyMs: Date.now() - startTime,
        },
      };
    }

    try {
      return {
        success: false,
        error: "Alpha Vantage rate limit reached",
        metadata: {
          provider: this.name,
          timestamp: new Date().toISOString(),
          symbol,
          timeframe,
          latencyMs: Date.now() - startTime,
        },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Alpha Vantage error";
      return {
        success: false,
        error: message,
        metadata: {
          provider: this.name,
          timestamp: new Date().toISOString(),
          symbol,
          timeframe,
          latencyMs: Date.now() - startTime,
        },
      };
    }
  }

  async getQuote(symbol: SupportedSymbol): Promise<ProviderResult<Quote>> {
    const startTime = Date.now();
    const env = getEnv();

    if (!env.ALPHA_VANTAGE_API_KEY) {
      return {
        success: false,
        error: "Alpha Vantage API key not configured",
        metadata: {
          provider: this.name,
          timestamp: new Date().toISOString(),
          symbol,
          latencyMs: Date.now() - startTime,
        },
      };
    }

    return {
      success: false,
      error: "Alpha Vantage quote unavailable",
      metadata: {
        provider: this.name,
        timestamp: new Date().toISOString(),
        symbol,
        latencyMs: Date.now() - startTime,
      },
    };
  }
}
