"use server";

import { getSessionUser } from "@/lib/auth/session";
import { reportBug } from "@/lib/services/dev";
import { revalidatePath } from "next/cache";

export async function createBugReportAction(params: {
  title: string;
  steps: string;
  expected?: string;
  actual?: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  project?: string;
}) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const res = await reportBug(user, {
      title: params.title,
      steps: params.steps,
      expected: params.expected,
      actual: params.actual,
      severity: params.severity,
    });

    revalidatePath("/dev");
    revalidatePath("/todo");
    revalidatePath("/console");
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to log bug" };
  }
}

export async function getBuildMapAction() {
  const user = await getSessionUser();
  if (!user) return { success: false, data: [] };

  try {
    const { getBuildMap } = await import("@/lib/services/dev");
    const tasks = await getBuildMap();
    const mapped = tasks.map((t) => {
      const started = t.startAt ? t.startAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Started";
      const expected = t.dueAt ? t.dueAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Ongoing";
      return {
        id: t.id,
        developerName: t.owner?.name || "Developer",
        projectName: t.project?.name || "Command Center",
        featureTitle: t.title,
        stack: t.project?.stack || "TypeScript · Next.js · Prisma",
        status: t.status,
        startedAt: started,
        expectedAt: expected,
      };
    });

    return { success: true, data: mapped };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load build map", data: [] };
  }
}

export async function getSitesAction() {
  const user = await getSessionUser();
  if (!user) return { success: false, data: [] };

  try {
    const { db } = await import("@/lib/db");
    const sites = await db.site.findMany({
      include: {
        checks: {
          take: 1,
          orderBy: { at: "desc" },
        },
      },
      orderBy: { domain: "asc" },
    });

    const now = Date.now();
    const mapped = sites.map((s) => {
      const lastCheck = s.checks[0];
      const sslDays = s.sslExpiresAt
        ? Math.max(0, Math.ceil((new Date(s.sslExpiresAt).getTime() - now) / (1000 * 60 * 60 * 24)))
        : 90;

      let lastCheckedAt = "Never";
      if (lastCheck) {
        const mins = Math.floor((now - new Date(lastCheck.at).getTime()) / 60000);
        lastCheckedAt = mins < 1 ? "Just now" : `${mins} min ago`;
      }

      return {
        id: s.id,
        domain: s.domain,
        url: s.url,
        hosting: s.hosting || "Cloudflare",
        dns: s.dns || "Cloudflare",
        sslExpiresAt: s.sslExpiresAt ? s.sslExpiresAt.toISOString() : null,
        sslDaysRemaining: sslDays,
        lastStatus: (s.lastStatus as "UP" | "DOWN" | "UNKNOWN") || "UP",
        uptimePercent: 99.9,
        lastCheckedAt,
      };
    });

    return { success: true, data: mapped };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load sites", data: [] };
  }
}

