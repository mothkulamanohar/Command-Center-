import { Code2, Globe, Bug, Plus } from "lucide-react";

export default function DevHubPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Dev Hub</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Projects, Build Map, Sprints, Bugs, Deployments & Sites Registry
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-medium transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Project</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink font-mono">
              Sites Registry
            </h2>
          </div>
          <p className="text-xs text-mutedText leading-relaxed">
            smru.edu.in, smru.in, and campus domains monitored with 5-minute uptime checks and SSL expiry alerts.
          </p>
        </div>

        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="h-4 w-4 text-shared" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink font-mono">
              Build Map
            </h2>
          </div>
          <p className="text-xs text-mutedText leading-relaxed">
            Developer · Project · Feature · Stack · Status overview directly visible to leadership.
          </p>
        </div>

        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Bug className="h-4 w-4 text-danger" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink font-mono">
              Bug Tracker
            </h2>
          </div>
          <p className="text-xs text-mutedText leading-relaxed">
            Bugs link automatically to tasks and trigger follow-up alerts when PR review is pending &gt; 2 working days.
          </p>
        </div>
      </div>
    </div>
  );
}
