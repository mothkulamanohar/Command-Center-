"use client";

import { CheckSquare, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export interface ScheduleSlot {
  time: string;
  title: string;
  kind: "TODO" | "MEETING" | "TASK";
}

interface TodayScheduleCardProps {
  slots?: ScheduleSlot[];
  unscheduledCount?: number;
}

export function TodayScheduleCard({
  slots = [],
  unscheduledCount = 0,
}: TodayScheduleCardProps) {
  return (
    <div className="bg-surface rounded-panel border border-line p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-ink">Today&apos;s Schedule (v1.1)</h2>
          </div>
          {unscheduledCount > 0 && (
            <span className="text-[11px] font-mono text-mutedText bg-ground px-2 py-0.5 rounded border border-line">
              {unscheduledCount} unscheduled
            </span>
          )}
        </div>

        {slots.length === 0 ? (
          <div className="py-8 text-center text-xs text-mutedText font-mono">
            No scheduled events or tasks for today.
          </div>
        ) : (
          <div className="space-y-2">
            {slots.map((slot, i) => (
              <div
                key={i}
                className="p-2.5 rounded-control bg-ground border border-line flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-ink truncate">{slot.title}</div>
                  <div className="text-[10px] font-mono text-mutedText flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>{slot.time}</span>
                  </div>
                </div>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase border shrink-0 ${
                    slot.kind === "MEETING"
                      ? "bg-primary/10 text-primary border-primary/20"
                      : slot.kind === "TASK"
                      ? "bg-chasing/10 text-chasing border-chasing/20"
                      : "bg-surface text-ink border-line"
                  }`}
                >
                  {slot.kind}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-line mt-3 flex justify-between items-center">
        <span className="text-[11px] font-mono text-mutedText">Planned around meetings</span>
        <Link
          href="/todo"
          prefetch={true}
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          <span>Open Day Schedule</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
