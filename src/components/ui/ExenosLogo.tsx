import React, { memo } from "react";

export interface ExenosLogoProps {
  size?: number;
  className?: string;
}

const ExenosLogoComponent: React.FC<ExenosLogoProps> = ({
  size = 24,
  className = "",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        width="32"
        height="32"
        rx="7"
        fill="#0E0E0E"
        stroke="#222222"
        strokeWidth="1.5"
      />
      <path
        d="M9 8.5H23V11.5H12.5V14.5H21V17.5H12.5V20.5H23V23.5H9V8.5Z"
        fill="url(#exenos-e-grad)"
      />
      <circle cx="23" cy="8.5" r="1.5" fill="#34D399" />
      <defs>
        <linearGradient
          id="exenos-e-grad"
          x1="9"
          y1="8.5"
          x2="23"
          y2="23.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const ExenosLogo = memo(ExenosLogoComponent);
