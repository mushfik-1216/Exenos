import { RiskValidationInput, RiskValidationResult, TradingStatus } from "@/types/risk";
import { SupportedSymbol } from "@/types/market";

export class RiskEngine {
  static validateTrade(input: RiskValidationInput, _symbol: SupportedSymbol): RiskValidationResult {
    const {
      signal,
      entryPrice,
      stopLoss,
      takeProfit,
      accountBalance,
      dailyLossTotal,
      tradesTodayCount,
      riskSettings,
    } = input;

    const rejectionReasons: string[] = [];
    const warnings: string[] = [];

    // 1. Check Trading Status & Daily Limits
    const maxDailyLoss = (accountBalance * riskSettings.dailyLossLimitPercent) / 100;
    let tradingStatus: TradingStatus = "ACTIVE";

    if (dailyLossTotal >= maxDailyLoss) {
      tradingStatus = "LOCKED";
      rejectionReasons.push(`Daily loss limit reached (${dailyLossTotal.toFixed(2)} >= ${maxDailyLoss.toFixed(2)})`);
    }

    if (tradesTodayCount >= riskSettings.maxTradesPerDay) {
      tradingStatus = "LOCKED";
      rejectionReasons.push(`Max daily trades limit reached (${tradesTodayCount}/${riskSettings.maxTradesPerDay})`);
    } else if (tradesTodayCount === riskSettings.maxTradesPerDay - 1) {
      tradingStatus = "WARNING";
      warnings.push("This is your last available trade for today.");
    }

    if (signal === "NO_TRADE") {
      return {
        isValid: false,
        tradingStatus,
        positionSizeUnits: 0,
        positionValue: 0,
        riskAmount: 0,
        riskPercent: 0,
        rewardRiskRatio: 0,
        rejectionReasons: ["Signal is NO_TRADE. Capital preservation active."],
        warnings,
      };
    }

    // 2. Validate Stop Loss & Entry
    const riskDistance = Math.abs(entryPrice - stopLoss);
    const rewardDistance = Math.abs(takeProfit - entryPrice);

    if (riskDistance <= 0) {
      rejectionReasons.push("Stop Loss cannot equal Entry Price");
    }

    if (signal === "BUY" && stopLoss >= entryPrice) {
      rejectionReasons.push("BUY Stop Loss must be below Entry Price");
    }

    if (signal === "SELL" && stopLoss <= entryPrice) {
      rejectionReasons.push("SELL Stop Loss must be above Entry Price");
    }

    const rewardRiskRatio = riskDistance > 0 ? Number((rewardDistance / riskDistance).toFixed(2)) : 0;
    if (rewardRiskRatio < 1.5) {
      rejectionReasons.push(`Risk-to-Reward ratio (${rewardRiskRatio}) is below minimum 1:1.5 threshold`);
    }

    // 3. Position Sizing Calculation
    const allowedRiskDollars = (accountBalance * riskSettings.riskPerTradePercent) / 100;

    const positionSizeUnits = riskDistance > 0 ? Math.floor(allowedRiskDollars / riskDistance) : 0;
    const positionValue = positionSizeUnits * entryPrice;

    const isValid = rejectionReasons.length === 0 && tradingStatus !== "LOCKED";

    return {
      isValid,
      tradingStatus,
      positionSizeUnits,
      positionValue: Number(positionValue.toFixed(2)),
      riskAmount: Number(allowedRiskDollars.toFixed(2)),
      riskPercent: riskSettings.riskPerTradePercent,
      rewardRiskRatio,
      rejectionReasons,
      warnings,
    };
  }
}
