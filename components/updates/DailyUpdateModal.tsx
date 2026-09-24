"use client";

import { useState } from "react";
import { Send, X, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

interface DailyUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { done: string; next: string; blockers?: string }) => void;
  initialDone?: string;
  initialNext?: string;
}

export function DailyUpdateModal({
  isOpen,
  onClose,
  onSubmit,
  initialDone = "",
  initialNext = "",
}: DailyUpdateModalProps) {
  const [done, setDone] = useState(initialDone);
  const [next, setNext] = useState(initialNext);
  const [blockers, setBlockers] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!done.trim() || !next.trim()) return;
    onSubmit({ done, next, blockers: blockers.trim() || undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-ink/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-xl rounded-panel border border-line p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-control bg-primary text-white">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Post Daily Update</h2>
              <p className="text-[11px] text-mutedText font-mono">
                Due by 18:00 IST • Pre-filled from your activity
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-mutedText hover:text-ink p-1 rounded-control"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider font-mono mb-1">
              1. What did you finish today? (Done)
            </label>
            <textarea
              rows={3}
              required
              value={done}
              onChange={(e) => setDone(e.target.value)}
              placeholder="Tasks completed today..."
              className="w-full p-2.5 bg-ground border border-line rounded-control text-xs font-mono text-ink focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider font-mono mb-1">
              2. What are you tackling tomorrow? (Next)
            </label>
            <textarea
              rows={3}
              required
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="Tasks planned for next working day..."
              className="w-full p-2.5 bg-ground border border-line rounded-control text-xs font-mono text-ink focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider font-mono mb-1 flex items-center justify-between">
              <span>3. Any blockers or dependencies? (Optional)</span>
              <span className="text-[10px] text-chasing font-normal">
                Notifies Lead & Sri
              </span>
            </label>
            <textarea
              rows={2}
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="Waiting for accounts signoff, server access..."
              className="w-full p-2.5 bg-ground border border-line rounded-control text-xs font-mono text-ink focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-line">
            <span className="text-[11px] font-mono text-mutedText">
              Takes &lt; 30 seconds
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-mutedText hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-control transition-colors shadow-xs"
              >
                Post Update
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
