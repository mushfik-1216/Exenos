import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { FileManager } from "@/lib/storage/file-manager";
import { JournalEntry, TradeResult } from "@/types/journal";
import { SupportedSymbol, Timeframe } from "@/types/market";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    const entries = await FileManager.getJournal();
    return NextResponse.json({ success: true, entries, data: entries }, { headers: NO_CACHE_HEADERS });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load journal entries";
    return NextResponse.json({ success: false, error: msg }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    const body = await request.json();
    const symbol = (body.symbol || "EURUSD") as SupportedSymbol;
    const direction = (body.direction || "BUY") as "BUY" | "SELL";
    const timeframe = (body.timeframe || "15m") as Timeframe;
    const entryPrice = parseFloat(body.entryPrice);
    const stopLoss = parseFloat(body.stopLoss);
    const takeProfit1 = parseFloat(body.takeProfit1);

    if (isNaN(entryPrice) || isNaN(stopLoss) || isNaN(takeProfit1)) {
      return NextResponse.json(
        { success: false, error: "Valid numeric Entry Price, Stop Loss, and Take Profit 1 are required" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const riskDistance = Math.abs(entryPrice - stopLoss);
    const rewardDistance = Math.abs(takeProfit1 - entryPrice);
    const riskReward = riskDistance > 0 ? parseFloat((rewardDistance / riskDistance).toFixed(2)) : 1.0;

    const result = (body.result || "WIN") as TradeResult;
    const exitPrice = body.exitPrice ? parseFloat(body.exitPrice) : undefined;
    const pnl = body.pnl !== undefined && body.pnl !== "" ? parseFloat(body.pnl) : undefined;
    const pnlPercent = body.pnlPercent ? parseFloat(body.pnlPercent) : undefined;
    const positionSize = body.positionSize ? parseFloat(body.positionSize) : 1.0;
    const setupType = body.setupType ? String(body.setupType).trim() : "Standard Setup";
    const notes = body.notes ? String(body.notes).trim() : undefined;

    const entries = await FileManager.getJournal();

    const newEntry: JournalEntry = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: session.userId,
      symbol,
      direction,
      timeframe,
      entryPrice,
      stopLoss,
      takeProfit1,
      exitPrice,
      positionSize,
      riskReward,
      pnl,
      pnlPercent,
      result,
      setupType,
      notes,
      openedAt: new Date().toISOString(),
      closedAt: result !== "OPEN" ? new Date().toISOString() : undefined,
    };

    const updated = [newEntry, ...entries];
    await FileManager.saveJournal(updated);

    return NextResponse.json(
      {
        success: true,
        entry: newEntry,
        message: "Trade journal record created successfully.",
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to record journal entry";
    return NextResponse.json({ success: false, error: msg }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Entry ID required" }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const entries = await FileManager.getJournal();
    const filtered = entries.filter((e) => e.id !== id);
    await FileManager.saveJournal(filtered);

    return NextResponse.json(
      {
        success: true,
        message: "Trade journal record removed.",
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete entry";
    return NextResponse.json({ success: false, error: msg }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
