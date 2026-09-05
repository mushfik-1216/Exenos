import { SupportedSymbol, Timeframe } from "./market";
import { SMCAnalysisResult } from "./smc";
import { TechnicalIndicatorsResult } from "./indicators";

export type SignalType = "BUY" | "SELL" | "NO_TRADE";

export type MarketBias = "BULLISH" | "BEARISH" | "NEUTRAL";

export interface AIAnalysisRequest {
  symbol: SupportedSymbol;
  timeframe: Timeframe;
  currentPrice: number;
  technicalIndicators: TechnicalIndicatorsResult;
  smcAnalysis: SMCAnalysisResult;
  multiTimeframeSummary?: {
    higherTimeframeBias?: MarketBias;
    higherTimeframeKeyLevels?: number[];
  };
  dailyTradeCount: number;
  currentTradingStatus: "ACTIVE" | "WARNING" | "LOCKED";
}

export interface AIAnalysisResponse {
  signal: SignalType;
  bias: MarketBias;
  setupName?: string;
  entryZone?: {
    min: number;
    max: number;
    optimal: number;
  };
  stopLoss?: number;
  takeProfit1?: number;
  takeProfit2?: number;
  riskRewardRatio?: number;
  confidenceScore: number; // 0 to 100
  reasons: string[];
  invalidationConditions: string[];
  warnings: string[];
  reasoningSummary: string;
  timestamp: string;
}
