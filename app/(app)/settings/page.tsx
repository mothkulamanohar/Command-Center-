"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { saveSettingsAction, fetchSettingsAction } from "./actions";
import {
  Settings,
  Shield,
  Bell,
  Cpu,
  Plus,
  X,
  CheckCircle2,
  Clock,
  Award,
  Calendar,
  CheckSquare,
  Crown,
  Layers,
} from "lucide-react";
import { RoleMatrixTable } from "@/components/settings/RoleMatrixTable";
import { settingsStore } from "@/lib/store/settingsStore";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"role-matrix" | "general">("role-matrix");
  const [seniorPeople, setSeniorPeople] = useState<string[]>([
    "VC Office",
    "CEO Office",
    "COO Office",
    "Janardhan sir",
  ]);
  const [newSenior, setNewSenior] = useState("");
  const [ollamaHost, setOllamaHost] = useState("http://127.0.0.1:11434");
  const [ollamaModel, setOllamaModel] = useState("qwen2.5:7b-instruct");

  // v1.1 Settings (F-AUTH-10)
  const [officeStart, setOfficeStart] = useState("09:00");
  const [graceMinutes, setGraceMinutes] = useState(15);
  const [halfDayHours, setHalfDayHours] = useState(4);
  const [absentCutoff, setAbsentCutoff] = useState("11:00");
  const [verifyMethod, setVerifyMethod] = useState("IP");
  const [officeIps, setOfficeIps] = useState("127.0.0.1/32, 103.21.44.0/24");
  const [timerAutoStop, setTimerAutoStop] = useState("18:30");
  const [leadsCanGiveFeedback, setLeadsCanGiveFeedback] = useState(true);
  const [collegeWebsiteUrl, setCollegeWebsiteUrl] = useState("https://smru.edu.in");
  const [verifyBaseUrl, setVerifyBaseUrl] = useState("https://cc.example.in/verify");
  const [certPrefix, setCertPrefix] = useState("SMRU-IT");
  const [minAttendancePercent, setMinAttendancePercent] = useState(80);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettingsAction().then((res) => {
      if (res.success && res.data) {
        const s = res.data;
        if (s.seniorPeople && Array.isArray(s.seniorPeople)) setSeniorPeople(s.seniorPeople as string[]);
        if (s.aiModel) setOllamaModel(String(s.aiModel));
        if (s.officeStart) setOfficeStart(String(s.officeStart));
        if (s.graceMinutes) setGraceMinutes(Number(s.graceMinutes));
        if (s.halfDayHours) setHalfDayHours(Number(s.halfDayHours));
        if (s.absentCutoff) setAbsentCutoff(String(s.absentCutoff));
        if (s.verifyMethod) setVerifyMethod(String(s.verifyMethod));
        if (s.timerAutoStop) setTimerAutoStop(String(s.timerAutoStop));
        if (s.leadsCanGiveFeedback !== undefined) setLeadsCanGiveFeedback(Boolean(s.leadsCanGiveFeedback));
        if (s.collegeWebsiteUrl) setCollegeWebsiteUrl(String(s.collegeWebsiteUrl));
        if (s.verifyBaseUrl) setVerifyBaseUrl(String(s.verifyBaseUrl));
        if (s.certPrefix) setCertPrefix(String(s.certPrefix));
        if (s.minAttendancePercent) setMinAttendancePercent(Number(s.minAttendancePercent));
      }
    });
  }, []);

  const handleAddSenior = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSenior.trim()) return;
    const updated = [...seniorPeople, newSenior.trim()];
    setSeniorPeople(updated);
    setNewSenior("");
    await saveSettingsAction({ seniorPeople: updated });
    toast.success("Senior list updated and saved. Follow-ups to this person will require approval.");
  };

  const handleRemoveSenior = async (person: string) => {
    const updated = seniorPeople.filter((p) => p !== person);
    setSeniorPeople(updated);
    await saveSettingsAction({ seniorPeople: updated });
    toast.success("Person removed and settings saved.");
  };

  const [isPending, startTransition] = useTransition();

  const handleSaveSettings = () => {
    if (isPending) return;
    startTransition(async () => {
      settingsStore.updateSettings({
        seniorPeople,
        aiModel: ollamaModel,
        attendance: {
          officeStart,
          officeEnd: "18:00",
          graceMinutes,
          halfDayHours,
          fullDayHours: 8,
          absentCutoff,
          verifyMethod: (verifyMethod as any) || "IP",
          maxRegularisationsPerMonth: 3,
          leaveApprovalRequired: true,
        },
        time: {
          hoursPerDay: 8,
          timerAutoStop,
        },
        feedback: {
          leadsCanGive: leadsCanGiveFeedback,
          dueWorkingDays: 3,
        },
        cert: {
          collegeName: "St. Mary's Group of Institutions",
          collegeWebsite: collegeWebsiteUrl,
          verifyBaseUrl,
          prefix: certPrefix,
          minAttendancePercent,
        },
      });

      const payload: Record<string, unknown> = {
        seniorPeople,
        aiModel: ollamaModel,
        officeStart,
        graceMinutes,
        halfDayHours,
        absentCutoff,
        verifyMethod,
        timerAutoStop,
        leadsCanGiveFeedback,
        collegeWebsiteUrl,
        verifyBaseUrl,
        certPrefix,
        minAttendancePercent,
      };

      try {
        await saveSettingsAction(payload);
      } catch {}

      toast.success("System and v1.1 settings saved successfully.");
    });
  };

  return (
    <div className="space-y-6">
      

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">System Settings & Governance</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Platform Admin Role Matrix, Operational Configurations & Organization Policies
          </p>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={handleSaveSettings}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-control text-xs font-semibold shadow-2xs self-start cursor-pointer active:scale-95 transition-all"
        >
          {isPending ? (
            <>
              <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Changes</span>
          )}
        </button>
      </div>

      {/* Top Tabs: Role Matrix vs General Policies */}
      <div className="flex items-center gap-2 border-b border-line pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("role-matrix")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer active:scale-95 ${
            activeTab === "role-matrix"
              ? "border-purple-600 text-purple-700 dark:text-purple-300 font-bold"
              : "border-transparent text-mutedText hover:text-ink"
          }`}
        >
          <Crown className="h-4 w-4 text-purple-600" />
          <span>Role Matrix & Privileges (Owner Governance)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer active:scale-95 ${
            activeTab === "general"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-mutedText hover:text-ink"
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>General Policies & Attendance Rules</span>
        </button>
      </div>

      {activeTab === "role-matrix" && <RoleMatrixTable />}

      {activeTab === "general" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
        {/* Attendance Rules (v1.1 F-AUTH-10) */}
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-ink">Attendance Rules (v1.1)</h2>
            </div>
            <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
              SPEC §10.5
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-mutedText text-[11px] mb-1 font-mono">Office Start</label>
                <input
                  type="text"
                  value={officeStart}
                  onChange={(e) => setOfficeStart(e.target.value)}
                  className="w-full p-2 bg-ground border border-line rounded-control font-mono text-xs text-ink"
                />
              </div>
              <div>
                <label className="block text-mutedText text-[11px] mb-1 font-mono">Grace Minutes</label>
                <input
                  type="number"
                  value={graceMinutes}
                  onChange={(e) => setGraceMinutes(Number(e.target.value))}
                  className="w-full p-2 bg-ground border border-line rounded-control font-mono text-xs text-ink"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-mutedText text-[11px] mb-1 font-mono">Half Day Min (hrs)</label>
                <input
                  type="number"
                  value={halfDayHours}
                  onChange={(e) => setHalfDayHours(Number(e.target.value))}
                  className="w-full p-2 bg-ground border border-line rounded-control font-mono text-xs text-ink"
                />
              </div>
              <div>
                <label className="block text-mutedText text-[11px] mb-1 font-mono">Absent Cutoff</label>
                <input
                  type="text"
                  value={absentCutoff}
                  onChange={(e) => setAbsentCutoff(e.target.value)}
                  className="w-full p-2 bg-ground border border-line rounded-control font-mono text-xs text-ink"
                />
              </div>
            </div>

            <div>
              <label className="block text-mutedText text-[11px] mb-1 font-mono">Verification Method</label>
              <select
                value={verifyMethod}
                onChange={(e) => setVerifyMethod(e.target.value)}
                className="w-full p-2 bg-ground border border-line rounded-control font-mono text-xs text-ink"
              >
                <option value="IP">Office IP Only</option>
                <option value="LOCATION">Campus Geofence (Location)</option>
                <option value="BOTH">Both (IP and Location)</option>
                <option value="NONE">None (Self-reported)</option>
              </select>
            </div>

            <div>
              <label className="block text-mutedText text-[11px] mb-1 font-mono">Office IP Ranges (CIDR)</label>
              <input
                type="text"
                value={officeIps}
                onChange={(e) => setOfficeIps(e.target.value)}
                className="w-full p-2 bg-ground border border-line rounded-control font-mono text-xs text-ink"
              />
            </div>
          </div>
        </div>

        {/* Task Duration & Feedback (v1.1 F-AUTH-10) */}
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-chasing" />
              <h2 className="text-sm font-bold text-ink">Duration & Feedback (v1.1)</h2>
            </div>
            <span className="text-[10px] font-mono bg-chasing/10 text-chasing px-1.5 py-0.5 rounded font-bold">
              SPEC §7.4, 7.5
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-mutedText text-[11px] mb-1 font-mono">Timer Auto-Stop Time</label>
              <input
                type="text"
                value={timerAutoStop}
                onChange={(e) => setTimerAutoStop(e.target.value)}
                className="w-full p-2 bg-ground border border-line rounded-control font-mono text-xs text-ink"
              />
              <span className="text-[10px] text-mutedText">Running timers automatically stop at this time daily.</span>
            </div>

            <div className="pt-2 border-t border-line">
              <label className="block text-mutedText text-[11px] mb-1 font-mono">Feedback Authority</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={leadsCanGiveFeedback}
                    onChange={() => setLeadsCanGiveFeedback(true)}
                  />
                  <span>Admin + Team Leads</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={!leadsCanGiveFeedback}
                    onChange={() => setLeadsCanGiveFeedback(false)}
                  />
                  <span>Admin Only</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate Settings (v1.1 F-AUTH-10) */}
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-ink">Certificates & Verification (v1.1)</h2>
            </div>
            <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
              SPEC §13.6
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <label className="block text-mutedText text-[11px] mb-1 font-mono">College Website URL</label>
              <input
                type="text"
                value={collegeWebsiteUrl}
                onChange={(e) => setCollegeWebsiteUrl(e.target.value)}
                className="w-full p-2 bg-ground border border-line rounded-control font-mono text-xs text-ink"
              />
            </div>

            <div>
              <label className="block text-mutedText text-[11px] mb-1 font-mono">Public Verification Base URL</label>
              <input
                type="text"
                value={verifyBaseUrl}
                onChange={(e) => setVerifyBaseUrl(e.target.value)}
                className="w-full p-2 bg-ground border border-line rounded-control font-mono text-xs text-ink"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-mutedText text-[11px] mb-1 font-mono">Number Prefix</label>
                <input
                  type="text"
                  value={certPrefix}
                  onChange={(e) => setCertPrefix(e.target.value)}
                  className="w-full p-2 bg-ground border border-line rounded-control font-mono text-xs text-ink"
                />
              </div>
              <div>
                <label className="block text-mutedText text-[11px] mb-1 font-mono">Min Attendance %</label>
                <input
                  type="number"
                  value={minAttendancePercent}
                  onChange={(e) => setMinAttendancePercent(Number(e.target.value))}
                  className="w-full p-2 bg-ground border border-line rounded-control font-mono text-xs text-ink"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Senior People List */}
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-chasing" />
              <h2 className="text-sm font-bold text-ink">Senior People (Approval Always)</h2>
            </div>
            <span className="text-[10px] font-mono bg-chasing/10 text-chasing px-1.5 py-0.5 rounded font-bold">
              SPEC §9.2
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {seniorPeople.map((person) => (
              <span
                key={person}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-ground border border-line text-xs font-semibold text-ink"
              >
                <span>{person}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSenior(person)}
                  className="hover:text-danger text-mutedText cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddSenior} className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="Add senior officer / department..."
              value={newSenior}
              onChange={(e) => setNewSenior(e.target.value)}
              className="flex-1 text-xs p-2 bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-control cursor-pointer"
            >
              Add
            </button>
          </form>
        </div>
      </div>
      )}
    </div>
  );
}
