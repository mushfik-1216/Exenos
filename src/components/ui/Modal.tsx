import React, { useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className={cn(
          "w-full max-w-lg bg-[#0A0A0A] border border-[#222222] rounded-lg shadow-2xl p-6 text-neutral-100 relative",
          className
        )}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A] mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-200">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-200 p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
