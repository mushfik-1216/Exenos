import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { MarketDataFailoverEngine } from "@/lib/market-data/failover-engine";
import { AnalysisPipeline } from "@/lib/pipeline/analysis-pipeline";
import { SupportedSymbol, Timeframe } from "@/types/market";
import { APP_CONFIG } from "@/config/constants";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const symbol = (body.symbol || APP_CONFIG.DEFAULT_SYMBOL) as SupportedSymbol;
    const timeframe = (body.timeframe || APP_CONFIG.DEFAULT_TIMEFRAME) as Timeframe;

    // Fetch market data through failover engine
    const marketEngine = new MarketDataFailoverEngine(session.userId);
    const candleResult = await marketEngine.getCandles(symbol, timeframe, 120);

    if (!candleResult.success || !candleResult.data || candleResult.data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "MARKET DATA UNAVAILABLE",
          metadata: candleResult.metadata,
        },
        { status: 503 }
      );
    }

    const riskSettings = body.riskSettings || {
      maxTradesPerDay: APP_CONFIG.DEFAULT_RISK.MAX_TRADES_PER_DAY,
      riskPerTradePercent: APP_CONFIG.DEFAULT_RISK.RISK_PER_TRADE_PERCENT,
      dailyLossLimitPercent: APP_CONFIG.DEFAULT_RISK.DAILY_LOSS_LIMIT_PERCENT,
      accountBalance: APP_CONFIG.DEFAULT_RISK.ACCOUNT_BALANCE,
      maxOpenPositions: APP_CONFIG.DEFAULT_RISK.MAX_OPEN_POSITIONS,
    };

    const dailyTradeCount = body.dailyTradeCount || 0;
    const dailyLossTotal = body.dailyLossTotal || 0;

    const pipeline = new AnalysisPipeline();
    const result = await pipeline.run(
      symbol,
      timeframe,
      candleResult.data,
      riskSettings,
      dailyTradeCount,
      dailyLossTotal
    );

    return NextResponse.json({
      success: true,
      data: result,
      metadata: candleResult.metadata,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Analysis pipeline failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
