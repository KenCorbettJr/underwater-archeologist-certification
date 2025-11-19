"use client";

import { useEffect } from "react";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function Toast({
  message,
  type = "info",
  duration = 5000,
  onClose,
  title,
  actionLabel,
  onAction,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const styles = {
    success: "bg-green-500/90 text-white border-green-600",
    error: "bg-red-500/90 text-white border-red-600",
    warning: "bg-amber-500/90 text-white border-amber-600",
    info: "bg-blue-500/90 text-white border-blue-600",
  };

  return (
    <div
      className={`${styles[type]} backdrop-blur-md rounded-2xl p-4 border-2 shadow-2xl min-w-[320px] max-w-md animate-slide-in-right`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
        <div className="flex-1 min-w-0">
          {title && <div className="font-bold mb-1">{title}</div>}
          <div className="text-sm opacity-95">{message}</div>
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="mt-2 text-sm font-medium underline hover:no-underline"
            >
              {actionLabel}
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:bg-white/20 rounded-lg p-1 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
