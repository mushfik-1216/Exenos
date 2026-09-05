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
import {
  Settings,
  Tv,
  Shield,
  Send,
  Users,
  UserPlus,
  Trash2,
  KeyRound,
  UserCheck,
  Edit,
  X,
} from "lucide-react";
import { TVConnectionType } from "@/types/tradingview";
import { User, UserRole } from "@/types/auth";
import { formatDateTime } from "@/lib/utils/formatters";

export default function SettingsPage() {
  const addToast = useUIStore((s) => s.addToast);
  const riskSettings = useRiskStore((s) => s.settings);
  const updateRiskSettings = useRiskStore((s) => s.updateSettings);
  const currentUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  // TradingView State
  const [tvType, setTvType] = useState<TVConnectionType>("session_id");
  const [tvValue, setTvValue] = useState("");
  const [tvRemember, setTvRemember] = useState(true);
  const [tvRemoveExit, setTvRemoveExit] = useState(false);
  const [tvStatus, setTvStatus] = useState<string>("disconnected");
  const [tvLoading, setTvLoading] = useState(false);

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

  const handleConnectTV = useCallback(
    async (e: React.FormEvent) => {
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
    },
    [tvValue, tvType, tvRemember, tvRemoveExit, addToast]
  );

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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      addToast("warning", "Please enter your current password to confirm changes.");
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
          newUsername: newUsername.trim() !== currentUser?.username ? newUsername.trim() : undefined,
          newPassword: newPassword ? newPassword.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        setUser(data.user);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        addToast("success", data.message || "Account credentials updated successfully.");
        if (isAdmin) loadUsers();
      } else {
        addToast("error", data.error || "Failed to update credentials.");
      }
    } catch {
      addToast("error", "Connection error while updating credentials.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddUsername || !newAddPassword) {
      addToast("warning", "Username and password are required.");
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
        addToast("success", data.message || "User created successfully.");
        setNewAddUsername("");
        setNewAddPassword("");
        setShowAddUser(false);
        loadUsers();
      } else {
        addToast("error", data.error || "Failed to create user.");
      }
    } catch {
      addToast("error", "Failed to connect to server.");
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editUserPassword) return;

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
        addToast("success", data.message || `Password reset for ${editingUser.username}.`);
        setEditingUser(null);
        setEditUserPassword("");
      } else {
        addToast("error", data.error || "Failed to reset password.");
      }
    } catch {
      addToast("error", "Failed to reset user password.");
    } finally {
      setEditUserLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to remove user account "${username}"?`)) {
      return;
    }

    setDeletingUserId(userId);
    try {
      const res = await fetch(`/api/users?id=${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast("info", data.message || `User "${username}" removed.`);
        loadUsers();
      } else {
        addToast("error", data.error || "Failed to remove user.");
      }
    } catch {
      addToast("error", "Failed to delete user.");
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-mono">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#0A0A0A] p-4 rounded border border-[#1A1A1A]">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-400" />
            System & Risk Configuration
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Admin Controls, TradingView Integration, Risk Limits & Storage
          </p>
        </div>
      </div>

      {/* ADMIN-ONLY USER MANAGEMENT SECTION */}
      {isAdmin && (
        <Card className="border-[#1E2A20] bg-[#0A0E0B]/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <CardTitle>User Management (Admin Only)</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {usersList.length} / 5 USERS
              </Badge>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddUser(!showAddUser)}
                disabled={usersList.length >= 5}
                className="flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{showAddUser ? "Cancel" : "Add New User"}</span>
              </Button>
            </div>
          </CardHeader>

          <div className="space-y-4 pt-1">
            <p className="text-neutral-400 text-xs">
              Manage terminal user accounts. Only administrators can access this section. Maximum limit is strictly enforced at 5 accounts. Adding a user will not remove or affect your admin account.
            </p>

            {/* Add User Form Drawer */}
            {showAddUser && (
              <form
                onSubmit={handleCreateUser}
                className="p-4 rounded border border-[#243328] bg-[#0C140E] space-y-3"
              >
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register New Terminal Account</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    label="Username"
                    placeholder="Enter username"
                    value={newAddUsername}
                    onChange={(e) => setNewAddUsername(e.target.value)}
                    required
                  />

                  <Input
                    label="Initial Password"
                    type="password"
                    placeholder="Min 6 characters"
                    value={newAddPassword}
                    onChange={(e) => setNewAddPassword(e.target.value)}
                    required
                  />

                  <Select
                    label="Role"
                    value={newAddRole}
                    onChange={(e) => setNewAddRole(e.target.value as UserRole)}
                    options={[
                      { label: "Trader (Standard Access)", value: "trader" },
                      { label: "Admin (Full System Access)", value: "admin" },
                    ]}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
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
                    Create Account
                  </Button>
                </div>
              </form>
            )}

            {/* Users Table */}
            <div className="overflow-x-auto border border-[#1A1A1A] rounded bg-[#080808]">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-neutral-500 border-b border-[#1A1A1A] text-left text-[11px] bg-[#0D0D0D]">
                    <th className="py-2.5 px-3">USERNAME</th>
                    <th className="py-2.5 px-3">ROLE</th>
                    <th className="py-2.5 px-3">CREATED</th>
                    <th className="py-2.5 px-3">LAST LOGIN</th>
                    <th className="py-2.5 px-3">STATUS</th>
                    <th className="py-2.5 px-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414]">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-neutral-500">
                        Loading terminal accounts...
                      </td>
                    </tr>
                  ) : usersList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-neutral-500">
                        No registered users found.
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u) => {
                      const isSelf = u.id === currentUser?.id;
                      return (
                        <tr key={u.id} className="hover:bg-[#0E0E0E]">
                          <td className="py-2.5 px-3 font-semibold text-neutral-200">
                            {u.username}
                            {isSelf && (
                              <span className="ml-1.5 text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1 py-0.2 rounded">
                                YOU
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge variant={u.role === "admin" ? "success" : "default"}>
                              {u.role.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-neutral-400">
                            {formatDateTime(u.createdAt)}
                          </td>
                          <td className="py-2.5 px-3 text-neutral-400">
                            {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Active
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingUser(u);
                                  setEditUserPassword("");
                                }}
                                title="Reset User Password"
                                className="px-2 py-0.5 text-[11px] flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Reset Pass</span>
                              </Button>

                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                disabled={isSelf}
                                isLoading={deletingUserId === u.id}
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                title={isSelf ? "Cannot delete own account" : "Remove user"}
                                className="px-2 py-0.5 text-[11px]"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* ADMIN RESET USER PASSWORD MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0A0A0A] border border-[#222222] rounded-lg shadow-2xl p-5 text-neutral-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>Reset Password for {editingUser.username}</span>
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-neutral-500 hover:text-neutral-200 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdminResetPassword} className="space-y-3 text-xs">
              <p className="text-neutral-400">
                As an Administrator, you can assign a new password directly to this user account.
              </p>

              <Input
                label="New Password"
                type="password"
                placeholder="Enter new password (min 6 chars)"
                value={editUserPassword}
                onChange={(e) => setEditUserPassword(e.target.value)}
                required
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-[#181818]">
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
                  Confirm Reset
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN & USER PROFILE CREDENTIALS (CHANGE USERNAME / PASSWORD) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <CardTitle>
              {isAdmin ? "Admin Profile Credentials & Password" : "My Account Credentials & Password"}
            </CardTitle>
          </div>
          <Badge variant={isAdmin ? "success" : "default"}>
            {isAdmin ? "ADMINISTRATOR" : "TRADER"}
          </Badge>
        </CardHeader>

        <form onSubmit={handleUpdateProfile} className="space-y-4 pt-1 text-xs">
          <p className="text-neutral-400 text-[11px]">
            Update your own {isAdmin ? "Admin" : "Trader"} username and password. Enter your current password below to authorize updates.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Input
                label="Current Account Username"
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
              />

              <Input
                label="Current Password (Required to Verify)"
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-3">
              <Input
                label="New Password (Leave blank to keep unchanged)"
                type="password"
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={profileLoading}
              className="flex items-center gap-2"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Update Credentials</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* GRID: TradingView & Risk Limits */}
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
