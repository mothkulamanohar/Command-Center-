import { z } from "zod";
import { db } from "@/lib/db";
import { UserContext, can } from "@/lib/auth/can";
import { logAudit } from "@/lib/services/audit";
import { createNotification } from "@/lib/services/notify";
import { TaskStatus, Priority, TaskSource } from "@prisma/client";

export const ReportBugSchema = z.object({
  title: z.string().min(3),
  steps: z.string().min(5),
  expected: z.string().optional(),
  actual: z.string().optional(),
  projectId: z.string().optional(),
  siteId: z.string().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  ownerId: z.string().optional(),
});

/**
 * F-DEV-07: Get all registered sites with uptime and SSL status
 */
export async function getSites() {
  return await db.site.findMany({
    orderBy: { domain: "asc" },
    include: {
      checks: {
        orderBy: { at: "desc" },
        take: 10,
      },
    },
  });
}

/**
 * F-DEV-08: Check site uptime (HTTP ping)
 */
export async function pingSite(siteId: string) {
  const site = await db.site.findUniqueOrThrow({ where: { id: siteId } });

  const start = Date.now();
  let ok = false;
  let status: number | null = null;
  let errorMsg: string | null = null;

  try {
    const res = await fetch(site.url, {
      method: "HEAD",
      signal: AbortSignal.timeout(10000), // 10s timeout
    });
    status = res.status;
    ok = res.ok;
  } catch (err: unknown) {
    ok = false;
    errorMsg = err instanceof Error ? err.message : "Connection failed";
  }

  const elapsed = Date.now() - start;

  // Record check
  await db.siteCheck.create({
    data: {
      siteId: site.id,
      ok,
      status,
      ms: elapsed,
      error: errorMsg,
    },
  });

  const newStatus = ok ? "UP" : "DOWN";

  // Check if consecutive down
  if (!ok && site.lastStatus === "DOWN") {
    // 2 consecutive failures -> Alert owner and Sri
    if (site.ownerId) {
      await createNotification({
        userId: site.ownerId,
        type: "SITE_DOWN",
        title: `Site Down: ${site.domain}`,
        body: `Uptime check failed consecutive times: ${errorMsg || `HTTP ${status}`}`,
        url: "/dev",
      });
    }
  }

  return await db.site.update({
    where: { id: site.id },
    data: {
      lastStatus: newStatus,
      lastCheckedAt: new Date(),
    },
  });
}

/**
 * F-DEV-02: Get active build map across developers and projects
 */
export async function getBuildMap() {
  return await db.task.findMany({
    where: {
      projectId: { not: null },
      tags: { has: "feature" },
      status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
    },
    include: {
      owner: true,
      project: true,
    },
    orderBy: { dueAt: "asc" },
  });
}

/**
 * F-DEV-04: Report a bug and auto-create corresponding Task
 */
export async function reportBug(actor: UserContext, input: z.infer<typeof ReportBugSchema>) {
  if (!can(actor, "create_task")) {
    throw new Error("Unauthorized to report bugs");
  }

  const data = ReportBugSchema.parse(input);

  const priorityMap: Record<string, Priority> = {
    LOW: Priority.LOW,
    MEDIUM: Priority.MEDIUM,
    HIGH: Priority.HIGH,
    CRITICAL: Priority.URGENT,
  };

  return await db.$transaction(async (tx) => {
    // 1. Create Task for bug
    const task = await tx.task.create({
      data: {
        title: `[BUG] ${data.title}`,
        description: {
          steps: data.steps,
          expected: data.expected,
          actual: data.actual,
          severity: data.severity,
        },
        ownerId: data.ownerId || actor.id,
        createdById: actor.id,
        status: TaskStatus.TODO,
        priority: priorityMap[data.severity] || Priority.MEDIUM,
        projectId: data.projectId,
        source: TaskSource.DEV,
        tags: ["bug", data.severity.toLowerCase()],
      },
    });

    await logAudit(tx, {
      actorId: actor.id,
      action: "BUG_CREATE",
      entity: "Task",
      entityId: task.id,
      after: { title: data.title, severity: data.severity },
    });

    return task;
  });
}
