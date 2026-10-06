"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { toast } from "sonner";
import {
  logTimeManualAction,
  fetchTimesheetWeekAction,
  fetchTeamTimesheetAction,
  getLeadStatusAction,
} from "./actions";
import { Clock, Calendar as CalendarIcon, Download, Plus, CheckCircle2, ChevronLeft, ChevronRight, User, Users } from "lucide-react";
import { formatMinutes } from "@/lib/time/duration";
import { timesheetStore } from "@/lib/store/timesheetStore";

export interface TimesheetTaskRow {
  taskId: string;
  taskRef: string;
  taskTitle: string;
  hours: number[];
}

function getWeekRange(offset: number) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + offset * 7);
  monday.setHours(0, 0, 0, 0);

  const days: { label: string; dateStr: string; dayIndex: number; date: Date }[] = [];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 0; i < 6; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push({
      label: `${dayNames[i]} (${d.getDate()})`,
      dateStr: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      dayIndex: i,
      date: d,
    });
  }

  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);

  const startOfYear = new Date(monday.getFullYear(), 0, 1);
  const pastDaysOfYear = (monday.getTime() - startOfYear.getTime()) / 86400000;
  const weekNum = Math.max(1, Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7));

  const monStr = monday.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const satStr = saturday.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const title = `Week ${weekNum} (${monStr} – ${satStr})`;

  return { weekKey: String(offset), title, days, mondayIso: monday.toISOString() };
}

interface TeamMemberTimesheet {
  user: { id: string; name: string; role: string };
  sheet: {
    rows: Array<{
      task: { id: string; number: number; title: string; estimateHours: number | null };
      days: number[];
      totalMinutes: number;
    }>;
    daysTotals: number[];
    grandTotalMinutes: number;
  };
}

export default function TimesheetPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekInfo = useMemo(() => getWeekRange(weekOffset), [weekOffset]);

  const [rows, setRows] = useState<TimesheetTaskRow[]>(() => timesheetStore.getRowsForWeek("0"));
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedTaskRef, setSelectedTaskRef] = useState("T-1042");
  const [logHours, setLogHours] = useState("1.5");
  const [logNote, setLogNote] = useState("");
  const [logDayIndex, setLogDayIndex] = useState(0);

  const [viewMode, setViewMode] = useState<"MY" | "TEAM">("MY");
  const [isLead, setIsLead] = useState(false);
  const [teamSheets, setTeamSheets] = useState<TeamMemberTimesheet[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check lead status
  useEffect(() => {
    getLeadStatusAction().then((res) => {
      if (res.success && res.isLead) {
        setIsLead(true);
      }
    });
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    if (viewMode === "TEAM") {
      const res = await fetchTeamTimesheetAction(weekInfo.mondayIso);
      if (res.success && res.data) {
        setTeamSheets(res.data as TeamMemberTimesheet[]);
      }
    } else {
      const res = await fetchTimesheetWeekAction(weekInfo.mondayIso);
      if (res.success && res.data) {
        const sheet = res.data as any;
        if (sheet.rows && sheet.rows.length > 0) {
          const mapped: TimesheetTaskRow[] = sheet.rows.map((r: any) => ({
            taskId: r.task.id,
            taskRef: `T-${r.task.number}`,
            taskTitle: r.task.title,
            hours: r.days.map((m: number) => m / 60),
          }));
          setRows(mapped);
        } else {
          setRows(timesheetStore.getRowsForWeek(weekInfo.weekKey));
        }
      } else {
        setRows(timesheetStore.getRowsForWeek(weekInfo.weekKey));
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [viewMode, weekInfo.mondayIso]);

  const days = weekInfo.days.map((d) => d.label);
  const currentWeek = weekInfo.title;

  const dayTotals = useMemo(
    () =>
      [0, 1, 2, 3, 4, 5].map((dayIdx) =>
        rows.reduce((sum, r) => sum + (r.hours[dayIdx] || 0), 0)
      ),
    [rows]
  );

  const grandTotal = useMemo(
    () => dayTotals.reduce((a, b) => a + b, 0),
    [dayTotals]
  );

  const [isPending, startTransition] = useTransition();

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    const hrs = parseFloat(logHours) || 0;
    if (hrs <= 0) return;

    startTransition(async () => {
      const targetDay = weekInfo.days[logDayIndex]?.date || new Date();

      // Optimistically update timesheetStore and local state
      timesheetStore.logHours(weekInfo.weekKey, selectedTaskRef, logDayIndex, hrs);
      setRows(timesheetStore.getRowsForWeek(weekInfo.weekKey));
      setIsLogModalOpen(false);
      setLogNote("");
      toast.success(`Logged ${hrs}h on ${selectedTaskRef}`);

      try {
        const res = await logTimeManualAction({
          taskId: selectedTaskRef,
          minutes: Math.round(hrs * 60),
          dateIso: targetDay.toISOString(),
          note: logNote || undefined,
        });
        if (res.success) loadData();
      } catch {}
    });
  };

  const handleExportCsv = () => {
    const csvLines = [
      "Task Ref,Task Title,Mon,Tue,Wed,Thu,Fri,Sat,Total Hours",
      ...rows.map(
        (r) =>
          `"${r.taskRef}","${r.taskTitle.replace(/"/g, '""')}",${r.hours.join(",")},${r.hours.reduce(
            (a, b) => a + b,
            0
          )}`
      ),
      `Total,,${dayTotals.join(",")},${grandTotal}`,
    ];
    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Timesheet_${currentWeek.replace(/[^a-zA-Z0-9]/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Timesheet exported to CSV");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Timesheets & Effort</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Track H (F-DUR-07): Weekly Task Time Logs, Actuals vs Estimates
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Item 22: Team View toggle hidden if user leads no team */}
          {isLead && (
            <div className="inline-flex rounded-control border border-line bg-surface p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setViewMode("MY")}
                className={`px-3 py-1 rounded-control font-medium transition-colors ${
                  viewMode === "MY" ? "bg-primary text-white" : "text-mutedText hover:text-ink cursor-pointer"
                }`}
              >
                My Timesheet
              </button>
              <button
                type="button"
                onClick={() => setViewMode("TEAM")}
                className={`px-3 py-1 rounded-control font-medium transition-colors ${
                  viewMode === "TEAM" ? "bg-primary text-white" : "text-mutedText hover:text-ink cursor-pointer"
                }`}
              >
                Team View
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-alt border border-line text-ink rounded-control text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-mutedText" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLogModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-semibold shadow-2xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log Time</span>
          </button>
        </div>
      </div>

      {/* Week Navigator */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-surface p-3 rounded-panel border border-line shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-1 rounded text-mutedText hover:text-ink border border-line cursor-pointer"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            title="Previous Week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold text-ink font-mono">{currentWeek}</span>
          <button
            type="button"
            className="p-1 rounded text-mutedText hover:text-ink border border-line cursor-pointer"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            title="Next Week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="text-xs font-mono font-semibold text-primary">
          {viewMode === "MY" ? (
            <>Weekly Total: <span className="text-sm font-bold">{grandTotal.toFixed(1)}h</span></>
          ) : (
            <>Team Members: <span className="text-sm font-bold">{teamSheets.length}</span></>
          )}
        </div>
      </div>

      {viewMode === "MY" ? (
        /* My Weekly Grid */
        <div className="bg-surface rounded-panel border border-line shadow-xs overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-line bg-ground text-mutedText font-mono uppercase text-[10px]">
                <th className="p-3 font-semibold">Task</th>
                {days.map((d) => (
                  <th key={d} className="p-3 font-semibold text-center w-24">
                    {d}
                  </th>
                ))}
                <th className="p-3 font-semibold text-center w-20">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-mutedText font-mono">
                    No time logged for this week. Click &ldquo;Log Time&rdquo; to add effort hours.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const rowTotal = row.hours.reduce((a, b) => a + b, 0);
                  return (
                    <tr key={row.taskId} className="hover:bg-ground/50 transition-colors">
                      <td className="p-3 min-w-[220px]">
                        <div className="font-mono text-[11px] font-bold text-primary">{row.taskRef}</div>
                        <div className="text-ink font-medium truncate max-w-sm">{row.taskTitle}</div>
                      </td>
                      {row.hours.map((val, idx) => (
                        <td
                          key={idx}
                          className="p-3 text-center font-mono cursor-pointer hover:bg-primary/5 transition-colors"
                          onClick={() => {
                            setSelectedTaskRef(row.taskRef);
                            setLogDayIndex(idx);
                            setIsLogModalOpen(true);
                          }}
                        >
                          {val > 0 ? (
                            <span className="inline-block px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                              {val.toFixed(1)}h
                            </span>
                          ) : (
                            <span className="text-mutedText/40">—</span>
                          )}
                        </td>
                      ))}
                      <td className="p-3 text-center font-mono font-bold text-ink">
                        {rowTotal > 0 ? `${rowTotal.toFixed(1)}h` : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
              {rows.length > 0 && (
                <tr className="bg-ground/80 font-bold border-t border-line text-ink font-mono">
                  <td className="p-3">Daily Totals</td>
                  {dayTotals.map((tot, idx) => (
                    <td key={idx} className="p-3 text-center text-primary">
                      {tot > 0 ? `${tot.toFixed(1)}h` : "0h"}
                    </td>
                  ))}
                  <td className="p-3 text-center text-primary text-sm">{grandTotal.toFixed(1)}h</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Team View */
        <div className="space-y-4">
          {teamSheets.length === 0 ? (
            <div className="bg-surface rounded-panel border border-line p-8 text-center text-xs text-mutedText font-mono">
              No team member timesheets found for this week.
            </div>
          ) : (
            teamSheets.map((ts) => {
              const memberHours = ts.sheet.daysTotals.map((mins) => mins / 60);
              const memberGrandTotal = ts.sheet.grandTotalMinutes / 60;
              return (
                <div key={ts.user.id} className="bg-surface rounded-panel border border-line shadow-xs overflow-hidden">
                  <div className="p-3 bg-ground border-b border-line flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-ink">{ts.user.name}</span>
                      <span className="text-[10px] font-mono text-mutedText bg-surface px-1.5 py-0.5 rounded border border-line">
                        {ts.user.role}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-primary">
                      Total: {memberGrandTotal.toFixed(1)}h
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-line bg-ground/50 text-mutedText font-mono uppercase text-[10px]">
                          <th className="p-2.5 font-semibold">Task</th>
                          {days.map((d) => (
                            <th key={d} className="p-2.5 font-semibold text-center w-20">
                              {d}
                            </th>
                          ))}
                          <th className="p-2.5 font-semibold text-center w-16">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {ts.sheet.rows.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-4 text-center text-mutedText text-xs">
                              No tasks logged this week.
                            </td>
                          </tr>
                        ) : (
                          ts.sheet.rows.map((r) => {
                            const rowHours = r.days.map((m) => m / 60);
                            const rowTotal = r.totalMinutes / 60;
                            return (
                              <tr key={r.task.id} className="hover:bg-ground/30">
                                <td className="p-2.5 min-w-[200px]">
                                  <span className="font-mono text-[10px] text-primary font-bold mr-1.5">
                                    T-{r.task.number}
                                  </span>
                                  <span className="text-ink font-medium">{r.task.title}</span>
                                </td>
                                {rowHours.map((h, i) => (
                                  <td key={i} className="p-2.5 text-center font-mono">
                                    {h > 0 ? `${h.toFixed(1)}h` : "—"}
                                  </td>
                                ))}
                                <td className="p-2.5 text-center font-mono font-bold text-ink">
                                  {rowTotal > 0 ? `${rowTotal.toFixed(1)}h` : "—"}
                                </td>
                              </tr>
                            );
                          })
                        )}
                        <tr className="bg-ground/40 font-bold border-t border-line text-ink font-mono text-[11px]">
                          <td className="p-2.5">Total</td>
                          {memberHours.map((h, i) => (
                            <td key={i} className="p-2.5 text-center text-primary">
                              {h > 0 ? `${h.toFixed(1)}h` : "0h"}
                            </td>
                          ))}
                          <td className="p-2.5 text-center text-primary font-bold">
                            {memberGrandTotal.toFixed(1)}h
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Manual Time Log Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-panel border border-line w-full max-w-md shadow-panel p-5 space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-ink">Log Time on Task</h3>
            <form onSubmit={handleAddLog} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">Task</label>
                <select
                  value={selectedTaskRef}
                  onChange={(e) => setSelectedTaskRef(e.target.value)}
                  className="w-full p-2 bg-ground border border-line rounded-control text-ink font-mono text-xs"
                >
                  {rows.map((r) => (
                    <option key={r.taskRef} value={r.taskRef}>
                      {r.taskRef} - {r.taskTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink mb-1">Day</label>
                  <select
                    value={logDayIndex}
                    onChange={(e) => setLogDayIndex(parseInt(e.target.value))}
                    className="w-full p-2 bg-ground border border-line rounded-control text-ink font-mono text-xs"
                  >
                    {days.map((d, idx) => (
                      <option key={idx} value={idx}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="12"
                    required
                    value={logHours}
                    onChange={(e) => setLogHours(e.target.value)}
                    className="w-full p-2 bg-ground border border-line rounded-control text-ink font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Work Note (Optional)</label>
                <input
                  type="text"
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  placeholder="e.g. Debugged webhook endpoint"
                  className="w-full p-2 bg-ground border border-line rounded-control text-ink font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-3 py-1.5 text-mutedText hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-control font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
