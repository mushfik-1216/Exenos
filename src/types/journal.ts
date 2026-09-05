import { SupportedSymbol, Timeframe } from "./market";

export type TradeResult = "WIN" | "LOSS" | "BREAKEVEN" | "OPEN";

export interface JournalEntry {
  id: string;
  userId: string;
  symbol: SupportedSymbol;
  direction: "BUY" | "SELL";
  timeframe: Timeframe;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2?: number;
  exitPrice?: number;
  positionSize: number;
  riskReward: number;
  pnl?: number;
  pnlPercent?: number;
  result: TradeResult;
  setupType: string;
  notes?: string;
  aiAnalysisSnapshot?: Record<string, unknown>;
  openedAt: string;
  closedAt?: string;
}
