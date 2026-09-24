import { z } from "zod";
import { db } from "@/lib/db";
import { can, UserContext } from "@/lib/auth/can";
import { logAudit } from "@/lib/services/audit";
import { FUCadence, FUStatus } from "@prisma/client";
import { emitToUser } from "@/lib/socket";

export const CreateFollowUpSchema = z.object({
  taskId: z.string(),
  targetId: z.string(),
  cadence: z.nativeEnum(FUCadence).default(FUCadence.DAILY),
  everyNDays: z.number().int().positive().optional(),
  template: z.enum(["GENTLE", "NORMAL", "FIRM"]).default("GENTLE"),
  customText: z.string().optional(),
  needsApproval: z.boolean().optional(),
  escalateAfter: z.number().int().default(2),
  maxSends: z.number().int().default(10),
  firstRunAt: z.date().optional(),
});

export function generateFollowUpText(params: {
  template: string;
  targetName: string;
  taskTitle: string;
  dueDateStr?: string;
  overdueDays?: number;
  senderName: string;
  honorific?: string | null;
}): string {
  const { template, targetName, taskTitle, dueDateStr, overdueDays, senderName, honorific } = params;
  const greeting = honorific ? `Dear ${honorific} ${targetName}` : `Hi ${targetName}`;

  if (template === "FIRM" && (overdueDays ?? 0) > 0) {
    return `${greeting}, "${taskTitle}" is now ${overdueDays} days overdue. Please update today or let us know what is blocking it. — sent for ${senderName}`;
  }

  if (template === "NORMAL") {
    return `${greeting}, "${taskTitle}" is due ${dueDateStr || "soon"}. Please share the current status or a new target date. — sent for ${senderName}`;
  }

  // GENTLE default
  return `${greeting}, a quick check on "${taskTitle}" (due ${dueDateStr || "soon"}). Any update? — sent for ${senderName}`;
}

/**
 * F-FU-01: Create a follow-up for a task
 */
export async function createFollowUp(
  actor: UserContext,
  input: z.infer<typeof CreateFollowUpSchema>
) {
  if (!can(actor, "create_followup")) {
    throw new Error("Unauthorized to create follow-ups");
  }

  const data = CreateFollowUpSchema.parse(input);

  const [task, targetUser, actorUser] = await Promise.all([
    db.task.findUniqueOrThrow({ where: { id: data.taskId } }),
    db.user.findUniqueOrThrow({ where: { id: data.targetId } }),
    db.user.findUnique({ where: { id: actor.id } }),
  ]);

  const actorName = actorUser?.name || "Sri";

  // SPEC F-FU-05: Senior people always require approval
  const needsApproval = data.needsApproval ?? targetUser.isSenior;

  // Calculate first run at 09:30 next morning if not specified
  const nextRunAt = data.firstRunAt || new Date(Date.now() + 1000 * 60 * 60 * 24);

  const initialStatus = needsApproval ? FUStatus.WAITING_APPROVAL : FUStatus.ACTIVE;

  const draftText = generateFollowUpText({
    template: data.template,
    targetName: targetUser.name,
    taskTitle: task.title,
    dueDateStr: task.dueAt ? task.dueAt.toLocaleDateString("en-IN") : undefined,
    senderName: actorName,
    honorific: targetUser.honorific,
  });

  const followUp = await db.followUp.create({
    data: {
      taskId: data.taskId,
      targetId: data.targetId,
      onBehalfOfId: actor.id,
      cadence: data.cadence,
      everyNDays: data.everyNDays,
      template: data.template,
      customText: data.customText,
      needsApproval,
      status: initialStatus,
      nextRunAt,
      escalateAfter: data.escalateAfter,
      maxSends: data.maxSends,
      draftText,
    },
  });

  await logAudit(db, {
    actorId: actor.id,
    action: "FU_CREATE",
    entity: "FollowUp",
    entityId: followUp.id,
    after: {
      taskId: task.id,
      targetId: targetUser.id,
      needsApproval,
      cadence: data.cadence,
    },
  });

  return followUp;
}

/**
 * F-FU-05: Approve & Send a follow-up waiting approval
 */
export async function approveFollowUp(actor: UserContext, followUpId: string, editedText?: string) {
  if (actor.role !== "ADMIN" && actor.role !== "LEAD") {
    throw new Error("Unauthorized to approve follow-ups");
  }

  const [fu, actorUser] = await Promise.all([
    db.followUp.findUniqueOrThrow({
      where: { id: followUpId },
      include: { task: true },
    }),
    db.user.findUnique({ where: { id: actor.id } }),
  ]);

  const actorName = actorUser?.name || "Sri";
  const body = editedText || fu.draftText || `Follow-up check on task ${fu.task.title}`;

  return await db.$transaction(async (tx) => {
    // 1. Post DM notification from Assistant to target
    await tx.taskComment.create({
      data: {
        taskId: fu.taskId,
        authorId: null, // Assistant
        kind: "FOLLOWUP",
        body: {
          text: body,
          sentOnBehalfOf: actorName,
          quickReplies: ["DONE", "NEW_DATE", "BLOCKED"],
        },
      },
    });

    // 2. Calculate next run time
    const nextRun = calculateNextRun(fu.cadence, fu.everyNDays);

    const updated = await tx.followUp.update({
      where: { id: fu.id },
      data: {
        status: FUStatus.ACTIVE,
        sentCount: { increment: 1 },
        unansweredCount: { increment: 1 },
        lastSentAt: new Date(),
        nextRunAt: nextRun,
      },
    });

    // 3. Emit real-time ping to target user
    emitToUser(fu.targetId, "followup:received", {
      followUpId: fu.id,
      taskId: fu.taskId,
      text: body,
    });

    await logAudit(tx, {
      actorId: actor.id,
      action: "FU_APPROVE",
      entity: "FollowUp",
      entityId: fu.id,
      after: { sentTo: fu.targetId },
    });

    return updated;
  });
}

/**
 * F-FU-04: Handle quick reply from target user
 */
export async function handleFollowUpReply(
  actor: UserContext,
  followUpId: string,
  replyType: "DONE" | "NEW_DATE" | "BLOCKED" | "TEXT",
  details?: { newDate?: Date; blockedReason?: string; text?: string }
) {
  const fu = await db.followUp.findUniqueOrThrow({
    where: { id: followUpId },
    include: { task: true },
  });

  if (fu.targetId !== actor.id && actor.role !== "ADMIN") {
    throw new Error("Only the target user can reply to this follow-up");
  }

  return await db.$transaction(async (tx) => {
    if (replyType === "DONE") {
      // Mark task as done
      await tx.task.update({
        where: { id: fu.taskId },
        data: {
          status: "DONE",
          doneAt: new Date(),
          doneById: actor.id,
        },
      });

      // Stop follow-up
      await tx.followUp.update({
        where: { id: fu.id },
        data: { status: FUStatus.COMPLETED, unansweredCount: 0 },
      });
    } else if (replyType === "NEW_DATE" && details?.newDate) {
      await tx.task.update({
        where: { id: fu.taskId },
        data: { dueAt: details.newDate },
      });
      // Reset unanswered count and reschedule
      await tx.followUp.update({
        where: { id: fu.id },
        data: {
          unansweredCount: 0,
          nextRunAt: calculateNextRun(fu.cadence, fu.everyNDays),
        },
      });
    } else if (replyType === "BLOCKED" && details?.blockedReason) {
      await tx.task.update({
        where: { id: fu.taskId },
        data: {
          status: "BLOCKED",
          blockedReason: details.blockedReason,
        },
      });
      // Pause follow-up until unblocked
      await tx.followUp.update({
        where: { id: fu.id },
        data: { status: FUStatus.PAUSED },
      });
      // Alert sender that task is blocked
      emitToUser(fu.onBehalfOfId, "task:blocked", {
        taskId: fu.taskId,
        reason: details.blockedReason,
      });
    } else {
      // Generic text reply
      await tx.followUp.update({
        where: { id: fu.id },
        data: {
          unansweredCount: 0,
          nextRunAt: calculateNextRun(fu.cadence, fu.everyNDays),
        },
      });
    }

    // Add activity comment
    await tx.taskComment.create({
      data: {
        taskId: fu.taskId,
        authorId: actor.id,
        kind: "REPLY",
        body: {
          replyType,
          details: details ?? {},
        },
      },
    });

    await logAudit(tx, {
      actorId: actor.id,
      action: "FU_REPLY",
      entity: "FollowUp",
      entityId: fu.id,
      after: { replyType },
    });

    return { success: true, replyType };
  });
}

/**
 * F-FU-06: Escalation check
 */
export async function checkEscalation(followUpId: string) {
  const fu = await db.followUp.findUniqueOrThrow({
    where: { id: followUpId },
    include: { task: { include: { team: true } } },
  });

  if (fu.unansweredCount >= fu.escalateAfter && fu.escalatedLevel === 0) {
    // Level 1: Escalate to Team Lead
    await db.followUp.update({
      where: { id: fu.id },
      data: { escalatedLevel: 1 },
    });

    if (fu.task.team?.leadId) {
      emitToUser(fu.task.team.leadId, "escalation:alert", {
        level: 1,
        taskId: fu.taskId,
        unansweredCount: fu.unansweredCount,
      });
    }
  } else if (fu.unansweredCount > fu.escalateAfter && fu.escalatedLevel === 1) {
    // Level 2: Escalate to Admin (Sri)
    await db.followUp.update({
      where: { id: fu.id },
      data: { escalatedLevel: 2 },
    });

    emitToUser(fu.onBehalfOfId, "escalation:alert", {
      level: 2,
      taskId: fu.taskId,
      unansweredCount: fu.unansweredCount,
    });
  }
}

/**
 * Calculate next run time based on cadence
 */
export function calculateNextRun(cadence: FUCadence, everyNDays?: number | null): Date {
  const now = new Date();
  const next = new Date(now);

  switch (cadence) {
    case FUCadence.ONCE:
      next.setDate(next.getDate() + 1);
      break;
    case FUCadence.DAILY:
      next.setDate(next.getDate() + 1);
      break;
    case FUCadence.EVERY_N_DAYS:
      next.setDate(next.getDate() + (everyNDays ?? 2));
      break;
    case FUCadence.WEEKLY:
      next.setDate(next.getDate() + 7);
      break;
    default:
      next.setDate(next.getDate() + 1);
      break;
  }

  // Default to 09:30 IST (04:00 UTC)
  next.setUTCHours(4, 0, 0, 0);
  return next;
}
