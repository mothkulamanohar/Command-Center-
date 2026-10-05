"use client";

import { useState, useEffect } from "react";
import {
  X,
  Users,
  MessageSquare,
  UserPlus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  MapPin,
  Shield,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  updateTeamSettingsAction,
  addTeamMemberAction,
  removeTeamMemberAction,
  getActiveUsersAction,
} from "@/app/(app)/teams/actions";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  isOnline: boolean;
  attendanceStatus: "PRESENT" | "LATE" | "ON_LEAVE" | "NOT_IN";
}

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
  description: string;
  members: TeamMember[];
}



interface ManageTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamCardData | null;
  onUpdateTeam: (updatedTeam: TeamCardData) => void;
}

export function ManageTeamModal({
  isOpen,
  onClose,
  team,
  onUpdateTeam,
}: ManageTeamModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"members" | "settings" | "assets">("members");
  const [availableUsers, setAvailableUsers] = useState<{ id: string; name: string; email: string; role?: string }[]>([]);

  useEffect(() => {
    getActiveUsersAction().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setAvailableUsers(res.data);
        setSelectedUserId(res.data[0].id);
      }
    });
  }, []);

  // Editable settings
  const [name, setName] = useState("");
  const [type, setType] = useState("Campus Team");
  const [campus, setCampus] = useState("SMRU Main Campus");
  const [leadName, setLeadName] = useState("Hari");
  const [status, setStatus] = useState("Active");
  const [description, setDescription] = useState("");

  // Add Member state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Developer");

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (team) {
      setName(team.name);
      setType(team.type);
      setCampus(team.campus);
      setLeadName(team.leadName);
      setStatus(team.status);
      setDescription(team.description || "");
      setFeedback(null);
    }
  }, [team]);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback(null);
    }, 3500);
  };

  if (!isOpen || !team) return null;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSaving) return;

    setIsSaving(true);
    const res = await updateTeamSettingsAction(team.id, {
      name: name.trim(),
      description,
    });
    setIsSaving(false);

    if (res.success) {
      const updated: TeamCardData = {
        ...team,
        name: name.trim(),
        description,
      };
      onUpdateTeam(updated);
      showFeedback("success", "Team settings saved to database.");
      toast.success("Team settings saved successfully.");
    } else {
      showFeedback("error", res.error || "Failed to update team settings.");
      toast.error(res.error || "Failed to update team settings");
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdding) return;

    const user = availableUsers.find((u) => u.id === selectedUserId);
    if (!user) return;

    if (team.members.some((m) => m.id === user.id)) {
      showFeedback("error", `${user.name} is already a member of this team.`);
      return;
    }

    setIsAdding(true);
    const res = await addTeamMemberAction(team.id, user.id, newMemberRole);
    setIsAdding(false);

    if (res.success) {
      const newMember: TeamMember = {
        id: user.id,
        name: user.name,
        role: newMemberRole,
        email: user.email,
        isOnline: true,
        attendanceStatus: "PRESENT",
      };

      const updated: TeamCardData = {
        ...team,
        members: [...team.members, newMember],
        memberCount: team.members.length + 1,
      };

      onUpdateTeam(updated);
      showFeedback("success", `${user.name} added to ${team.name}.`);
      toast.success(`${user.name} added to team ${team.name}`);
    } else {
      showFeedback("error", res.error || "Failed to add member.");
      toast.error(res.error || "Failed to add member");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const member = team.members.find((m) => m.id === memberId);
    const res = await removeTeamMemberAction(team.id, memberId);
    if (res.success) {
      const updated: TeamCardData = {
        ...team,
        members: team.members.filter((m) => m.id !== memberId),
        memberCount: Math.max(0, team.members.length - 1),
      };
      onUpdateTeam(updated);
      showFeedback("success", `${member?.name || "Member"} removed from team.`);
      toast.success(`${member?.name || "Member"} removed from team`);
    } else {
      showFeedback("error", res.error || "Failed to remove member.");
      toast.error(res.error || "Failed to remove member");
    }
  };

  const openTeamChat = () => {
    onClose();
    router.push(`/chat?channel=${team.slug}`);
  };

  const openDirectMessage = (member: TeamMember) => {
    onClose();
    router.push(`/chat?dm=${member.id}`);
  };

  const presentCount = team.members.filter(
    (m) => m.attendanceStatus === "PRESENT" || m.attendanceStatus === "LATE" || m.isOnline
  ).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-surface rounded-panel border border-line w-full max-w-2xl shadow-panel overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-line bg-surface-alt/60 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-control bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-ink truncate">{team.name}</h2>
                <span className="text-[10px] font-mono uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold shrink-0">
                  {team.status}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{presentCount} of {team.members.length} Present</span>
                </span>
              </div>
              <p className="text-xs text-mutedText truncate font-mono">
                #{team.slug} • Lead: {team.leadName} • {team.campus} • {presentCount}/{team.members.length} Present Today
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Direct Connect to Chat Button */}
            <button
              type="button"
              onClick={openTeamChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1B365D] hover:bg-[#284E82] text-white rounded-control text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title={`Open #${team.slug} channel in Chat`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Open Team Chat</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-mutedText hover:text-ink hover:bg-ground rounded-control transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-line px-5 bg-surface shrink-0 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`py-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "members"
                ? "border-primary text-primary"
                : "border-transparent text-mutedText hover:text-ink"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Members Roster ({presentCount}/{team.members.length} Present)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`py-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "settings"
                ? "border-primary text-primary"
                : "border-transparent text-mutedText hover:text-ink"
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Team Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("assets")}
            className={`py-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "assets"
                ? "border-primary text-primary"
                : "border-transparent text-mutedText hover:text-ink"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Assets &amp; Links</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
          {feedback && (
            <div
              className={`p-3 rounded-control border flex items-center gap-2 font-medium animate-in fade-in duration-150 ${
                feedback.type === "success"
                  ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300"
                  : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Tab 1: Members Roster */}
          {activeTab === "members" && (
            <div className="space-y-4">
              {/* Add Member Bar */}
              <form
                onSubmit={handleAddMember}
                className="p-3 bg-ground rounded-control border border-line flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
              >
                <div className="flex-1">
                  <label className="text-[10px] font-mono uppercase text-mutedText font-semibold block mb-1">
                    Select University Personnel
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full p-2 bg-surface border border-line rounded-control text-ink text-xs focus:outline-none focus:border-primary"
                  >
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role || "Member"} • {u.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-40">
                  <label className="text-[10px] font-mono uppercase text-mutedText font-semibold block mb-1">
                    Team Role
                  </label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="w-full p-2 bg-surface border border-line rounded-control text-ink text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="Lead">Lead</option>
                    <option value="Developer">Developer</option>
                    <option value="Support Tech">Support Tech</option>
                    <option value="Network Specialist">Network Specialist</option>
                    <option value="Operations Specialist">Operations</option>
                    <option value="Intern">Intern</option>
                    <option value="Member">Member</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="sm:self-end py-2 px-3 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-semibold rounded-control inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-opacity"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Add Member</span>
                    </>
                  )}
                </button>
              </form>

              {/* Members List */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-mutedText font-semibold">
                  Current Team Roster
                </div>
                <div className="divide-y divide-line border border-line rounded-control bg-surface overflow-hidden">
                  {team.members.length === 0 ? (
                    <div className="p-4 text-center text-mutedText">
                      No members assigned to this team yet. Use the form above to add members.
                    </div>
                  ) : (
                    team.members.map((member) => (
                      <div
                        key={member.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-surface-alt/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar Circle with Presence Dot */}
                          <div className="relative shrink-0">
                            <div className="h-8 w-8 rounded-full bg-[#1B365D] text-white flex items-center justify-center font-mono font-bold text-xs">
                              {member.name.charAt(0)}
                            </div>
                            <span
                              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-surface ${
                                member.attendanceStatus === "PRESENT"
                                  ? "bg-green-500"
                                  : member.attendanceStatus === "LATE"
                                  ? "bg-amber-500"
                                  : "bg-slate-400"
                              }`}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-ink truncate">{member.name}</span>
                              <span className="text-[10px] font-mono bg-surface-alt border border-line px-1.5 py-0.2 rounded text-mutedText">
                                {member.role}
                              </span>
                            </div>
                            <div className="text-[11px] text-mutedText font-mono truncate">
                              {member.email} • Status: {member.attendanceStatus.toLowerCase()}
                            </div>
                          </div>
                        </div>

                        {/* Member Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Direct Message in Chat Button */}
                          <button
                            type="button"
                            onClick={() => openDirectMessage(member)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-surface hover:bg-surface-alt text-primary border border-line rounded-control text-xs font-semibold transition-colors cursor-pointer"
                            title={`Send direct chat to ${member.name}`}
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span className="hidden sm:inline">DM</span>
                          </button>

                          {/* Remove Member Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-1.5 text-danger hover:bg-danger-tint border border-transparent hover:border-danger/20 rounded-control transition-colors cursor-pointer"
                            title="Remove member from team"
                            aria-label={`Remove ${member.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Team Settings */}
          {activeTab === "settings" && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink mb-1">Team Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Team Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full p-2 bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="Campus Team">Campus Team</option>
                    <option value="Dev Team">Dev Team</option>
                    <option value="Implementation">Implementation</option>
                    <option value="Support">Support</option>
                    <option value="Interns">Interns</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-ink mb-1">Campus Location</label>
                  <input
                    type="text"
                    value={campus}
                    onChange={(e) => setCampus(e.target.value)}
                    className="w-full p-2 bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Team Lead</label>
                  <select
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="w-full p-2 bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="Sri (IT Manager)">Sri (IT Manager)</option>
                    <option value="Hari (Coordinator)">Hari (Coordinator)</option>
                    <option value="Dev Web">Dev Web</option>
                    <option value="Janardhan">Janardhan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Operational Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full p-2 bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="Active">Active</option>
                    <option value="On-site">On-site</option>
                    <option value="Core">Core</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Team Description &amp; Scope</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe team mission, ongoing tracks, and service level targets..."
                  className="w-full p-2 bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-3 border-t border-line flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-semibold rounded-control inline-flex items-center gap-1.5 shadow-xs cursor-pointer transition-opacity"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>Save Team Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Tab 3: Assets & Links */}
          {activeTab === "assets" && (
            <div className="space-y-3">
              <div className="p-3 bg-ground rounded-control border border-line flex items-center justify-between">
                <div>
                  <div className="font-semibold text-ink">Team Chat Channel</div>
                  <div className="text-[11px] text-mutedText font-mono">
                    Auto-provisioned room: #{team.slug}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openTeamChat}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1B365D] text-white rounded-control text-xs font-semibold hover:bg-[#284E82] transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Open Chat</span>
                </button>
              </div>

              <div className="p-3 bg-ground rounded-control border border-line flex items-center justify-between">
                <div>
                  <div className="font-semibold text-ink">Documentation Folder</div>
                  <div className="text-[11px] text-mutedText font-mono">
                    Knowledge Base &amp; Runbooks for {team.name}
                  </div>
                </div>
                <Link
                  href="/docs"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface text-ink border border-line rounded-control text-xs font-semibold hover:border-primary transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Browse Docs</span>
                </Link>
              </div>

              <div className="p-3 bg-ground rounded-control border border-line flex items-center justify-between">
                <div>
                  <div className="font-semibold text-ink">Team Tasks &amp; Chases</div>
                  <div className="text-[11px] text-mutedText font-mono">
                    {team.openTasks} active tasks assigned to this team
                  </div>
                </div>
                <Link
                  href="/console"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface text-ink border border-line rounded-control text-xs font-semibold hover:border-primary transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>View in Console</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
