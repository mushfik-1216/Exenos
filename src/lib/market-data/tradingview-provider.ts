import { IMarketDataProvider, ProviderResult } from "./provider-interface";
import { Candle, Quote, SupportedSymbol, Timeframe, ProviderName } from "@/types/market";
import { TVSessionManager } from "@/lib/tradingview/session-manager";
import { SUPPORTED_SYMBOLS } from "@/config/symbols";
import { TIMEFRAMES } from "@/config/timeframes";
import { YahooFinanceProvider } from "./yahoo-provider";

export class TradingViewProvider implements IMarketDataProvider {
  readonly name: ProviderName = "TradingView";
  readonly priority = 1;
  private yahooProvider = new YahooFinanceProvider();

  constructor(private userId?: string) {}

  async isAvailable(): Promise<boolean> {
    if (!this.userId) return false;
    const creds = await TVSessionManager.getCredentials(this.userId);
    return Boolean(creds?.value && creds.value.trim().length > 0);
  }

  private getScannerUrl(category: string): string {
    switch (category) {
      case "crypto":
        return "https://scanner.tradingview.com/crypto/scan";
      case "metals":
      case "indices":
        return "https://scanner.tradingview.com/cfd/scan";
      case "forex":
      default:
        return "https://scanner.tradingview.com/forex/scan";
    }
  }

  private getCookieHeader(credentialValue: string): string {
    const trimmed = credentialValue.trim();
    if (trimmed.includes("sessionid=")) {
      return trimmed;
    }
    return `sessionid=${trimmed};`;
  }

  async getQuote(symbol: SupportedSymbol): Promise<ProviderResult<Quote>> {
    const startTime = Date.now();
    const symConfig = SUPPORTED_SYMBOLS[symbol];

    if (!symConfig) {
      return {
        success: false,
        error: `Unsupported symbol: ${symbol}`,
        metadata: {
          provider: this.name,
          timestamp: new Date().toISOString(),
          symbol,
          latencyMs: Date.now() - startTime,
        },
      };
    }

    if (!this.userId) {
      return {
        success: false,
        error: "User session required for TradingView data",
        metadata: {
          provider: this.name,
          timestamp: new Date().toISOString(),
          symbol,
          latencyMs: Date.now() - startTime,
        },
      };
    }

    const creds = await TVSessionManager.getCredentials(this.userId);
    if (!creds?.value) {
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

    try {
      const scanUrl = this.getScannerUrl(symConfig.category);
      const cookieHeader = this.getCookieHeader(creds.value);

      const response = await fetch(scanUrl, {
        method: "POST",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Cookie": cookieHeader,
        },
        body: JSON.stringify({
          symbols: {
            tickers: [symConfig.tradingViewSymbol],
            query: { types: [] },
          },
          columns: [
            "open",
            "high",
            "low",
            "close",
            "change",
            "change_abs",
            "volume",
            "high_1d",
            "low_1d",
            "description",
          ],
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`TradingView scanner HTTP ${response.status}`);
      }

      const json = await response.json();
      const row = json?.data?.[0]?.d;

      if (!row || !Array.isArray(row) || row.length < 4) {
        throw new Error("No market data returned from TradingView");
      }

      const open = Number(row[0]) || 0;
      const high = Number(row[1]) || open;
      const low = Number(row[2]) || open;
      const close = Number(row[3]) || open;
      const changePercent = Number(row[4]) || 0;
      const changeAbs = Number(row[5]) || 0;
      const high1d = row[7] !== null ? Number(row[7]) : high;
      const low1d = row[8] !== null ? Number(row[8]) : low;

      const quote: Quote = {
        symbol,
        price: Number(close.toFixed(symConfig.decimals)),
        change24h: Number(changeAbs.toFixed(symConfig.decimals)),
        changePercent24h: Number(changePercent.toFixed(2)),
        high24h: Number(high1d.toFixed(symConfig.decimals)),
        low24h: Number(low1d.toFixed(symConfig.decimals)),
        timestamp: Math.floor(Date.now() / 1000),
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
      const message = err instanceof Error ? err.message : "TradingView quote error";
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

  async getCandles(
    symbol: SupportedSymbol,
    timeframe: Timeframe,
    limit: number = 100
  ): Promise<ProviderResult<Candle[]>> {
    const startTime = Date.now();
    const symConfig = SUPPORTED_SYMBOLS[symbol];
    const tfConfig = TIMEFRAMES[timeframe];

    if (!symConfig || !tfConfig) {
      return {
        success: false,
        error: `Unsupported symbol or timeframe: ${symbol} / ${timeframe}`,
        metadata: {
          provider: this.name,
          timestamp: new Date().toISOString(),
          symbol,
          timeframe,
          latencyMs: Date.now() - startTime,
        },
      };
    }

    const isAvail = await this.isAvailable();
    if (!isAvail) {
      return {
        success: false,
        error: "TradingView session not connected",
        metadata: {
          provider: this.name,
          timestamp: new Date().toISOString(),
          symbol,
          timeframe,
          latencyMs: Date.now() - startTime,
        },
      };
    }

    // Try fetching real market candles from Yahoo/Binance
    const realCandlesResult = await this.yahooProvider.getCandles(symbol, timeframe, limit);
    const tvQuote = await this.getQuote(symbol);

    if (realCandlesResult.success && realCandlesResult.data && realCandlesResult.data.length > 0) {
      const candles = [...realCandlesResult.data];

      // If live TV quote is available, sync the latest bar with TradingView's exact live price
      if (tvQuote.success && tvQuote.data) {
        const lastIndex = candles.length - 1;
        const last = candles[lastIndex];
        const livePrice = tvQuote.data.price;

        candles[lastIndex] = {
          ...last,
          close: livePrice,
          high: Math.max(last.high, livePrice),
          low: Math.min(last.low, livePrice),
        };
      }

      return {
        success: true,
        data: candles,
        metadata: {
          provider: this.name,
          timestamp: new Date().toISOString(),
          symbol,
          timeframe,
          latencyMs: Date.now() - startTime,
        },
      };
    }

    return {
      success: false,
      error: "Unable to retrieve candle series for TradingView overlay",
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
