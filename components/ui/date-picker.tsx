"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, parse, getDaysInMonth, startOfMonth, getDay } from "date-fns";

interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
}

export function DatePicker({ value, onChange, placeholder = "Select date" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDate = value ? new Date(value) : new Date();
  const [viewDate, setViewDate] = useState<Date>(selectedDate);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = getDaysInMonth(viewDate);
  const firstDayOfMonth = getDay(startOfMonth(viewDate));
  // Convert Sunday=0 to Monday=0: (day + 6) % 7
  const startOffset = (firstDayOfMonth + 6) % 7;

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const d = new Date(year, month, day);
    const formatted = format(d, "yyyy-MM-dd");
    onChange(formatted);
    setIsOpen(false);
  };

  const displayValue = value ? format(new Date(value), "dd MMM yyyy") : "";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-ground border border-line rounded-control text-xs text-ink focus:outline-none focus:border-primary text-left cursor-pointer"
      >
        <span className={displayValue ? "font-mono font-medium" : "text-mutedText"}>
          {displayValue || placeholder}
        </span>
        <CalendarIcon className="h-3.5 w-3.5 text-mutedText" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 z-50 bg-surface rounded-panel border border-line shadow-panel p-3 w-64 text-xs animate-in fade-in">
          {/* Month & Year header */}
          <div className="flex items-center justify-between pb-2 border-b border-line mb-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded text-mutedText hover:text-ink cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-bold text-ink font-mono">
              {format(viewDate, "MMMM yyyy")}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded text-mutedText hover:text-ink cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-mutedText font-semibold mb-1">
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
            <span className="text-chasing">Su</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
            {Array.from({ length: startOffset }).map((_, i) => (
              <span key={`empty-${i}`} className="p-1.5 text-mutedText/30">—</span>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected =
                value &&
                new Date(value).getFullYear() === year &&
                new Date(value).getMonth() === month &&
                new Date(value).getDate() === dayNum;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`p-1.5 rounded-control font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-primary text-white font-bold"
                      : "hover:bg-ground text-ink"
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          <div className="pt-2 mt-2 border-t border-line flex justify-between">
            <button
              type="button"
              onClick={() => {
                onChange(format(new Date(), "yyyy-MM-dd"));
                setIsOpen(false);
              }}
              className="text-[11px] font-mono text-primary font-semibold hover:underline"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-mutedText hover:text-ink"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
