import { Users, Plus, ShieldAlert } from "lucide-react";

export default function TeamsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Teams & Campuses</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Campus IT, Dev Team, Implementation, Support & Intern Batches
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-medium transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Team</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-surface-alt border border-line rounded text-[10px] font-mono uppercase text-mutedText">
                Campus Team
              </span>
              <span className="text-[11px] font-mono text-[#3FB8AC]">On-site</span>
            </div>
            <h2 className="text-base font-semibold text-ink mt-3">SMRU Campus IT</h2>
            <p className="text-xs text-mutedText mt-1">Lead: Hari (IT Coordinator)</p>
          </div>
          <div className="mt-6 pt-4 border-t border-line flex items-center justify-between text-xs text-mutedText font-mono">
            <span>Members: —</span>
            <span>Open tasks: 0</span>
          </div>
        </div>

        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-surface-alt border border-line rounded text-[10px] font-mono uppercase text-mutedText">
                Dev Team
              </span>
              <span className="text-[11px] font-mono text-[#3FB8AC]">Core</span>
            </div>
            <h2 className="text-base font-semibold text-ink mt-3">Developers</h2>
            <p className="text-xs text-mutedText mt-1">Lead: Sri (IT Manager)</p>
          </div>
          <div className="mt-6 pt-4 border-t border-line flex items-center justify-between text-xs text-mutedText font-mono">
            <span>Members: —</span>
            <span>Active bugs: 0</span>
          </div>
        </div>

        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-surface-alt border border-line rounded text-[10px] font-mono uppercase text-mutedText">
                Implementation
              </span>
              <span className="text-[11px] font-mono text-chasing">In Progress</span>
            </div>
            <h2 className="text-base font-semibold text-ink mt-3">UOS Rollout</h2>
            <p className="text-xs text-mutedText mt-1">Stage tracking across 5 campuses</p>
          </div>
          <div className="mt-6 pt-4 border-t border-line flex items-center justify-between text-xs text-mutedText font-mono">
            <span>Stages: 5</span>
            <span>Status: Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
