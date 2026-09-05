import { create } from "zustand";
import { SupportedSymbol, Timeframe, Candle, Quote, ProviderMetadata } from "@/types/market";
import { APP_CONFIG } from "@/config/constants";

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
    set({ activeSymbol: symbol });
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
        set({ quote: json.data, isLoadingQuote: false });
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
