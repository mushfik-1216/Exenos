"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatusBanner } from "@/components/layout/StatusBanner";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMarketStore } from "@/stores/useMarketStore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const checkSession = useAuthStore((s) => s.checkSession);

  const fetchMarketData = useMarketStore((s) => s.fetchMarketData);
  const fetchQuote = useMarketStore((s) => s.fetchQuote);
  const initialFetchDone = useRef(false);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      if (!initialFetchDone.current) {
        initialFetchDone.current = true;
        fetchMarketData();
        fetchQuote();
      }

      // Fast quote polling for live tick and chart updates
      const quoteInterval = setInterval(() => {
        fetchQuote();
      }, 3000);

      // Periodic background candles refresh
      const candlesInterval = setInterval(() => {
        fetchMarketData();
      }, 30000);

      // Handle visibility/focus changes
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          fetchQuote();
          fetchMarketData();
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        clearInterval(quoteInterval);
        clearInterval(candlesInterval);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }
  }, [isAuthenticated, fetchMarketData, fetchQuote]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 font-mono text-xs text-neutral-400">
          <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
          <span>INITIALIZING EXENOS CORE...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <Header />
      <StatusBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 bg-[#050505] text-neutral-100">
          {children}
        </main>
      </div>
    </div>
  );
}
