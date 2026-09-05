import React from "react";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatPercent } from "@/lib/utils/formatters";
import { BarChart3 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EXENOS | Analytics & Performance",
  description: "Discipline metrics, win rate analytics, and strategy verification.",
};

export default function AnalyticsPage() {
  const summary = {
    totalTrades: 24,
    winningTrades: 17,
    losingTrades: 6,
    breakevenTrades: 1,
    winRatePercent: 70.8,
    totalPnL: 3450,
    totalPnLPercent: 34.5,
    averageRR: 2.3,
    profitFactor: 2.85,
    maxDrawdownPercent: 3.2,
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-mono">
      <div className="flex items-center justify-between bg-[#0A0A0A] p-4 rounded border border-[#1A1A1A]">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Performance & Analytics
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Discipline Metrics & Strategy Validation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="p-3.5">
          <div className="text-[10px] text-neutral-500 uppercase">Win Rate</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {formatPercent(summary.winRatePercent, false)}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            {summary.winningTrades} W / {summary.losingTrades} L / {summary.breakevenTrades} BE
          </div>
        </Card>

        <Card className="p-3.5">
          <div className="text-[10px] text-neutral-500 uppercase">Net Profit / PnL</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {formatCurrency(summary.totalPnL)}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            {formatPercent(summary.totalPnLPercent)} on Account
          </div>
        </Card>

        <Card className="p-3.5">
          <div className="text-[10px] text-neutral-500 uppercase">Profit Factor</div>
          <div className="text-xl font-bold text-neutral-100 mt-1">
            {summary.profitFactor}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            Avg RR: 1:{summary.averageRR}
          </div>
        </Card>

        <Card className="p-3.5">
          <div className="text-[10px] text-neutral-500 uppercase">Max Drawdown</div>
          <div className="text-xl font-bold text-rose-400 mt-1">
            {formatPercent(summary.maxDrawdownPercent, false)}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            Limit: 3.0% Daily
          </div>
        </Card>
      </div>
    </div>
  );
}
