export interface PerformanceSummary {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRatePercent: number;
  lossRatePercent: number;
  totalPnL: number;
  totalPnLPercent: number;
  averageRR: number;
  profitFactor: number;
  maxDrawdownPercent: number;
  tradesToday: number;
}

export interface PairAnalytics {
  symbol: string;
  totalTrades: number;
  winRate: number;
  pnl: number;
}

export interface SetupAnalytics {
  setup: string;
  totalTrades: number;
  winRate: number;
  pnl: number;
}
