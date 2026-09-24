"use client";

import { useState } from "react";
import { CalendarView, CalendarEvent } from "@/components/calendar/CalendarView";
import { Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: "e-1",
    title: "SMRU IT Weekly Coordination Meeting",
    kind: "MEETING",
    date: "25 Sep 2026",
    time: "10:00 AM",
    location: "IT Conference Room",
  },
  {
    id: "e-2",
    title: "UOS Phase 1 Go-Live: Campus A & B",
    kind: "GOLIVE",
    date: "26 Sep 2026",
    time: "09:00 AM",
    location: "Main Campus Server Room",
  },
  {
    id: "e-3",
    title: "smru.in SSL Certificate Renewal Deadline",
    kind: "RENEWAL",
    date: "28 Sep 2026",
    time: "06:00 PM",
    location: "DNS Console",
  },
  {
    id: "e-4",
    title: "Monthly KPI Report Delivery to VC Office",
    kind: "DEADLINE",
    date: "29 Sep 2026",
    time: "05:00 PM",
    location: "VC Office",
  },
  {
    id: "e-5",
    title: "Gandhi Jayanti (University Holiday)",
    kind: "HOLIDAY",
    date: "02 Oct 2026",
    time: "All Day",
    location: "All Campuses",
  },
];

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddEvent = (eventData: Omit<CalendarEvent, "id">) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `ev-${Date.now()}`,
    };
    setEvents([newEvent, ...events]);
    showToast(`Event scheduled: "${eventData.title}"`);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-surface px-4 py-2.5 rounded-control text-xs font-medium shadow-panel border border-line flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Calendar & Deadlines</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Track F: Meetings, Deadlines, Go-Lives, SSL Renewals & Holidays
          </p>
        </div>
      </div>

      <CalendarView events={events} onAddEvent={handleAddEvent} />
    </div>
  );
}
