"use client";

import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isWeekend, getISOWeek } from "date-fns";

export interface CalendarItem {
  id: string;
  title: string;
  kind: "MEETING" | "DEADLINE" | "GOLIVE" | "RENEWAL" | "LEAVE" | "HOLIDAY" | "TODO";
  date: string; // YYYY-MM-DD
  time?: string;
}

interface MonthGridProps {
  currentDate: Date;
  items: CalendarItem[];
  onSelectDate: (date: Date) => void;
  selectedDate?: Date | null;
}

export function MonthGrid({ currentDate, items, onSelectDate, selectedDate }: MonthGridProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  // Group by weeks of 7 days
  const weeks = useMemo(() => {
    const res: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      res.push(days.slice(i, i + 7));
    }
    return res;
  }, [days]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const list = map.get(item.date) || [];
      list.push(item);
      map.set(item.date, list);
    }
    return map;
  }, [items]);

  return (
    <div className="bg-surface rounded-panel border border-line shadow-xs overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-[36px_repeat(7,1fr)] bg-ground border-b border-line text-center text-[10px] font-mono font-semibold text-mutedText py-2">
        <span className="text-mutedText/60">W#</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span className="text-chasing font-bold">Sun</span>
      </div>

      {/* 6-row calendar grid */}
      <div className="divide-y divide-line">
        {weeks.map((week, wIdx) => {
          const isoWeek = getISOWeek(week[0]);
          return (
            <div key={wIdx} className="grid grid-cols-[36px_repeat(7,1fr)] min-h-[96px] divide-x divide-line">
              {/* Week Number column */}
              <div className="bg-ground/40 flex items-center justify-center text-[10px] font-mono text-mutedText/50 select-none">
                {isoWeek}
              </div>

              {/* 7 Days */}
              {week.map((day) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const inCurrentMonth = isSameMonth(day, currentDate);
                const isCurrentDay = isToday(day);
                const isSelected = selectedDate && format(selectedDate, "yyyy-MM-dd") === dayKey;
                const isSun = day.getDay() === 0;
                const dayItems = itemsByDate.get(dayKey) || [];

                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() => onSelectDate(day)}
                    className={`p-1.5 flex flex-col justify-between text-left transition-colors cursor-pointer relative min-h-[90px] ${
                      !inCurrentMonth ? "bg-ground/30 text-mutedText/40" : "bg-surface text-ink"
                    } ${isSun && inCurrentMonth ? "bg-[#FBFAF7]" : ""} ${
                      isSelected ? "ring-2 ring-primary ring-inset z-10" : ""
                    } hover:bg-ground/60`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-mono font-semibold rounded-full w-5 h-5 flex items-center justify-center ${
                          isCurrentDay
                            ? "bg-primary text-white font-bold ring-2 ring-primary/30"
                            : ""
                        }`}
                      >
                        {format(day, "d")}
                      </span>

                      {dayItems.length > 0 && (
                        <span className="text-[10px] font-mono font-bold text-primary">
                          {dayItems.length}
                        </span>
                      )}
                    </div>

                    {/* Items snippet (up to 2 visible, +N more) */}
                    <div className="space-y-1 w-full mt-1">
                      {dayItems.slice(0, 2).map((it) => (
                        <div
                          key={it.id}
                          className={`text-[10px] font-medium px-1 py-0.5 rounded truncate border leading-tight ${
                            it.kind === "HOLIDAY"
                              ? "bg-ground text-ink border-line"
                              : it.kind === "MEETING"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : it.kind === "DEADLINE"
                              ? "bg-danger/10 text-danger border-danger/20"
                              : "bg-surface text-mutedText border-line"
                          }`}
                        >
                          {it.title}
                        </div>
                      ))}
                      {dayItems.length > 2 && (
                        <div className="text-[9px] font-mono text-mutedText pl-1">
                          +{dayItems.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
