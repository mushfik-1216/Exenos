"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useUIStore } from "@/stores/useUIStore";
import { SYMBOL_LIST } from "@/config/symbols";
import { TIMEFRAME_LIST } from "@/config/timeframes";
import { SupportedSymbol, Timeframe } from "@/types/market";
import { formatCurrency, formatPrice, formatDateTime } from "@/lib/utils/formatters";
import { BookOpen, Plus, ArrowUpRight, ArrowDownRight, Trash2, X } from "lucide-react";
import { JournalEntry, TradeResult } from "@/types/journal";

const JournalRow = memo<{
  entry: JournalEntry;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}>(({ entry, onDelete, isDeleting }) => {
  const isBuy = entry.direction === "BUY";
  const pnl = entry.pnl ?? 0;
  const isPositive = pnl >= 0;

  return (
    <tr className="hover:bg-[#0E0E0E]">
      <td className="py-2.5 px-3 text-neutral-400">{formatDateTime(entry.openedAt)}</td>
      <td className="py-2.5 px-3 font-semibold text-neutral-200">{entry.symbol}</td>
      <td className="py-2.5 px-3">
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
      <td className="py-2.5 px-3 tabular-nums">{formatPrice(entry.entryPrice, entry.symbol)}</td>
      <td className="py-2.5 px-3 tabular-nums text-rose-400/80">{formatPrice(entry.stopLoss, entry.symbol)}</td>
      <td className="py-2.5 px-3 tabular-nums text-emerald-400/80">{formatPrice(entry.takeProfit1, entry.symbol)}</td>
      <td className="py-2.5 px-3 tabular-nums text-neutral-300">
        {entry.exitPrice ? formatPrice(entry.exitPrice, entry.symbol) : "--"}
      </td>
      <td className="py-2.5 px-3 tabular-nums">1:{entry.riskReward}</td>
      <td className="py-2.5 px-3">
        <span className="text-neutral-400 text-[11px] truncate max-w-[120px] block" title={entry.setupType}>
          {entry.setupType}
        </span>
      </td>
      <td className="py-2.5 px-3">
        <Badge
          variant={
            entry.result === "WIN"
              ? "success"
              : entry.result === "LOSS"
              ? "danger"
              : "outline"
          }
        >
          {entry.result}
        </Badge>
      </td>
      <td
        className={`py-2.5 px-3 text-right tabular-nums font-semibold ${
          isPositive ? "text-emerald-400" : "text-rose-400"
        }`}
      >
        {entry.pnl !== undefined ? formatCurrency(entry.pnl) : "--"}
      </td>
      <td className="py-2.5 px-3 text-right">
        <Button
          variant="ghost"
          size="sm"
          disabled={isDeleting}
          onClick={() => onDelete(entry.id)}
          title="Remove entry"
          className="p-1 text-neutral-500 hover:text-rose-400"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </td>
    </tr>
  );
});
JournalRow.displayName = "JournalRow";

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const addToast = useUIStore((s) => s.addToast);

  // Form State
  const [symbol, setSymbol] = useState<SupportedSymbol>("EURUSD");
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY");
  const [timeframe, setTimeframe] = useState<Timeframe>("15m");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit1, setTakeProfit1] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [result, setResult] = useState<TradeResult>("WIN");
  const [pnl, setPnl] = useState("");
  const [setupType, setSetupType] = useState("OB + Liquidity Sweep");
  const [notes, setNotes] = useState("");

  const loadJournal = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/journal");
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.entries)) {
        setEntries(json.entries);
      }
    } catch {
      addToast("error", "Failed to load trade journal records.");
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadJournal();
  }, [loadJournal]);

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryPrice || !stopLoss || !takeProfit1) {
      addToast("warning", "Please fill in Entry, Stop Loss, and Take Profit.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          direction,
          timeframe,
          entryPrice: parseFloat(entryPrice),
          stopLoss: parseFloat(stopLoss),
          takeProfit1: parseFloat(takeProfit1),
          exitPrice: exitPrice ? parseFloat(exitPrice) : undefined,
          pnl: pnl ? parseFloat(pnl) : undefined,
          result,
          setupType,
          notes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast("success", data.message || "Trade journal record saved.");
        setShowModal(false);
        // Reset form
        setEntryPrice("");
        setStopLoss("");
        setTakeProfit1("");
        setExitPrice("");
        setPnl("");
        setNotes("");
        loadJournal();
      } else {
        addToast("error", data.error || "Failed to create entry.");
      }
    } catch {
      addToast("error", "Network connection failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Remove this trade journal record?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/journal?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast("info", "Journal entry deleted.");
        loadJournal();
      } else {
        addToast("error", data.error || "Failed to delete record.");
      }
    } catch {
      addToast("error", "Failed to connect to server.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-mono">
      <div className="flex items-center justify-between bg-[#0A0A0A] p-4 rounded border border-[#1A1A1A]">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            Trading Journal
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Deterministic Trade Log & Retrospective Performance Sync
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Journal Entry</span>
        </Button>
      </div>

      {/* MODAL: ADD JOURNAL ENTRY */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0A0A0A] border border-[#222222] rounded-lg shadow-2xl p-6 text-neutral-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>Log New Executed Trade</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-500 hover:text-neutral-200 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select
                  label="Pair / Symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value as SupportedSymbol)}
                  options={SYMBOL_LIST.map((s) => ({ label: s, value: s }))}
                />

                <Select
                  label="Direction"
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as "BUY" | "SELL")}
                  options={[
                    { label: "BUY (Long)", value: "BUY" },
                    { label: "SELL (Short)", value: "SELL" },
                  ]}
                />

                <Select
                  label="Timeframe"
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                  options={TIMEFRAME_LIST.map((tf) => ({ label: tf, value: tf }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Entry Price"
                  type="number"
                  step="any"
                  placeholder="e.g. 1.08500"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  required
                />

                <Input
                  label="Stop Loss"
                  type="number"
                  step="any"
                  placeholder="e.g. 1.08200"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  required
                />

                <Input
                  label="Take Profit 1"
                  type="number"
                  step="any"
                  placeholder="e.g. 1.09100"
                  value={takeProfit1}
                  onChange={(e) => setTakeProfit1(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Exit Price (Optional)"
                  type="number"
                  step="any"
                  placeholder="e.g. 1.09100"
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value)}
                />

                <Select
                  label="Outcome / Result"
                  value={result}
                  onChange={(e) => setResult(e.target.value as TradeResult)}
                  options={[
                    { label: "WIN (Take Profit)", value: "WIN" },
                    { label: "LOSS (Stop Out)", value: "LOSS" },
                    { label: "BREAKEVEN", value: "BREAKEVEN" },
                  ]}
                />

                <Input
                  label="Net PnL ($)"
                  type="number"
                  step="any"
                  placeholder="e.g. +450 or -200"
                  value={pnl}
                  onChange={(e) => setPnl(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Input
                  label="Setup Pattern / Strategy"
                  placeholder="e.g. Order Block + SSL Sweep / FVG Retest"
                  value={setupType}
                  onChange={(e) => setSetupType(e.target.value)}
                />

                <Input
                  label="Trade Notes & Execution Summary"
                  placeholder="e.g. London open sweep of Asian lows with high volume displacement."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#181818]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                >
                  Save to Journal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Trade History & Execution Records</CardTitle>
          <span className="text-xs text-neutral-500">{entries.length} Logged Trades</span>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-neutral-500 border-b border-[#1A1A1A] text-left text-[11px] bg-[#0D0D0D]">
                <th className="py-2.5 px-3">DATE</th>
                <th className="py-2.5 px-3">PAIR</th>
                <th className="py-2.5 px-3">DIR</th>
                <th className="py-2.5 px-3">ENTRY</th>
                <th className="py-2.5 px-3">SL</th>
                <th className="py-2.5 px-3">TP</th>
                <th className="py-2.5 px-3">EXIT</th>
                <th className="py-2.5 px-3">RR</th>
                <th className="py-2.5 px-3">SETUP</th>
                <th className="py-2.5 px-3">RESULT</th>
                <th className="py-2.5 px-3 text-right">PNL</th>
                <th className="py-2.5 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-neutral-500">
                    Loading trade records...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-neutral-500">
                    No journal entries logged yet. Click &quot;New Journal Entry&quot; to log your first trade.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <JournalRow
                    key={entry.id}
                    entry={entry}
                    onDelete={handleDeleteEntry}
                    isDeleting={deletingId === entry.id}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
