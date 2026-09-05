import { NextRequest, NextResponse } from "next/server";
import { MarketDataFailoverEngine } from "@/lib/market-data/failover-engine";
import { SupportedSymbol } from "@/types/market";
import { getCurrentSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") || "EURUSD") as SupportedSymbol;

  const session = await getCurrentSession();
  const engine = new MarketDataFailoverEngine(session?.userId);
  const result = await engine.getQuote(symbol);

  return NextResponse.json(result);
}
