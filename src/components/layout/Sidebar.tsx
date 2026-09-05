"use client";

import React, { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  BrainCircuit,
  BookOpen,
  BarChart3,
  Settings,
} from "lucide-react";

const navigationItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "AI Analysis", href: "/analysis", icon: BrainCircuit },
  { name: "Trade Journal", href: "/journal", icon: BookOpen },
  { name: "Performance", href: "/analytics", icon: BarChart3 },
  { name: "System Settings", href: "/settings", icon: Settings },
];

const SidebarComponent: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-[#080808] border-r border-[#1A1A1A] flex flex-col justify-between select-none">
      <div className="p-3 space-y-4">
        {/* Navigation links */}
        <div className="space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-500">
            Navigation
          </div>
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors font-mono",
                  isActive
                    ? "bg-[#161616] text-neutral-100 border border-[#242424] font-semibold"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-[#101010]"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-emerald-400" : "text-neutral-500")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Engine Pipeline Status */}
        <div className="pt-2 border-t border-[#161616] space-y-2">
          <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-neutral-500">
            Pipeline Architecture
          </div>
          <div className="px-3 py-2 bg-[#0C0C0C] border border-[#1A1A1A] rounded text-[11px] font-mono space-y-1 text-neutral-400">
            <div className="flex items-center justify-between">
              <span>Market Feed:</span>
              <span className="text-emerald-400">READY</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Indicators:</span>
              <span className="text-emerald-400">DETERMINISTIC</span>
            </div>
            <div className="flex items-center justify-between">
              <span>SMC Engine:</span>
              <span className="text-emerald-400">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between">
              <span>AI Provider:</span>
              <span className="text-sky-400">OmniRoute</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Risk Shield:</span>
              <span className="text-emerald-400">ENFORCED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="p-3 border-t border-[#1A1A1A] text-[10px] font-mono text-neutral-500 space-y-1">
        <div className="flex items-center justify-between">
          <span>Private Build:</span>
          <span>Max 5 Users</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Storage:</span>
          <span>JSON Sync</span>
        </div>
      </div>
    </aside>
  );
};

export const Sidebar = memo(SidebarComponent);
