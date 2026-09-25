"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, Clock, MapPin, Tag, Plus, X, Download } from "lucide-react";

export interface CalendarEvent {
  id: string;
  title: string;
  kind: "MEETING" | "DEADLINE" | "GOLIVE" | "RENEWAL" | "LEAVE" | "HOLIDAY";
  date: string;
  time: string;
  location?: string | null;
  priority?: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, "id">) => void;
}

export function CalendarView({ events, onAddEvent }: CalendarViewProps) {
  const [selectedKind, setSelectedKind] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newKind, setNewKind] = useState<CalendarEvent["kind"]>("MEETING");
  const [newDate, setNewDate] = useState("2026-09-25");
  const [newTime, setNewTime] = useState("11:00 AM");
  const [newLocation, setNewLocation] = useState("");

  const filtered = events.filter((e) => selectedKind === "ALL" || e.kind === selectedKind);

  const getKindColor = (kind: CalendarEvent["kind"]) => {
    switch (kind) {
      case "MEETING":
        return "bg-primary/10 text-primary border-primary/20";
      case "DEADLINE":
        return "bg-danger/10 text-danger border-danger/20";
      case "GOLIVE":
        return "bg-shared/10 text-shared border-shared/20";
      case "RENEWAL":
        return "bg-chasing/10 text-chasing border-chasing/20";
      case "HOLIDAY":
        return "bg-ground text-ink border-line";
      default:
        return "bg-surface text-mutedText border-line";
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddEvent({
      title: newTitle.trim(),
      kind: newKind,
      date: newDate,
      time: newTime,
      location: newLocation || null,
    });

    setNewTitle("");
    setIsModalOpen(false);
  };

  const handleExportIcs = () => {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//IT Command Center//Calendar Engine//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];
    for (const ev of events) {
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${ev.id}@commandcenter.local`);
      lines.push(`SUMMARY:${ev.title}`);
      if (ev.location) lines.push(`LOCATION:${ev.location}`);
      lines.push("STATUS:CONFIRMED");
      lines.push("END:VEVENT");
    }
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "smru-calendar.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filter and New Event Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {["ALL", "MEETING", "DEADLINE", "GOLIVE", "RENEWAL", "HOLIDAY"].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setSelectedKind(k)}
              className={`px-2.5 py-1 rounded-control text-xs font-medium font-mono uppercase transition-colors shrink-0 cursor-pointer ${
                selectedKind === k
                  ? "bg-primary text-white"
                  : "bg-surface border border-line text-mutedText hover:text-ink"
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            type="button"
            onClick={handleExportIcs}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-alt border border-line text-ink rounded-control text-xs font-medium transition-colors cursor-pointer shadow-2xs"
            title="Download iCalendar (.ics) feed"
          >
            <Download className="h-3.5 w-3.5 text-mutedText" />
            <span>Export .ICS</span>
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-semibold shadow-2xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* Events List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-card border border-line bg-surface hover:border-primary/40 transition-colors flex items-start justify-between gap-3"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${getKindColor(
                    item.kind
                  )}`}
                >
                  {item.kind}
                </span>
                <span className="text-xs font-bold text-ink truncate">{item.title}</span>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-mutedText font-mono pt-1">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {item.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {item.time}
                </span>
                {item.location && (
                  <span className="flex items-center gap-1 font-sans">
                    <MapPin className="h-3 w-3" />
                    {item.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-panel border border-line w-full max-w-md shadow-panel p-4 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <h3 className="text-sm font-bold text-ink">Schedule New Event</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-mutedText hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SMRU Wi-Fi Cutover Review"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-ink mb-1">Kind</label>
                  <select
                    value={newKind}
                    onChange={(e) => setNewKind(e.target.value as CalendarEvent["kind"])}
                    className="w-full p-2 bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary font-mono text-[11px]"
                  >
                    <option value="MEETING">Meeting</option>
                    <option value="DEADLINE">Deadline</option>
                    <option value="GOLIVE">Go-Live</option>
                    <option value="RENEWAL">Renewal</option>
                    <option value="HOLIDAY">Holiday</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Time</label>
                  <input
                    type="text"
                    placeholder="11:00 AM"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full p-2 bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Location / Link</label>
                <input
                  type="text"
                  placeholder="e.g. Boardroom A or Google Meet"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full p-2 bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-mutedText hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-white font-semibold rounded-control"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
