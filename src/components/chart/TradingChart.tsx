"use client";

import React, { useEffect, useRef, useState, useMemo, memo } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  IPriceLine,
  CandlestickData,
  LineData,
  SeriesMarker,
  Time,
  LineStyle,
} from "lightweight-charts";
import { Candle, SupportedSymbol, Timeframe } from "@/types/market";
import { SMCAnalysisResult } from "@/types/smc";
import { TechnicalIndicatorsResult } from "@/types/indicators";
import { AIAnalysisResponse } from "@/types/ai";
import { calculateEMA } from "@/lib/indicators/ema";
import { Eye, EyeOff } from "lucide-react";

interface TradingChartProps {
  symbol: SupportedSymbol;
  timeframe: Timeframe;
  candles: Candle[];
  smcResult?: SMCAnalysisResult | null;
  indicators?: TechnicalIndicatorsResult | null;
  aiAnalysis?: AIAnalysisResponse | null;
  height?: number;
}

const TradingChartComponent: React.FC<TradingChartProps> = ({
  symbol,
  timeframe,
  candles,
  smcResult,
  indicators,
  aiAnalysis,
  height = 420,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const ema9SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ema21SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);

  const [showEMAs, setShowEMAs] = useState(true);
  const [showSMC, setShowSMC] = useState(true);
  const [showTargets, setShowTargets] = useState(true);

  // Memoize unique sorted candles strictly in ascending time order
  const { uniqueCandles, seenTimes } = useMemo(() => {
    if (!candles || candles.length === 0) {
      return { uniqueCandles: [], seenTimes: new Set<number>() };
    }

    // Filter valid numeric entries
    const valid = candles.filter(
      (c) =>
        c &&
        typeof c.time === "number" &&
        !isNaN(c.time) &&
        !isNaN(c.open) &&
        !isNaN(c.high) &&
        !isNaN(c.low) &&
        !isNaN(c.close)
    );

    // Sort strictly ascending
    valid.sort((a, b) => a.time - b.time);

    const unique: Candle[] = [];
    const seen = new Set<number>();

    for (let i = 0; i < valid.length; i++) {
      const c = valid[i];
      // Strictly enforce ascending timestamp with no duplicates
      if (unique.length > 0 && c.time <= unique[unique.length - 1].time) {
        continue;
      }
      seen.add(c.time);
      unique.push(c);
    }

    return { uniqueCandles: unique, seenTimes: seen };
  }, [candles]);

  // Memoize calculated EMAs based on uniqueCandles
  const { ema9Data, ema21Data } = useMemo(() => {
    if (uniqueCandles.length < 9) {
      return { ema9Data: [], ema21Data: [] };
    }

    try {
      const ema9Vals = calculateEMA(uniqueCandles, 9);
      const ema21Vals = calculateEMA(uniqueCandles, 21);

      const offset9 = uniqueCandles.length - ema9Vals.length;
      const offset21 = uniqueCandles.length - ema21Vals.length;

      const data9: LineData<Time>[] = [];
      for (let i = 0; i < ema9Vals.length; i++) {
        data9.push({
          time: (uniqueCandles[i + offset9].time as unknown) as Time,
          value: ema9Vals[i],
        });
      }

      const data21: LineData<Time>[] = [];
      for (let i = 0; i < ema21Vals.length; i++) {
        data21.push({
          time: (uniqueCandles[i + offset21].time as unknown) as Time,
          value: ema21Vals[i],
        });
      }

      return { ema9Data: data9, ema21Data: data21 };
    } catch {
      return { ema9Data: [], ema21Data: [] };
    }
  }, [uniqueCandles]);

  // Initialize Chart
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    try {
      const chart = createChart(container, {
        width: container.clientWidth || 600,
        height: height,
        layout: {
          background: { color: "#080808" },
          textColor: "#9CA3AF",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: "#141414" },
          horzLines: { color: "#141414" },
        },
        crosshair: {
          vertLine: {
            color: "#2E2E2E",
            width: 1,
            style: LineStyle.Dashed,
            labelBackgroundColor: "#1F1F1F",
          },
          horzLine: {
            color: "#2E2E2E",
            width: 1,
            style: LineStyle.Dashed,
            labelBackgroundColor: "#1F1F1F",
          },
        },
        timeScale: {
          borderColor: "#1A1A1A",
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: "#1A1A1A",
          autoScale: true,
        },
      });

      const candleSeries = chart.addCandlestickSeries({
        upColor: "#22C55E",
        downColor: "#EF4444",
        borderVisible: false,
        wickUpColor: "#22C55E",
        wickDownColor: "#EF4444",
      });

      const ema9Series = chart.addLineSeries({
        color: "#00E599",
        lineWidth: 1,
        title: "EMA 9",
      });

      const ema21Series = chart.addLineSeries({
        color: "#F59E0B",
        lineWidth: 1,
        title: "EMA 21",
      });

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;
      ema9SeriesRef.current = ema9Series;
      ema21SeriesRef.current = ema21Series;

      let animationFrameId: number;
      const resizeObserver = new ResizeObserver((entries) => {
        if (!entries || entries.length === 0 || !chartRef.current) return;
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => {
          if (chartContainerRef.current && chartRef.current) {
            chartRef.current.applyOptions({
              width: chartContainerRef.current.clientWidth,
            });
          }
        });
      });

      resizeObserver.observe(container);

      return () => {
        cancelAnimationFrame(animationFrameId);
        resizeObserver.disconnect();
        priceLinesRef.current = [];
        chart.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
        ema9SeriesRef.current = null;
        ema21SeriesRef.current = null;
      };
    } catch (err) {
      console.warn("Chart initialization notice:", err);
    }
  }, [height]);

  // Update Data & Real-time Candles smoothly and safely
  useEffect(() => {
    if (!candleSeriesRef.current || !chartRef.current || uniqueCandles.length === 0) return;

    try {
      const candleData: CandlestickData<Time>[] = uniqueCandles.map((c) => ({
        time: (c.time as unknown) as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      // Safe, crash-free dataset synchronization
      candleSeriesRef.current.setData(candleData);

      // EMAs
      if (showEMAs && ema9SeriesRef.current && ema21SeriesRef.current) {
        ema9SeriesRef.current.setData(ema9Data);
        ema21SeriesRef.current.setData(ema21Data);
      } else if (ema9SeriesRef.current && ema21SeriesRef.current) {
        ema9SeriesRef.current.setData([]);
        ema21SeriesRef.current.setData([]);
      }

      // SMC Markers (BOS, CHOCH, Liquidity Sweeps)
      if (showSMC && smcResult) {
        const markers: SeriesMarker<Time>[] = [];

        if (Array.isArray(smcResult.events)) {
          for (let i = 0; i < smcResult.events.length; i++) {
            const ev = smcResult.events[i];
            if (ev && seenTimes.has(ev.breakTime)) {
              markers.push({
                time: (ev.breakTime as unknown) as Time,
                position: ev.direction === "BULLISH" ? "belowBar" : "aboveBar",
                color: ev.direction === "BULLISH" ? "#22C55E" : "#EF4444",
                shape: ev.direction === "BULLISH" ? "arrowUp" : "arrowDown",
                text: `${ev.type} (${ev.direction[0]})`,
              });
            }
          }
        }

        if (Array.isArray(smcResult.liquidity)) {
          for (let i = 0; i < smcResult.liquidity.length; i++) {
            const liq = smcResult.liquidity[i];
            if (liq && liq.swept && liq.sweepTime && seenTimes.has(liq.sweepTime)) {
              markers.push({
                time: (liq.sweepTime as unknown) as Time,
                position:
                  liq.type?.includes("BUY") || liq.type?.includes("HIGH")
                    ? "aboveBar"
                    : "belowBar",
                color: "#F59E0B",
                shape: "circle",
                text: "SWEEP",
              });
            }
          }
        }

        markers.sort((a, b) => Number(a.time) - Number(b.time));
        candleSeriesRef.current.setMarkers(markers);
      } else {
        candleSeriesRef.current.setMarkers([]);
      }

      // Clear previous price lines
      if (candleSeriesRef.current && priceLinesRef.current.length > 0) {
        priceLinesRef.current.forEach((pl) => {
          try {
            candleSeriesRef.current?.removePriceLine(pl);
          } catch {
            // ignore
          }
        });
        priceLinesRef.current = [];
      }

      // Trade Levels (Entry, SL, TP)
      if (
        showTargets &&
        aiAnalysis &&
        aiAnalysis.signal !== "NO_TRADE" &&
        candleSeriesRef.current
      ) {
        if (aiAnalysis.entryZone?.optimal) {
          const entryLine = candleSeriesRef.current.createPriceLine({
            price: aiAnalysis.entryZone.optimal,
            color: "#00E599",
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: "ENTRY",
          });
          priceLinesRef.current.push(entryLine);
        }

        if (aiAnalysis.stopLoss) {
          const slLine = candleSeriesRef.current.createPriceLine({
            price: aiAnalysis.stopLoss,
            color: "#EF4444",
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: "SL",
          });
          priceLinesRef.current.push(slLine);
        }

        if (aiAnalysis.takeProfit1) {
          const tp1Line = candleSeriesRef.current.createPriceLine({
            price: aiAnalysis.takeProfit1,
            color: "#22C55E",
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: "TP1",
          });
          priceLinesRef.current.push(tp1Line);
        }
      }
    } catch (err) {
      console.warn("Chart render update notice:", err);
    }
  }, [
    uniqueCandles,
    seenTimes,
    ema9Data,
    ema21Data,
    smcResult,
    indicators,
    aiAnalysis,
    showEMAs,
    showSMC,
    showTargets,
    symbol,
    timeframe,
  ]);

  return (
    <div className="relative w-full rounded border border-[#1A1A1A] bg-[#080808] overflow-hidden font-mono">
      {/* Chart Control Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#161616] bg-[#0A0A0A] text-xs select-none">
        <div className="flex items-center gap-2">
          <span className="font-bold text-neutral-200">{symbol}</span>
          <span className="text-[11px] text-neutral-500 bg-[#141414] px-1.5 py-0.5 rounded">
            {timeframe}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-neutral-400">
          <button
            onClick={() => setShowEMAs(!showEMAs)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
              showEMAs
                ? "text-emerald-400 bg-emerald-950/30"
                : "text-neutral-600 hover:text-neutral-400"
            }`}
          >
            {showEMAs ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>EMA (9/21)</span>
          </button>

          <button
            onClick={() => setShowSMC(!showSMC)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
              showSMC
                ? "text-sky-400 bg-sky-950/30"
                : "text-neutral-600 hover:text-neutral-400"
            }`}
          >
            {showSMC ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>SMC Overlay</span>
          </button>

          {aiAnalysis && aiAnalysis.signal !== "NO_TRADE" && (
            <button
              onClick={() => setShowTargets(!showTargets)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
                showTargets
                  ? "text-amber-400 bg-amber-950/30"
                  : "text-neutral-600 hover:text-neutral-400"
              }`}
            >
              {showTargets ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>Trade Targets</span>
            </button>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div ref={chartContainerRef} className="w-full" style={{ height: `${height}px` }} />
    </div>
  );
};

export const TradingChart = memo(TradingChartComponent);
