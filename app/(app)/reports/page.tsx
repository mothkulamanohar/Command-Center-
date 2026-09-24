import { BarChart3, Download, FileSpreadsheet, FileText } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Reports & Performance</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Weekly KPIs, JPA (Appraisal), JPR (Team Progress) & Leadership Packs
          </p>
        </div>
      </div>

      {/* Preset Downloads Bar (SPEC §13.5) */}
      <div className="bg-surface rounded-panel border border-line p-5 shadow-xs">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink font-mono mb-3">
          One-Click Leadership Presets
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 bg-surface border border-line rounded-control text-xs font-medium text-ink hover:bg-surface-alt transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>Weekly Report · VC (PDF)</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 bg-surface border border-line rounded-control text-xs font-medium text-ink hover:bg-surface-alt transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>Monthly Report · CEO (PDF)</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 bg-surface border border-line rounded-control text-xs font-medium text-ink hover:bg-surface-alt transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>Weekly Pack · COO (PDF)</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 bg-surface border border-line rounded-control text-xs font-medium text-ink hover:bg-surface-alt transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-shared" />
            <span>Team KPI + JPR (Excel)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-ink">Job Progress Report (JPR)</h3>
          </div>
          <p className="text-xs text-mutedText leading-relaxed">
            Team-level progress, highlights, blocked risks, and next-week plans computed directly from live task records.
          </p>
        </div>

        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-shared" />
            <h3 className="text-sm font-semibold text-ink">Job Performance Appraisal (JPA)</h3>
          </div>
          <p className="text-xs text-mutedText leading-relaxed">
            Individual appraisal ratings (Delivery 25%, Timeliness 25%, Reliability 15%, Responsiveness 10%, Quality 10%, Lead review 15%).
          </p>
        </div>
      </div>
    </div>
  );
}
