"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, RotateCcw, X } from "lucide-react";

export interface UndoToastEventDetail {
  id: string;
  message: string;
  onUndo: () => void;
  durationSeconds?: number;
}

export function triggerUndoToast(options: {
  message: string;
  onUndo: () => void;
  durationSeconds?: number;
}) {
  if (typeof window === "undefined") return;
  const detail: UndoToastEventDetail = {
    id: `undo-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    message: options.message,
    onUndo: options.onUndo,
    durationSeconds: options.durationSeconds || 10,
  };
  window.dispatchEvent(new CustomEvent("icc-show-undo-toast", { detail }));
}

interface ActiveUndoToast {
  id: string;
  message: string;
  onUndo: () => void;
  duration: number;
  remaining: number;
}

export function UndoToastContainer() {
  const [activeToast, setActiveToast] = useState<ActiveUndoToast | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleShowToast = (e: Event) => {
      const custom = e as CustomEvent<UndoToastEventDetail>;
      if (!custom.detail) return;

      if (timerRef.current) clearInterval(timerRef.current);

      const duration = custom.detail.durationSeconds || 10;
      setActiveToast({
        id: custom.detail.id,
        message: custom.detail.message,
        onUndo: custom.detail.onUndo,
        duration,
        remaining: duration,
      });

      timerRef.current = setInterval(() => {
        setActiveToast((prev) => {
          if (!prev) return null;
          if (prev.remaining <= 1) {
            clearInterval(timerRef.current!);
            return null;
          }
          return { ...prev, remaining: prev.remaining - 1 };
        });
      }, 1000);
    };

    window.addEventListener("icc-show-undo-toast", handleShowToast);
    return () => {
      window.removeEventListener("icc-show-undo-toast", handleShowToast);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!activeToast) return null;

  const handleUndoClick = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    activeToast.onUndo();
    setActiveToast(null);
  };

  const handleDismiss = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveToast(null);
  };

  const progressPercent = (activeToast.remaining / activeToast.duration) * 100;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="bg-surface text-ink px-4 py-3 rounded-panel shadow-panel border border-line flex flex-col gap-2 min-w-[320px] max-w-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-medium text-ink truncate">{activeToast.message}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleUndoClick}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-white hover:bg-primary-hover text-xs font-semibold rounded-control transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Undo ({activeToast.remaining}s)</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 text-mutedText hover:text-ink hover:bg-ground rounded-control transition-colors cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 10-second countdown progress bar */}
        <div className="w-full bg-ground h-1 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
