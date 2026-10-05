"use client";

import { format, startOfMonth, getDaysInMonth, getDay, isToday } from "date-fns";
import { CalendarItem } from "./MonthGrid";

interface YearViewProps {
  year: number;
  items: CalendarItem[];
  onSelectDate: (date: Date) => void;
  onSelectMonth: (monthIndex: number) => void;
}

export function YearView({ year, items, onSelectDate, onSelectMonth }: YearViewProps) {
  const months = Array.from({ length: 12 }, (_, i) => i);

  // Group items by date string YYYY-MM-DD
  const itemDateCounts = new Map<string, number>();
  for (const item of items) {
    const cur = itemDateCounts.get(item.date) || 0;
    itemDateCounts.set(item.date, cur + 1);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {months.map((mIdx) => {
        const firstOfMonth = new Date(year, mIdx, 1);
        const daysInMonth = getDaysInMonth(firstOfMonth);
        const startDay = getDay(firstOfMonth);
        const mondayOffset = (startDay + 6) % 7;
        const monthName = format(firstOfMonth, "MMMM");

        return (
          <div
            key={mIdx}
            className="p-3 bg-surface rounded-card border border-line shadow-xs space-y-2 hover:border-primary/40 transition-colors"
          >
            {/* Clickable Month Title */}
            <div className="flex items-center justify-between pb-1.5 border-b border-line">
              <button
                type="button"
                onClick={() => onSelectMonth(mIdx)}
                className="text-xs font-bold text-ink hover:text-primary transition-colors cursor-pointer text-left"
              >
                {monthName}
              </button>
              <span className="text-[10px] font-mono text-mutedText">{year}</span>
            </div>

            {/* Weekday indicators */}
            <div className="grid grid-cols-7 gap-0.5 text-center font-mono text-[9px] text-mutedText font-semibold">
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
              <span className="text-chasing font-bold">S</span>
            </div>

            {/* Mini Days Grid */}
            <div className="grid grid-cols-7 gap-0.5 text-center font-mono text-[10px]">
              {Array.from({ length: mondayOffset }).map((_, i) => (
                <span key={`empty-${i}`} className="p-0.5 text-transparent">
                  .
                </span>
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const d = new Date(year, mIdx, dayNum);
                const dayKey = format(d, "yyyy-MM-dd");
                const count = itemDateCounts.get(dayKey) || 0;
                const isCurrent = isToday(d);

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => onSelectDate(d)}
                    className={`p-1 rounded text-center transition-colors cursor-pointer relative ${
                      isCurrent
                        ? "bg-primary text-white font-bold"
                        : "hover:bg-ground text-ink"
                    }`}
                  >
                    <span>{dayNum}</span>
                    {count > 0 && !isCurrent && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
