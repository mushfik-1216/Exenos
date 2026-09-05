import React, { HTMLAttributes, memo } from "react";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "danger" | "warning" | "info" | "outline";
  size?: "sm" | "md";
}

const BadgeComponent: React.FC<BadgeProps> = ({
  children,
  className,
  variant = "default",
  size = "sm",
  ...props
}) => {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] font-mono tracking-wider uppercase",
    md: "px-2.5 py-1 text-xs font-mono tracking-wider uppercase",
  };

  const variantStyles = {
    default: "bg-[#161616] text-neutral-300 border border-[#262626]",
    success: "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40",
    danger: "bg-rose-950/40 text-rose-400 border border-rose-800/40",
    warning: "bg-amber-950/40 text-amber-400 border border-amber-800/40",
    info: "bg-sky-950/40 text-sky-400 border border-sky-800/40",
    outline: "bg-transparent text-neutral-400 border border-[#262626]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export const Badge = memo(BadgeComponent);
