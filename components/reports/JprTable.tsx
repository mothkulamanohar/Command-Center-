"use client";

import { BarChart3, AlertTriangle, ShieldCheck } from "lucide-react";

export interface JprRow {
  teamName: string;
  leadName: string;
  donePlanned: string;
  progressPercent: number;
  highlights: string[];
  risks: string[];
  health: "Good" | "Watch" | "Needs attention";
  attendancePercent?: number;
  hoursLogged?: number;
  avgFeedback?: number;
}

interface JprTableProps {
  rows: JprRow[];
}

export function JprTable({ rows }: JprTableProps) {
  return (
    <div className="bg-surface rounded-panel border border-line overflow-hidden shadow-xs">
      <div className="p-4 border-b border-line flex items-center justify-between bg-surface-alt/40">
        <div>
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span>Job Progress Report (JPR)</span>
            <span className="text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-semibold">
              SPEC §13.3
            </span>
          </h2>
          <p className="text-xs text-mutedText mt-0.5">
            Team-level progress, highlight wins, and blocker risk flags
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-alt/70 text-mutedText uppercase text-[10px] font-mono border-b border-line">
            <tr>
              <th className="py-2.5 px-4">Team & Lead</th>
              <th className="py-2.5 px-3">Done / Planned</th>
              <th className="py-2.5 px-3">Progress</th>
              <th className="py-2.5 px-3">Attendance</th>
              <th className="py-2.5 px-3">Hours</th>
              <th className="py-2.5 px-3">Feedback</th>
              <th className="py-2.5 px-4">Key Highlights</th>
              <th className="py-2.5 px-4">Risks & Blockers</th>
              <th className="py-2.5 px-3">Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-surface-alt/40 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-ink">{row.teamName}</div>
                  <div className="text-[11px] text-mutedText font-mono">Lead: {row.leadName}</div>
                </td>

                <td className="py-3 px-3 font-mono text-ink font-semibold">
                  {row.donePlanned}
                </td>

                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-ground rounded-full overflow-hidden border border-line">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(100, row.progressPercent)}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-ink font-bold">
                      {row.progressPercent}%
                    </span>
                  </div>
                </td>

                <td className="py-3 px-3 font-mono text-ink font-semibold text-[11px]">
                  {row.attendancePercent != null ? `${row.attendancePercent}%` : "—"}
                </td>

                <td className="py-3 px-3 font-mono text-ink font-semibold text-[11px]">
                  {row.hoursLogged != null ? `${row.hoursLogged}h` : "—"}
                </td>

                <td className="py-3 px-3 font-mono text-ink font-semibold text-[11px]">
                  {row.avgFeedback != null ? `${row.avgFeedback} ★` : "—"}
                </td>

                <td className="py-3 px-4">
                  <ul className="space-y-0.5">
                    {row.highlights.map((h, idx) => (
                      <li key={idx} className="text-[11px] text-ink flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-primary" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </td>

                <td className="py-3 px-4">
                  {row.risks.length === 0 ? (
                    <span className="text-[11px] text-mutedText font-mono">None flagged</span>
                  ) : (
                    <ul className="space-y-0.5">
                      {row.risks.map((r, idx) => (
                        <li key={idx} className="text-[11px] text-danger flex items-center gap-1.5 font-medium">
                          <span className="h-1 w-1 rounded-full bg-danger" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>

                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      row.health === "Good"
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : row.health === "Watch"
                        ? "bg-chasing/10 text-chasing border border-chasing/20"
                        : "bg-danger/10 text-danger border border-danger/20"
                    }`}
                  >
                    {row.health}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
