import { AIAnalysisResponse } from "@/types/ai";
import { RiskValidationResult } from "@/types/risk";
import { SupportedSymbol, Timeframe } from "@/types/market";

export interface TelegramMessagePayload {
  chatId?: string;
  text: string;
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
}

export interface SignalAlertPayload {
  symbol: SupportedSymbol;
  timeframe: Timeframe;
  analysis: AIAnalysisResponse;
  riskValidation: RiskValidationResult;
}

export interface RiskAlertPayload {
  title: string;
  message: string;
  tradingStatus: "ACTIVE" | "WARNING" | "LOCKED";
  dailyTrades: number;
  dailyLoss: number;
}
