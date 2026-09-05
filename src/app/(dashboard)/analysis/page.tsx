"use client";

import React, { useCallback } from "react";
import dynamic from "next/dynamic";
import { useMarketStore } from "@/stores/useMarketStore";
import { useAnalysisStore } from "@/stores/useAnalysisStore";
import { useRiskStore } from "@/stores/useRiskStore";
import { useUIStore } from "@/stores/useUIStore";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils/formatters";
import {
  BrainCircuit,
  Play,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Layers,
  Activity,
} from "lucide-react";

const TradingChart = dynamic(
  () => import("@/components/chart/TradingChart").then((mod) => mod.TradingChart),
  {
    ssr: false,
    loading: () => (
      <Card className="h-[380px] flex items-center justify-center text-xs text-neutral-500 font-mono">
        <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mr-2" />
        LOADING CHART ENGINE...
      </Card>
    ),
  }
);

export default function AnalysisPage() {
  const activeSymbol = useMarketStore((s) => s.activeSymbol);
  const activeTimeframe = useMarketStore((s) => s.activeTimeframe);
  const candles = useMarketStore((s) => s.candles);

  const aiAnalysis = useAnalysisStore((s) => s.aiAnalysis);
  const smcResult = useAnalysisStore((s) => s.smcResult);
  const indicators = useAnalysisStore((s) => s.indicators);
  const isAnalyzing = useAnalysisStore((s) => s.isAnalyzing);
  const setIsAnalyzing = useAnalysisStore((s) => s.setIsAnalyzing);
  const setAIAnalysis = useAnalysisStore((s) => s.setAIAnalysis);
  const setSMCResult = useAnalysisStore((s) => s.setSMCResult);
  const setIndicators = useAnalysisStore((s) => s.setIndicators);
  const setError = useAnalysisStore((s) => s.setError);

  const settings = useRiskStore((s) => s.settings);
  const tradingStatus = useRiskStore((s) => s.tradingStatus);
  const dailyTradeCount = useRiskStore((s) => s.dailyTradeCount);
  const dailyLossTotal = useRiskStore((s) => s.dailyLossTotal);

  const addToast = useUIStore((s) => s.addToast);

  const handleRunAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await fetch("/api/analysis/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: activeSymbol,
          timeframe: activeTimeframe,
          riskSettings: settings,
          dailyTradeCount,
          dailyLossTotal,
        }),
      });

      const json = await res.json();

      if (res.ok && json.success && json.data) {
        const pipelineOutput = json.data;
        setAIAnalysis(pipelineOutput.ai);
        setSMCResult(pipelineOutput.smc);
        setIndicators(pipelineOutput.indicators);
        addToast("success", `Analysis complete for ${activeSymbol}: ${pipelineOutput.ai.signal}`);
      } else {
        const errMsg = json.error || "Analysis pipeline failed";
        setError(errMsg);
        addToast("error", errMsg);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Pipeline execution failed";
      setError(msg);
      addToast("error", msg);
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    activeSymbol,
    activeTimeframe,
    settings,
    dailyTradeCount,
    dailyLossTotal,
    setIsAnalyzing,
    setError,
    setAIAnalysis,
    setSMCResult,
    setIndicators,
    addToast,
  ]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-mono">
      {/* Header action bar */}
      <div className="flex items-center justify-between bg-[#0A0A0A] p-4 rounded border border-[#1A1A1A]">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-100 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-emerald-400" />
            AI Market Analysis Engine
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Active: {activeSymbol} ({activeTimeframe}) • Strict Deterministic Validation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={handleRunAnalysis}
            isLoading={isAnalyzing}
            disabled={tradingStatus === "LOCKED"}
            className="flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Execute Analysis Pipeline</span>
          </Button>
        </div>
      </div>

      {/* Chart Section */}
      {candles.length > 0 && (
        <TradingChart
          symbol={activeSymbol}
          timeframe={activeTimeframe}
          candles={candles}
          smcResult={smcResult}
          indicators={indicators}
          aiAnalysis={aiAnalysis}
          height={380}
        />
      )}

      {/* Grid: Indicators, SMC, and AI Signal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Col: Indicators & SMC State */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-neutral-400" />
                <CardTitle>Technical Indicators</CardTitle>
              </div>
              <Badge variant="outline">DETERMINISTIC</Badge>
            </CardHeader>
            <div className="space-y-2 text-xs text-neutral-400">
              <div className="flex justify-between py-1 border-b border-[#141414]">
                <span>EMA (9 / 21):</span>
                <span className="text-neutral-200">
                  {indicators?.ema?.[9] ? `${indicators.ema[9]} / ${indicators.ema[21]}` : "COMPUTED ON RUN"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#141414]">
                <span>RSI (14):</span>
                <span className="text-neutral-200">
                  {indicators?.rsi !== undefined ? `${indicators.rsi}` : "--"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#141414]">
                <span>MACD Histogram:</span>
                <span
                  className={
                    (indicators?.macd?.histogram ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                  }
                >
                  {indicators?.macd?.histogram ?? "--"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#141414]">
                <span>ATR Volatility:</span>
                <span className="text-neutral-200">{indicators?.atr ?? "--"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>ADX Trend Strength:</span>
                <span className="text-neutral-200">
                  {indicators?.adx?.adx !== undefined ? `${indicators.adx.adx}` : "--"}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-neutral-400" />
                <CardTitle>Smart Money Structure</CardTitle>
              </div>
              <Badge
                variant={
                  smcResult?.marketStructure === "BULLISH"
                    ? "success"
                    : smcResult?.marketStructure === "BEARISH"
                    ? "danger"
                    : "outline"
                }
              >
                {smcResult?.marketStructure || "AWAITING RUN"}
              </Badge>
            </CardHeader>
            <div className="space-y-2 text-xs text-neutral-400">
              <div className="flex justify-between py-1 border-b border-[#141414]">
                <span>Order Blocks Detected:</span>
                <span className="text-neutral-200">
                  {smcResult?.zones?.filter((z) => z.type === "ORDER_BLOCK").length ?? 0}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#141414]">
                <span>Fair Value Gaps (FVG):</span>
                <span className="text-neutral-200">
                  {smcResult?.zones?.filter((z) => z.type === "FAIR_VALUE_GAP").length ?? 0}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#141414]">
                <span>Liquidity Sweeps:</span>
                <span className="text-neutral-200">
                  {smcResult?.liquidity?.filter((l) => l.swept).length ?? 0}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>Equilibrium Price:</span>
                <span className="text-neutral-200">
                  {smcResult?.equilibriumPrice ? formatPrice(smcResult.equilibriumPrice, activeSymbol) : "--"}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right 2 Cols: AI Reasoning & Trade Validation */}
        <Card className="lg:col-span-2 space-y-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-emerald-400" />
              <CardTitle>AI Reasoning & Setup</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">Provider: OmniRoute</span>
              <Badge
                variant={
                  aiAnalysis?.signal === "BUY"
                    ? "success"
                    : aiAnalysis?.signal === "SELL"
                    ? "danger"
                    : "warning"
                }
                size="md"
              >
                {aiAnalysis?.signal || "NO_TRADE"}
              </Badge>
            </div>
          </CardHeader>

          {aiAnalysis ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#0D0D0D] border border-[#1A1A1A] rounded space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">
                    Setup: {aiAnalysis.setupName || "None"}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    Confidence: {aiAnalysis.confidenceScore}%
                  </span>
                </div>
                <p className="text-neutral-200 leading-relaxed">
                  {aiAnalysis.reasoningSummary}
                </p>
              </div>

              {/* Trade execution parameters */}
              {aiAnalysis.signal !== "NO_TRADE" && aiAnalysis.entryZone && (
                <div className="grid grid-cols-3 gap-2 p-3 bg-[#0C150E] border border-emerald-900/40 rounded text-neutral-200">
                  <div>
                    <div className="text-[10px] text-emerald-400 font-bold uppercase">Optimal Entry</div>
                    <div className="text-sm font-bold tabular-nums">
                      {formatPrice(aiAnalysis.entryZone.optimal, activeSymbol)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-rose-400 font-bold uppercase">Stop Loss</div>
                    <div className="text-sm font-bold tabular-nums text-rose-400">
                      {aiAnalysis.stopLoss ? formatPrice(aiAnalysis.stopLoss, activeSymbol) : "--"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-400 font-bold uppercase">Take Profit 1</div>
                    <div className="text-sm font-bold tabular-nums text-emerald-400">
                      {aiAnalysis.takeProfit1 ? formatPrice(aiAnalysis.takeProfit1, activeSymbol) : "--"}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">
                  Validation Reasons:
                </div>
                <ul className="space-y-1 text-neutral-300">
                  {aiAnalysis.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">
                  Invalidation Conditions:
                </div>
                <ul className="space-y-1 text-neutral-300">
                  {aiAnalysis.invalidationConditions.map((ic, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>{ic}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">
                  Warnings & Risk Notes:
                </div>
                <ul className="space-y-1 text-amber-300">
                  {aiAnalysis.warnings.map((w, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-xs text-neutral-500 gap-2">
              <BrainCircuit className="w-8 h-8 text-neutral-700" />
              <span>Click &quot;Execute Analysis Pipeline&quot; to run live analysis across indicators, SMC, and AI.</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
