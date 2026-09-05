import { IMarketDataProvider, ProviderResult } from "./provider-interface";
import { Candle, Quote, SupportedSymbol, Timeframe, ProviderName } from "@/types/market";
import { TradingViewProvider } from "./tradingview-provider";
import { YahooFinanceProvider } from "./yahoo-provider";
import { AlphaVantageProvider } from "./alpha-vantage-provider";

interface CacheEntry<T> {
  data: ProviderResult<T>;
  expiresAt: number;
}

const CANDLES_CACHE_TTL_MS = 15 * 1000; // 15 seconds
const QUOTE_CACHE_TTL_MS = 5 * 1000;    // 5 seconds

// Global in-memory cache and in-flight promise registry across engine instances
const candlesCache = new Map<string, CacheEntry<Candle[]>>();
const quotesCache = new Map<string, CacheEntry<Quote>>();
const pendingCandles = new Map<string, Promise<ProviderResult<Candle[]>>>();
const pendingQuotes = new Map<string, Promise<ProviderResult<Quote>>>();

export class MarketDataFailoverEngine {
  private providers: IMarketDataProvider[];

  constructor(userId?: string) {
    this.providers = [
      new TradingViewProvider(userId),
      new YahooFinanceProvider(),
      new AlphaVantageProvider(),
    ];
  }

  async getCandles(
    symbol: SupportedSymbol,
    timeframe: Timeframe,
    limit: number = 100
  ): Promise<ProviderResult<Candle[]>> {
    const cacheKey = `${symbol}:${timeframe}:${limit}`;
    const now = Date.now();

    const cached = candlesCache.get(cacheKey);
    if (cached && cached.expiresAt > now && cached.data.success) {
      return cached.data;
    }

    const existingPromise = pendingCandles.get(cacheKey);
    if (existingPromise) {
      return existingPromise;
    }

    const fetchPromise = (async (): Promise<ProviderResult<Candle[]>> => {
      try {
        for (const provider of this.providers) {
          const isAvail = await provider.isAvailable();
          if (!isAvail) {
            continue;
          }

          const result = await provider.getCandles(symbol, timeframe, limit);
          if (result.success && result.data && result.data.length > 0) {
            candlesCache.set(cacheKey, {
              data: result,
              expiresAt: Date.now() + CANDLES_CACHE_TTL_MS,
            });
            return result;
          }
        }

        const fallbackProvider: ProviderName = "Alpha Vantage";
        return {
          success: false,
          error: "MARKET DATA UNAVAILABLE",
          metadata: {
            provider: fallbackProvider,
            timestamp: new Date().toISOString(),
            symbol,
            timeframe,
          },
        };
      } finally {
        pendingCandles.delete(cacheKey);
      }
    })();

    pendingCandles.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  async getQuote(symbol: SupportedSymbol): Promise<ProviderResult<Quote>> {
    const cacheKey = symbol;
    const now = Date.now();

    const cached = quotesCache.get(cacheKey);
    if (cached && cached.expiresAt > now && cached.data.success) {
      return cached.data;
    }

    const existingPromise = pendingQuotes.get(cacheKey);
    if (existingPromise) {
      return existingPromise;
    }

    const fetchPromise = (async (): Promise<ProviderResult<Quote>> => {
      try {
        for (const provider of this.providers) {
          const isAvail = await provider.isAvailable();
          if (!isAvail) {
            continue;
          }

          const result = await provider.getQuote(symbol);
          if (result.success && result.data) {
            quotesCache.set(cacheKey, {
              data: result,
              expiresAt: Date.now() + QUOTE_CACHE_TTL_MS,
            });
            return result;
          }
        }

        const fallbackProvider: ProviderName = "Alpha Vantage";
        return {
          success: false,
          error: "MARKET DATA UNAVAILABLE",
          metadata: {
            provider: fallbackProvider,
            timestamp: new Date().toISOString(),
            symbol,
          },
        };
      } finally {
        pendingQuotes.delete(cacheKey);
      }
    })();

    pendingQuotes.set(cacheKey, fetchPromise);
    return fetchPromise;
  }
}
