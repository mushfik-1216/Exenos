import { create } from "zustand";
import { SupportedSymbol, Timeframe, Candle, Quote, ProviderMetadata } from "@/types/market";
import { APP_CONFIG } from "@/config/constants";
import { TIMEFRAMES } from "@/config/timeframes";

interface MarketState {
  activeSymbol: SupportedSymbol;
  activeTimeframe: Timeframe;
  quote: Quote | null;
  candles: Candle[];
  isLoadingCandles: boolean;
  isLoadingQuote: boolean;
  lastMetadata: ProviderMetadata | null;
  error: string | null;

  setActiveSymbol: (symbol: SupportedSymbol) => void;
  setActiveTimeframe: (tf: Timeframe) => void;
  fetchMarketData: (symbol?: SupportedSymbol, tf?: Timeframe) => Promise<void>;
  fetchQuote: (symbol?: SupportedSymbol) => Promise<void>;
}

let activeCandlesController: AbortController | null = null;
let activeQuoteController: AbortController | null = null;

export const useMarketStore = create<MarketState>((set, get) => ({
  activeSymbol: APP_CONFIG.DEFAULT_SYMBOL,
  activeTimeframe: APP_CONFIG.DEFAULT_TIMEFRAME,
  quote: null,
  candles: [],
  isLoadingCandles: false,
  isLoadingQuote: false,
  lastMetadata: null,
  error: null,

  setActiveSymbol: (symbol) => {
    if (get().activeSymbol === symbol) return;
    set({ activeSymbol: symbol, quote: null });
    get().fetchMarketData(symbol, get().activeTimeframe);
    get().fetchQuote(symbol);
  },

  setActiveTimeframe: (tf) => {
    if (get().activeTimeframe === tf) return;
    set({ activeTimeframe: tf });
    get().fetchMarketData(get().activeSymbol, tf);
  },

  fetchMarketData: async (symbol, tf) => {
    const sym = symbol || get().activeSymbol;
    const timeframe = tf || get().activeTimeframe;

    if (activeCandlesController) {
      activeCandlesController.abort();
    }
    const controller = new AbortController();
    activeCandlesController = controller;

    set({ isLoadingCandles: true, error: null });

    try {
      const res = await fetch(
        `/api/market-data/candles?symbol=${sym}&timeframe=${timeframe}&limit=120`,
        { signal: controller.signal }
      );
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        set({
          candles: json.data,
          lastMetadata: json.metadata,
          isLoadingCandles: false,
          error: null,
        });
      } else {
        set({
          error: json.error || "MARKET DATA UNAVAILABLE",
          lastMetadata: json.metadata,
          isLoadingCandles: false,
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      const msg = err instanceof Error ? err.message : "Failed to load market data";
      set({ error: msg, isLoadingCandles: false });
    } finally {
      if (activeCandlesController === controller) {
        activeCandlesController = null;
      }
    }
  },

  fetchQuote: async (symbol) => {
    const sym = symbol || get().activeSymbol;
    if (get().isLoadingQuote) return;

    if (activeQuoteController) {
      activeQuoteController.abort();
    }
    const controller = new AbortController();
    activeQuoteController = controller;

    set({ isLoadingQuote: true });

    try {
      const res = await fetch(`/api/market-data/quote?symbol=${sym}`, {
        signal: controller.signal,
      });
      const json = await res.json();

      if (json.success && json.data) {
        const q: Quote = json.data;
        const currentCandles = get().candles;
        const activeTf = get().activeTimeframe;
        const activeSym = get().activeSymbol;

        if (q.symbol === activeSym && currentCandles.length > 0) {
          const tfConfig = TIMEFRAMES[activeTf] || { minutes: 15 };
          const intervalSec = tfConfig.minutes * 60;
          const currentCandleTime = Math.floor(q.timestamp / intervalSec) * intervalSec;

          const updatedCandles = [...currentCandles];
          const lastIndex = updatedCandles.length - 1;
          const lastCandle = updatedCandles[lastIndex];

          if (lastCandle.time === currentCandleTime || q.timestamp < lastCandle.time + intervalSec) {
            // Update open candle
            updatedCandles[lastIndex] = {
              ...lastCandle,
              close: q.price,
              high: Math.max(lastCandle.high, q.price),
              low: Math.min(lastCandle.low, q.price),
              volume: (lastCandle.volume || 0) + 1,
            };
          } else if (currentCandleTime > lastCandle.time) {
            // Bar rollover
            updatedCandles.push({
              time: currentCandleTime,
              open: q.price,
              high: q.price,
              low: q.price,
              close: q.price,
              volume: 1,
            });
            if (updatedCandles.length > 150) {
              updatedCandles.shift();
            }
          }

          set({
            quote: q,
            candles: updatedCandles,
            lastMetadata: json.metadata || get().lastMetadata,
            isLoadingQuote: false,
          });
        } else {
          set({
            quote: q,
            lastMetadata: json.metadata || get().lastMetadata,
            isLoadingQuote: false,
          });
        }
      } else {
        set({ isLoadingQuote: false });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      set({ isLoadingQuote: false });
    } finally {
      if (activeQuoteController === controller) {
        activeQuoteController = null;
      }
    }
  },
}));
