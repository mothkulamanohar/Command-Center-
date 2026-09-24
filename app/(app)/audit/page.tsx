import { Shield, Filter, Download } from "lucide-react";

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">System Audit Log</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Immutable Record of All System Operations (SPEC §5 F-AUTH-08)
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-line rounded-control text-xs text-ink hover:bg-surface-alt transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-panel border border-line overflow-hidden shadow-xs">
        <div className="p-4 border-b border-line flex items-center justify-between bg-surface-alt">
          <div className="text-xs font-mono font-semibold uppercase tracking-wider text-mutedText">
            Recent Audit Events
          </div>
          <span className="text-[11px] font-mono text-[#3FB8AC]">
            Tamper-evident
          </span>
        </div>

        <div className="p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
          <div className="h-10 w-10 rounded-full bg-surface-alt border border-line flex items-center justify-center text-mutedText mb-3">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-ink">Audit Log Initialized</h2>
          <p className="text-xs text-mutedText mt-1 max-w-md">
            All user creations, role alterations, password resets, campus/team modifications, and task status transitions are logged with before/after snapshots.
          </p>
        </div>
      </div>
    </div>
  );
}
