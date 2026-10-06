"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Building2, Layers, Plus, CheckCircle2, ShieldCheck, X, Server, Network } from "lucide-react";
import {
  getCampusesAction,
  createCampusAction,
  toggleCampusSupportModeAction,
} from "./actions";
import { campusStore } from "@/lib/store/campusStore";

export interface CampusItem {
  id: string;
  name: string;
  code: string;
  mode: "ONSITE" | "REMOTE";
  leadName: string;
  userCount?: number;
  teamCount?: number;
  status: string;
}

export default function SetupPage() {
  const [campuses, setCampuses] = useState<CampusItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // New campus form state
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newMode, setNewMode] = useState<"ONSITE" | "REMOTE">("ONSITE");
  const [newLead, setNewLead] = useState("Hari");
  const [newSubnet, setNewSubnet] = useState("10.20.0.0/16");
  const [newRacks, setNewRacks] = useState(2);
  const [isLoading, setIsLoading] = useState(true);

  const loadCampuses = async () => {
    try {
      const res = await getCampusesAction();
      if (res.success && res.data && res.data.length > 0) {
        setCampuses(res.data as any);
        setIsLoading(false);
        return;
      }
    } catch {}

    setCampuses(
      campusStore.getCampuses().map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        mode: c.mode,
        leadName: c.leadName,
        teamCount: c.teamsCount,
        status: "Active",
      }))
    );
    setIsLoading(false);
  };

  useEffect(() => {
    loadCampuses();
  }, []);

  const toggleMode = async (id: string) => {
    campusStore.toggleMode(id);
    setCampuses((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, mode: c.mode === "ONSITE" ? "REMOTE" : "ONSITE" } : c
      )
    );
    toast.success("Campus support mode updated");
    try {
      const res = await toggleCampusSupportModeAction(id);
      if (res.success) loadCampuses();
    } catch {}
  };

  const handleCreateCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) return;

    const trimmedName = newName.trim();
    const trimmedCode = newCode.trim().toUpperCase();

    campusStore.addCampus({
      name: trimmedName,
      code: trimmedCode,
      mode: newMode,
      leadName: newLead,
    });
    setIsAddModalOpen(false);
    setNewName("");
    setNewCode("");
    toast.success(`Campus "${trimmedName}" created successfully`);
    loadCampuses();

    try {
      const res = await createCampusAction({
        name: trimmedName,
        code: trimmedCode,
        mode: newMode,
        leadName: newLead,
      });
      if (res.success) loadCampuses();
    } catch {}
  };

  return (
    <div className="space-y-6">
      

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
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-semibold shadow-2xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Campus</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-xs">
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
                  <td className="py-3 px-3 font-mono text-[11px]">{c.teamCount}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => toggleMode(c.id)}
                      className="px-2.5 py-1 rounded-control bg-surface border border-line hover:bg-ground text-[11px] font-mono text-ink transition-colors cursor-pointer"
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-center text-[11px] font-mono pt-1">
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

      {/* Add Campus Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-panel border border-line w-full max-w-md shadow-panel p-5 space-y-4 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span>Register New Campus</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-mutedText hover:text-ink cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCampus} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">Campus Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kukatpally Technology Center"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2 bg-ground border border-line rounded-control text-ink text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink mb-1">Campus Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KPC"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full p-2 bg-ground border border-line rounded-control text-ink font-mono text-xs uppercase focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Support Mode</label>
                  <select
                    value={newMode}
                    onChange={(e) => setNewMode(e.target.value as "ONSITE" | "REMOTE")}
                    className="w-full p-2 bg-ground border border-line rounded-control text-ink text-xs"
                  >
                    <option value="ONSITE">ONSITE (Dedicated Lead)</option>
                    <option value="REMOTE">REMOTE (Centralized)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink mb-1">Assigned Lead</label>
                  <select
                    value={newLead}
                    onChange={(e) => setNewLead(e.target.value)}
                    className="w-full p-2 bg-ground border border-line rounded-control text-ink text-xs"
                  >
                    <option value="Hari">Hari (Coordinator)</option>
                    <option value="Sri">Sri (Manager)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Subnet CIDR</label>
                  <input
                    type="text"
                    placeholder="e.g. 10.20.0.0/16"
                    value={newSubnet}
                    onChange={(e) => setNewSubnet(e.target.value)}
                    className="w-full p-2 bg-ground border border-line rounded-control text-ink font-mono text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Server Room Rack Count</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={newRacks}
                  onChange={(e) => setNewRacks(Number(e.target.value))}
                  className="w-full p-2 bg-ground border border-line rounded-control text-ink font-mono text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-mutedText hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-white font-semibold rounded-control hover:bg-primary-hover shadow-2xs cursor-pointer"
                >
                  Create Campus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
