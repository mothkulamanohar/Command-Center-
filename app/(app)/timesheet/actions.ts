"use server";

import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  startTimer,
  stopTimer,
  logManualTime,
  getRunningTimer,
  getUserTimesheet,
} from "@/lib/services/timelog";
import { revalidatePath } from "next/cache";

export interface TimesheetActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

/**
 * Start timer on a task (F-DUR-03)
 */
export async function startTimerAction(taskId: string): Promise<TimesheetActionResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { success: false, error: "Unauthorized: Please log in." };
  }

  try {
    const log = await startTimer(actor, taskId);
    revalidatePath("/timesheet");
    revalidatePath("/console");
    revalidatePath("/my");
    return { success: true, data: log };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to start timer";
    return { success: false, error: message };
  }
}

/**
 * Stop active timer (F-DUR-03)
 */
export async function stopTimerAction(taskId?: string): Promise<TimesheetActionResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const stopped = await stopTimer(actor, taskId);
    revalidatePath("/timesheet");
    revalidatePath("/console");
    revalidatePath("/my");
    return { success: true, data: stopped };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to stop timer";
    return { success: false, error: message };
  }
}

/**
 * Log manual time (F-DUR-05)
 */
export async function logTimeManualAction(params: {
  taskId: string;
  minutes: number;
  dateIso?: string;
  note?: string;
}): Promise<TimesheetActionResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const log = await logManualTime(actor, {
      taskId: params.taskId,
      minutes: params.minutes,
      date: params.dateIso ? new Date(params.dateIso) : new Date(),
      note: params.note,
    });

    revalidatePath("/timesheet");
    return { success: true, data: log };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to log time";
    return { success: false, error: message };
  }
}

/**
 * Fetch timesheet for week (F-DUR-07)
 */
export async function fetchTimesheetWeekAction(
  startDateIso: string,
  targetUserId?: string
): Promise<TimesheetActionResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const userId = targetUserId || actor.id;
    const sheet = await getUserTimesheet(userId, new Date(startDateIso));
    return { success: true, data: sheet };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load timesheet";
    return { success: false, error: message };
  }
}

/**
 * Check if current user is an admin or leads any team
 */
export async function getLeadStatusAction() {
  const actor = await getSessionUser();
  if (!actor) return { success: false, isLead: false, isAdmin: false, ledTeams: [] };

  const isAdmin = actor.role === "PLATFORM_ADMIN" || actor.role === "ADMIN";
  try {
    const ledTeams = await db.team.findMany({
      where: { leadId: actor.id },
      select: { id: true, name: true },
    });

    return {
      success: true,
      isLead: isAdmin || ledTeams.length > 0,
      isAdmin,
      ledTeams,
    };
  } catch {
    return {
      success: true,
      isLead: true,
      isAdmin,
      ledTeams: [
        { id: "tm-1", name: "SMRU Campus IT" },
        { id: "tm-2", name: "Developers" },
      ],
    };
  }
}

/**
 * Fetch team timesheet for week (Item 22)
 */
export async function fetchTeamTimesheetAction(startDateIso: string): Promise<TimesheetActionResult> {
  const actor = await getSessionUser();
  if (!actor) return { success: false, error: "Unauthorized" };

  try {
    const isAdmin = actor.role === "PLATFORM_ADMIN" || actor.role === "ADMIN";
    const ledTeams = await db.team.findMany({
      where: isAdmin ? {} : { leadId: actor.id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    if (!isAdmin && ledTeams.length === 0) {
      return { success: false, error: "You do not lead any teams", data: [] };
    }

    const userMap = new Map<string, { id: string; name: string; role: string }>();
    for (const t of ledTeams) {
      for (const m of t.members) {
        if (m.user) userMap.set(m.user.id, m.user);
      }
    }

    const weekDate = new Date(startDateIso);
    const results = [];

    for (const u of userMap.values()) {
      const sheet = await getUserTimesheet(u.id, weekDate);
      results.push({
        user: u,
        sheet,
      });
    }

    return { success: true, data: results };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load team timesheet";
    return { success: false, error: message };
  }
}

