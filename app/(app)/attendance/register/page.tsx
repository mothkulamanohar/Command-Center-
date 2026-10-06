"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Download, FileSpreadsheet, Filter, CheckCircle2 } from "lucide-react";
import { fetchMonthlyRegisterAction } from "./actions";

function getAvailableMonths() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 4; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    months.push({ value, label });
  }
  return months;
}

interface RegisterPerson {
  id: string;
  name: string;
  role: string;
  team: string;
  days: Array<{ day: number; code: string; statusKind: string; date: string }>;
  p: number;
  l: number;
  h: number;
  a: number;
  lv: number;
  att: string;
}

export default function AttendanceRegisterPage() {
  const months = getAvailableMonths();
  const [selectedMonth, setSelectedMonth] = useState(months[0].value);
  const [daysInMonth, setDaysInMonth] = useState<number>(30);
  const [people, setPeople] = useState<RegisterPerson[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    fetchMonthlyRegisterAction(selectedMonth).then((res) => {
      if (res.success && res.data) {
        setDaysInMonth(res.data.daysInMonth);
        setPeople(res.data.people as RegisterPerson[]);
      } else {
        toast.error(res.error || "Failed to load register");
      }
      setIsLoading(false);
    });
  }, [selectedMonth]);

  const handleExportCsv = () => {
    window.location.href = `/api/attendance/export?month=${selectedMonth}`;
    toast.success(`Exporting attendance CSV for ${selectedMonth}...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/attendance"
            prefetch={true}
            className="p-1.5 border border-line rounded-control text-mutedText hover:text-ink hover:bg-surface cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-ink">Monthly Attendance Register</h1>
            <p className="text-xs text-mutedText mt-0.5">
              Comprehensive organization grid (F-ATT-09) · Mon–Sat work week
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 text-xs bg-surface border border-line rounded-control text-ink font-mono focus:outline-none cursor-pointer"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-control text-xs font-semibold hover:bg-primary-hover cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Legend Strip */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-surface border border-line rounded-panel text-xs">
        <span className="font-semibold text-ink text-[11px] font-mono uppercase">Legend:</span>
        <span className="px-2 py-0.5 rounded bg-primary/15 text-primary font-bold">P = Present</span>
        <span className="px-2 py-0.5 rounded bg-chasing/15 text-chasing font-bold">L = Late</span>
        <span className="px-2 py-0.5 rounded bg-[#FFF4C2] text-ink font-bold">H = Half Day</span>
        <span className="px-2 py-0.5 rounded bg-danger/15 text-danger font-bold">A = Absent</span>
        <span className="px-2 py-0.5 rounded bg-shared/15 text-shared font-bold">LV = Leave</span>
        <span className="px-2 py-0.5 rounded bg-ground text-mutedText border border-line font-bold">WO = Week Off</span>
      </div>

      {/* Full Month Register Table */}
      <div className="bg-surface rounded-panel border border-line overflow-x-auto shadow-xs">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-mutedText font-mono">
            Loading attendance records for {selectedMonth}...
          </div>
        ) : people.length === 0 ? (
          <div className="py-16 text-center text-xs text-mutedText font-mono">
            No active staff found for this month.
          </div>
        ) : (
          <table className="w-full min-w-[850px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-ground/70 border-b border-line text-[11px] font-mono text-mutedText">
                <th className="p-3 sticky left-0 bg-ground/90 z-10 w-44 min-w-[150px] font-semibold">User</th>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                  <th key={d} className="p-1 text-center w-7 border-l border-line/40">
                    {d}
                  </th>
                ))}
                <th className="p-2 text-center border-l border-line font-semibold">P</th>
                <th className="p-2 text-center border-l border-line font-semibold">L</th>
                <th className="p-2 text-center border-l border-line font-semibold">Att %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {people.map((person) => (
                <tr key={person.id} className="hover:bg-ground/30 transition-colors">
                  <td className="p-3 sticky left-0 bg-surface z-10 border-r border-line min-w-[150px]">
                    <div className="font-semibold text-ink">{person.name}</div>
                    <div className="text-[10px] text-mutedText">{person.role} · {person.team}</div>
                  </td>
                  {person.days.map((dayItem) => {
                    let cls = "text-mutedText/40";
                    if (dayItem.code === "WO") {
                      cls = "text-mutedText/60 bg-ground/50";
                    } else if (dayItem.code === "A") {
                      cls = "text-danger font-bold bg-danger/10";
                    } else if (dayItem.code === "L") {
                      cls = "text-chasing font-bold bg-chasing/10";
                    } else if (dayItem.code === "H") {
                      cls = "text-ink font-bold bg-[#FFF4C2]";
                    } else if (dayItem.code === "LV") {
                      cls = "text-shared font-bold bg-shared/10";
                    } else if (dayItem.code === "P") {
                      cls = "text-primary font-bold";
                    }

                    return (
                      <td
                        key={dayItem.day}
                        className={`p-1 text-center font-mono text-[10px] border-l border-line/30 ${cls}`}
                      >
                        {dayItem.code}
                      </td>
                    );
                  })}
                  <td className="p-2 text-center font-mono text-primary font-bold border-l border-line">
                    {person.p}
                  </td>
                  <td className="p-2 text-center font-mono text-chasing font-bold border-l border-line">
                    {person.l}
                  </td>
                  <td className="p-2 text-center font-mono text-ink font-bold border-l border-line">
                    {person.att}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
