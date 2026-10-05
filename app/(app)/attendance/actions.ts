"use server";

import { headers } from "next/headers";
import { getSessionUser } from "@/lib/auth/session";
import {
  checkIn,
  checkOut,
  requestRegularization,
  decideRegularization,
  getTodayAttendanceBoard,
} from "@/lib/services/attendance";
import { applyLeave } from "@/lib/services/leave";
import { getClientIpFromHeaders } from "@/lib/geo/ip";
import { WorkMode, ApprovalState, LeaveType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface AttendanceActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

/**
 * Check-in server action with cloud IP detection (F-ATT-01..02)
 */
export async function checkInAction(
  mode: WorkMode = WorkMode.OFFICE,
  campusId?: string,
  lat?: number,
  lng?: number
): Promise<AttendanceActionResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { success: false, error: "Unauthorized: Please log in." };
  }

  const reqHeaders = await headers();
  const ip = getClientIpFromHeaders(reqHeaders);

  try {
    const record = await checkIn(actor, {
      mode,
      campusId,
      lat,
      lng,
      ip,
    });

    revalidatePath("/attendance");
    revalidatePath("/console");
    revalidatePath("/my");
    return { success: true, data: record };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to check in";
    return { success: false, error: message };
  }
}

/**
 * Check-out server action (F-ATT-01)
 */
export async function checkOutAction(lat?: number, lng?: number): Promise<AttendanceActionResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { success: false, error: "Unauthorized: Please log in." };
  }

  const reqHeaders = await headers();
  const ip = getClientIpFromHeaders(reqHeaders);

  try {
    const record = await checkOut(actor, { lat, lng, ip });

    revalidatePath("/attendance");
    revalidatePath("/console");
    revalidatePath("/my");
    return { success: true, data: record };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to check out";
    return { success: false, error: message };
  }
}

/**
 * Regularize attendance server action (F-ATT-05)
 */
export async function regularizeAttendanceAction(
  dateIso: string,
  reason: string,
  reqInIso?: string,
  reqOutIso?: string,
  reqMode: WorkMode = WorkMode.OFFICE
): Promise<AttendanceActionResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const reg = await requestRegularization(actor, {
      date: new Date(dateIso),
      reason,
      reqInAt: reqInIso ? new Date(reqInIso) : undefined,
      reqOutAt: reqOutIso ? new Date(reqOutIso) : undefined,
      reqMode,
    });

    revalidatePath("/attendance");
    revalidatePath("/attendance/requests");
    return { success: true, data: reg };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit regularisation";
    return { success: false, error: message };
  }
}

/**
 * Approve / Reject regularisation (F-ATT-05)
 */
export async function decideRegularizationAction(
  regId: string,
  state: ApprovalState,
  reviewNote?: string
): Promise<AttendanceActionResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const updated = await decideRegularization(actor, regId, state, reviewNote);
    revalidatePath("/attendance");
    revalidatePath("/attendance/requests");
    return { success: true, data: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to review regularisation";
    return { success: false, error: message };
  }
}

/**
 * Apply leave action (F-ATT-06, F-UPD-05)
 */
export async function applyLeaveAction(
  fromIso: string,
  toIso: string,
  type: LeaveType,
  halfDay: boolean = false,
  reason?: string
): Promise<AttendanceActionResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const leave = await applyLeave(actor, {
      from: new Date(fromIso),
      to: new Date(toIso),
      type,
      halfDay,
      reason,
    });

    revalidatePath("/attendance");
    return { success: true, data: leave };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to apply leave";
    return { success: false, error: message };
  }
}

/**
 * Fetch Today Board for Admin / Lead (F-ATT-08)
 */
export async function fetchTodayBoardAction(teamId?: string): Promise<AttendanceActionResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const board = await getTodayAttendanceBoard(actor, teamId);
    return { success: true, data: board };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch today board";
    return { success: false, error: message };
  }
}

/**
 * Remind all users who have NOT checked in today (F-ATT-08)
 * Creates a Notification row for each absent user.
 */
export async function remindNotCheckedInAction(): Promise<AttendanceActionResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { success: false, error: "Unauthorized" };
  }

  // Only ADMIN or LEAD can send attendance reminders
  if (actor.role !== "ADMIN" && actor.role !== "LEAD") {
    return { success: false, error: "Only Leads or Admins can send reminders" };
  }

  try {
    const { default: prisma } = await import("@/lib/db").then(m => ({ default: m.prisma }));
    const { startOfDay } = await import("date-fns");
    const today = startOfDay(new Date());

    // Find users who should be tracked but have no attendance record today
    const usersToTrack = await prisma.user.findMany({
      where: {
        active: true,
        trackAttendance: true,
        role: { not: "GUEST" },
      },
      select: { id: true, name: true },
    });

    const recordsToday = await prisma.attendanceRecord.findMany({
      where: { date: today },
      select: { userId: true },
    });

    const checkedInIds = new Set(recordsToday.map((r: any) => r.userId));
    const absentUsers = usersToTrack.filter((u: any) => !checkedInIds.has(u.id));

    if (absentUsers.length === 0) {
      return { success: true, data: { count: 0 } };
    }

    // Create a notification for each absent user
    await prisma.notification.createMany({
      data: absentUsers.map((u: any) => ({
        userId: u.id,
        type: "attendance",
        title: `Attendance Reminder: Please record your check-in today`,
        body: `Sent by ${actor.name || "Admin"} at ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`,
        url: "/attendance",
      })),
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "UPDATE",
        entity: "Attendance Nudge",
        entityId: "bulk",
        after: { count: absentUsers.length, userIds: absentUsers.map((u: any) => u.id) },
      },
    });

    revalidatePath("/attendance");
    return { success: true, data: { count: absentUsers.length } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send reminders";
    return { success: false, error: message };
  }
}

/**
 * Decide Leave Action (Approve/Reject)
 */
export async function decideLeaveAction(
  leaveId: string,
  state: ApprovalState,
  decisionNote?: string
): Promise<AttendanceActionResult> {
  const actor = await getSessionUser();
  if (!actor) return { success: false, error: "Unauthorized" };

  try {
    const { decideLeave } = await import("@/lib/services/leave");
    const updated = await decideLeave(actor, leaveId, state, decisionNote);
    revalidatePath("/attendance");
    revalidatePath("/attendance/requests");
    revalidatePath("/console");
    return { success: true, data: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to review leave";
    return { success: false, error: message };
  }
}

/**
 * Fetch all pending regularizations and leave requests
 */
export async function fetchPendingRequestsAction(): Promise<AttendanceActionResult> {
  const actor = await getSessionUser();
  if (!actor) return { success: false, error: "Unauthorized" };

  try {
    const { db } = await import("@/lib/db");
    const regs = await db.attendanceRegularization.findMany({
      where: { state: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    const leaves = await db.leave.findMany({
      where: { state: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    const userIds = Array.from(new Set([...regs.map((r) => r.userId), ...leaves.map((l) => l.userId)]));
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, role: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    return {
      success: true,
      data: {
        regs: regs.map((r) => ({
          id: r.id,
          userName: userMap.get(r.userId) || "Team Member",
          date: r.date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
          reqInAt: r.reqInAt ? r.reqInAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "09:00",
          reqOutAt: r.reqOutAt ? r.reqOutAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "18:00",
          reqMode: r.reqMode,
          reason: r.reason,
          status: r.state,
        })),
        leaves: leaves.map((l) => ({
          id: l.id,
          userName: userMap.get(l.userId) || "Team Member",
          type: l.type,
          from: l.from.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
          to: l.to.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
          halfDay: l.halfDay,
          reason: l.reason || "Personal Leave",
          status: l.state,
        })),
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load requests";
    return { success: false, error: message };
  }
}

/**
 * Fetch live breakdown counts for Who's In Today card (F-CON-08)
 */
export async function getWhoIsInTodaySummaryAction(): Promise<AttendanceActionResult> {
  const actor = await getSessionUser();
  if (!actor) return { success: false, error: "Unauthorized" };

  try {
    const board = await getTodayAttendanceBoard(actor);
    const { db } = await import("@/lib/db");
    const [pendingRegs, pendingLeaves] = await Promise.all([
      db.attendanceRegularization.count({ where: { state: "PENDING" } }),
      db.leave.count({ where: { state: "PENDING" } }),
    ]);

    return {
      success: true,
      data: {
        inCount: board.inCount,
        lateCount: board.lateCount,
        remoteCount: board.remoteCount,
        notYetCount: board.notYetCount,
        leaveCount: 0,
        pendingRequestsCount: pendingRegs + pendingLeaves,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load summary";
    return { success: false, error: message };
  }
}


