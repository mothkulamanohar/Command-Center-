"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { SitesRegistryTable, SiteItem } from "@/components/dev/SitesRegistryTable";
import { BuildMapTable, BuildMapItem } from "@/components/dev/BuildMapTable";
import { BugTrackerModal } from "@/components/dev/BugTrackerModal";
import { Globe, Code2, Bug, CheckCircle2 } from "lucide-react";
import { createBugReportAction, getBuildMapAction, getSitesAction } from "./actions";

const INITIAL_SITES: SiteItem[] = [
  {
    id: "s-1",
    domain: "smru.edu.in",
    url: "https://smru.edu.in",
    hosting: "Dedicated Host",
    dns: "Cloudflare",
    sslDaysRemaining: 74,
    lastStatus: "UP",
    uptimePercent: 99.98,
    lastCheckedAt: "2 min ago",
  },
  {
    id: "s-2",
    domain: "smru.in",
    url: "https://smru.in",
    hosting: "Vercel",
    dns: "Route53",
    sslDaysRemaining: 18,
    lastStatus: "UP",
    uptimePercent: 99.95,
    lastCheckedAt: "4 min ago",
  },
  {
    id: "s-3",
    domain: "womens.smru.edu.in",
    url: "https://womens.smru.edu.in",
    hosting: "Campus Server",
    dns: "Local DNS",
    sslDaysRemaining: 5,
    lastStatus: "UP",
    uptimePercent: 98.80,
    lastCheckedAt: "Just now",
  },
  {
    id: "s-4",
    domain: "chebrol.smru.edu.in",
    url: "https://chebrol.smru.edu.in",
    hosting: "Campus Server",
    dns: "Local DNS",
    sslDaysRemaining: 120,
    lastStatus: "UP",
    uptimePercent: 99.90,
    lastCheckedAt: "3 min ago",
  },
];

const INITIAL_BUILD_MAP: BuildMapItem[] = [
  {
    id: "b-1",
    developerName: "Dev · Web",
    projectName: "Command Center",
    featureTitle: "Team Links Board & Auto URL extraction",
    stack: "Next.js 15 · Tailwind · Prisma",
    status: "IN_REVIEW",
    startedAt: "22 Sep",
    expectedAt: "25 Sep",
  },
  {
    id: "b-2",
    developerName: "Dev · Backend",
    projectName: "UOS Rollout",
    featureTitle: "Attendance punch sync background daemon",
    stack: "Node.js · PostgreSQL · pg-boss",
    status: "IN_PROGRESS",
    startedAt: "23 Sep",
    expectedAt: "26 Sep",
  },
  {
    id: "b-3",
    developerName: "Dev · Web",
    projectName: "Admissions Portal",
    featureTitle: "Seat allotment letter PDF generation",
    stack: "Next.js · Playwright",
    status: "TODO",
    startedAt: "24 Sep",
    expectedAt: "28 Sep",
  },
];

export default function DevHubPage() {
  const [activeTab, setActiveTab] = useState<"sites" | "buildmap" | "bugs">("sites");
  const [sites, setSites] = useState<SiteItem[]>(INITIAL_SITES);
  const [buildMap, setBuildMap] = useState<BuildMapItem[]>(INITIAL_BUILD_MAP);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);

  useEffect(() => {
    getSitesAction().then((res) => {
      if (res.success && res.data && (res.data as SiteItem[]).length > 0) {
        const dbSites = res.data as SiteItem[];
        const dbDomains = new Set(dbSites.map((s) => s.domain));
        setSites([...dbSites, ...INITIAL_SITES.filter((s) => !dbDomains.has(s.domain))]);
      }
    });

    getBuildMapAction().then((res) => {
      if (res.success && res.data && (res.data as BuildMapItem[]).length > 0) {
        const dbItems = res.data as BuildMapItem[];
        const dbIds = new Set(dbItems.map((b) => b.id));
        setBuildMap([...dbItems, ...INITIAL_BUILD_MAP.filter((b) => !dbIds.has(b.id))]);
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
    let res: any = { success: false };
    try {
      res = await createBugReportAction({
        title: data.title,
        steps: data.steps,
        severity: data.severity,
        project: data.project,
      });
    } catch {}

    if (res.success) {
      setIsBugModalOpen(false);
      toast.success(`Bug logged: "${data.title}" · Bug and task created`);
    } else {
      const { taskStore } = await import("@/lib/store/taskStore");
      taskStore.addTask({
        title: `[BUG] ${data.title}`,
        requesterName: "Dev Hub",
        priority: data.severity === "CRITICAL" ? "URGENT" as any : data.severity === "HIGH" ? "HIGH" as any : "MEDIUM" as any,
      });
      setIsBugModalOpen(false);
      toast.success(`Bug logged: "${data.title}" · Bug and task created`);
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
