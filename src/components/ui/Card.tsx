import React, { HTMLAttributes, memo } from "react";
import { cn } from "@/lib/utils/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "bordered";
}

const CardComponent: React.FC<CardProps> = ({
  children,
  className,
  variant = "default",
  ...props
}) => {
  const variantStyles = {
    default: "bg-[#0A0A0A] border-[#1A1A1A]",
    elevated: "bg-[#0E0E0E] border-[#222222] shadow-subtle",
    bordered: "bg-transparent border-[#1F1F1F]",
  };

  return (
    <div
      className={cn(
        "rounded border p-4 text-neutral-100",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const Card = memo(CardComponent);

export const CardHeader = memo<HTMLAttributes<HTMLDivElement>>(({
  children,
  className,
  ...props
}) => (
  <div
    className={cn("flex items-center justify-between pb-3 border-b border-[#181818] mb-3", className)}
    {...props}
  >
    {children}
  </div>
));
CardHeader.displayName = "CardHeader";

export const CardTitle = memo<HTMLAttributes<HTMLHeadingElement>>(({
  children,
  className,
  ...props
}) => (
  <h3 className={cn("text-xs font-semibold uppercase tracking-wider text-neutral-400", className)} {...props}>
    {children}
  </h3>
));
CardTitle.displayName = "CardTitle";
