import { NextRequest, NextResponse } from "next/server";
import { MarketDataFailoverEngine } from "@/lib/market-data/failover-engine";
import { SupportedSymbol, Timeframe } from "@/types/market";
import { getCurrentSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") || "EURUSD") as SupportedSymbol;
  const timeframe = (searchParams.get("timeframe") || "15m") as Timeframe;
  const limit = parseInt(searchParams.get("limit") || "120", 10);

  const session = await getCurrentSession();
  const engine = new MarketDataFailoverEngine(session?.userId);
  const result = await engine.getCandles(symbol, timeframe, limit);

  return NextResponse.json(result);
}
