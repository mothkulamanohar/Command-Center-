"use client";

import { TrendingUp, TrendingDown, Target, CheckCircle2 } from "lucide-react";

export interface KpiTile {
  name: string;
  value: string | number;
  target: string;
  change: string;
  isPositive: boolean;
  status: "GOOD" | "WARN" | "BAD";
}

interface KpiGridProps {
  tiles: KpiTile[];
}

export function KpiGrid({ tiles }: KpiGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map((kpi, idx) => (
        <div
          key={idx}
          className="bg-surface rounded-card border border-line p-4 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-mutedText font-medium">{kpi.name}</span>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                  kpi.status === "GOOD"
                    ? "bg-primary/10 text-primary border-primary/20"
                    : kpi.status === "WARN"
                    ? "bg-chasing/10 text-chasing border-chasing/20"
                    : "bg-danger/10 text-danger border-danger/20"
                }`}
              >
                {kpi.status}
              </span>
            </div>

            <div className="text-2xl font-bold text-ink mt-2 tracking-tight">
              {kpi.value}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-line flex items-center justify-between text-[11px] font-mono">
            <span className="text-mutedText flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span>Target: {kpi.target}</span>
            </span>

            <span
              className={`flex items-center gap-0.5 font-semibold ${
                kpi.isPositive ? "text-primary" : "text-danger"
              }`}
            >
              {kpi.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{kpi.change}</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
