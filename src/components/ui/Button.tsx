import React, { ButtonHTMLAttributes, memo } from "react";
import { cn } from "@/lib/utils/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const ButtonComponent: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "secondary",
  size = "md",
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-150 rounded border focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs tracking-tight",
    md: "px-3.5 py-1.5 text-sm tracking-tight",
    lg: "px-5 py-2.5 text-base",
  };

  const variantStyles = {
    primary:
      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-500/50 active:bg-emerald-500/30",
    secondary:
      "bg-[#111111] text-neutral-200 border-[#222222] hover:bg-[#181818] hover:border-[#333333] active:bg-[#202020]",
    danger:
      "bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25 hover:border-rose-500/50 active:bg-rose-500/30",
    outline:
      "bg-transparent text-neutral-300 border-[#262626] hover:bg-[#111111] hover:border-[#404040]",
    ghost:
      "bg-transparent text-neutral-400 border-transparent hover:text-neutral-100 hover:bg-[#141414]",
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-3.5 w-3.5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export const Button = memo(ButtonComponent);
