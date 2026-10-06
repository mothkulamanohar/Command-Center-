"use client";

import { useState, useEffect } from "react";
import { Sunrise, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Bell, CheckCircle2 } from "lucide-react";
import type { MorningBriefData } from "@/lib/services/brief";

interface MorningBriefCardProps {
  initialData: MorningBriefData;
  onRefresh?: () => void;
}

export function MorningBriefCard({ initialData, onRefresh }: MorningBriefCardProps) {
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="bg-surface rounded-card border border-line p-4 shadow-2xs space-y-3">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-control bg-primary/10 text-primary">
            <Sunrise className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-ink">Morning Brief · 08:00 IST</h3>
            <p className="text-[10px] text-mutedText font-mono">{data.date}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className={`p-1.5 rounded-control text-mutedText hover:text-ink hover:bg-surface-alt transition-colors ${
            isRefreshing ? "animate-spin" : ""
          }`}
          title="Refresh Morning Brief"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Summary statement */}
      <div className="p-2.5 rounded-control bg-surface-alt/70 border border-line/60 text-xs text-ink leading-relaxed">
        {data.summaryText.split("\n").map((line, idx) => (
          <p key={idx} className="mt-0.5 first:mt-0">
            {line.replace(/\*\*/g, "")}
          </p>
        ))}
      </div>

      {/* Key Metric Chips */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="p-2 rounded-control bg-surface border border-line flex flex-col items-center text-center">
          <span className="text-[10px] text-mutedText font-mono uppercase">Due Today</span>
          <span className="text-sm font-bold text-ink mt-0.5">{data.dueToday.length}</span>
        </div>
        <div className="p-2 rounded-control bg-surface border border-line flex flex-col items-center text-center">
          <span className="text-[10px] text-mutedText font-mono uppercase">Overdue</span>
          <span className="text-sm font-bold text-danger mt-0.5">{data.overdue.length}</span>
        </div>
        <div className="p-2 rounded-control bg-surface border border-line flex flex-col items-center text-center">
          <span className="text-[10px] text-mutedText font-mono uppercase">Chases</span>
          <span className="text-sm font-bold text-chasing mt-0.5">{data.chasesToday.length}</span>
        </div>
      </div>

      {/* Expand / Collapse Details */}
      {expanded && (
        <div className="pt-2 border-t border-line space-y-2 text-xs animate-in fade-in">
          {data.leadershipAsks.length > 0 && (
            <div>
              <span className="font-semibold text-ink text-[11px]">Leadership Asks:</span>
              <ul className="mt-1 space-y-1">
                {data.leadershipAsks.map((ask) => (
                  <li key={ask.id} className="text-mutedText flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="text-primary font-bold">T-{ask.number}</span>
                    <span>{ask.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1 py-1 text-[11px] font-medium text-mutedText hover:text-ink transition-colors"
      >
        <span>{expanded ? "Show less" : "View full breakdown"}</span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
    </div>
  );
}
