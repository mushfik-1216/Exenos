"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { useMarketStore } from "@/stores/useMarketStore";
import { useRiskStore } from "@/stores/useRiskStore";
import { useAnalysisStore } from "@/stores/useAnalysisStore";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPrice, formatPercent, formatCurrency } from "@/lib/utils/formatters";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";

const TradingChart = dynamic(
  () => import("@/components/chart/TradingChart").then((mod) => mod.TradingChart),
  {
    ssr: false,
    loading: () => (
      <Card className="h-[460px] flex items-center justify-center text-xs text-neutral-500 font-mono">
        <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mr-2" />
        LOADING CHART ENGINE...
      </Card>
    ),
  }
);

export default function DashboardOverviewPage() {
  const activeSymbol = useMarketStore((s) => s.activeSymbol);
  const activeTimeframe = useMarketStore((s) => s.activeTimeframe);
  const quote = useMarketStore((s) => s.quote);
  const candles = useMarketStore((s) => s.candles);
  const isLoadingCandles = useMarketStore((s) => s.isLoadingCandles);

  const settings = useRiskStore((s) => s.settings);
  const tradingStatus = useRiskStore((s) => s.tradingStatus);
  const dailyTradeCount = useRiskStore((s) => s.dailyTradeCount);
  const dailyLossTotal = useRiskStore((s) => s.dailyLossTotal);

  const aiAnalysis = useAnalysisStore((s) => s.aiAnalysis);
  const smcResult = useAnalysisStore((s) => s.smcResult);
  const indicators = useAnalysisStore((s) => s.indicators);

  const { lastCandle, isUp } = useMemo(() => {
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    const up = last && prev ? last.close >= prev.close : true;
    return { lastCandle: last, isUp: up };
  }, [candles]);

  const maxDailyLossDollars = useMemo(() => {
    return (settings.accountBalance * settings.dailyLossLimitPercent) / 100;
  }, [settings.accountBalance, settings.dailyLossLimitPercent]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-mono">
      {/* Top Stat Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Stat 1: Live Market Price */}
        <Card className="p-3.5">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
            {activeSymbol} Spot Price
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-neutral-100 tabular-nums">
              {formatPrice(quote?.price ?? lastCandle?.close ?? 0, activeSymbol)}
            </span>
            <div className="flex items-center text-xs">
              {isUp ? (
                <span className="text-emerald-400 flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {quote?.changePercent24h ? formatPercent(quote.changePercent24h) : "+0.00%"}
                </span>
              ) : (
                <span className="text-rose-400 flex items-center">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  {quote?.changePercent24h ? formatPercent(quote.changePercent24h) : "+0.00%"}
                </span>
              )}
            </div>
          </div>
          <div className="text-[10px] text-neutral-500 mt-1 flex items-center justify-between">
            <span>TF: {activeTimeframe}</span>
            <span>24h H: {quote?.high24h ? formatPrice(quote.high24h, activeSymbol) : "--"}</span>
          </div>
        </Card>

        {/* Stat 2: Daily Risk & Trade Cap */}
        <Card className="p-3.5">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
            Disciplined Trade Cap
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-neutral-100 tabular-nums">
              {dailyTradeCount} / {settings.maxTradesPerDay}
            </span>
            <Badge
              variant={
                tradingStatus === "ACTIVE"
                  ? "success"
                  : tradingStatus === "WARNING"
                  ? "warning"
                  : "danger"
              }
            >
              {tradingStatus}
            </Badge>
          </div>
          <div className="text-[10px] text-neutral-500 mt-1 flex items-center justify-between">
            <span>Risk/Trade: {settings.riskPerTradePercent}%</span>
            <span>Remaining: {Math.max(0, settings.maxTradesPerDay - dailyTradeCount)}</span>
          </div>
        </Card>

        {/* Stat 3: Daily Drawdown Guard */}
        <Card className="p-3.5">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
            Daily Loss Shield
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-neutral-100 tabular-nums">
              {formatCurrency(dailyLossTotal)}
            </span>
            <span className="text-xs text-neutral-400 tabular-nums">
              / {formatCurrency(maxDailyLossDollars)}
            </span>
          </div>
          <div className="text-[10px] text-neutral-500 mt-1 flex items-center justify-between">
            <span>Max DD: {settings.dailyLossLimitPercent}%</span>
            <span>Balance: {formatCurrency(settings.accountBalance)}</span>
          </div>
        </Card>

        {/* Stat 4: SMC Market Structure */}
        <Card className="p-3.5">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
            SMC Structure Bias
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-neutral-100">
              {smcResult?.marketStructure || "ANALYZING..."}
            </span>
            <Badge variant={smcResult?.marketStructure === "BULLISH" ? "success" : smcResult?.marketStructure === "BEARISH" ? "danger" : "outline"}>
              {smcResult?.zones?.length ?? 0} ZONES
            </Badge>
          </div>
          <div className="text-[10px] text-neutral-500 mt-1 flex items-center justify-between">
            <span>Swings: {smcResult?.swings?.length ?? 0}</span>
            <span>Events: {smcResult?.events?.length ?? 0}</span>
          </div>
        </Card>
      </div>

      {/* Main Grid: Interactive Trading Chart & Pipeline Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Interactive Lightweight Chart */}
        <div className="lg:col-span-2 space-y-2">
          {isLoadingCandles ? (
            <Card className="h-[460px] flex items-center justify-center text-xs text-neutral-500">
              <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mr-2" />
              STREAMING MARKET CANDLES...
            </Card>
          ) : candles.length > 0 ? (
            <TradingChart
              symbol={activeSymbol}
              timeframe={activeTimeframe}
              candles={candles}
              smcResult={smcResult}
              indicators={indicators}
              aiAnalysis={aiAnalysis}
              height={420}
            />
          ) : (
            <Card className="h-[460px] flex items-center justify-center text-xs text-neutral-500">
              NO MARKET DATA AVAILABLE FOR {activeSymbol}
            </Card>
          )}
        </div>

        {/* Right 1 Col: Execution Pipeline & Rules */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Mandatory Pipeline</CardTitle>
            <Badge variant="outline">STRICT</Badge>
          </CardHeader>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 p-2 rounded bg-[#0D0D0D] border border-[#1C1C1C]">
              <span className="w-5 h-5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                1
              </span>
              <div className="flex-1">
                <div className="font-semibold text-neutral-200">Market Data Ingestion</div>
                <div className="text-[10px] text-neutral-500">Priority: TV → Yahoo → Alpha Vantage</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded bg-[#0D0D0D] border border-[#1C1C1C]">
              <span className="w-5 h-5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                2
              </span>
              <div className="flex-1">
                <div className="font-semibold text-neutral-200">Technical Indicators</div>
                <div className="text-[10px] text-neutral-500">Deterministic EMA, RSI, MACD, ATR, ADX</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded bg-[#0D0D0D] border border-[#1C1C1C]">
              <span className="w-5 h-5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                3
              </span>
              <div className="flex-1">
                <div className="font-semibold text-neutral-200">Smart Money Concepts</div>
                <div className="text-[10px] text-neutral-500">BOS, CHOCH, FVG, Liquidity Sweeps</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded bg-[#0D0D0D] border border-[#1C1C1C]">
              <span className="w-5 h-5 rounded bg-sky-950/60 border border-sky-800 text-sky-400 flex items-center justify-center text-[10px] font-bold">
                4
              </span>
              <div className="flex-1">
                <div className="font-semibold text-neutral-200">OmniRoute AI Reasoning</div>
                <div className="text-[10px] text-neutral-500">Context reasoning & NO_TRADE support</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded bg-[#0D0D0D] border border-[#1C1C1C]">
              <span className="w-5 h-5 rounded bg-amber-950/60 border border-amber-800 text-amber-400 flex items-center justify-center text-[10px] font-bold">
                5
              </span>
              <div className="flex-1">
                <div className="font-semibold text-neutral-200">Deterministic Risk Guard</div>
                <div className="text-[10px] text-neutral-500">Position sizing & trade limits check</div>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/analysis" className="block">
                <Button variant="primary" size="sm" className="w-full">
                  Run Full Analysis Engine
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
