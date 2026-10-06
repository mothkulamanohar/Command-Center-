"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Users,
  Plus,
  CheckCircle2,
  X,
  MessageSquare,
  SlidersHorizontal,
  MapPin,
  ExternalLink,
} from "lucide-react";
import {
  ManageTeamModal,
  TeamCardData,
  TeamMember,
} from "@/components/teams/ManageTeamModal";
import { getTeamsAction, createTeamAction } from "./actions";

import { INITIAL_TEAMS } from "@/lib/mock/teamsData";

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamCardData[]>(INITIAL_TEAMS);
  const [selectedTeam, setSelectedTeam] = useState<TeamCardData | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadTeams = () => {
    getTeamsAction().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setTeams(res.data as any);
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadTeams();
  }, []);

  // New Team form
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamType, setNewTeamType] = useState("Campus Team");
  const [newLead, setNewLead] = useState("Hari");
  const [newCampus, setNewCampus] = useState("SMRU Main Campus");
  const [newDescription, setNewDescription] = useState("");
  const handleOpenManageModal = (team: TeamCardData) => {
    setSelectedTeam(team);
    setIsManageModalOpen(true);
  };

  const [isCreating, setIsCreating] = useState(false);

  const handleUpdateTeam = (updated: TeamCardData) => {
    setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTeam(updated);
    toast.success(`Team "${updated.name}" updated successfully!`);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || isCreating) return;

    setIsCreating(true);

    // Optimistic: add to local state
    const localTeam: TeamCardData = {
      id: `local-${Date.now()}`,
      name: newTeamName.trim(),
      slug: newTeamName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      type: newTeamType,
      campus: newCampus,
      leadName: newLead,
      description: newDescription,
      memberCount: 0,
      openTasks: 0,
      status: "Active",
      members: [],
    };
    setTeams((prev) => [...prev, localTeam]);
    setIsCreateModalOpen(false);
    toast.success(`Team "${newTeamName.trim()}" created! Auto-provisioned channel and Docs space.`);
    setNewTeamName("");
    setNewDescription("");

    try {
      const res = await createTeamAction({
        name: localTeam.name,
        type: newTeamType,
        campus: newCampus,
        leadName: newLead,
        description: newDescription,
      });
      if (res.success) loadTeams();
    } catch {} finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Teams &amp; Campuses</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Track A (Foundation): Auto-Provisioned Channels, Docs &amp; Member Rosters
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-semibold shadow-xs self-start cursor-pointer transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create Team</span>
        </button>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teams.map((team) => (
          <div
            key={team.id}
            className="bg-surface rounded-panel border border-line p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 hover:shadow-sm transition-all"
          >
            <div>
              {/* Card Badge Header */}
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 bg-surface-alt border border-line rounded text-[10px] font-mono uppercase text-mutedText font-semibold">
                  {team.type}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-primary font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span>{team.status}</span>
                </span>
              </div>

              {/* Title & Description */}
              <h2 className="text-base font-bold text-ink mt-3">{team.name}</h2>
              <p className="text-xs text-mutedText mt-1 line-clamp-2 leading-relaxed">
                {team.description}
              </p>

              {/* Lead & Campus meta */}
              <div className="mt-3.5 pt-3 border-t border-line/60 space-y-1.5 text-xs text-mutedText">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px]">Lead:</span>
                  <span className="font-semibold text-ink">{team.leadName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-mutedText" />
                    <span>Campus:</span>
                  </span>
                  <span className="text-ink">{team.campus}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>Present Today:</span>
                  </span>
                  <span className="font-mono font-semibold text-emerald-600 text-[11px]">
                    {
                      team.members.filter(
                        (m) =>
                          m.attendanceStatus === "PRESENT" ||
                          m.attendanceStatus === "LATE" ||
                          m.isOnline
                      ).length
                    }{" "}
                    / {team.members.length} Present
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar: Connect to Chat + Manage Team */}
            <div className="mt-5 pt-3 border-t border-line flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs text-mutedText font-mono">
                <span className="flex items-center gap-1.5 flex-wrap">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-ink">{team.members.length} members</span>
                  <span className="text-line">•</span>
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold text-[10px]"
                    title={`${
                      team.members.filter(
                        (m) =>
                          m.attendanceStatus === "PRESENT" ||
                          m.attendanceStatus === "LATE" ||
                          m.isOnline
                      ).length
                    } members checked-in / present today`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>
                      {
                        team.members.filter(
                          (m) =>
                            m.attendanceStatus === "PRESENT" ||
                            m.attendanceStatus === "LATE" ||
                            m.isOnline
                        ).length
                      }{" "}
                      present
                    </span>
                  </span>
                </span>
                <span>{team.openTasks} open tasks</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* 1. Connect to Chat Button */}
                <Link
                  href={`/chat?channel=${team.slug}`}
                  prefetch={true}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 bg-surface-alt hover:bg-ground text-primary border border-line rounded-control text-xs font-semibold transition-colors shadow-2xs"
                  title={`Open #${team.slug} channel in Chat`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="truncate">#{team.slug}</span>
                </Link>

                {/* 2. Manage Team Button */}
                <button
                  type="button"
                  onClick={() => handleOpenManageModal(team)}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                  title="Manage team members, roles & settings"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Manage</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comprehensive Manage Team Modal */}
      <ManageTeamModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        team={selectedTeam}
        onUpdateTeam={handleUpdateTeam}
      />

      {/* Create Team Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface rounded-panel border border-line w-full max-w-md shadow-panel p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <h3 className="text-sm font-bold text-ink">Create New Team</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded text-mutedText hover:text-ink cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-3.5 text-xs">
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

              <div>
                <label className="block font-semibold text-ink mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Mission and operational responsibilities..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
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
                    <option value="Hari (Coordinator)">Hari</option>
                    <option value="Sri (IT Manager)">Sri</option>
                    <option value="Dev Web">Dev Web</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Campus Location</label>
                <input
                  type="text"
                  value={newCampus}
                  onChange={(e) => setNewCampus(e.target.value)}
                  className="w-full p-2 bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary"
                />
              </div>

              <div className="p-2.5 rounded-control bg-surface-alt border border-line text-[11px] text-mutedText">
                Auto-provisions: Chat channel (<span className="font-mono text-primary">#team-slug</span>) and a Docs space.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 text-mutedText hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-1.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-semibold rounded-control cursor-pointer shadow-xs inline-flex items-center gap-1.5 transition-opacity"
                >
                  {isCreating ? (
                    <>
                      <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Provisioning...</span>
                    </>
                  ) : (
                    <span>Create &amp; Provision</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
