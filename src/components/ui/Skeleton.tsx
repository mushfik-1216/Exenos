import React, { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export const Skeleton: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn("animate-pulse rounded bg-[#161616]", className)}
      {...props}
    />
  );
};
