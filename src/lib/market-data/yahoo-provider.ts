import { IMarketDataProvider, ProviderResult } from "./provider-interface";
import { Candle, Quote, SupportedSymbol, Timeframe, ProviderName } from "@/types/market";
import { SUPPORTED_SYMBOLS } from "@/config/symbols";
import { TIMEFRAMES } from "@/config/timeframes";

export class YahooFinanceProvider implements IMarketDataProvider {
  readonly name: ProviderName = "Yahoo Finance";
  readonly priority = 2;

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async getCandles(
    symbol: SupportedSymbol,
    timeframe: Timeframe,
    limit: number = 100
  ): Promise<ProviderResult<Candle[]>> {
    const startTime = Date.now();
    const symConfig = SUPPORTED_SYMBOLS[symbol];
    const tfConfig = TIMEFRAMES[timeframe];

    if (!symConfig) {
      return {
        success: false,
        error: `Unsupported symbol: ${symbol}`,
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
      const ticker = encodeURIComponent(symConfig.yahooTicker);
      const interval = tfConfig.yahooInterval;
      
      // Calculate range based on timeframe
      let range = "1d";
      if (["15m", "30m", "1h"].includes(timeframe)) range = "5d";
      if (["4h", "1D"].includes(timeframe)) range = "1mo";

      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}&range=${range}`;
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        throw new Error(`Yahoo Finance HTTP ${response.status}`);
      }

      const json = await response.json();
      const result = json?.chart?.result?.[0];
      if (!result) {
        throw new Error("Invalid Yahoo Finance response structure");
      }

      const timestamps: number[] = result.timestamp || [];
      const quote = result.indicators?.quote?.[0] || {};
      const opens: (number | null)[] = quote.open || [];
      const highs: (number | null)[] = quote.high || [];
      const lows: (number | null)[] = quote.low || [];
      const closes: (number | null)[] = quote.close || [];
      const volumes: (number | null)[] = quote.volume || [];

      const candles: Candle[] = [];

      for (let i = 0; i < timestamps.length; i++) {
        const o = opens[i];
        const h = highs[i];
        const l = lows[i];
        const c = closes[i];
        const v = volumes[i] ?? 0;

        if (o !== null && h !== null && l !== null && c !== null && !isNaN(o) && !isNaN(h) && !isNaN(l) && !isNaN(c)) {
          candles.push({
            time: timestamps[i],
            open: Number(o.toFixed(symConfig.decimals)),
            high: Number(h.toFixed(symConfig.decimals)),
            low: Number(l.toFixed(symConfig.decimals)),
            close: Number(c.toFixed(symConfig.decimals)),
            volume: Number(v),
          });
        }
      }

      const slicedCandles = candles.slice(-limit);

      return {
        success: true,
        data: slicedCandles,
        metadata: {
          provider: this.name,
          timestamp: new Date().toISOString(),
          symbol,
          timeframe,
          latencyMs: Date.now() - startTime,
        },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Yahoo Finance fetch error";
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
    const symConfig = SUPPORTED_SYMBOLS[symbol];

    try {
      const ticker = encodeURIComponent(symConfig.yahooTicker);
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1m&range=1d`;
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Yahoo Finance Quote HTTP ${response.status}`);
      }

      const json = await response.json();
      const meta = json?.chart?.result?.[0]?.meta;
      const price = meta?.regularMarketPrice;

      if (!price) {
        throw new Error("No market price in Yahoo Finance response");
      }

      const quote: Quote = {
        symbol,
        price: Number(price.toFixed(symConfig.decimals)),
        change24h: meta.regularMarketPrice - (meta.chartPreviousClose || meta.previousClose || price),
        changePercent24h: meta.chartPreviousClose 
          ? ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100 
          : 0,
        high24h: meta.regularMarketDayHigh,
        low24h: meta.regularMarketDayLow,
        timestamp: meta.regularMarketTime || Math.floor(Date.now() / 1000),
      };

      return {
        success: true,
        data: quote,
        metadata: {
          provider: this.name,
          timestamp: new Date().toISOString(),
          symbol,
          latencyMs: Date.now() - startTime,
        },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Yahoo Finance quote error";
      return {
        success: false,
        error: message,
        metadata: {
          provider: this.name,
          timestamp: new Date().toISOString(),
          symbol,
          latencyMs: Date.now() - startTime,
        },
      };
    }
  }
}
