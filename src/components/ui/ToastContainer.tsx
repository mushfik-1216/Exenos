"use client";

import React, { memo } from "react";
import { useUIStore } from "@/stores/useUIStore";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const icons = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
  error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
  info: <Info className="w-4 h-4 text-sky-400 shrink-0" />,
};

const borderStyles = {
  success: "border-emerald-900/50 bg-[#09150E]",
  error: "border-rose-900/50 bg-[#150909]",
  warning: "border-amber-900/50 bg-[#151109]",
  info: "border-sky-900/50 bg-[#091115]",
};

const ToastContainerComponent: React.FC = () => {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 p-3 rounded border shadow-lg text-sm text-neutral-200 transition-all duration-200",
            borderStyles[toast.type]
          )}
        >
          {icons[toast.type]}
          <div className="flex-1 text-xs">{toast.message}</div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-neutral-500 hover:text-neutral-300 p-0.5"
            aria-label="Close notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export const ToastContainer = memo(ToastContainerComponent);
