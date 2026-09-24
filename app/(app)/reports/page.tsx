"use client";

import { useState } from "react";
import { KpiGrid, KpiTile } from "@/components/reports/KpiGrid";
import { JprTable, JprRow } from "@/components/reports/JprTable";
import { JpaCard, JpaProfile } from "@/components/reports/JpaCard";
import { DownloadModal } from "@/components/reports/DownloadModal";
import { BarChart3, FileText, Download, CheckCircle2, Award } from "lucide-react";

const INITIAL_KPIS: KpiTile[] = [
  {
    name: "Tasks Completed",
    value: 38,
    target: "↑ 35",
    change: "+12%",
    isPositive: true,
    status: "GOOD",
  },
  {
    name: "On-Time Delivery",
    value: "88%",
    target: "≥ 85%",
    change: "+3%",
    isPositive: true,
    status: "GOOD",
  },
  {
    name: "Overdue Open",
    value: 2,
    target: "0",
    change: "-1",
    isPositive: true,
    status: "GOOD",
  },
  {
    name: "Requests Closed",
    value: "92%",
    target: "≥ 90%",
    change: "+4%",
    isPositive: true,
    status: "GOOD",
  },
  {
    name: "Daily Update Compliance",
    value: "94%",
    target: "≥ 90%",
    change: "+2%",
    isPositive: true,
    status: "GOOD",
  },
  {
    name: "Follow-ups Answered",
    value: "85%",
    target: "≥ 80%",
    change: "+5%",
    isPositive: true,
    status: "GOOD",
  },
  {
    name: "Leadership Asks Closed",
    value: "100%",
    target: "100%",
    change: "0%",
    isPositive: true,
    status: "GOOD",
  },
  {
    name: "Website Uptime",
    value: "99.94%",
    target: "≥ 99.5%",
    change: "+0.02%",
    isPositive: true,
    status: "GOOD",
  },
];

const INITIAL_JPR: JprRow[] = [
  {
    teamName: "SMRU Campus IT",
    leadName: "Hari (Coordinator)",
    donePlanned: "16 / 18",
    progressPercent: 89,
    highlights: ["Completed 48-port core switch migration in Lab B", "Re-cabled server rack 4"],
    risks: ["Fiber optic patch cable shipment delayed 2 days"],
    health: "Good",
  },
  {
    teamName: "Developers",
    leadName: "Sri (IT Manager)",
    donePlanned: "12 / 12",
    progressPercent: 100,
    highlights: ["Command Center Track B & C deployed", "Socket.IO real-time channels verified"],
    risks: [],
    health: "Good",
  },
  {
    teamName: "UOS Rollout",
    leadName: "Hari",
    donePlanned: "6 / 8",
    progressPercent: 75,
    highlights: ["Attendance biometric mapping complete for Block A"],
    risks: ["Block C switch port config pending"],
    health: "Watch",
  },
];

const INITIAL_JPA: JpaProfile = {
  name: "Hari",
  role: "IT Coordinator · SMRU Campus IT",
  period: "Q3 2026 (Jul - Sep)",
  scores: {
    delivery: 4.5,
    timeliness: 4.8,
    reliability: 4.7,
    responsiveness: 4.2,
    quality: 4.5,
    leadReview: 4.6,
  },
  overallScore: 4.6,
  kudosReceivedCount: 5,
  strengths: [
    "Exceptional on-time delivery across campus hardware cutovers",
    "Consistent daily update submission streak (24 days)",
    "Proactive coordination of physical rack maintenance",
  ],
  improvements: [
    "Ensure earlier notification for fiber cable vendor procurements",
    "Complete documentation handover for backup technician",
  ],
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"kpi" | "jpr" | "jpa">("kpi");
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDownload = (fileName: string) => {
    showToast(`Report downloaded: ${fileName}`);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-surface px-4 py-2.5 rounded-control text-xs font-medium shadow-panel border border-line flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Reports & Performance</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Track G: Weekly KPIs, JPR (Team Progress), JPA (Appraisal) & Leadership Packs
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsDownloadOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-semibold shadow-2xs self-start"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Download Report Pack</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("kpi")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-control text-xs font-medium transition-colors ${
            activeTab === "kpi"
              ? "bg-primary text-white"
              : "text-mutedText hover:text-ink hover:bg-surface"
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Weekly KPIs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("jpr")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-control text-xs font-medium transition-colors ${
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
          className={`flex items-center gap-2 px-3 py-1.5 rounded-control text-xs font-medium transition-colors ${
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
      {activeTab === "kpi" && <KpiGrid tiles={INITIAL_KPIS} />}

      {activeTab === "jpr" && <JprTable rows={INITIAL_JPR} />}

      {activeTab === "jpa" && <JpaCard jpa={INITIAL_JPA} />}

      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        onDownload={handleDownload}
      />
    </div>
  );
}
