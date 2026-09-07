"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { useUIStore } from "@/stores/useUIStore";
import { useRiskStore } from "@/stores/useRiskStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMarketStore } from "@/stores/useMarketStore";
import {
  Settings,
  Database,
  Shield,
  Send,
  Users,
  UserPlus,
  Trash2,
  KeyRound,
  UserCheck,
  
  X,
  CheckCircle2,
} from "lucide-react";
import { User, UserRole } from "@/types/auth";
import { formatDateTime } from "@/lib/utils/formatters";

export default function SettingsPage() {
  const addToast = useUIStore((s) => s.addToast);
  const riskSettings = useRiskStore((s) => s.settings);
  const updateRiskSettings = useRiskStore((s) => s.updateSettings);
  const currentUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const fetchMarketData = useMarketStore((s) => s.fetchMarketData);
  const fetchQuote = useMarketStore((s) => s.fetchQuote);

  // Market Data Configuration State
  const [twelveDataKey, setTwelveDataKey] = useState("");
  const [alphaVantageKey, setAlphaVantageKey] = useState("");
  const [activeProvider, setActiveProvider] = useState("Yahoo Finance");
  const [hasTwelveKey, setHasTwelveKey] = useState(false);
  const [marketDataLoading, setMarketDataLoading] = useState(false);

  // Telegram State
  const [telegramLoading, setTelegramLoading] = useState(false);

  // Personal Account / Admin Profile Credentials State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // User Management State (Admin only)
  const [usersList, setUsersList] = useState<Omit<User, "password_hash">[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newAddUsername, setNewAddUsername] = useState("");
  const [newAddPassword, setNewAddPassword] = useState("");
  const [newAddRole, setNewAddRole] = useState<UserRole>("trader");
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Admin Reset Password for other user modal
  const [editingUser, setEditingUser] = useState<Omit<User, "password_hash"> | null>(null);
  const [editUserPassword, setEditUserPassword] = useState("");
  const [editUserLoading, setEditUserLoading] = useState(false);

  const isAdmin = currentUser?.role === "admin";

  const loadMarketDataConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/market-data/config");
      const data = await res.json();
      if (res.ok && data.success) {
        setActiveProvider(data.activeProvider || "Yahoo Finance");
        setHasTwelveKey(Boolean(data.hasTwelveKey));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadMarketDataConfig();
  }, [loadMarketDataConfig]);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    setUsersLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.users)) {
        setUsersList(data.users);
      }
    } catch {
      // ignore
    } finally {
      setUsersLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin, loadUsers]);

  useEffect(() => {
    if (currentUser?.username) {
      setNewUsername(currentUser.username);
    }
  }, [currentUser?.username]);

  const handleSaveMarketDataKeys = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMarketDataLoading(true);

      try {
        const res = await fetch("/api/market-data/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            twelveDataApiKey: twelveDataKey || undefined,
            alphaVantageApiKey: alphaVantageKey || undefined,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          addToast("success", data.message || "Market data configuration updated.");
          loadMarketDataConfig();
          fetchMarketData();
          fetchQuote();
          setTwelveDataKey("");
          setAlphaVantageKey("");
        } else {
          addToast("error", data.error || "Failed to update market data keys.");
        }
      } catch {
        addToast("error", "Network connection failed");
      } finally {
        setMarketDataLoading(false);
      }
    },
    [twelveDataKey, alphaVantageKey, addToast, loadMarketDataConfig, fetchMarketData, fetchQuote]
  );

  const handleTestTelegram = useCallback(async () => {
    setTelegramLoading(true);
    try {
      const res = await fetch("/api/telegram/test", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast("success", "Telegram test alert dispatched successfully!");
      } else {
        addToast("error", data.error || "Telegram connection failed");
      }
    } catch {
      addToast("error", "Network request failed");
    } finally {
      setTelegramLoading(false);
    }
  }, [addToast]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      addToast("error", "Current password is required to save changes.");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      addToast("error", "New password and confirmation do not match.");
      return;
    }

    setProfileLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newUsername: newUsername !== currentUser?.username ? newUsername : undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast("success", "Profile updated successfully!");
        if (data.user) {
          setUser(data.user);
        }
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        addToast("error", data.error || "Failed to update profile credentials");
      }
    } catch {
      addToast("error", "Failed to update credentials. Please try again.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddUsername.trim() || !newAddPassword.trim()) {
      addToast("error", "Username and password are required.");
      return;
    }

    setAddUserLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newAddUsername.trim(),
          password: newAddPassword.trim(),
          role: newAddRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast("success", data.message || `User ${newAddUsername} created successfully.`);
        setNewAddUsername("");
        setNewAddPassword("");
        setNewAddRole("trader");
        setShowAddUser(false);
        loadUsers();
      } else {
        addToast("error", data.error || "Failed to create user account.");
      }
    } catch {
      addToast("error", "Network connection failed");
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to remove user "${username}"?`)) return;

    setDeletingUserId(userId);
    try {
      const res = await fetch(`/api/users?id=${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast("success", `User "${username}" removed successfully.`);
        loadUsers();
      } else {
        addToast("error", data.error || "Failed to delete user account.");
      }
    } catch {
      addToast("error", "Network connection failed");
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editUserPassword.trim()) return;

    setEditUserLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser.id,
          newPassword: editUserPassword.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast("success", `Password updated for "${editingUser.username}".`);
        setEditingUser(null);
        setEditUserPassword("");
      } else {
        addToast("error", data.error || "Failed to update user password.");
      }
    } catch {
      addToast("error", "Network error occurred.");
    } finally {
      setEditUserLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-mono pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1A1A1A]">
        <div>
          <h1 className="text-base font-bold text-neutral-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            System & Account Settings
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Admin Controls, Market Data Ingestion, Risk Limits & Security
          </p>
        </div>
      </div>

      {/* ADMIN ONLY: User Management Section */}
      {isAdmin && (
        <Card className="border border-emerald-900/30 bg-[#090D0A]">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <CardTitle>User & Trader Management (Administrator Only)</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" size="sm">
                {usersList.length} Accounts
              </Badge>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddUser(!showAddUser)}
                className="flex items-center gap-1.5"
              >
                {showAddUser ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>{showAddUser ? "Cancel" : "Add New User"}</span>
              </Button>
            </div>
          </CardHeader>

          {/* Add User Form Modal / Accordion */}
          {showAddUser && (
            <div className="p-4 mb-4 mx-4 bg-[#0D120E] border border-emerald-800/40 rounded-lg">
              <h3 className="text-xs font-bold text-emerald-400 mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add New Terminal User
              </h3>
              <form onSubmit={handleCreateUser} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Username"
                    placeholder="e.g. trader_john"
                    value={newAddUsername}
                    onChange={(e) => setNewAddUsername(e.target.value)}
                    required
                  />
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Min 6 characters"
                    value={newAddPassword}
                    onChange={(e) => setNewAddPassword(e.target.value)}
                    required
                  />
                  <Select
                    label="Assigned Role"
                    value={newAddRole}
                    onChange={(e) => setNewAddRole(e.target.value as UserRole)}
                    options={[
                      { label: "Trader (Standard Access)", value: "trader" },
                      { label: "Administrator (Full Access)", value: "admin" },
                    ]}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddUser(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={addUserLoading}
                  >
                    Create User Account
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Users Table */}
          <div className="overflow-x-auto p-4 pt-0">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-neutral-500 border-b border-[#1A1A1A] text-left text-[11px] bg-[#0A0E0B]">
                  <th className="py-2.5 px-3">USER ID</th>
                  <th className="py-2.5 px-3">USERNAME</th>
                  <th className="py-2.5 px-3">ROLE</th>
                  <th className="py-2.5 px-3">CREATED</th>
                  <th className="py-2.5 px-3">LAST LOGIN</th>
                  <th className="py-2.5 px-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141A16]">
                {usersLoading ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-neutral-500">
                      Loading user accounts...
                    </td>
                  </tr>
                ) : usersList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-neutral-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-[#0D140F]">
                      <td className="py-2.5 px-3 text-neutral-500 font-mono text-[10px]">
                        {u.id}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-neutral-200">
                        {u.username}
                        {u.id === currentUser?.id && (
                          <span className="ml-1.5 text-[9px] bg-emerald-950 border border-emerald-800 text-emerald-400 px-1 py-0.2 rounded">
                            YOU
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={u.role === "admin" ? "success" : "outline"}>
                          {u.role.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-400">
                        {formatDateTime(u.createdAt)}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-400">
                        {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingUser(u);
                              setEditUserPassword("");
                            }}
                            title="Reset password for this user"
                            className="p-1 text-neutral-400 hover:text-emerald-400"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </Button>
                          {u.id !== currentUser?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deletingUserId === u.id}
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              title="Delete user"
                              className="p-1 text-neutral-500 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Admin Reset Password Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
          <div className="w-full max-w-md bg-[#0C0C0C] border border-[#222] rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-neutral-100">
                  Reset Password for &quot;{editingUser.username}&quot;
                </h2>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-neutral-500 hover:text-neutral-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdminResetPassword} className="space-y-4 text-xs">
              <Input
                label="New Password"
                type="password"
                placeholder="Enter at least 6 characters"
                value={editUserPassword}
                onChange={(e) => setEditUserPassword(e.target.value)}
                required
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1A1A1A]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={editUserLoading}
                >
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Personal Account / Credentials Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <CardTitle>My Account Credentials</CardTitle>
          </div>
          <Badge variant="outline">LOGGED IN AS {currentUser?.role?.toUpperCase()}</Badge>
        </CardHeader>

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          <p className="text-neutral-400 text-[11px]">
            Update your own login username or password. Your current password is required for verification.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Username"
              required
            />

            <Input
              label="Current Password (Required for any changes)"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#161616]">
            <Input
              label="New Password (Leave blank to keep unchanged)"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={profileLoading}
            >
              Save Account Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* GRID: Market Data Ingestion & Risk Limits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Market Data Provider Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <CardTitle>Market Data Provider</CardTitle>
            </div>
            <Badge variant={hasTwelveKey ? "success" : "outline"}>
              {activeProvider.toUpperCase()}
            </Badge>
          </CardHeader>

          <form onSubmit={handleSaveMarketDataKeys} className="space-y-3 pt-1 text-xs">
            <p className="text-neutral-400 text-[11px]">
              Twelve Data is the primary market provider with high-precision OHLC candles. If no key is set, EXENOS automatically falls back to Yahoo Finance.
            </p>

            <Input
              label="Twelve Data API Key (Primary Provider)"
              type="password"
              placeholder={hasTwelveKey ? "•••••••••••••••• (Configured)" : "Enter Twelve Data API Key"}
              value={twelveDataKey}
              onChange={(e) => setTwelveDataKey(e.target.value)}
            />

            <Input
              label="Alpha Vantage API Key (Optional Fallback)"
              type="password"
              placeholder="Enter Alpha Vantage Key"
              value={alphaVantageKey}
              onChange={(e) => setAlphaVantageKey(e.target.value)}
            />

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Active Provider: <strong className="text-neutral-200">{activeProvider}</strong></span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={marketDataLoading}
              >
                Save & Verify Key
              </Button>
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
