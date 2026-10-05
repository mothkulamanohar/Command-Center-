"use client";

import { format } from "date-fns";
import { X, Calendar as CalendarIcon, Clock, CheckCircle2, Plus, AlertCircle, MapPin } from "lucide-react";
import { CalendarItem } from "./MonthGrid";

interface DayPanelProps {
  date: Date;
  onClose: () => void;
  items: CalendarItem[];
  onQuickAdd: (kind: "EVENT" | "TASK" | "TODO") => void;
}

export function DayPanel({ date, onClose, items, onQuickAdd }: DayPanelProps) {
  const fullDateString = format(date, "EEEE, dd MMMM yyyy");
  const dateKey = format(date, "yyyy-MM-dd");
  const dayItems = items.filter((i) => i.date === dateKey);

  return (
    <div className="bg-surface rounded-panel border border-line shadow-panel p-5 space-y-4 animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-line">
        <div>
          <span className="text-[10px] font-mono text-mutedText uppercase tracking-wider">
            Day Schedule & Details
          </span>
          <h2 className="text-sm font-bold text-ink">{fullDateString}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-mutedText hover:text-ink cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Quick Add Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onQuickAdd("EVENT")}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-ground hover:bg-ground/80 border border-line text-xs font-semibold text-ink cursor-pointer"
        >
          <Plus className="h-3 w-3 text-primary" />
          <span>Event</span>
        </button>
        <button
          type="button"
          onClick={() => onQuickAdd("TASK")}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-ground hover:bg-ground/80 border border-line text-xs font-semibold text-ink cursor-pointer"
        >
          <Plus className="h-3 w-3 text-primary" />
          <span>Task</span>
        </button>
        <button
          type="button"
          onClick={() => onQuickAdd("TODO")}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-ground hover:bg-ground/80 border border-line text-xs font-semibold text-ink cursor-pointer"
        >
          <Plus className="h-3 w-3 text-primary" />
          <span>To-do</span>
        </button>
      </div>

      {/* Day Items List */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono uppercase text-mutedText font-semibold">
          Scheduled Items ({dayItems.length})
        </div>

        {dayItems.length === 0 ? (
          <div className="p-6 text-center bg-ground rounded-control border border-line text-xs text-mutedText">
            No events or deadlines scheduled for this date.
          </div>
        ) : (
          <div className="space-y-2">
            {dayItems.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-ground rounded-control border border-line space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-surface border border-line text-primary">
                    {item.kind}
                  </span>
                  {item.time && (
                    <span className="text-[10px] font-mono text-mutedText flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.time}
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-ink">{item.title}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attendance & Updates Context */}
      <div className="p-3 bg-ground/50 rounded-control border border-line text-xs space-y-1">
        <div className="font-semibold text-ink flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
          <span>Attendance & Update Status</span>
        </div>
        <p className="text-[11px] text-mutedText font-mono">
          Status: <strong className="text-primary font-sans">PRESENT</strong> (09:04 – 18:00) • Daily Update: <strong className="text-primary font-sans">POSTED</strong>
        </p>
      </div>
    </div>
  );
}
