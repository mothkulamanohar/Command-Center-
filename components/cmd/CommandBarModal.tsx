"use client";

import { useState, useEffect } from "react";
import { parseCommand } from "@/lib/cmd/parse";
import { ParseResult } from "@/lib/cmd/intents";
import { Search, Sparkles, X, CornerDownLeft, Undo2, Check } from "lucide-react";

export function CommandBarModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !isOpen && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA")) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (input.trim().length > 0) {
      const res = parseCommand(input);
      setPreview(res);
    } else {
      setPreview(null);
    }
  }, [input]);

  const handleRun = () => {
    if (!input.trim() || !preview) return;

    setHistory((prev) => [input, ...prev.slice(0, 19)]);
    setToast(`Executed: ${preview.preview}`);
    setTimeout(() => setToast(null), 10000); // 10s undo window per SPEC §4.2

    setInput("");
    setIsOpen(false);
  };

  if (!isOpen && !toast) return null;

  return (
    <>
      {/* Toast Notification with 10s Undo per SPEC §4.2 */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-white px-4 py-3 rounded-control border border-[#262A33] shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <Check className="h-4 w-4 text-[#3FB8AC]" />
          <span className="text-xs font-mono">{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 inline-flex items-center gap-1 text-[11px] font-mono text-[#3FB8AC] hover:underline"
          >
            <Undo2 className="h-3 w-3" />
            <span>Undo (10s)</span>
          </button>
        </div>
      )}

      {/* Command Bar Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-ink/60 backdrop-blur-xs z-50 flex items-start justify-center pt-20 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-surface w-full max-w-2xl rounded-panel border border-line shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input Bar */}
            <div className="flex items-center px-4 py-3 border-b border-line gap-3">
              <Search className="h-5 w-5 text-mutedText shrink-0" />
              <input
                type="text"
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRun();
                  if (e.key === "ArrowUp") {
                    if (historyIndex < history.length - 1) {
                      const nextIdx = historyIndex + 1;
                      setHistoryIndex(nextIdx);
                      setInput(history[nextIdx] || "");
                    }
                  }
                  if (e.key === "ArrowDown") {
                    if (historyIndex > 0) {
                      const nextIdx = historyIndex - 1;
                      setHistoryIndex(nextIdx);
                      setInput(history[nextIdx] || "");
                    } else if (historyIndex === 0) {
                      setHistoryIndex(-1);
                      setInput("");
                    }
                  }
                }}
                placeholder="Ask Hari to fix fee page by Friday, chase daily..."
                className="flex-1 bg-transparent text-sm text-ink placeholder:text-mutedText focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-mutedText hover:text-ink p-1 rounded-control"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Live Preview Line per SPEC §8.1 */}
            {preview && (
              <div className="px-4 py-2.5 bg-ground border-b border-line flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-ink">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="font-semibold text-primary uppercase text-[10px]">
                    {preview.intent}:
                  </span>
                  <span className="truncate">{preview.preview}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono text-mutedText">
                  <span>Enter</span>
                  <CornerDownLeft className="h-2.5 w-2.5" />
                </div>
              </div>
            )}

            {/* Suggestions & Cheatsheet */}
            <div className="p-4 space-y-2 text-xs text-mutedText bg-surface-alt">
              <div className="text-[10px] font-mono uppercase tracking-wider text-mutedText">
                Examples you can type:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => setInput("Ask Hari to check fee page by tomorrow, chase daily")}
                  className="p-2 bg-surface border border-line rounded-control text-left hover:border-primary text-ink transition-colors"
                >
                  Ask Hari to check fee page by tomorrow, chase daily
                </button>
                <button
                  type="button"
                  onClick={() => setInput("Add: VC wants placement report by Monday")}
                  className="p-2 bg-surface border border-line rounded-control text-left hover:border-primary text-ink transition-colors"
                >
                  Add: VC wants placement report by Monday
                </button>
                <button
                  type="button"
                  onClick={() => setInput("Pass UOS rollout to Hari")}
                  className="p-2 bg-surface border border-line rounded-control text-left hover:border-primary text-ink transition-colors"
                >
                  Pass UOS rollout to Hari
                </button>
                <button
                  type="button"
                  onClick={() => setInput("what's my day?")}
                  className="p-2 bg-surface border border-line rounded-control text-left hover:border-primary text-ink transition-colors"
                >
                  what&apos;s my day?
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
