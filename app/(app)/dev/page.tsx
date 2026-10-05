"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { SitesRegistryTable, SiteItem } from "@/components/dev/SitesRegistryTable";
import { BuildMapTable, BuildMapItem } from "@/components/dev/BuildMapTable";
import { BugTrackerModal } from "@/components/dev/BugTrackerModal";
import { Globe, Code2, Bug, CheckCircle2 } from "lucide-react";
import { createBugReportAction, getBuildMapAction, getSitesAction } from "./actions";

export default function DevHubPage() {
  const [activeTab, setActiveTab] = useState<"sites" | "buildmap" | "bugs">("sites");
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [buildMap, setBuildMap] = useState<BuildMapItem[]>([]);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);

  useEffect(() => {
    getSitesAction().then((res) => {
      if (res.success && res.data) {
        setSites(res.data as SiteItem[]);
      }
    });

    getBuildMapAction().then((res) => {
      if (res.success && res.data) {
        setBuildMap(res.data as BuildMapItem[]);
      }
    });
  }, []);

  const handlePing = async (id: string) => {
    const site = sites.find((s) => s.id === id);
    if (!site) return;

    try {
      const res = await fetch(`/api/dev/ping?url=${encodeURIComponent(site.url)}`);
      const data = await res.json();
      const isUp = Boolean(data.ok);
      const statusStr = isUp ? "UP" : "DOWN";

      setSites((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                lastStatus: statusStr,
                lastCheckedAt: "Just now",
              }
            : s
        )
      );

      if (isUp) {
        toast.success(`HTTP check passed (${data.status || 200} OK, ${data.latencyMs}ms)`);
      } else {
        toast.success(`HTTP check failed (${data.error || "Offline"})`);
      }
    } catch {
      toast.success("Ping request failed to complete");
    }
  };

  const handleBugSubmit = async (data: {
    title: string;
    steps: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    project: string;
  }) => {
    const res = await createBugReportAction({
      title: data.title,
      steps: data.steps,
      severity: data.severity,
      project: data.project,
    });

    if (res.success) {
      setIsBugModalOpen(false);
      toast.success(`Bug logged: "${data.title}" · Bug and task created`);
    } else {
      toast.error(res.error || "Failed to log bug");
    }
  };

  return (
    <div className="space-y-6">
      

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Dev Hub</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Track E: Sites Registry, 5-Min Uptime, Active Build Map & Bug Tracker
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsBugModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-danger hover:bg-danger/90 text-white rounded-control text-xs font-medium transition-colors shadow-2xs"
          >
            <Bug className="h-3.5 w-3.5" />
            <span>Report Bug</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("sites")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-control text-xs font-medium transition-colors ${
            activeTab === "sites"
              ? "bg-primary text-white"
              : "text-mutedText hover:text-ink hover:bg-surface"
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          <span>Sites & Uptime ({sites.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("buildmap")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-control text-xs font-medium transition-colors ${
            activeTab === "buildmap"
              ? "bg-primary text-white"
              : "text-mutedText hover:text-ink hover:bg-surface"
          }`}
        >
          <Code2 className="h-3.5 w-3.5" />
          <span>Active Build Map ({buildMap.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "sites" && <SitesRegistryTable sites={sites} onPing={handlePing} />}

      {activeTab === "buildmap" && <BuildMapTable items={buildMap} />}

      <BugTrackerModal
        isOpen={isBugModalOpen}
        onClose={() => setIsBugModalOpen(false)}
        onSubmit={handleBugSubmit}
      />
    </div>
  );
}
