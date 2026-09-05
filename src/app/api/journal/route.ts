import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { FileManager } from "@/lib/storage/file-manager";
import { JournalEntry, TradeResult } from "@/types/journal";
import { PerformanceSummary } from "@/types/analytics";
import { SupportedSymbol, Timeframe } from "@/types/market";

function calculatePerformanceSummary(entries: JournalEntry[]): PerformanceSummary {
  const totalTrades = entries.length;
  if (totalTrades === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
      winRatePercent: 0,
      lossRatePercent: 0,
      totalPnL: 0,
      totalPnLPercent: 0,
      averageRR: 0,
      profitFactor: 0,
      maxDrawdownPercent: 0,
      tradesToday: 0,
    };
  }

  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;
  let totalPnL = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let rrSum = 0;
  let rrCount = 0;
  let peakPnL = 0;
  let maxDrawdown = 0;
  let runningPnL = 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  let tradesToday = 0;

  // Chronological sort for drawdown tracking
  const chronological = [...entries].sort(
    (a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime()
  );

  for (const entry of chronological) {
    const pnl = entry.pnl ?? 0;
    totalPnL += pnl;
    runningPnL += pnl;

    if (runningPnL > peakPnL) {
      peakPnL = runningPnL;
    }
    const currentDrawdown = peakPnL - runningPnL;
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }

    if (entry.result === "WIN" || pnl > 0) {
      winningTrades++;
      grossProfit += pnl > 0 ? pnl : 0;
    } else if (entry.result === "LOSS" || pnl < 0) {
      losingTrades++;
      grossLoss += Math.abs(pnl);
    } else {
      breakevenTrades++;
    }

    if (entry.riskReward && entry.riskReward > 0) {
      rrSum += entry.riskReward;
      rrCount++;
    }

    if (entry.openedAt && entry.openedAt.startsWith(todayStr)) {
      tradesToday++;
    }
  }

  const decisiveTrades = winningTrades + losingTrades;
  const winRatePercent = decisiveTrades > 0 ? Number(((winningTrades / decisiveTrades) * 100).toFixed(1)) : 0;
  const lossRatePercent = decisiveTrades > 0 ? Number(((losingTrades / decisiveTrades) * 100).toFixed(1)) : 0;
  const averageRR = rrCount > 0 ? Number((rrSum / rrCount).toFixed(2)) : 0;
  const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? Number(grossProfit.toFixed(2)) : 0;
  const maxDrawdownPercent = peakPnL > 0 ? Number(((maxDrawdown / peakPnL) * 100).toFixed(1)) : 0;
  const totalPnLPercent = Number(((totalPnL / 10000) * 100).toFixed(1)); // based on standard account

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    breakevenTrades,
    winRatePercent,
    lossRatePercent,
    totalPnL: Number(totalPnL.toFixed(2)),
    totalPnLPercent,
    averageRR,
    profitFactor,
    maxDrawdownPercent,
    tradesToday,
  };
}

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const entries = await FileManager.getJournal();
    // Default seed entry if empty
    if (entries.length === 0) {
      const defaultEntry: JournalEntry = {
        id: "entry_seed_001",
        userId: session.userId,
        symbol: "EURUSD",
        direction: "BUY",
        timeframe: "15m",
        entryPrice: 1.085,
        stopLoss: 1.082,
        takeProfit1: 1.091,
        exitPrice: 1.091,
        positionSize: 100000,
        riskReward: 2.0,
        pnl: 600,
        pnlPercent: 2.0,
        result: "WIN",
        setupType: "OB + Liquidity Sweep",
        notes: "Clean London session sweep followed by displacement.",
        openedAt: new Date(Date.now() - 86400000).toISOString(),
        closedAt: new Date(Date.now() - 72000000).toISOString(),
      };
      await FileManager.saveJournal([defaultEntry]);
      entries.push(defaultEntry);
    }

    const sortedEntries = [...entries].sort(
      (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
    );
    const summary = calculatePerformanceSummary(sortedEntries);

    return NextResponse.json({
      success: true,
      entries: sortedEntries,
      summary,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load journal";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
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
    } = body as {
      symbol: SupportedSymbol;
      direction: "BUY" | "SELL";
      timeframe: Timeframe;
      entryPrice: number;
      stopLoss: number;
      takeProfit1: number;
      exitPrice?: number;
      positionSize?: number;
      riskReward?: number;
      pnl?: number;
      pnlPercent?: number;
      result: TradeResult;
      setupType: string;
      notes?: string;
    };

    if (!symbol || !direction || !entryPrice || !stopLoss || !takeProfit1) {
      return NextResponse.json(
        { success: false, error: "Symbol, direction, entry, stop loss, and take profit are required." },
        { status: 400 }
      );
    }

    const numEntry = parseFloat(String(entryPrice));
    const numSL = parseFloat(String(stopLoss));
    const numTP = parseFloat(String(takeProfit1));
    const numExit = exitPrice ? parseFloat(String(exitPrice)) : undefined;
    const numSize = positionSize ? parseFloat(String(positionSize)) : 100000;

    const riskDist = Math.abs(numEntry - numSL);
    const rewardDist = Math.abs(numTP - numEntry);
    const calculatedRR = riskReward
      ? parseFloat(String(riskReward))
      : riskDist > 0
      ? Number((rewardDist / riskDist).toFixed(2))
      : 1.5;

    let finalPnL = pnl !== undefined ? parseFloat(String(pnl)) : 0;
    if (pnl === undefined && numExit) {
      finalPnL = (numExit - numEntry) * (direction === "BUY" ? 1 : -1) * (numSize / 100);
    } else if (pnl === undefined) {
      finalPnL = result === "WIN" ? 450 : result === "LOSS" ? -200 : 0;
    }

    const finalPnLPercent = pnlPercent !== undefined
      ? parseFloat(String(pnlPercent))
      : Number(((finalPnL / 10000) * 100).toFixed(2));

    const newEntry: JournalEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: session.userId,
      symbol: symbol || "EURUSD",
      direction: direction || "BUY",
      timeframe: timeframe || "15m",
      entryPrice: numEntry,
      stopLoss: numSL,
      takeProfit1: numTP,
      exitPrice: numExit,
      positionSize: numSize,
      riskReward: calculatedRR,
      pnl: Number(finalPnL.toFixed(2)),
      pnlPercent: finalPnLPercent,
      result: result || (finalPnL > 0 ? "WIN" : finalPnL < 0 ? "LOSS" : "BREAKEVEN"),
      setupType: setupType?.trim() || "Order Block + Liquidity Sweep",
      notes: notes?.trim() || "",
      openedAt: new Date().toISOString(),
      closedAt: numExit ? new Date().toISOString() : undefined,
    };

    const entries = await FileManager.getJournal();
    const updated = [newEntry, ...entries];
    await FileManager.saveJournal(updated);

    return NextResponse.json({
      success: true,
      entry: newEntry,
      message: "Trade journal record created successfully.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to record journal entry";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Entry ID required" }, { status: 400 });
    }

    const entries = await FileManager.getJournal();
    const filtered = entries.filter((e) => e.id !== id);
    await FileManager.saveJournal(filtered);

    return NextResponse.json({
      success: true,
      message: "Trade journal record removed.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete entry";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
