"use client";

import { Search, Plus, Bell, Command } from "lucide-react";
import { useEffect, useState } from "react";

export function Header() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault();
        // Command bar trigger
        alert("Command bar (F-CMD) shortcut triggered. Active in Phase 2.");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="h-16 bg-surface border-b border-line px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Command Bar search trigger */}
      <div className="flex-1 max-w-xl">
        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", ctrlKey: true })
            )
          }
          className="w-full flex items-center justify-between px-3.5 py-2 bg-ground border border-line rounded-control text-xs text-mutedText hover:border-mutedText transition-colors shadow-xs"
          aria-label="Open command bar"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-mutedText" />
            <span>Type a command or ask anything...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono bg-surface border border-line rounded text-mutedText">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-2 md:gap-3 ml-4">
        {/* Quick Add Button */}
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-medium transition-colors shadow-xs"
          aria-label="Quick add task, request or update"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add</span>
        </button>

        {/* Notifications Bell */}
        <button
          type="button"
          className="relative p-2 text-ink hover:bg-surface-alt border border-line rounded-control transition-colors"
          aria-label="View notifications (3 unread)"
        >
          <Bell className="h-4 w-4 text-ink" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-chasing" />
        </button>

        {/* User Chip */}
        <div className="flex items-center gap-2 pl-2 border-l border-line">
          <div className="h-8 w-8 rounded-control bg-primary text-white font-mono font-semibold flex items-center justify-center text-xs">
            SR
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold leading-tight text-ink">
              Sri
            </div>
            <div className="text-[10px] text-mutedText leading-tight font-mono">
              IT Manager
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
