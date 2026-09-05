import { Candle, SupportedSymbol, Timeframe } from "@/types/market";
import { TechnicalAnalysisEngine } from "@/lib/indicators/engine";
import { SMCEngine } from "@/lib/smc/engine";
import { OmniRouteClient } from "@/lib/ai/omniroute-client";
import { RiskEngine } from "@/lib/risk/calculator";
import { RiskSettings, RiskValidationResult } from "@/types/risk";
import { AIAnalysisResponse } from "@/types/ai";
import { SMCAnalysisResult } from "@/types/smc";
import { TechnicalIndicatorsResult } from "@/types/indicators";

export interface PipelineOutput {
  symbol: SupportedSymbol;
  timeframe: Timeframe;
  currentPrice: number;
  indicators: TechnicalIndicatorsResult;
  smc: SMCAnalysisResult;
  ai: AIAnalysisResponse;
  riskValidation: RiskValidationResult;
  executedAt: string;
}

export class AnalysisPipeline {
  private aiClient: OmniRouteClient;

  constructor() {
    this.aiClient = new OmniRouteClient();
  }

  async run(
    symbol: SupportedSymbol,
    timeframe: Timeframe,
    candles: Candle[],
    riskSettings: RiskSettings,
    dailyTradeCount: number,
    dailyLossTotal: number
  ): Promise<PipelineOutput> {
    if (!candles || candles.length === 0) {
      throw new Error("Cannot run analysis pipeline: No candle data");
    }

    const currentPrice = candles[candles.length - 1].close;

    // 1. Deterministic Technical Indicators Engine
    const indicators = TechnicalAnalysisEngine.calculateAll(candles);

    // 2. Deterministic SMC Engine
    const smc = SMCEngine.analyze(candles);

    // 3. AI Reasoning Engine (OmniRoute)
    const ai = await this.aiClient.analyze({
      symbol,
      timeframe,
      currentPrice,
      technicalIndicators: indicators,
      smcAnalysis: smc,
      dailyTradeCount,
      currentTradingStatus: dailyTradeCount >= riskSettings.maxTradesPerDay ? "LOCKED" : "ACTIVE",
    });

    // 4. Deterministic Risk Validation Engine
    const riskValidation = RiskEngine.validateTrade(
      {
        signal: ai.signal,
        entryPrice: ai.entryZone?.optimal || currentPrice,
        stopLoss: ai.stopLoss || (ai.signal === "BUY" ? currentPrice * 0.99 : currentPrice * 1.01),
        takeProfit: ai.takeProfit1 || (ai.signal === "BUY" ? currentPrice * 1.02 : currentPrice * 0.98),
        accountBalance: riskSettings.accountBalance,
        dailyLossTotal,
        tradesTodayCount: dailyTradeCount,
        riskSettings,
      },
      symbol
    );

    return {
      symbol,
      timeframe,
      currentPrice,
      indicators,
      smc,
      ai,
      riskValidation,
      executedAt: new Date().toISOString(),
    };
  }
}
