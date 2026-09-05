"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Terminal } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        setUser(data.user);
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection error";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded border border-[#222222] bg-[#0E0E0E] mb-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold font-mono tracking-wider text-neutral-100">
            EXENOS
          </h1>
          <p className="text-xs text-neutral-500 font-mono">
            Analyze. Validate. Execute Smarter.
          </p>
        </div>

        {/* Login Card */}
        <Card variant="elevated" className="border-[#1E1E1E]">
          <CardHeader>
            <CardTitle>Private Terminal Access</CardTitle>
            <span className="text-[10px] font-mono text-neutral-500">Max 5 Users</span>
          </CardHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {error && (
              <div className="p-2.5 rounded bg-rose-950/40 border border-rose-900/60 text-xs text-rose-400 font-mono">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <Input
                label="Username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2 font-mono"
              isLoading={isLoading}
            >
              Authenticate Session
            </Button>
          </form>
        </Card>

        {/* Security Notice */}
        <div className="text-center text-[11px] font-mono text-neutral-600 space-y-1">
          <p>Strict Risk Controls & Deterministic SMC</p>
          <p className="text-[10px] text-neutral-700">Protected Private System</p>
        </div>
      </div>
    </div>
  );
}
