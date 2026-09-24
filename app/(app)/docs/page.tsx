import { FileText, Plus, Folder } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Docs</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Spaces, SOPs, Project Briefs, Meeting Notes & Handover Guides
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-medium transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Doc</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Folder className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink font-mono">
              Org Space
            </h2>
          </div>
          <p className="text-xs text-mutedText leading-relaxed">
            Standard operating procedures, IT policies, and onboarding guides.
          </p>
        </div>

        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Folder className="h-4 w-4 text-shared" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink font-mono">
              Team Spaces
            </h2>
          </div>
          <p className="text-xs text-mutedText leading-relaxed">
            Folders auto-created for each team upon team setup.
          </p>
        </div>

        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Folder className="h-4 w-4 text-chasing" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink font-mono">
              Templates
            </h2>
          </div>
          <p className="text-xs text-mutedText leading-relaxed">
            SOP, Incident Report, Meeting Notes, Release Notes, and Handover templates.
          </p>
        </div>
      </div>
    </div>
  );
}
