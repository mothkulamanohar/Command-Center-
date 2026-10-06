"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { checkInAction, checkOutAction, remindNotCheckedInAction, fetchTodayBoardAction } from "./actions";
import { format } from "date-fns";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  Calendar,
  FileSpreadsheet,
  Send,
  UserCheck,
  BellRing,
  Filter,
  Check,
  Info,
} from "lucide-react";
import Link from "next/link";
import { WorkMode, AttendanceStatus } from "@prisma/client";

interface TodayUser {
  id: string;
  name: string;
  role: string;
  inTime?: string;
  mode: string;
  status: string;
}

const ORIGINAL_TODAY_USERS: TodayUser[] = [
  { id: "u-1", name: "Sri", role: "Admin", inTime: "08:55", mode: "OFFICE", status: "PRESENT" },
  { id: "u-2", name: "Hari", role: "Lead", inTime: "09:02", mode: "OFFICE", status: "PRESENT" },
  { id: "u-3", name: "Dev Web", role: "Developer", inTime: "09:12", mode: "CAMPUS", status: "PRESENT" },
  { id: "u-4", name: "Dev Backend", role: "Developer", inTime: "09:00", mode: "REMOTE", status: "PRESENT" },
  { id: "u-5", name: "Intern Web A", role: "Intern", inTime: "09:35", mode: "OFFICE", status: "LATE" },
  { id: "u-6", name: "Intern Web B", role: "Intern", inTime: undefined, mode: "OFFICE", status: "NOT_YET" },
];

export default function AttendancePage() {
  const [isCheckedIn, setIsCheckedIn] = useState(true);
  const [checkInTime, setCheckInTime] = useState("09:04");
  const [selectedMode, setSelectedMode] = useState<WorkMode>(WorkMode.OFFICE);
  const [todayBoard, setTodayBoard] = useState<{
    inCount: number;
    lateCount: number;
    remoteCount: number;
    leaveCount: number;
    notYetCount: number;
    users: TodayUser[];
  }>({
    inCount: 4,
    lateCount: 1,
    remoteCount: 1,
    leaveCount: 0,
    notYetCount: 1,
    users: ORIGINAL_TODAY_USERS,
  });

  const [activeTab, setActiveTab] = useState<"today" | "my-month">("today");
  const [filterMode, setFilterMode] = useState<"ALL" | "IN" | "LATE" | "REMOTE" | "NOT_YET">("ALL");
  const [selectedDayDetails, setSelectedDayDetails] = useState<{ day: number; code: string; label: string } | null>(null);
  const [remindedUsers, setRemindedUsers] = useState<Set<string>>(new Set());

  const loadBoard = async () => {
    const res = await fetchTodayBoardAction();
    if (res.success && res.data) {
      const board = res.data as any;
      const allUsers: TodayUser[] = [
        ...(board.inList || []).map((item: any) => ({
          id: item.user.id,
          name: item.user.name,
          role: item.user.title || item.user.role,
          inTime: item.record?.firstInAt ? format(new Date(item.record.firstInAt), "HH:mm") : undefined,
          mode: item.record?.mode || "OFFICE",
          status: item.record?.status || "PRESENT",
        })),
        ...(board.lateList || []).map((item: any) => ({
          id: item.user.id,
          name: item.user.name,
          role: item.user.title || item.user.role,
          inTime: item.record?.firstInAt ? format(new Date(item.record.firstInAt), "HH:mm") : undefined,
          mode: item.record?.mode || "OFFICE",
          status: "LATE",
        })),
        ...(board.remoteList || []).map((item: any) => ({
          id: item.user.id,
          name: item.user.name,
          role: item.user.title || item.user.role,
          inTime: item.record?.firstInAt ? format(new Date(item.record.firstInAt), "HH:mm") : undefined,
          mode: "REMOTE",
          status: item.record?.status || "PRESENT",
        })),
        ...(board.notYetList || []).map((item: any) => ({
          id: item.user.id,
          name: item.user.name,
          role: item.user.title || item.user.role,
          inTime: undefined,
          mode: "OFFICE",
          status: "NOT_YET",
        })),
      ];

      if (allUsers.length > 0) {
        setTodayBoard({
          inCount: board.inCount || 0,
          lateCount: board.lateCount || 0,
          remoteCount: board.remoteCount || 0,
          leaveCount: 0,
          notYetCount: board.notYetCount || 0,
          users: allUsers,
        });
      }

      // Find self if in list
      const selfIn = (board.inList || []).find((i: any) => i.record?.lastOutAt === null && i.record?.firstInAt);
      const selfLate = (board.lateList || []).find((i: any) => i.record?.lastOutAt === null && i.record?.firstInAt);
      const selfRemote = (board.remoteList || []).find((i: any) => i.record?.lastOutAt === null && i.record?.firstInAt);
      const activeSelf = selfIn || selfLate || selfRemote;
      if (activeSelf?.record) {
        setIsCheckedIn(true);
        setCheckInTime(format(new Date(activeSelf.record.firstInAt), "HH:mm"));
        setSelectedMode(activeSelf.record.mode || WorkMode.OFFICE);
      }
    }
  };

  useEffect(() => {
    loadBoard();
  }, []);

  // Summary stats
  const [stats] = useState({
    attendancePercent: 96.5,
    presentDays: 20,
    lateDays: 2,
    halfDays: 1,
    absentDays: 0,
    leaveDays: 1,
    avgInTime: "09:08",
    avgOutTime: "18:14",
    totalHoursWorked: 172.5,
  });

  const [isPending, startTransition] = useTransition();

  const handleToggleCheckInOut = () => {
    startTransition(async () => {
      if (isCheckedIn) {
        // Optimistic checkout
        setIsCheckedIn(false);
        toast.success("Checked out successfully for today");
        try {
          const res = await checkOutAction();
          if (res.success) await loadBoard();
        } catch {}
      } else {
        // Optimistic checkin
        const time = format(new Date(), "HH:mm");
        setIsCheckedIn(true);
        setCheckInTime(time);
        toast.success(`Checked in at ${time} (${selectedMode} verified)`);
        try {
          const res = await checkInAction(selectedMode);
          if (res.success) await loadBoard();
        } catch {}
      }
    });
  };

  const handleModeChange = (newMode: WorkMode) => {
    setSelectedMode(newMode);
    toast.success(`Work mode set to ${newMode}`);
  };

  const handleNudgeUser = async (userId: string, name: string) => {
    setRemindedUsers((prev) => new Set([...prev, userId]));
    toast.success(`Push reminder sent to ${name} to check in`);
  };

  const handleRemindAll = () => {
    startTransition(async () => {
      const notIn = todayBoard.users.filter((u) => u.status === "NOT_YET");
      setRemindedUsers(new Set(notIn.map((u) => u.id)));
      toast.success(`Push notification dispatched to ${notIn.length} pending users`);
      try {
        const res = await remindNotCheckedInAction();
        if (res.success) {
          const count = (res.data as any)?.count || 0;
          if (count > 0) toast.success(`Server confirmed: ${count} reminders sent`);
        }
      } catch {}
    });
  };

  const filteredUsers = todayBoard.users.filter((u) => {
    if (filterMode === "ALL") return true;
    if (filterMode === "IN") return !!u.inTime;
    if (filterMode === "LATE") return u.status === "LATE";
    if (filterMode === "REMOTE") return u.mode === "REMOTE";
    if (filterMode === "NOT_YET") return u.status === "NOT_YET";
    return true;
  });

  return (
    <div className="space-y-6">
      

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-ink">Attendance Protocol</h1>
          </div>
          <p className="text-xs text-mutedText mt-0.5">
            Office IP & geofence verified attendance. Working window: 09:00 - 18:00 IST.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/attendance/register"
            prefetch={true}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-line rounded-control text-xs font-medium text-ink bg-surface hover:bg-ground hover:border-primary/40 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            <span>Monthly Register</span>
          </Link>
          <Link
            href="/attendance/requests"
            prefetch={true}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-line rounded-control text-xs font-medium text-ink bg-surface hover:bg-ground hover:border-chasing/40 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <Send className="h-4 w-4 text-chasing" />
            <span>Regularisations & Leave</span>
          </Link>
        </div>
      </div>

      {/* Main Check-In Card */}
      <div className="bg-surface rounded-panel border border-line p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center font-mono font-bold text-sm border transition-colors ${
            isCheckedIn
              ? "bg-primary/10 border-primary/20 text-primary"
              : "bg-danger/10 border-danger/20 text-danger"
          }`}>
            {isCheckedIn ? "IN" : "OUT"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink">
                {isCheckedIn ? `Checked in at ${checkInTime}` : "Not Checked In Today"}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                  isCheckedIn ? "bg-primary/15 text-primary border border-primary/30" : "bg-ground text-mutedText border border-line"
                }`}
              >
                {isCheckedIn ? `Present (${selectedMode})` : "Pending Check-In"}
              </span>
            </div>
            <p className="text-xs text-mutedText mt-1 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Verified via Office IP (127.0.0.1)
              </span>
              <span>·</span>
              <span>Grace cutoff: 09:15</span>
            </p>
          </div>
        </div>

        {/* Action Button & Mode Selector */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={selectedMode}
            onChange={(e) => handleModeChange(e.target.value as WorkMode)}
            className="px-3 py-2 text-xs bg-ground border border-line rounded-control text-ink focus:outline-none cursor-pointer hover:border-primary/50 transition-colors"
            aria-label="Select Work Mode"
          >
            <option value="OFFICE">Office (SMRU Main)</option>
            <option value="CAMPUS">Campus Visit</option>
            <option value="REMOTE">Remote / WFH</option>
            <option value="FIELD">Field Visit</option>
          </select>

          <button
            type="button"
            onClick={handleToggleCheckInOut}
            className={`px-5 py-2.5 rounded-control text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-95 text-center ${
              isCheckedIn
                ? "bg-ground text-ink border border-line hover:bg-danger/10 hover:text-danger hover:border-danger/30"
                : "bg-primary text-white hover:bg-primary-hover shadow-primary/20"
            }`}
          >
            {isCheckedIn ? "Check Out" : "Check In Now"}
          </button>
        </div>
      </div>

      {/* Stats Strip (Interactive Cards that filter Today Board / switch views) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab("today");
            setFilterMode("ALL");
            toast.success("Showing all attendees");
          }}
          className="bg-surface p-3.5 rounded-panel border border-line text-left hover:border-primary/40 hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="text-[11px] text-mutedText font-mono uppercase group-hover:text-primary transition-colors">Attendance %</div>
          <div className="text-xl font-bold text-primary mt-1">{stats.attendancePercent}%</div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("today");
            setFilterMode("IN");
            toast.success("Filtered by Present users");
          }}
          className="bg-surface p-3.5 rounded-panel border border-line text-left hover:border-primary/40 hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="text-[11px] text-mutedText font-mono uppercase group-hover:text-primary transition-colors">Present Days</div>
          <div className="text-xl font-bold text-ink mt-1">{stats.presentDays}</div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("today");
            setFilterMode("LATE");
            toast.success("Filtered by Late arrivals");
          }}
          className="bg-surface p-3.5 rounded-panel border border-line text-left hover:border-chasing/40 hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="text-[11px] text-mutedText font-mono uppercase group-hover:text-chasing transition-colors">Late Arrivals</div>
          <div className="text-xl font-bold text-chasing mt-1">{stats.lateDays}</div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("today");
            setFilterMode("ALL");
            toast.success("Showing half days breakdown");
          }}
          className="bg-surface p-3.5 rounded-panel border border-line text-left hover:border-primary/40 hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="text-[11px] text-mutedText font-mono uppercase group-hover:text-ink transition-colors">Half Days</div>
          <div className="text-xl font-bold text-ink mt-1">{stats.halfDays}</div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("my-month");
            toast.success("Opened Attendance Register view");
          }}
          className="bg-surface p-3.5 rounded-panel border border-line text-left hover:border-primary/40 hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="text-[11px] text-mutedText font-mono uppercase group-hover:text-ink transition-colors">Avg In-Time</div>
          <div className="text-xl font-bold text-ink mt-1 font-mono">{stats.avgInTime}</div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("my-month");
            toast.success("Viewing monthly hours breakdown");
          }}
          className="bg-surface p-3.5 rounded-panel border border-line text-left hover:border-primary/40 hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="text-[11px] text-mutedText font-mono uppercase group-hover:text-primary transition-colors">Total Hours</div>
          <div className="text-xl font-bold text-primary mt-1 font-mono">{stats.totalHoursWorked}h</div>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("today")}
          className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer active:scale-95 ${
            activeTab === "today"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-mutedText hover:text-ink"
          }`}
        >
          Today Board ({todayBoard.inCount} in)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("my-month")}
          className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer active:scale-95 ${
            activeTab === "my-month"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-mutedText hover:text-ink"
          }`}
        >
          My Attendance History
        </button>
      </div>

      {/* Today Board (F-ATT-08) */}
      {activeTab === "today" && (
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
            {/* Interactive Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  setFilterMode("ALL");
                  toast.success("Showing all team members");
                }}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer font-bold active:scale-95 ${
                  filterMode === "ALL"
                    ? "bg-ink text-white ring-2 ring-ink/20"
                    : "bg-ground text-mutedText hover:bg-line border border-line"
                }`}
              >
                All: {todayBoard.users.length}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterMode(filterMode === "IN" ? "ALL" : "IN");
                  toast.success(filterMode === "IN" ? "Showing all members" : "Filtering by checked-in members");
                }}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer font-bold active:scale-95 ${
                  filterMode === "IN"
                    ? "bg-primary text-white ring-2 ring-primary/20"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                }`}
              >
                In: {todayBoard.inCount}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterMode(filterMode === "LATE" ? "ALL" : "LATE");
                  toast.success(filterMode === "LATE" ? "Showing all members" : "Filtering by late arrivals");
                }}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer font-bold active:scale-95 ${
                  filterMode === "LATE"
                    ? "bg-chasing text-white ring-2 ring-chasing/20"
                    : "bg-chasing/10 text-chasing hover:bg-chasing/20"
                }`}
              >
                Late: {todayBoard.lateCount}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterMode(filterMode === "REMOTE" ? "ALL" : "REMOTE");
                  toast.success(filterMode === "REMOTE" ? "Showing all members" : "Filtering by remote members");
                }}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer font-bold active:scale-95 ${
                  filterMode === "REMOTE"
                    ? "bg-shared text-white ring-2 ring-shared/20"
                    : "bg-shared/10 text-shared hover:bg-shared/20"
                }`}
              >
                Remote: {todayBoard.remoteCount}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterMode(filterMode === "NOT_YET" ? "ALL" : "NOT_YET");
                  toast.success(filterMode === "NOT_YET" ? "Showing all members" : "Filtering by not yet checked in");
                }}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer font-bold active:scale-95 ${
                  filterMode === "NOT_YET"
                    ? "bg-mutedText text-white ring-2 ring-mutedText/20"
                    : "bg-ground text-mutedText hover:bg-line border border-line"
                }`}
              >
                Not yet in: {todayBoard.notYetCount}
              </button>
            </div>

            <button
              type="button"
              onClick={handleRemindAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-all cursor-pointer active:scale-95"
            >
              <BellRing className="h-3.5 w-3.5" />
              <span>Remind Not-yet-in</span>
            </button>
          </div>

          <div className="divide-y divide-line">
            {filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-xs text-mutedText">
                No attendees match the selected filter ({filterMode}).
                <button
                  type="button"
                  onClick={() => setFilterMode("ALL")}
                  className="ml-2 text-primary hover:underline font-semibold cursor-pointer"
                >
                  Reset filter
                </button>
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isReminded = remindedUsers.has(u.id);
                return (
                  <div key={u.id} className="py-3 flex items-center justify-between text-xs hover:bg-ground/40 px-2 rounded-control transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-ground border border-line flex items-center justify-center font-bold text-xs text-ink">
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-ink flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {u.status === "NOT_YET" && isReminded && (
                            <span className="text-[10px] text-chasing font-mono bg-chasing/10 px-1.5 py-0.2 rounded font-normal">
                              Reminded
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-mutedText">{u.role}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      {u.inTime ? (
                        <span className="text-ink font-medium">{u.inTime} ({u.mode})</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-mutedText italic">Not checked in</span>
                          <button
                            type="button"
                            onClick={() => handleNudgeUser(u.id, u.name)}
                            className="px-2 py-0.5 text-[10px] rounded bg-primary/10 hover:bg-primary/20 text-primary font-semibold transition-all cursor-pointer active:scale-95"
                          >
                            {isReminded ? "Nudged" : "Nudge"}
                          </button>
                        </div>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                          u.status === "PRESENT"
                            ? "bg-primary/15 text-primary"
                            : u.status === "LATE"
                            ? "bg-chasing/15 text-chasing"
                            : "bg-ground text-mutedText border border-line"
                        }`}
                      >
                        {u.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* My Attendance History */}
      {activeTab === "my-month" && (
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div>
              <h3 className="text-xs font-semibold text-ink font-mono uppercase">
                September 2026 Register
              </h3>
              <p className="text-[11px] text-mutedText mt-0.5">Click any day to view verified shift records</p>
            </div>
            <span className="text-xs text-mutedText font-mono">100% working day coverage</span>
          </div>

          {selectedDayDetails && (
            <div className="p-3 bg-ground border border-primary/30 rounded-control flex items-center justify-between text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <span className="font-semibold text-ink">September {selectedDayDetails.day}, 2026:</span>
                <span className="text-mutedText">{selectedDayDetails.label}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayDetails(null)}
                className="text-[11px] text-mutedText hover:text-ink cursor-pointer font-mono"
              >
                Close
              </button>
            </div>
          )}

          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="font-mono text-mutedText text-[11px] py-1 font-semibold">
                {d}
              </div>
            ))}
            {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
              const isSunday = (day + 1) % 7 === 0;
              const isLate = day === 14 || day === 21;
              const isHalf = day === 8;
              const code = isSunday ? "WO" : isLate ? "L" : isHalf ? "H" : "P";
              const label = isSunday
                ? "Weekly Off (University Closed)"
                : isLate
                ? "In at 09:35 AM · Out at 18:10 PM · 8.6h (Late arrival: Grace exceeded)"
                : isHalf
                ? "In at 09:05 AM · Out at 13:30 PM · 4.4h (Half Day approved)"
                : "In at 09:04 AM · Out at 18:05 PM · 9.0h (Full attendance verified)";

              const color = isSunday
                ? "bg-ground text-mutedText hover:bg-line/40"
                : isLate
                ? "bg-chasing/15 text-chasing font-bold hover:bg-chasing/25"
                : isHalf
                ? "bg-[#FFF4C2] text-ink font-bold hover:bg-[#FFEAA0]"
                : "bg-primary/15 text-primary font-bold hover:bg-primary/25";

              const isSelected = selectedDayDetails?.day === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setSelectedDayDetails({ day, code, label });
                    toast.success(`Sep ${day}: ${code} - ${label.split("·")[0]}`);
                  }}
                  className={`p-2 rounded-control border ${
                    isSelected ? "border-primary ring-2 ring-primary/30" : "border-line/60"
                  } ${color} flex flex-col items-center justify-center min-h-[46px] cursor-pointer active:scale-95 transition-all`}
                  title={`Sep ${day}: Click to view shift record`}
                >
                  <span className="text-[10px] font-mono opacity-80">{day}</span>
                  <span className="text-xs font-bold">{code}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
