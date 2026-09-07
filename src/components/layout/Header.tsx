"use client";

import React, { memo } from "react";
import { useMarketStore } from "@/stores/useMarketStore";
import { useRiskStore } from "@/stores/useRiskStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { SYMBOL_LIST } from "@/config/symbols";
import { TIMEFRAME_LIST } from "@/config/timeframes";
import { SupportedSymbol } from "@/types/market";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ExenosLogo } from "@/components/ui/ExenosLogo";
import { formatPrice, formatPercent } from "@/lib/utils/formatters";
import { ShieldAlert, ShieldCheck, LogOut, Radio, User } from "lucide-react";

const HeaderComponent: React.FC = () => {
  const activeSymbol = useMarketStore((s) => s.activeSymbol);
  const activeTimeframe = useMarketStore((s) => s.activeTimeframe);
  const setActiveSymbol = useMarketStore((s) => s.setActiveSymbol);
  const setActiveTimeframe = useMarketStore((s) => s.setActiveTimeframe);
  const quote = useMarketStore((s) => s.quote);
  const lastMetadata = useMarketStore((s) => s.lastMetadata);

  const tradingStatus = useRiskStore((s) => s.tradingStatus);
  const dailyTradeCount = useRiskStore((s) => s.dailyTradeCount);
  const maxTradesPerDay = useRiskStore((s) => s.settings.maxTradesPerDay);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const statusVariant = {
    ACTIVE: "success",
    WARNING: "warning",
    LOCKED: "danger",
  }[tradingStatus] as "success" | "warning" | "danger";

  return (
    <header className="h-14 bg-[#080808] border-b border-[#1A1A1A] px-4 flex items-center justify-between select-none z-20">
      {/* Left: Brand & Symbol / Timeframe Selectors */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 pr-2 border-r border-[#1A1A1A]">
          <ExenosLogo size={26} />
          <span className="font-bold text-sm tracking-wider text-neutral-100 font-mono">
            EXENOS
          </span>
          <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded font-mono">
            v1.0
          </span>
        </div>

        {/* Symbol Selector */}
        <div className="flex items-center gap-1.5">
          <select
            value={activeSymbol}
            onChange={(e) => setActiveSymbol(e.target.value as SupportedSymbol)}
            aria-label="Select market symbol"
            className="bg-[#111111] border border-[#222222] text-xs font-mono font-medium text-neutral-100 rounded px-2.5 py-1 focus:outline-none focus:border-neutral-500 cursor-pointer"
          >
            {SYMBOL_LIST.map((sym) => (
              <option key={sym} value={sym}>
                {sym}
              </option>
            ))}
          </select>

          {/* Timeframe Selector */}
          <div className="flex items-center bg-[#111111] border border-[#222222] rounded p-0.5">
            {TIMEFRAME_LIST.map((tf) => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                  activeTimeframe === tf
                    ? "bg-[#222222] text-neutral-100 font-bold"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Live Quote Display */}
        {quote && (
          <div className="hidden md:flex items-center gap-3 pl-3 border-l border-[#1A1A1A] text-xs font-mono">
            <span className="text-neutral-400">PRICE:</span>
            <span className="font-semibold text-neutral-100">
              {formatPrice(quote.price, activeSymbol)}
            </span>
            {quote.changePercent24h !== undefined && (
              <span
                className={
                  quote.changePercent24h >= 0 ? "text-emerald-400" : "text-rose-400"
                }
              >
                {formatPercent(quote.changePercent24h)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Data Provider, Risk Status, User profile */}
      <div className="flex items-center gap-3">
        {/* Provider Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 bg-[#0E0E0E] px-2.5 py-1 rounded border border-[#1C1C1C]">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>PROVIDER:</span>
          <span className="text-neutral-200 font-medium">
            {lastMetadata?.provider || "Twelve Data"}
          </span>
        </div>

        {/* Risk Trading Status */}
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant} size="md">
            <span className="flex items-center gap-1.5">
              {tradingStatus === "ACTIVE" ? (
                <ShieldCheck className="w-3 h-3" />
              ) : (
                <ShieldAlert className="w-3 h-3" />
              )}
              {tradingStatus} ({dailyTradeCount}/{maxTradesPerDay})
            </span>
          </Badge>
        </div>

        {/* User Session Info & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#1A1A1A]">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-neutral-400">
            <User className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-neutral-200 font-medium">{user?.username || "Trader"}</span>
            <span className="text-[10px] text-neutral-500 uppercase">({user?.role || "user"})</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            title="Logout"
            aria-label="Logout"
            className="p-1.5 text-neutral-400 hover:text-rose-400"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export const Header = memo(HeaderComponent);
