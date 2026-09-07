import { SupportedSymbol, MarketCategory } from "@/types/market";

export interface SymbolConfig {
  symbol: SupportedSymbol;
  name: string;
  category: MarketCategory;
  pipSize: number;
  decimals: number;
  defaultSpread: number;
  yahooTicker: string;
  twelveDataSymbol: string;
  alphaVantageSymbol: string;
}

export const SUPPORTED_SYMBOLS: Record<SupportedSymbol, SymbolConfig> = {
  EURUSD: {
    symbol: "EURUSD",
    name: "Euro / US Dollar",
    category: "forex",
    pipSize: 0.0001,
    decimals: 5,
    defaultSpread: 0.0001,
    yahooTicker: "EURUSD=X",
    twelveDataSymbol: "EUR/USD",
    alphaVantageSymbol: "EURUSD",
  },
  GBPUSD: {
    symbol: "GBPUSD",
    name: "British Pound / US Dollar",
    category: "forex",
    pipSize: 0.0001,
    decimals: 5,
    defaultSpread: 0.00015,
    yahooTicker: "GBPUSD=X",
    twelveDataSymbol: "GBP/USD",
    alphaVantageSymbol: "GBPUSD",
  },
  USDJPY: {
    symbol: "USDJPY",
    name: "US Dollar / Japanese Yen",
    category: "forex",
    pipSize: 0.01,
    decimals: 3,
    defaultSpread: 0.015,
    yahooTicker: "USDJPY=X",
    twelveDataSymbol: "USD/JPY",
    alphaVantageSymbol: "USDJPY",
  },
  AUDUSD: {
    symbol: "AUDUSD",
    name: "Australian Dollar / US Dollar",
    category: "forex",
    pipSize: 0.0001,
    decimals: 5,
    defaultSpread: 0.00012,
    yahooTicker: "AUDUSD=X",
    twelveDataSymbol: "AUD/USD",
    alphaVantageSymbol: "AUDUSD",
  },
  USDCHF: {
    symbol: "USDCHF",
    name: "US Dollar / Swiss Franc",
    category: "forex",
    pipSize: 0.0001,
    decimals: 5,
    defaultSpread: 0.00015,
    yahooTicker: "USDCHF=X",
    twelveDataSymbol: "USD/CHF",
    alphaVantageSymbol: "USDCHF",
  },
  USDCAD: {
    symbol: "USDCAD",
    name: "US Dollar / Canadian Dollar",
    category: "forex",
    pipSize: 0.0001,
    decimals: 5,
    defaultSpread: 0.00014,
    yahooTicker: "USDCAD=X",
    twelveDataSymbol: "USD/CAD",
    alphaVantageSymbol: "USDCAD",
  },
  NZDUSD: {
    symbol: "NZDUSD",
    name: "New Zealand Dollar / US Dollar",
    category: "forex",
    pipSize: 0.0001,
    decimals: 5,
    defaultSpread: 0.00018,
    yahooTicker: "NZDUSD=X",
    twelveDataSymbol: "NZD/USD",
    alphaVantageSymbol: "NZDUSD",
  },
  XAUUSD: {
    symbol: "XAUUSD",
    name: "Gold / US Dollar",
    category: "metals",
    pipSize: 0.1,
    decimals: 2,
    defaultSpread: 0.3,
    yahooTicker: "GC=F",
    twelveDataSymbol: "XAU/USD",
    alphaVantageSymbol: "XAUUSD",
  },
  BTCUSD: {
    symbol: "BTCUSD",
    name: "Bitcoin / US Dollar",
    category: "crypto",
    pipSize: 1,
    decimals: 2,
    defaultSpread: 5.0,
    yahooTicker: "BTC-USD",
    twelveDataSymbol: "BTC/USD",
    alphaVantageSymbol: "BTC",
  },
  ETHUSD: {
    symbol: "ETHUSD",
    name: "Ethereum / US Dollar",
    category: "crypto",
    pipSize: 0.1,
    decimals: 2,
    defaultSpread: 0.5,
    yahooTicker: "ETH-USD",
    twelveDataSymbol: "ETH/USD",
    alphaVantageSymbol: "ETH",
  },
  NAS100: {
    symbol: "NAS100",
    name: "Nasdaq 100 Index",
    category: "indices",
    pipSize: 1,
    decimals: 2,
    defaultSpread: 1.5,
    yahooTicker: "^NDX",
    twelveDataSymbol: "QQQ",
    alphaVantageSymbol: "NAS100",
  },
  US30: {
    symbol: "US30",
    name: "Dow Jones 30 Index",
    category: "indices",
    pipSize: 1,
    decimals: 2,
    defaultSpread: 2.0,
    yahooTicker: "^DJI",
    twelveDataSymbol: "DIA",
    alphaVantageSymbol: "US30",
  },
};

export const SYMBOL_LIST = Object.keys(SUPPORTED_SYMBOLS) as SupportedSymbol[];
