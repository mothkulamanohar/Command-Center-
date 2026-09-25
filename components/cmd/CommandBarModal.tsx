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
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ query?: string }>;
      if (customEvent?.detail?.query) {
        setInput(customEvent.detail.query);
      }
      setIsOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-bar", handleOpen);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-bar", handleOpen);
    };
  }, [isOpen]);

  useEffect(() => {
    if (input.trim().length > 0) {
      const res = parseCommand(input);
      setPreview(res);
    } else {
      setPreview(null);
    }
  }, [input]);

  const handleRun = (explicitInput?: string, explicitPreview?: ParseResult) => {
    const textToRun = explicitInput ?? input;
    const previewToRun = explicitPreview ?? preview;
    if (!textToRun.trim() || !previewToRun) return;

    setHistory((prev) => [textToRun, ...prev.slice(0, 19)]);
    setToast(`Executed: ${previewToRun.preview}`);
    setTimeout(() => setToast(null), 10000); // 10s undo window per SPEC §4.2

    // Dispatch event so Console and other views update in real-time
    window.dispatchEvent(
      new CustomEvent("command-executed", {
        detail: {
          input: textToRun,
          intent: previewToRun.intent,
          slots: previewToRun.slots,
          preview: previewToRun.preview,
        },
      })
    );

    setInput("");
    setIsOpen(false);
  };

  const handleExampleSelect = (text: string, executeImmediately = false) => {
    setInput(text);
    const res = parseCommand(text);
    setPreview(res);
    if (executeImmediately && res) {
      handleRun(text, res);
    }
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
                className="text-mutedText hover:text-ink p-1 rounded-control cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Live Preview & One-Click Execute Bar */}
            {preview && (
              <button
                type="button"
                onClick={() => handleRun()}
                className="w-full px-4 py-2.5 bg-ground hover:bg-primary/10 border-b border-line flex items-center justify-between transition-colors cursor-pointer text-left group"
                aria-label="Execute command"
              >
                <div className="flex items-center gap-2 text-xs font-mono text-ink">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-primary uppercase text-[10px] bg-primary/10 px-1.5 py-0.5 rounded">
                    {preview.intent}:
                  </span>
                  <span className="truncate group-hover:text-primary transition-colors">{preview.preview}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-white bg-primary hover:bg-primary-hover px-2.5 py-1 rounded shadow-xs shrink-0 ml-2">
                  <span className="font-semibold">Enter</span>
                  <CornerDownLeft className="h-3 w-3" />
                </div>
              </button>
            )}

            {/* Suggestions & Cheatsheet */}
            <div className="p-4 space-y-2 text-xs text-mutedText bg-surface-alt">
              <div className="text-[10px] font-mono uppercase tracking-wider text-mutedText">
                Examples you can type or click:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                {[
                  "Ask Hari to check fee page by tomorrow, chase daily",
                  "Add: VC wants placement report by Monday",
                  "Pass UOS rollout to Hari",
                  "what's my day?",
                ].map((ex) => (
                  <div
                    key={ex}
                    onClick={() => handleExampleSelect(ex, false)}
                    className="p-2.5 bg-surface border border-line rounded-control text-left hover:border-primary text-ink transition-colors cursor-pointer flex items-center justify-between gap-2 group"
                  >
                    <span className="line-clamp-2">{ex}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExampleSelect(ex, true);
                      }}
                      className="shrink-0 px-2 py-0.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded text-[10px] font-medium transition-colors cursor-pointer shadow-xs"
                      title="Run immediately"
                    >
                      Run &rarr;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
