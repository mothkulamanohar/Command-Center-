import { Sliders, Building2, Layers, Users } from "lucide-react";

export default function SetupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink tracking-tight">Organization Setup</h1>
        <p className="text-xs text-mutedText mt-0.5 font-mono">
          Configure Campuses, Team Types & Stages (F-ORG-01 to F-ORG-04)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink font-mono">
              Campuses
            </h2>
          </div>
          <p className="text-xs text-mutedText leading-relaxed">
            Manage physical institutions (SMRU, Hyderabad group, Chebrol, Guntur, Women&apos;s campus) with On-site / Remote mode.
          </p>
        </div>

        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="h-4 w-4 text-shared" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink font-mono">
              Team Types & Stages
            </h2>
          </div>
          <p className="text-xs text-mutedText leading-relaxed">
            Campus team, Implementation, Dev team, Interns, and Support types with custom stages and fields.
          </p>
        </div>

        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-chasing" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink font-mono">
              Team Management
            </h2>
          </div>
          <p className="text-xs text-mutedText leading-relaxed">
            Create teams, assign leads, set intern batch dates and auto-provision chat groups and docs folders.
          </p>
        </div>
      </div>
    </div>
  );
}
