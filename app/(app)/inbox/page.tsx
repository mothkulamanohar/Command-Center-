import { Inbox, Plus, Filter } from "lucide-react";

export default function InboxPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Inbox</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Requests from Anyone • Accept, Delegate, Schedule, or Decline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-line rounded-control text-xs text-ink hover:bg-surface-alt transition-colors"
          >
            <Filter className="h-3.5 w-3.5 text-mutedText" />
            <span>Filter</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Request</span>
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-panel border border-line p-8 text-center min-h-[360px] flex flex-col items-center justify-center shadow-xs">
        <div className="h-12 w-12 rounded-full bg-surface-alt border border-line flex items-center justify-center text-mutedText mb-3">
          <Inbox className="h-6 w-6" />
        </div>
        <h2 className="text-sm font-semibold text-ink">Inbox Zero</h2>
        <p className="text-xs text-mutedText mt-1 max-w-sm">
          No new requests waiting. Any request raised by team members or guest leadership offices lands here.
        </p>
      </div>
    </div>
  );
}
