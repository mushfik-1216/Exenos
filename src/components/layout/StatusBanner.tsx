"use client";

import React, { memo } from "react";
import { useRiskStore } from "@/stores/useRiskStore";
import { AlertOctagon, AlertTriangle } from "lucide-react";

const StatusBannerComponent: React.FC = () => {
  const tradingStatus = useRiskStore((s) => s.tradingStatus);
  const dailyTradeCount = useRiskStore((s) => s.dailyTradeCount);
  const maxTrades = useRiskStore((s) => s.settings.maxTradesPerDay);

  if (tradingStatus === "ACTIVE") return null;

  if (tradingStatus === "LOCKED") {
    return (
      <div className="bg-rose-950/60 border-b border-rose-800/50 px-4 py-2 flex items-center justify-between text-xs text-rose-300 font-mono">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-rose-400 animate-bounce" />
          <span className="font-bold tracking-wider">TRADING LOCKED:</span>
          <span>
            Daily discipline limit reached ({dailyTradeCount}/{maxTrades} trades or loss limit). New setups are blocked.
          </span>
        </div>
        <span className="text-[10px] uppercase bg-rose-900/50 px-2 py-0.5 rounded border border-rose-700/50">
          Enforced
        </span>
      </div>
    );
  }

  if (tradingStatus === "WARNING") {
    return (
      <div className="bg-amber-950/60 border-b border-amber-800/50 px-4 py-2 flex items-center justify-between text-xs text-amber-300 font-mono">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="font-bold tracking-wider">RISK WARNING:</span>
          <span>
            1 trade remaining today ({dailyTradeCount}/{maxTrades}). Maintain strict setup criteria.
          </span>
        </div>
      </div>
    );
  }

  return null;
};

export const StatusBanner = memo(StatusBannerComponent);
