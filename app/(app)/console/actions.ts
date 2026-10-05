"use server";

import { getSessionUser } from "@/lib/auth/session";
import { generateMorningBrief, MorningBriefData } from "@/lib/services/brief";
import { db } from "@/lib/db";
import { ApprovalState, TaskStatus, TaskMode } from "@prisma/client";
import { format } from "date-fns";
import { decideRegularization } from "@/lib/services/attendance";
import { markTaskDone, passTaskTurn, getThreeLists } from "@/lib/services/task";
import { logAudit } from "@/lib/services/audit";
import { revalidatePath } from "next/cache";

export async function getMorningBriefAction(): Promise<{ success: boolean; data?: MorningBriefData; error?: string }> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const brief = await generateMorningBrief(user);
    return { success: true, data: brief };
  } catch (error) {
    return { success: false, error: "Failed to generate morning brief" };
  }
}

export async function getConsoleMetaAction() {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const inboxCount = await db.request.count({
      where: { toUserId: user.id, state: "NEW" },
    });

    return {
      success: true,
      data: {
        userId: user.id,
        userName: user.name,
        role: user.role,
        inboxCount,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load meta" };
  }
}

export async function getConsoleTasksAction() {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const lists = await getThreeLists(user.id);
    return { success: true, data: lists };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load tasks" };
  }
}

export async function updateConsoleTaskStatusAction(taskId: string, status: TaskStatus) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    if (status === TaskStatus.DONE) {
      await markTaskDone(user, taskId);
    } else {
      await db.task.update({
        where: { id: taskId },
        data: { status, doneAt: null, doneById: null, lastActivityAt: new Date() },
      });
      await logAudit(db, {
        actorId: user.id,
        action: "TASK_RESTORED",
        entity: "Task",
        entityId: taskId,
      });
    }
    revalidatePath("/console");
    revalidatePath("/my");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update task status" };
  }
}

export async function passConsoleTaskTurnAction(taskId: string, partnerId?: string, note?: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const task = await db.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error("Task not found");

    const targetUser = partnerId || (task.turnUserId === user.id ? (task.ownerId === user.id ? task.partnerId : task.ownerId) : user.id);
    if (!targetUser) throw new Error("No partner assigned to pass turn to");

    await passTaskTurn(user, taskId, targetUser, note);
    revalidatePath("/console");
    revalidatePath("/my");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to pass turn" };
  }
}

export async function getPendingApprovalsAction() {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    // 1. Regularization requests awaiting approval
    const regularizations = await db.attendanceRegularization.findMany({
      where: { state: ApprovalState.PENDING },
      orderBy: { createdAt: "desc" },
    });

    const userIds = [...new Set(regularizations.map((r) => r.userId))];
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, role: true, isSenior: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const regItems = regularizations.map((reg) => {
      const u = userMap.get(reg.userId);
      const inStr = reg.reqInAt ? format(reg.reqInAt, "HH:mm") : "—";
      const outStr = reg.reqOutAt ? format(reg.reqOutAt, "HH:mm") : "—";
      return {
        id: reg.id,
        kind: "ATTENDANCE" as const,
        targetName: u?.name || "Employee",
        targetRole: u?.role || "Staff",
        isSenior: u?.isSenior || false,
        taskTitle: `Attendance Regularization (${format(reg.date, "dd MMM")})`,
        draftText: `Requested Punch: ${inStr} - ${outStr}. Reason: "${reg.reason}"`,
        cadence: "Attendance",
        createdAt: format(reg.createdAt, "dd MMM"),
      };
    });

    // 2. Follow-ups awaiting approval
    const followups = await db.followUp.findMany({
      where: { needsApproval: true, status: "ACTIVE" },
      include: { task: true },
      orderBy: { createdAt: "desc" },
    });

    const fuTargetIds = [...new Set(followups.map((f) => f.targetId))];
    const fuUsers = await db.user.findMany({
      where: { id: { in: fuTargetIds } },
      select: { id: true, name: true, role: true, isSenior: true },
    });
    const fuUserMap = new Map(fuUsers.map((u) => [u.id, u]));

    const fuItems = followups.map((fu) => {
      const u = fuUserMap.get(fu.targetId);
      return {
        id: fu.id,
        kind: "FOLLOWUP" as const,
        targetName: u?.name || "Recipient",
        targetRole: u?.role || "Staff",
        isSenior: u?.isSenior || false,
        taskTitle: fu.task?.title || "Task Follow-up",
        draftText: fu.draftText || "Automated check-in on this task.",
        cadence: String(fu.cadence),
        createdAt: format(fu.createdAt, "dd MMM"),
      };
    });

    return { success: true, items: [...regItems, ...fuItems] };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load pending approvals", items: [] };
  }
}

export async function approveApprovalAction(id: string, text?: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const reg = await db.attendanceRegularization.findUnique({ where: { id } });
    if (reg) {
      await decideRegularization(user, id, ApprovalState.APPROVED, text);
      revalidatePath("/console");
      revalidatePath("/attendance");
      return { success: true };
    }

    const fu = await db.followUp.findUnique({ where: { id } });
    if (fu) {
      await db.followUp.update({
        where: { id },
        data: {
          needsApproval: false,
          draftText: text || fu.draftText,
          lastSentAt: new Date(),
          sentCount: { increment: 1 },
        },
      });
      await logAudit(db, {
        actorId: user.id,
        action: "FOLLOWUP_APPROVED",
        entity: "FollowUp",
        entityId: id,
      });
      revalidatePath("/console");
      return { success: true };
    }

    return { success: false, error: "Approval item not found" };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to approve item" };
  }
}

export async function rejectApprovalAction(id: string, reason?: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const reg = await db.attendanceRegularization.findUnique({ where: { id } });
    if (reg) {
      await decideRegularization(user, id, ApprovalState.REJECTED, reason);
      revalidatePath("/console");
      revalidatePath("/attendance");
      return { success: true };
    }

    const fu = await db.followUp.findUnique({ where: { id } });
    if (fu) {
      await db.followUp.update({
        where: { id },
        data: {
          needsApproval: false,
          status: "PAUSED",
        },
      });
      await logAudit(db, {
        actorId: user.id,
        action: "FOLLOWUP_REJECTED",
        entity: "FollowUp",
        entityId: id,
      });
      revalidatePath("/console");
      return { success: true };
    }

    return { success: false, error: "Approval item not found" };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to reject item" };
  }
}
