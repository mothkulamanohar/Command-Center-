"use client";

import { useState } from "react";
import { Users, Plus, ShieldAlert, CheckCircle2, X } from "lucide-react";

export interface TeamCardData {
  id: string;
  name: string;
  slug: string;
  type: string;
  campus: string;
  leadName: string;
  memberCount: number;
  openTasks: number;
  status: string;
}

const INITIAL_TEAMS: TeamCardData[] = [
  {
    id: "tm-1",
    name: "SMRU Campus IT",
    slug: "smru-campus-it",
    type: "Campus Team",
    campus: "SMRU Main Campus",
    leadName: "Hari (Coordinator)",
    memberCount: 5,
    openTasks: 4,
    status: "On-site",
  },
  {
    id: "tm-2",
    name: "Developers",
    slug: "developers",
    type: "Dev Team",
    campus: "Central IT",
    leadName: "Sri (IT Manager)",
    memberCount: 3,
    openTasks: 2,
    status: "Core",
  },
  {
    id: "tm-3",
    name: "UOS Rollout",
    slug: "uos-rollout",
    type: "Implementation",
    campus: "Multi-Campus",
    leadName: "Hari",
    memberCount: 4,
    openTasks: 3,
    status: "In Progress",
  },
  {
    id: "tm-4",
    name: "Remote Support",
    slug: "remote-support",
    type: "Support",
    campus: "Remote",
    leadName: "Hari",
    memberCount: 2,
    openTasks: 1,
    status: "Remote",
  },
  {
    id: "tm-5",
    name: "Interns · Web Batch Sep '26",
    slug: "interns-sep-26",
    type: "Interns",
    campus: "SMRU",
    leadName: "Hari",
    memberCount: 3,
    openTasks: 5,
    status: "Batch Sep",
  },
];

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamCardData[]>(INITIAL_TEAMS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamType, setNewTeamType] = useState("Campus Team");
  const [newLead, setNewLead] = useState("Hari");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    const slug = newTeamName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const newTeam: TeamCardData = {
      id: `tm-${Date.now()}`,
      name: newTeamName.trim(),
      slug,
      type: newTeamType,
      campus: "SMRU",
      leadName: newLead,
      memberCount: 1,
      openTasks: 0,
      status: "Active",
    };

    setTeams([...teams, newTeam]);
    setIsModalOpen(false);
    setNewTeamName("");
    showToast(`Team "${newTeam.name}" created! Auto-provisioned #${slug} and Docs folder.`);
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
          <h1 className="text-xl font-bold text-ink tracking-tight">Teams & Campuses</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Track A (Foundation): Auto-Provisioned Channels, Docs & Member Rosters
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-semibold shadow-2xs self-start"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Team</span>
        </button>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div
            key={team.id}
            className="bg-surface rounded-panel border border-line p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-surface-alt border border-line rounded text-[10px] font-mono uppercase text-mutedText font-semibold">
                  {team.type}
                </span>
                <span className="text-[11px] font-mono text-primary font-bold">{team.status}</span>
              </div>
              <h2 className="text-base font-bold text-ink mt-3">{team.name}</h2>
              <p className="text-xs text-mutedText mt-1">Lead: {team.leadName}</p>
              <div className="mt-2 text-[10px] font-mono text-mutedText">
                Campus: {team.campus}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-line flex items-center justify-between text-xs text-mutedText font-mono">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>{team.memberCount} members</span>
              </span>
              <span>{team.openTasks} open tasks</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Team Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-panel border border-line w-full max-w-md shadow-panel p-4 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <h3 className="text-sm font-bold text-ink">Create New Team</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-mutedText hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wi-Fi Infrastructure Team"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full p-2 bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-ink mb-1">Type</label>
                  <select
                    value={newTeamType}
                    onChange={(e) => setNewTeamType(e.target.value)}
                    className="w-full p-2 bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="Campus Team">Campus Team</option>
                    <option value="Dev Team">Dev Team</option>
                    <option value="Implementation">Implementation</option>
                    <option value="Support">Support</option>
                    <option value="Interns">Interns</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Team Lead</label>
                  <select
                    value={newLead}
                    onChange={(e) => setNewLead(e.target.value)}
                    className="w-full p-2 bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="Sri (IT Manager)">Sri</option>
                    <option value="Hari (Coordinator)">Hari</option>
                    <option value="Dev Web">Dev Web</option>
                  </select>
                </div>
              </div>

              <div className="p-2.5 rounded-control bg-surface-alt border border-line text-[11px] text-mutedText">
                Auto-provisions: Chat channel (<span className="font-mono text-primary">#team-slug</span>) and a team Docs space folder.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-mutedText hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-white font-semibold rounded-control"
                >
                  Create & Provision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
