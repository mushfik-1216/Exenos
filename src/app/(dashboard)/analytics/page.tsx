"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatPercent } from "@/lib/utils/formatters";
import {
  BarChart3,
  TrendingUp,
  Target,
  Shield,
  Activity,
  Layers,
  Award,
} from "lucide-react";
import { PerformanceSummary } from "@/types/analytics";
import { JournalEntry } from "@/types/journal";

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/journal");
      const json = await res.json();
      if (res.ok && json.success) {
        setSummary(json.summary);
        setEntries(json.entries || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Derive Pair Breakdown
  const pairStats = React.useMemo(() => {
    const map = new Map<string, { trades: number; wins: number; pnl: number }>();
    for (const e of entries) {
      const current = map.get(e.symbol) || { trades: 0, wins: 0, pnl: 0 };
      current.trades++;
      if (e.result === "WIN" || (e.pnl ?? 0) > 0) current.wins++;
      current.pnl += e.pnl ?? 0;
      map.set(e.symbol, current);
    }
    return Array.from(map.entries()).map(([symbol, stat]) => ({
      symbol,
      trades: stat.trades,
      winRate: Number(((stat.wins / stat.trades) * 100).toFixed(1)),
      pnl: Number(stat.pnl.toFixed(2)),
    }));
  }, [entries]);

  // Derive Setup Breakdown
  const setupStats = React.useMemo(() => {
    const map = new Map<string, { trades: number; wins: number; pnl: number }>();
    for (const e of entries) {
      const setup = e.setupType || "Standard";
      const current = map.get(setup) || { trades: 0, wins: 0, pnl: 0 };
      current.trades++;
      if (e.result === "WIN" || (e.pnl ?? 0) > 0) current.wins++;
      current.pnl += e.pnl ?? 0;
      map.set(setup, current);
    }
    return Array.from(map.entries()).map(([setup, stat]) => ({
      setup,
      trades: stat.trades,
      winRate: Number(((stat.wins / stat.trades) * 100).toFixed(1)),
      pnl: Number(stat.pnl.toFixed(2)),
    }));
  }, [entries]);

  const s = summary || {
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

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-mono">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#0A0A0A] p-4 rounded border border-[#1A1A1A]">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Performance & Strategy Analytics
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time metric synchronization computed from trade journal execution logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {isLoading ? "SYNCING..." : `${s.totalTrades} EXECUTED TRADES`}
          </Badge>
        </div>
      </div>

      {/* Top 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Stat 1: Win Rate */}
        <Card className="p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Win Rate</span>
            <Target className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 tabular-nums">
            {formatPercent(s.winRatePercent, false)}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1 flex items-center justify-between">
            <span>{s.winningTrades} W / {s.losingTrades} L / {s.breakevenTrades} BE</span>
            <span>Total: {s.totalTrades}</span>
          </div>
        </Card>

        {/* Stat 2: Total Net PnL */}
        <Card className="p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Net Realized PnL</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div
            className={`text-2xl font-bold mt-1 tabular-nums ${
              s.totalPnL >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatCurrency(s.totalPnL)}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1 flex items-center justify-between">
            <span>{formatPercent(s.totalPnLPercent)} Account Gain</span>
            <span>Ref Balance: $10,000</span>
          </div>
        </Card>

        {/* Stat 3: Profit Factor & Avg RR */}
        <Card className="p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Profit Factor</span>
            <Award className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold text-neutral-100 mt-1 tabular-nums">
            {s.profitFactor}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1 flex items-center justify-between">
            <span>Avg Risk:Reward</span>
            <span className="text-neutral-200 font-bold">1:{s.averageRR}</span>
          </div>
        </Card>

        {/* Stat 4: Max Drawdown */}
        <Card className="p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Peak Drawdown</span>
            <Shield className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-1 tabular-nums">
            {formatPercent(s.maxDrawdownPercent, false)}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1 flex items-center justify-between">
            <span>Daily Loss Limit</span>
            <span className="text-neutral-400">3.0% Max DD</span>
          </div>
        </Card>
      </div>

      {/* Grid: Strategy Performance & Symbol Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pair Performance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <CardTitle>Asset & Pair Breakdown</CardTitle>
            </div>
            <Badge variant="outline">{pairStats.length} SYMBOLS</Badge>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-neutral-500 border-b border-[#1A1A1A] text-left text-[10px]">
                  <th className="py-2 px-2.5">SYMBOL</th>
                  <th className="py-2 px-2.5">TRADES</th>
                  <th className="py-2 px-2.5">WIN RATE</th>
                  <th className="py-2 px-2.5 text-right">NET PNL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]">
                {pairStats.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-neutral-500 text-xs">
                      No symbol history available.
                    </td>
                  </tr>
                ) : (
                  pairStats.map((item) => (
                    <tr key={item.symbol} className="hover:bg-[#0E0E0E]">
                      <td className="py-2 px-2.5 font-semibold text-neutral-200">{item.symbol}</td>
                      <td className="py-2 px-2.5 text-neutral-400">{item.trades}</td>
                      <td className="py-2 px-2.5 text-emerald-400 font-medium">
                        {item.winRate}%
                      </td>
                      <td
                        className={`py-2 px-2.5 text-right tabular-nums font-semibold ${
                          item.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {formatCurrency(item.pnl)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Strategy Setup Performance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <CardTitle>Strategy & Setup Validation</CardTitle>
            </div>
            <Badge variant="outline">{setupStats.length} SETUPS</Badge>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-neutral-500 border-b border-[#1A1A1A] text-left text-[10px]">
                  <th className="py-2 px-2.5">SETUP PATTERN</th>
                  <th className="py-2 px-2.5">TRADES</th>
                  <th className="py-2 px-2.5">WIN RATE</th>
                  <th className="py-2 px-2.5 text-right">NET PNL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]">
                {setupStats.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-neutral-500 text-xs">
                      No setup history logged yet.
                    </td>
                  </tr>
                ) : (
                  setupStats.map((item) => (
                    <tr key={item.setup} className="hover:bg-[#0E0E0E]">
                      <td className="py-2 px-2.5 font-semibold text-neutral-200 max-w-[180px] truncate">
                        {item.setup}
                      </td>
                      <td className="py-2 px-2.5 text-neutral-400">{item.trades}</td>
                      <td className="py-2 px-2.5 text-emerald-400 font-medium">
                        {item.winRate}%
                      </td>
                      <td
                        className={`py-2 px-2.5 text-right tabular-nums font-semibold ${
                          item.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {formatCurrency(item.pnl)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
