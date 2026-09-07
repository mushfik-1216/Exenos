import { IMarketDataProvider, ProviderResult } from "./provider-interface";
import { Candle, Quote, SupportedSymbol, Timeframe, ProviderName } from "@/types/market";
import { SUPPORTED_SYMBOLS } from "@/config/symbols";
import { TIMEFRAMES } from "@/config/timeframes";
import { getEnv } from "@/config/env";
import { FileManager } from "@/lib/storage/file-manager";

export class TwelveDataProvider implements IMarketDataProvider {
  readonly name: ProviderName = "Twelve Data";
  readonly priority = 1;

  private async getApiKey(): Promise<string | null> {
    const env = getEnv();
    if (env.TWELVE_DATA_API_KEY) {
      return env.TWELVE_DATA_API_KEY;
    }
    if (process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY) {
      return process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY;
    }
    try {
      const settings = await FileManager.getSettings();
      if (settings?.twelveDataApiKey) {
        return settings.twelveDataApiKey;
      }
    } catch {
      // ignore
    }
    return null;
  }

  async isAvailable(): Promise<boolean> {
    const key = await this.getApiKey();
    return Boolean(key && key.trim().length > 0);
  }

  async getCandles(
    symbol: SupportedSymbol,
    timeframe: Timeframe,
    limit: number = 100
  ): Promise<ProviderResult<Candle[]>> {
    const startTime = Date.now();
    const symConfig = SUPPORTED_SYMBOLS[symbol];
    const tfConfig = TIMEFRAMES[timeframe];
    const apiKey = await this.getApiKey();

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

    if (!apiKey) {
      return {
        success: false,
        error: "Twelve Data API key not configured",
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
      const mappedSymbol = encodeURIComponent(symConfig.twelveDataSymbol);
      const interval = tfConfig.twelveDataInterval;
      const size = Math.min(Math.max(limit, 50), 200);

      const url = `https://api.twelvedata.com/time_series?symbol=${mappedSymbol}&interval=${interval}&outputsize=${size}&apikey=${apiKey}`;

      const response = await fetch(url, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        throw new Error(`Twelve Data HTTP ${response.status}`);
      }

      const json = await response.json();

      if (json.status === "error" || !Array.isArray(json.values)) {
        throw new Error(json.message || "Invalid Twelve Data response");
      }

      const candles: Candle[] = [];

      for (let i = 0; i < json.values.length; i++) {
        const item = json.values[i];
        const dateStr = item.datetime.includes("T")
          ? item.datetime
          : item.datetime.replace(" ", "T") + "Z";
        let timeSec = Math.floor(new Date(dateStr).getTime() / 1000);

        if (isNaN(timeSec)) {
          timeSec = Math.floor(new Date(item.datetime).getTime() / 1000);
        }

        const o = parseFloat(item.open);
        const h = parseFloat(item.high);
        const l = parseFloat(item.low);
        const c = parseFloat(item.close);
        const v = parseFloat(item.volume || "0");

        if (!isNaN(timeSec) && !isNaN(o) && !isNaN(h) && !isNaN(l) && !isNaN(c)) {
          candles.push({
            time: timeSec,
            open: Number(o.toFixed(symConfig.decimals)),
            high: Number(h.toFixed(symConfig.decimals)),
            low: Number(l.toFixed(symConfig.decimals)),
            close: Number(c.toFixed(symConfig.decimals)),
            volume: isNaN(v) ? 0 : Number(v),
          });
        }
      }

      // Sort strictly ascending (oldest to newest)
      candles.sort((a, b) => a.time - b.time);

      return {
        success: true,
        data: candles.slice(-limit),
        metadata: {
          provider: this.name,
          timestamp: new Date().toISOString(),
          symbol,
          timeframe,
          latencyMs: Date.now() - startTime,
        },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Twelve Data fetch error";
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
    const apiKey = await this.getApiKey();

    if (!symConfig || !apiKey) {
      return {
        success: false,
        error: "Twelve Data API key or symbol not configured",
        metadata: {
          provider: this.name,
          timestamp: new Date().toISOString(),
          symbol,
          latencyMs: Date.now() - startTime,
        },
      };
    }

    try {
      const mappedSymbol = encodeURIComponent(symConfig.twelveDataSymbol);
      const url = `https://api.twelvedata.com/quote?symbol=${mappedSymbol}&apikey=${apiKey}`;

      const response = await fetch(url, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Twelve Data Quote HTTP ${response.status}`);
      }

      const json = await response.json();

      if (json.status === "error" || !json.close) {
        throw new Error(json.message || "Failed to retrieve quote");
      }

      const price = parseFloat(json.close);
      
      const high = parseFloat(json.high || json.close);
      const low = parseFloat(json.low || json.close);
      const change = parseFloat(json.change || "0");
      const percentChange = parseFloat(json.percent_change || "0");

      const quote: Quote = {
        symbol,
        price: Number(price.toFixed(symConfig.decimals)),
        change24h: Number(change.toFixed(symConfig.decimals)),
        changePercent24h: Number(percentChange.toFixed(2)),
        high24h: Number(high.toFixed(symConfig.decimals)),
        low24h: Number(low.toFixed(symConfig.decimals)),
        timestamp: json.timestamp || Math.floor(Date.now() / 1000),
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
      const message = err instanceof Error ? err.message : "Twelve Data quote error";
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
