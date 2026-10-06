"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Calendar as CalendarIcon, CheckCircle2, ChevronLeft, ChevronRight, Download, Plus, Filter } from "lucide-react";
import { format } from "date-fns";
import { MonthGrid, CalendarItem } from "@/components/calendar/MonthGrid";
import { YearView } from "@/components/calendar/YearView";
import { DayPanel } from "@/components/calendar/DayPanel";
import { CalendarView, CalendarEvent } from "@/components/calendar/CalendarView";
import { getCalendarItemsAction, createCalendarEventAction } from "./actions";

import { getFestivalCalendarItems } from "@/lib/services/festivalData";

const BASELINE_USER_ITEMS: CalendarItem[] = [
  { id: "t-1042-dl", title: "[T-1042] Review monthly KPI report for VC", kind: "DEADLINE", date: "2026-10-07", time: "06:00 PM" },
  { id: "t-1043-dl", title: "[T-1043] Approve UOS implementation rollout schedule", kind: "DEADLINE", date: "2026-10-08", time: "06:00 PM" },
  { id: "t-1044-dl", title: "[T-1044] Fix admission form verification on smru.in", kind: "DEADLINE", date: "2026-10-09", time: "06:00 PM" },
  { id: "t-1045-dl", title: "[T-1045] Renew smru.in SSL & DNS mapping", kind: "DEADLINE", date: "2026-10-12", time: "06:00 PM" },
  { id: "ev-1", title: "Campus IT Weekly Operations Sync", kind: "MEETING", date: "2026-10-06", time: "10:00 AM" },
  { id: "ev-2", title: "UOS Phase 1 Implementation Review", kind: "MEETING", date: "2026-10-08", time: "02:30 PM" },
];

const INITIAL_CALENDAR_ITEMS: CalendarItem[] = [
  ...(getFestivalCalendarItems(2026) as CalendarItem[]),
  ...BASELINE_USER_ITEMS,
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"MONTH" | "YEAR" | "LIST">("MONTH");
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [items, setItems] = useState<CalendarItem[]>(INITIAL_CALENDAR_ITEMS);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const loadItems = async () => {
    const res = await getCalendarItemsAction(currentYear, currentMonth);
    if (res.success && res.data && res.data.length > 0) {
      setItems(res.data);
    }
  };

  useEffect(() => {
    loadItems();
  }, [currentYear, currentMonth]);

  const handlePrev = () => {
    if (viewMode === "YEAR") {
      setCurrentDate(new Date(currentYear - 1, currentMonth, 1));
    } else {
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "YEAR") {
      setCurrentDate(new Date(currentYear + 1, currentMonth, 1));
    } else {
      setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDay(now);
    toast.success(`Navigated to Today (${format(now, "d MMM yyyy")})`);
  };

  const handleQuickAdd = (kind: "EVENT" | "TASK" | "TODO") => {
    const dateStr = format(selectedDay || new Date(), "yyyy-MM-dd");
    if (kind === "TODO") {
      window.dispatchEvent(
        new CustomEvent("open-command-bar", { detail: { query: `todo on ${dateStr}: ` } })
      );
      toast.success(`Command bar opened for To-do on ${dateStr}`);
    } else if (kind === "TASK") {
      window.dispatchEvent(
        new CustomEvent("open-command-bar", { detail: { query: `Add: task due ${dateStr} ` } })
      );
      toast.success(`Command bar opened for Task due ${dateStr}`);
    } else {
      window.dispatchEvent(
        new CustomEvent("open-command-bar", { detail: { query: `meeting on ${dateStr} ` } })
      );
      toast.success(`Command bar opened for Event on ${dateStr}`);
    }
  };

  return (
    <div className="space-y-6">
      

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Full Calendar</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Track H (F-CAL-08..16): All Dates, Month & Year Grids, Holidays, Day Panel
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="inline-flex rounded-control border border-line bg-surface p-0.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => setViewMode("MONTH")}
              className={`px-3 py-1 rounded-control font-medium transition-colors cursor-pointer ${
                viewMode === "MONTH" ? "bg-primary text-white" : "text-mutedText hover:text-ink"
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode("YEAR")}
              className={`px-3 py-1 rounded-control font-medium transition-colors cursor-pointer ${
                viewMode === "YEAR" ? "bg-primary text-white" : "text-mutedText hover:text-ink"
              }`}
            >
              Year
            </button>
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className={`px-3 py-1 rounded-control font-medium transition-colors cursor-pointer ${
                viewMode === "LIST" ? "bg-primary text-white" : "text-mutedText hover:text-ink"
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3 rounded-panel border border-line shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="p-1.5 rounded-control border border-line hover:bg-ground text-ink cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1 rounded-control border border-line text-xs font-mono font-semibold hover:bg-ground cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="p-1.5 rounded-control border border-line hover:bg-ground text-ink cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Month / Year Title & Dropdowns */}
          <div className="flex items-center gap-1 pl-2">
            {viewMode !== "YEAR" && (
              <span className="text-sm font-bold text-ink font-mono">
                {format(currentDate, "MMMM")}
              </span>
            )}
            <span className="text-sm font-bold text-primary font-mono pl-1">
              {currentYear}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-mutedText">
          <span>Week Starts: <strong className="text-ink">Mon</strong></span>
          <span>•</span>
          <span>Leap Year: <strong className="text-ink">Supported</strong></span>
        </div>
      </div>

      {/* Main Views Layout */}
      {viewMode === "MONTH" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <MonthGrid
              currentDate={currentDate}
              items={items}
              onSelectDate={(d) => setSelectedDay(d)}
              selectedDate={selectedDay}
            />
          </div>

          <div className="lg:col-span-1">
            {selectedDay ? (
              <DayPanel
                date={selectedDay}
                onClose={() => setSelectedDay(null)}
                items={items}
                onQuickAdd={handleQuickAdd}
              />
            ) : (
              <div className="p-8 text-center bg-surface rounded-panel border border-line text-xs text-mutedText">
                Select any date in the calendar to view its schedule and day panel.
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === "YEAR" && (
        <YearView
          year={currentYear}
          items={items}
          onSelectDate={(d) => {
            setCurrentDate(d);
            setSelectedDay(d);
            setViewMode("MONTH");
          }}
          onSelectMonth={(m) => {
            setCurrentDate(new Date(currentYear, m, 1));
            setViewMode("MONTH");
          }}
        />
      )}

      {viewMode === "LIST" && (
        <CalendarView
          events={items.map((i) => ({
            id: i.id,
            title: i.title,
            kind: i.kind === "TODO" ? "MEETING" : i.kind,
            date: i.date,
            time: i.time || "All Day",
          }))}
          onAddEvent={async (ev) => {
            const res = await createCalendarEventAction({
              title: ev.title,
              kind: ev.kind as any,
              date: ev.date,
              time: ev.time,
            });
            if (res.success) {
              toast.success(`Event added: ${ev.title}`);
              loadItems();
            } else {
              toast.error(res.error || "Failed to create event");
            }
          }}
        />
      )}
    </div>
  );
}
