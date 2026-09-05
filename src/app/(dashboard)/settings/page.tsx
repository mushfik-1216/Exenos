"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { useUIStore } from "@/stores/useUIStore";
import { useRiskStore } from "@/stores/useRiskStore";
import { Settings, Tv, Shield, Send } from "lucide-react";
import { TVConnectionType } from "@/types/tradingview";

export default function SettingsPage() {
  const addToast = useUIStore((s) => s.addToast);
  const riskSettings = useRiskStore((s) => s.settings);
  const updateRiskSettings = useRiskStore((s) => s.updateSettings);

  // TradingView State
  const [tvType, setTvType] = useState<TVConnectionType>("session_id");
  const [tvValue, setTvValue] = useState("");
  const [tvRemember, setTvRemember] = useState(true);
  const [tvRemoveExit, setTvRemoveExit] = useState(false);
  const [tvStatus, setTvStatus] = useState<string>("disconnected");
  const [tvLoading, setTvLoading] = useState(false);

  // Telegram State
  const [telegramLoading, setTelegramLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/tradingview/status")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.status) setTvStatus(data.status);
      })
      .catch(() => {
        if (isMounted) setTvStatus("disconnected");
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleConnectTV = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tvValue) return;

    setTvLoading(true);
    try {
      const res = await fetch("/api/tradingview/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionType: tvType,
          credentialValue: tvValue,
          rememberSession: tvRemember,
          removeOnExit: tvRemoveExit,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTvStatus("connected");
        setTvValue("");
        addToast("success", "TradingView credentials encrypted and connected successfully.");
      } else {
        addToast("error", data.error || "Failed to connect TradingView");
      }
    } catch {
      addToast("error", "Network connection failed");
    } finally {
      setTvLoading(false);
    }
  }, [tvValue, tvType, tvRemember, tvRemoveExit, addToast]);

  const handleDisconnectTV = useCallback(async () => {
    setTvLoading(true);
    try {
      await fetch("/api/tradingview/disconnect", { method: "POST" });
      setTvStatus("disconnected");
      addToast("info", "TradingView disconnected.");
    } finally {
      setTvLoading(false);
    }
  }, [addToast]);

  const handleTestTelegram = useCallback(async () => {
    setTelegramLoading(true);
    try {
      const res = await fetch("/api/telegram/test", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast("success", data.message || "Telegram test message delivered.");
      } else {
        addToast("warning", data.error || "Telegram not configured in environment.");
      }
    } catch {
      addToast("error", "Telegram test failed");
    } finally {
      setTelegramLoading(false);
    }
  }, [addToast]);

  return (
    <div className="space-y-4 max-w-5xl mx-auto font-mono">
      <div className="flex items-center justify-between bg-[#0A0A0A] p-4 rounded border border-[#1A1A1A]">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-400" />
            System & Risk Configuration
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            TradingView Integration, Risk Limits & Storage Management
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TradingView Connection Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-neutral-300" />
              <CardTitle>TradingView Integration</CardTitle>
            </div>
            <Badge variant={tvStatus === "connected" ? "success" : "outline"}>
              {tvStatus.toUpperCase()}
            </Badge>
          </CardHeader>

          <form onSubmit={handleConnectTV} className="space-y-3 pt-1 text-xs">
            <p className="text-neutral-400 text-[11px]">
              Connect user-linked TradingView session. Credentials are encrypted server-side with AES-256-GCM and never sent to AI.
            </p>

            <Select
              label="Connection Type"
              value={tvType}
              onChange={(e) => setTvType(e.target.value as TVConnectionType)}
              options={[
                { label: "Session ID", value: "session_id" },
                { label: "Cookie String", value: "cookie" },
              ]}
            />

            <Input
              label={tvType === "session_id" ? "TradingView Session ID" : "Cookie String"}
              type="password"
              placeholder={tvType === "session_id" ? "sessionid=..." : "sessionid=...; sessionid_sign=..."}
              value={tvValue}
              onChange={(e) => setTvValue(e.target.value)}
              required
            />

            <div className="flex flex-col gap-2 pt-1 text-neutral-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tvRemember}
                  onChange={(e) => setTvRemember(e.target.checked)}
                  className="rounded bg-[#161616] border-[#333333] text-emerald-500 focus:ring-0"
                />
                <span>Persist encrypted credentials across browser sessions</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tvRemoveExit}
                  onChange={(e) => setTvRemoveExit(e.target.checked)}
                  className="rounded bg-[#161616] border-[#333333] text-emerald-500 focus:ring-0"
                />
                <span>Auto-remove credentials upon user sign out</span>
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={tvLoading}
              >
                Connect & Encrypt
              </Button>

              {tvStatus === "connected" && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleDisconnectTV}
                  isLoading={tvLoading}
                >
                  Disconnect
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* Risk Limits Configuration Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <CardTitle>Deterministic Risk Limits</CardTitle>
            </div>
            <Badge variant="success">ENFORCED</Badge>
          </CardHeader>

          <div className="space-y-3 pt-1 text-xs">
            <p className="text-neutral-400 text-[11px]">
              Platform-level risk rules cannot be overridden by AI reasoning. Trades exceeding limits are rejected automatically.
            </p>

            <Input
              label="Account Balance ($)"
              type="number"
              value={riskSettings.accountBalance}
              onChange={(e) =>
                updateRiskSettings({ accountBalance: Math.max(100, parseFloat(e.target.value) || 0) })
              }
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Max Daily Trades"
                type="number"
                value={riskSettings.maxTradesPerDay}
                onChange={(e) =>
                  updateRiskSettings({ maxTradesPerDay: Math.max(1, parseInt(e.target.value, 10) || 1) })
                }
              />

              <Input
                label="Risk Per Trade (%)"
                type="number"
                step="0.1"
                value={riskSettings.riskPerTradePercent}
                onChange={(e) =>
                  updateRiskSettings({ riskPerTradePercent: Math.max(0.1, parseFloat(e.target.value) || 0.1) })
                }
              />
            </div>

            <Input
              label="Daily Loss Limit (%)"
              type="number"
              step="0.5"
              value={riskSettings.dailyLossLimitPercent}
              onChange={(e) =>
                updateRiskSettings({ dailyLossLimitPercent: Math.max(0.5, parseFloat(e.target.value) || 0.5) })
              }
            />
          </div>
        </Card>

        {/* Telegram Notifications Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-400" />
              <CardTitle>Telegram Notification Bot</CardTitle>
            </div>
            <Badge variant="info">OPTIONAL</Badge>
          </CardHeader>

          <div className="space-y-3 pt-1 text-xs">
            <p className="text-neutral-400 text-[11px]">
              Dispatches deterministic Signal Alerts, Risk Warnings, and Daily Summaries to your private Telegram channel. Configure <code>TELEGRAM_BOT_TOKEN</code> and <code>TELEGRAM_CHAT_ID</code> in <code>.env.local</code>.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestTelegram}
                isLoading={telegramLoading}
                className="flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Test Alert</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
