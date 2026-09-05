"use client";

import React, { useState, memo } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatPrice, formatDateTime } from "@/lib/utils/formatters";
import { BookOpen, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { JournalEntry } from "@/types/journal";

const INITIAL_ENTRIES: JournalEntry[] = [
  {
    id: "entry_001",
    userId: "user_admin_001",
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
  },
];

const JournalRow = memo<{ entry: JournalEntry }>(({ entry }) => {
  const isBuy = entry.direction === "BUY";
  const pnl = entry.pnl ?? 0;
  const isPositive = pnl >= 0;

  return (
    <tr className="hover:bg-[#0E0E0E]">
      <td className="py-2 px-3 text-neutral-400">{formatDateTime(entry.openedAt)}</td>
      <td className="py-2 px-3 font-semibold text-neutral-200">{entry.symbol}</td>
      <td className="py-2 px-3">
        <span
          className={`inline-flex items-center gap-0.5 font-bold ${
            isBuy ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {isBuy ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : (
            <ArrowDownRight className="w-3 h-3" />
          )}
          {entry.direction}
        </span>
      </td>
      <td className="py-2 px-3 tabular-nums">{formatPrice(entry.entryPrice, entry.symbol)}</td>
      <td className="py-2 px-3 tabular-nums text-rose-400/80">{formatPrice(entry.stopLoss, entry.symbol)}</td>
      <td className="py-2 px-3 tabular-nums text-emerald-400/80">{formatPrice(entry.takeProfit1, entry.symbol)}</td>
      <td className="py-2 px-3 tabular-nums text-neutral-300">
        {entry.exitPrice ? formatPrice(entry.exitPrice, entry.symbol) : "--"}
      </td>
      <td className="py-2 px-3 tabular-nums">1:{entry.riskReward}</td>
      <td className="py-2 px-3">
        <Badge variant={entry.result === "WIN" ? "success" : entry.result === "LOSS" ? "danger" : "outline"}>
          {entry.result}
        </Badge>
      </td>
      <td
        className={`py-2 px-3 text-right tabular-nums font-semibold ${
          isPositive ? "text-emerald-400" : "text-rose-400"
        }`}
      >
        {entry.pnl !== undefined ? formatCurrency(entry.pnl) : "--"}
      </td>
    </tr>
  );
});
JournalRow.displayName = "JournalRow";

export default function JournalPage() {
  const [entries] = useState<JournalEntry[]>(INITIAL_ENTRIES);

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-mono">
      <div className="flex items-center justify-between bg-[#0A0A0A] p-4 rounded border border-[#1A1A1A]">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            Trading Journal
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Deterministic Trade Log & Retrospective AI Review
          </p>
        </div>

        <Button variant="primary" size="sm" className="flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          <span>New Journal Entry</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trade History & Execution Records</CardTitle>
          <span className="text-xs text-neutral-500">{entries.length} Logged Trades</span>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-neutral-500 border-b border-[#1A1A1A] text-left text-[11px]">
                <th className="py-2 px-3">DATE</th>
                <th className="py-2 px-3">PAIR</th>
                <th className="py-2 px-3">DIR</th>
                <th className="py-2 px-3">ENTRY</th>
                <th className="py-2 px-3">SL</th>
                <th className="py-2 px-3">TP</th>
                <th className="py-2 px-3">EXIT</th>
                <th className="py-2 px-3">RR</th>
                <th className="py-2 px-3">RESULT</th>
                <th className="py-2 px-3 text-right">PNL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]">
              {entries.map((entry) => (
                <JournalRow key={entry.id} entry={entry} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
