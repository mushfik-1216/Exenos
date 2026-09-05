import { IMarketDataProvider, ProviderResult } from "./provider-interface";
import { Candle, Quote, SupportedSymbol, Timeframe, ProviderName } from "@/types/market";
import { TVSessionManager } from "@/lib/tradingview/session-manager";

export class TradingViewProvider implements IMarketDataProvider {
  readonly name: ProviderName = "TradingView";
  readonly priority = 1;

  constructor(private userId?: string) {}

  async isAvailable(): Promise<boolean> {
    if (!this.userId) return false;
    const creds = await TVSessionManager.getCredentials(this.userId);
    return Boolean(creds?.value);
  }

  async getCandles(
    symbol: SupportedSymbol,
    timeframe: Timeframe,
    _limit: number = 100
  ): Promise<ProviderResult<Candle[]>> {
    const startTime = Date.now();
    const available = await this.isAvailable();

    if (!available) {
      return {
        success: false,
        error: "TradingView session not connected or invalid",
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
        error: "TradingView stream unavailable, triggering failover",
        metadata: {
          provider: this.name,
          timestamp: new Date().toISOString(),
          symbol,
          timeframe,
          latencyMs: Date.now() - startTime,
        },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "TradingView data fetch error";
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
    const available = await this.isAvailable();

    if (!available) {
      return {
        success: false,
        error: "TradingView credentials not configured",
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
      error: "TradingView quote unavailable",
      metadata: {
        provider: this.name,
        timestamp: new Date().toISOString(),
        symbol,
        latencyMs: Date.now() - startTime,
      },
    };
  }
}
