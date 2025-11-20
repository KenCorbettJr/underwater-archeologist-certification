"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface TouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  active?: boolean;
}

export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      active = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "touch-manipulation select-none font-medium rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

    const variantClasses = {
      primary:
        "bg-sand-400 hover:bg-sand-500 text-sand-900 shadow-lg active:shadow-md",
      secondary:
        "bg-ocean-500 hover:bg-ocean-600 text-white shadow-lg active:shadow-md",
      outline:
        "border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm",
      ghost: "text-white hover:bg-white/10",
    };

    const sizeClasses = {
      sm: "px-3 py-2 text-sm min-h-[36px] min-w-[36px]",
      md: "px-4 py-3 text-base min-h-[44px] min-w-[44px]",
      lg: "px-6 py-4 text-lg min-h-[52px] min-w-[52px]",
    };

    const activeClasses = active ? "ring-2 ring-sand-400 bg-sand-500" : "";

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          activeClasses,
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TouchButton.displayName = "TouchButton";
