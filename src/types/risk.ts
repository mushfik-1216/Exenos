export type TradingStatus = "ACTIVE" | "WARNING" | "LOCKED";

export interface RiskSettings {
  maxTradesPerDay: number; // default: 2
  riskPerTradePercent: number; // default: 1%
  dailyLossLimitPercent: number; // default: 3%
  dailyProfitTargetPercent?: number;
  accountBalance: number;
  maxOpenPositions: number;
}

export interface RiskValidationInput {
  signal: "BUY" | "SELL" | "NO_TRADE";
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  accountBalance: number;
  dailyLossTotal: number;
  tradesTodayCount: number;
  riskSettings: RiskSettings;
}

export interface RiskValidationResult {
  isValid: boolean;
  tradingStatus: TradingStatus;
  positionSizeUnits: number;
  positionValue: number;
  riskAmount: number;
  riskPercent: number;
  rewardRiskRatio: number;
  rejectionReasons: string[];
  warnings: string[];
}
