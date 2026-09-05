import { AIAnalysisRequest } from "@/types/ai";

export function buildAnalysisContext(req: AIAnalysisRequest): string {
  const {
    symbol,
    timeframe,
    currentPrice,
    technicalIndicators,
    smcAnalysis,
    multiTimeframeSummary,
    dailyTradeCount,
    currentTradingStatus,
  } = req;

  return JSON.stringify(
    {
      instrument: {
        symbol,
        timeframe,
        currentPrice,
      },
      indicators: {
        rsi: technicalIndicators.rsi,
        macd: technicalIndicators.macd,
        ema: technicalIndicators.ema,
        atr: technicalIndicators.atr,
        vwap: technicalIndicators.vwap,
        bollingerBands: technicalIndicators.bollingerBands,
        adx: technicalIndicators.adx,
      },
      smartMoneyConcepts: {
        marketStructure: smcAnalysis.marketStructure,
        equilibriumPrice: smcAnalysis.equilibriumPrice,
        currentRange: smcAnalysis.currentRange,
        recentSwings: smcAnalysis.swings.slice(-5).map((s) => ({
          type: s.type,
          price: s.price,
        })),
        recentEvents: smcAnalysis.events.slice(-3).map((e) => ({
          type: e.type,
          direction: e.direction,
          level: e.brokenLevel,
        })),
        activeZones: smcAnalysis.zones.slice(-4).map((z) => ({
          type: z.type,
          direction: z.direction,
          high: z.high,
          low: z.low,
          mitigated: z.mitigated,
        })),
        liquiditySwept: smcAnalysis.liquidity.filter((l) => l.swept).map((l) => ({
          type: l.type,
          price: l.price,
        })),
      },
      multiTimeframe: multiTimeframeSummary || { higherTimeframeBias: "NEUTRAL" },
      disciplineAndRiskState: {
        dailyTradeCount,
        tradingStatus: currentTradingStatus,
      },
    },
    null,
    2
  );
}
