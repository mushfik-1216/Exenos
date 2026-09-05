import React, { SelectHTMLAttributes, forwardRef, memo } from "react";
import { cn } from "@/lib/utils/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string }[];
}

export const Select = memo(
  forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, options, ...props }, ref) => {
      return (
        <div className="w-full space-y-1">
          {label && (
            <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400">
              {label}
            </label>
          )}
          <select
            ref={ref}
            className={cn(
              "w-full px-3 py-1.5 bg-[#0D0D0D] border border-[#222222] rounded text-sm text-neutral-100 focus:outline-none focus:border-neutral-500 transition-colors cursor-pointer",
              error && "border-rose-500/60",
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#0D0D0D] text-neutral-100">
                {opt.label}
              </option>
            ))}
          </select>
          {error && <p className="text-[11px] text-rose-400">{error}</p>}
        </div>
      );
    }
  )
);
Select.displayName = "Select";
