"use client";

import { useState } from "react";
import { Building2, Layers, Plus, CheckCircle2, ShieldCheck } from "lucide-react";

export interface CampusItem {
  id: string;
  name: string;
  code: string;
  mode: "ONSITE" | "REMOTE";
  leadName: string;
  teamsCount: number;
}

const INITIAL_CAMPUSES: CampusItem[] = [
  { id: "c-1", name: "SMRU Main Campus", code: "SMRU", mode: "ONSITE", leadName: "Hari", teamsCount: 3 },
  { id: "c-2", name: "Hyderabad Group", code: "HYD", mode: "REMOTE", leadName: "Sri", teamsCount: 1 },
  { id: "c-3", name: "Chebrol Campus", code: "CHB", mode: "ONSITE", leadName: "Hari", teamsCount: 1 },
  { id: "c-4", name: "Guntur Campus", code: "GNT", mode: "REMOTE", leadName: "Hari", teamsCount: 1 },
  { id: "c-5", name: "St. Mary's Women's Campus", code: "SMW", mode: "ONSITE", leadName: "Hari", teamsCount: 1 },
];

export default function SetupPage() {
  const [campuses, setCampuses] = useState<CampusItem[]>(INITIAL_CAMPUSES);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const toggleMode = (id: string) => {
    setCampuses((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, mode: c.mode === "ONSITE" ? "REMOTE" : "ONSITE" }
          : c
      )
    );
    showToast("Campus support mode updated");
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
          <h1 className="text-xl font-bold text-ink tracking-tight">Organization Setup</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Track A (Phase 1): Campuses, Support Modes & Team Types (F-ORG-01..04)
          </p>
        </div>
      </div>

      {/* Campuses Table */}
      <div className="bg-surface rounded-panel border border-line overflow-hidden shadow-xs">
        <div className="p-4 border-b border-line flex items-center justify-between bg-surface-alt/40">
          <div>
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span>Campus Registry</span>
              <span className="text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-semibold">
                F-ORG-01
              </span>
            </h2>
            <p className="text-xs text-mutedText mt-0.5">
              Physical institutions with On-site and Remote IT support coverage
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-alt/70 text-mutedText uppercase text-[10px] font-mono border-b border-line">
              <tr>
                <th className="py-2.5 px-4">Campus Name</th>
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Support Mode</th>
                <th className="py-2.5 px-3">Lead</th>
                <th className="py-2.5 px-3">Active Teams</th>
                <th className="py-2.5 px-4 text-right">Toggle Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {campuses.map((c) => (
                <tr key={c.id} className="hover:bg-surface-alt/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-ink">{c.name}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-mutedText">{c.code}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        c.mode === "ONSITE"
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-surface text-mutedText border border-line"
                      }`}
                    >
                      {c.mode}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-mutedText">{c.leadName}</td>
                  <td className="py-3 px-3 font-mono text-[11px]">{c.teamsCount}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => toggleMode(c.id)}
                      className="px-2.5 py-1 rounded-control bg-surface border border-line hover:bg-ground text-[11px] font-mono text-ink transition-colors"
                    >
                      Set to {c.mode === "ONSITE" ? "Remote" : "Onsite"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Types & Implementation Stages */}
      <div className="bg-surface rounded-panel border border-line p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-shared" />
          <h2 className="text-sm font-bold text-ink">Team Types & Stage Trackers</h2>
          <span className="text-[10px] font-mono bg-shared/10 text-shared border border-shared/20 px-1.5 py-0.5 rounded font-semibold">
            F-ORG-02
          </span>
        </div>
        <p className="text-xs text-mutedText">
          Pre-configured stage pipelines for multi-campus rollouts:
        </p>

        <div className="p-3 rounded-card bg-surface-alt border border-line space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-ink">
            <span>Implementation Team Stage Pipeline (UOS Rollout)</span>
            <span className="font-mono text-[10px] text-primary">5 Stages Active</span>
          </div>
          <div className="grid grid-cols-5 gap-2 text-center text-[11px] font-mono pt-1">
            <div className="p-2 rounded bg-primary/15 text-primary border border-primary/30 font-bold">
              1. Planning
            </div>
            <div className="p-2 rounded bg-primary/15 text-primary border border-primary/30 font-bold">
              2. Hardware Delivery
            </div>
            <div className="p-2 rounded bg-primary/15 text-primary border border-primary/30 font-bold">
              3. Cabling & Rack
            </div>
            <div className="p-2 rounded bg-chasing/15 text-chasing border border-chasing/30 font-bold">
              4. Network Config
            </div>
            <div className="p-2 rounded bg-ground text-mutedText border border-line">
              5. Final Go-Live
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
