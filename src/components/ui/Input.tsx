import React, { InputHTMLAttributes, forwardRef, memo } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = memo(
  forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, type = "text", ...props }, ref) => {
      return (
        <div className="w-full space-y-1">
          {label && (
            <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400">
              {label}
            </label>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              "w-full px-3 py-1.5 bg-[#0D0D0D] border border-[#222222] rounded text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors",
              error && "border-rose-500/60 focus:border-rose-500 focus:ring-rose-500",
              className
            )}
            {...props}
          />
          {error && <p className="text-[11px] text-rose-400">{error}</p>}
        </div>
      );
    }
  )
);
Input.displayName = "Input";
