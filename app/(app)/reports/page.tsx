"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { KpiGrid, KpiTile } from "@/components/reports/KpiGrid";
import { JprTable, JprRow } from "@/components/reports/JprTable";
import { JpaCard, JpaProfile } from "@/components/reports/JpaCard";
import { DownloadModal } from "@/components/reports/DownloadModal";
import { BarChart3, FileText, Download, CheckCircle2, Award, Calendar } from "lucide-react";
import { getReportsDataAction } from "./actions";

const FALLBACK_KPIS: KpiTile[] = [
  { name: "Tasks Completed", value: 0, target: "↑ 20", change: "0%", isPositive: true, status: "GOOD" },
  { name: "On-Time Delivery", value: "100%", target: "≥ 85%", change: "0%", isPositive: true, status: "GOOD" },
  { name: "Overdue Open", value: 0, target: "0", change: "0", isPositive: true, status: "GOOD" },
  { name: "Leadership Asks Closed", value: "100%", target: "≥ 90%", change: "0%", isPositive: true, status: "GOOD" },
  { name: "Daily Update Compliance", value: "100%", target: "≥ 90%", change: "0%", isPositive: true, status: "GOOD" },
  { name: "Follow-ups Answered", value: "100%", target: "≥ 80%", change: "0%", isPositive: true, status: "GOOD" },
  { name: "Estimate Accuracy", value: "100%", target: "≥ 80%", change: "0%", isPositive: true, status: "GOOD" },
  { name: "Avg Feedback Rating", value: "5.0 ★", target: "≥ 4.5", change: "0", isPositive: true, status: "GOOD" },
];

const FALLBACK_JPR: JprRow[] = [];

const FALLBACK_JPA: JpaProfile = {
  name: "Sri",
  role: "IT Manager · SMRU Campus IT",
  period: "Current Period",
  scores: {
    delivery: 4.8,
    timeliness: 4.9,
    reliability: 4.8,
    attendance: 4.9,
    responsiveness: 4.7,
    quality: 4.8,
    leadReview: 4.9,
  },
  overallScore: 4.8,
  kudosReceivedCount: 4,
  strengths: ["Excellent on-time milestone closure", "Consistent daily update submissions"],
  improvements: ["Proactive documentation handover"],
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"kpi" | "jpr" | "jpa">("kpi");
  const [period, setPeriod] = useState<"MONTH" | "QUARTER" | "YEAR">("MONTH");
  const [kpis, setKpis] = useState<KpiTile[]>(FALLBACK_KPIS);
  const [jprRows, setJprRows] = useState<JprRow[]>(FALLBACK_JPR);
  const [jpaProfile, setJpaProfile] = useState<JpaProfile>(FALLBACK_JPA);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getReportsDataAction(period).then((res) => {
      if (res.success && res.data) {
        if (res.data.kpiTiles) setKpis(res.data.kpiTiles);
        if (res.data.jprRows) setJprRows(res.data.jprRows);
        if (res.data.jpaProfile) setJpaProfile(res.data.jpaProfile);
      }
      setIsLoading(false);
    });
  }, [period]);

  const handleDownload = (fileName: string) => {
    if (fileName.endsWith(".csv")) {
      const escapeCell = (val: unknown) => {
        const str = String(val ?? "");
        if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csvRows: string[] = [];
      csvRows.push([escapeCell("SMRU IT COMMAND CENTER - LEADERSHIP REPORT"), ""].join(","));
      csvRows.push([escapeCell("Report"), escapeCell(fileName)].join(","));
      csvRows.push([escapeCell("Generated"), escapeCell(new Date().toLocaleString("en-IN"))].join(","));
      csvRows.push("");
      csvRows.push(escapeCell("--- SECTION 1: KPIS ---"));
      csvRows.push(["KPI Name", "Current Value", "Target", "Change", "Status"].map(escapeCell).join(","));
      kpis.forEach((kpi) => {
        csvRows.push([kpi.name, kpi.value, kpi.target, kpi.change, kpi.status].map(escapeCell).join(","));
      });
      csvRows.push("");
      csvRows.push(escapeCell("--- SECTION 2: JOB PROGRESS REPORT (JPR) ---"));
      csvRows.push(["Team Name", "Lead Name", "Done / Planned", "Progress %", "Attendance %", "Hours Logged", "Avg Feedback", "Health", "Highlights", "Risks"].map(escapeCell).join(","));
      jprRows.forEach((row) => {
        csvRows.push([
          row.teamName,
          row.leadName,
          row.donePlanned,
          `${row.progressPercent}%`,
          `${row.attendancePercent}%`,
          row.hoursLogged,
          row.avgFeedback,
          row.health,
          row.highlights.join("; "),
          row.risks.join("; "),
        ].map(escapeCell).join(","));
      });
      csvRows.push("");
      csvRows.push(escapeCell("--- SECTION 3: JOB PERFORMANCE APPRAISAL (JPA) ---"));
      csvRows.push([escapeCell("Employee Name"), escapeCell(jpaProfile.name)].join(","));
      csvRows.push([escapeCell("Role"), escapeCell(jpaProfile.role)].join(","));
      csvRows.push([escapeCell("Period"), escapeCell(jpaProfile.period)].join(","));
      csvRows.push([escapeCell("Overall Score"), escapeCell(`${jpaProfile.overallScore} / 5.0`)].join(","));
      csvRows.push([escapeCell("Kudos Received"), escapeCell(jpaProfile.kudosReceivedCount)].join(","));
      csvRows.push(["Competency Metric", "Score (1-5)"].map(escapeCell).join(","));
      Object.entries(jpaProfile.scores).forEach(([metric, score]) => {
        csvRows.push([metric.charAt(0).toUpperCase() + metric.slice(1), score].map(escapeCell).join(","));
      });

      const csvContent = csvRows.join("\r\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded CSV: ${fileName}`);
      return;
    }

    // PDF Print View
    const printWin = window.open("", "_blank");
    if (printWin) {
      const dateStr = new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${fileName}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0F172A; background: #FFF; margin: 0; padding: 24px; font-size: 11px; line-height: 1.4; }
    .header { border-bottom: 2px solid #0F172A; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }
    .brand { font-size: 10px; font-family: monospace; font-weight: 700; color: #64748B; letter-spacing: 0.5px; }
    .title { font-size: 18px; font-weight: 800; color: #0F172A; margin: 4px 0 0 0; }
    .meta { font-family: monospace; font-size: 10px; color: #64748B; text-align: right; }
    h2 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px; color: #1E293B; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
    .kpi-card { border: 1px solid #CBD5E1; border-radius: 6px; padding: 10px; background: #F8FAFC; }
    .kpi-name { font-size: 10px; color: #64748B; margin-bottom: 4px; }
    .kpi-val { font-size: 18px; font-weight: 800; color: #0F172A; }
    .kpi-change { font-size: 9px; font-family: monospace; font-weight: 600; color: #166534; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    th, td { border: 1px solid #CBD5E1; padding: 6px 9px; text-align: left; }
    th { background: #F1F5F9; font-weight: 600; font-size: 10px; text-transform: uppercase; color: #475569; }
    .badge { display: inline-block; padding: 2px 6px; font-size: 9px; font-family: monospace; font-weight: 700; border-radius: 4px; }
    .badge-good { background: #DCFCE7; color: #166534; }
    .badge-watch { background: #FEF3C7; color: #92400E; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">SMRU IT COMMAND CENTER · LEADERSHIP REPORT</div>
      <h1 class="title">${fileName.replace(/_/g, " ").replace(".pdf", "")}</h1>
    </div>
    <div class="meta">
      <div>Generated: ${dateStr}</div>
      <div>Confidential · VC / Executive Desk</div>
    </div>
  </div>

  <h2>1. Performance KPIs (${period})</h2>
  <div class="grid">
    ${kpis.map(k => `
      <div class="kpi-card">
        <div class="kpi-name">${k.name}</div>
        <div class="kpi-val">${k.value}</div>
        <div class="kpi-change">${k.change} (Target: ${k.target})</div>
      </div>
    `).join("")}
  </div>

  <h2>2. Job Progress Report (JPR)</h2>
  <table>
    <thead>
      <tr>
        <th>Team</th>
        <th>Lead</th>
        <th>Done / Planned</th>
        <th>Progress</th>
        <th>Attendance</th>
        <th>Hours</th>
        <th>Health</th>
      </tr>
    </thead>
    <tbody>
      ${jprRows.map(r => `
        <tr>
          <td><strong>${r.teamName}</strong></td>
          <td>${r.leadName}</td>
          <td>${r.donePlanned}</td>
          <td>${r.progressPercent}%</td>
          <td>${r.attendancePercent}%</td>
          <td>${r.hoursLogged}h</td>
          <td><span class="badge ${r.health === "Good" ? "badge-good" : "badge-watch"}">${r.health}</span></td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <h2>3. Job Performance Appraisal (JPA) Summary</h2>
  <table>
    <thead>
      <tr>
        <th>Employee</th>
        <th>Role</th>
        <th>Period</th>
        <th>Overall Score</th>
        <th>Kudos</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>${jpaProfile.name}</strong></td>
        <td>${jpaProfile.role}</td>
        <td>${jpaProfile.period}</td>
        <td><strong>${jpaProfile.overallScore} / 5.0</strong></td>
        <td>${jpaProfile.kudosReceivedCount} Received</td>
      </tr>
    </tbody>
  </table>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => { window.print(); }, 350);
    });
  </script>
</body>
</html>`);
      printWin.document.close();
      toast.success(`Opened clean print view for ${fileName}`);
    } else {
      window.print();
      toast.success(`Printing report: ${fileName}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Reports & Performance</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Track G (SPEC §13.1): Authoritative KPI Calculation Engine, JPR & JPA
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="inline-flex rounded-control border border-line bg-surface p-0.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => setPeriod("MONTH")}
              className={`px-2.5 py-1 rounded-control font-medium transition-colors cursor-pointer ${
                period === "MONTH" ? "bg-primary text-white" : "text-mutedText hover:text-ink"
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setPeriod("QUARTER")}
              className={`px-2.5 py-1 rounded-control font-medium transition-colors cursor-pointer ${
                period === "QUARTER" ? "bg-primary text-white" : "text-mutedText hover:text-ink"
              }`}
            >
              This Quarter
            </button>
            <button
              type="button"
              onClick={() => setPeriod("YEAR")}
              className={`px-2.5 py-1 rounded-control font-medium transition-colors cursor-pointer ${
                period === "YEAR" ? "bg-primary text-white" : "text-mutedText hover:text-ink"
              }`}
            >
              This Year
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsDownloadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-semibold shadow-2xs cursor-pointer transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Report Pack</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("kpi")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-control text-xs font-medium transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === "kpi"
              ? "bg-primary text-white"
              : "text-mutedText hover:text-ink hover:bg-surface"
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Performance KPIs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("jpr")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-control text-xs font-medium transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === "jpr"
              ? "bg-primary text-white"
              : "text-mutedText hover:text-ink hover:bg-surface"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Job Progress Report (JPR)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("jpa")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-control text-xs font-medium transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === "jpa"
              ? "bg-primary text-white"
              : "text-mutedText hover:text-ink hover:bg-surface"
          }`}
        >
          <Award className="h-3.5 w-3.5" />
          <span>Job Performance Appraisal (JPA)</span>
        </button>
      </div>

      {/* Tab Panels */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-mutedText font-mono">
          Calculating performance metrics from database...
        </div>
      ) : (
        <>
          {activeTab === "kpi" && <KpiGrid tiles={kpis} />}
          {activeTab === "jpr" && <JprTable rows={jprRows} />}
          {activeTab === "jpa" && <JpaCard jpa={jpaProfile} />}
        </>
      )}

      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        onDownload={handleDownload}
      />
    </div>
  );
}
