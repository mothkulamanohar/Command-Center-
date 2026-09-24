import { Calendar as CalendarIcon, Plus } from "lucide-react";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Calendar</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Meetings, Deadlines, Go-lives, Renewals, Leave & Holidays
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-medium transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Event</span>
        </button>
      </div>

      <div className="bg-surface rounded-panel border border-line p-8 text-center min-h-[380px] flex flex-col items-center justify-center shadow-xs">
        <div className="h-12 w-12 rounded-full bg-surface-alt border border-line flex items-center justify-center text-mutedText mb-3">
          <CalendarIcon className="h-6 w-6" />
        </div>
        <h2 className="text-sm font-semibold text-ink">Schedule & Deadlines</h2>
        <p className="text-xs text-mutedText mt-1 max-w-sm">
          Task due dates and meetings appear here with 15-minute reminders and meeting note links.
        </p>
      </div>
    </div>
  );
}
