import { z } from "zod";
import { db } from "@/lib/db";
import { can, UserContext } from "@/lib/auth/can";
import { logAudit } from "@/lib/services/audit";
import { FeedbackOutcome, FeedbackState, TaskStatus, Prisma } from "@prisma/client";
import { emitToUser } from "@/lib/socket";

export const GiveFeedbackSchema = z.object({
  taskId: z.string(),
  rating: z.number().int().min(1).max(5),
  quality: z.number().int().min(1).max(5).optional(),
  timeliness: z.number().int().min(1).max(5).optional(),
  communication: z.number().int().min(1).max(5).optional(),
  chips: z.array(z.string()).default([]),
  comment: z.string().max(1000).optional(),
  outcome: z.nativeEnum(FeedbackOutcome).default(FeedbackOutcome.ACCEPTED),
}).refine(
  (data) => {
    // Comment is required if overall rating <= 2 or outcome is REWORK
    if (data.rating <= 2 || data.outcome === FeedbackOutcome.REWORK) {
      return !!data.comment && data.comment.trim().length > 0;
    }
    return true;
  },
  {
    message: "Comment is required when rating is 2 stars or less, or when requesting rework.",
    path: ["comment"],
  }
);

/**
 * F-FB-01..03: Submit feedback on completed task
 */
export async function giveTaskFeedback(actor: UserContext, input: z.input<typeof GiveFeedbackSchema>) {
  if (!can(actor, "give_feedback")) {
    throw new Error("Unauthorized to give task feedback");
  }

  const data = GiveFeedbackSchema.parse(input);
  const task = await db.task.findUnique({
    where: { id: data.taskId },
    include: { owner: true },
  });
  if (!task) throw new Error("Task not found");

  const now = new Date();
  const lockedAt = new Date(now.getTime() + 24 * 3600 * 1000); // 24 hours lock

  return await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const feedback = await tx.taskFeedback.create({
      data: {
        taskId: data.taskId,
        userId: task.ownerId,
        reviewerId: actor.id,
        rating: data.rating,
        quality: data.quality,
        timeliness: data.timeliness,
        communication: data.communication,
        chips: data.chips,
        comment: data.comment,
        outcome: data.outcome,
        lockedAt,
      },
    });

    if (data.outcome === FeedbackOutcome.REWORK) {
      // Reopen task to TODO with rework comment
      await tx.task.update({
        where: { id: data.taskId },
        data: {
          status: TaskStatus.TODO,
          feedbackState: FeedbackState.REWORK,
          reopenCount: { increment: 1 },
          lastActivityAt: now,
        },
      });

      await tx.taskComment.create({
        data: {
          taskId: data.taskId,
          authorId: actor.id,
          kind: "FEEDBACK",
          body: {
            text: `Rework requested: ${data.comment}`,
            rating: data.rating,
          },
        },
      });
    } else {
      await tx.task.update({
        where: { id: data.taskId },
        data: {
          feedbackState: FeedbackState.GIVEN,
          lastActivityAt: now,
        },
      });
    }

    await logAudit(tx, {
      actorId: actor.id,
      action: "GIVE_FEEDBACK",
      entity: "TaskFeedback",
      entityId: feedback.id,
      after: { taskId: data.taskId, rating: data.rating, outcome: data.outcome },
    });

    // Notify task owner
    const starString = "★".repeat(data.rating) + "☆".repeat(5 - data.rating);
    emitToUser(task.ownerId, "feedback:new", {
      taskId: task.id,
      feedbackId: feedback.id,
      rating: data.rating,
      outcome: data.outcome,
      message: `${actor.name || "Admin"} gave feedback on T-${task.number}: ${starString}`,
    });

    return feedback;
  });
}

/**
 * F-FB-05: Acknowledge & reply to feedback
 */
export async function acknowledgeFeedback(
  actor: UserContext,
  feedbackId: string,
  reply?: string
) {
  const fb = await db.taskFeedback.findUnique({
    where: { id: feedbackId },
    include: { task: true },
  });
  if (!fb) throw new Error("Feedback record not found");

  if (!can(actor, "reply_feedback", { targetUserId: fb.userId })) {
    throw new Error("Unauthorized to acknowledge this feedback");
  }

  const updated = await db.taskFeedback.update({
    where: { id: feedbackId },
    data: {
      ackAt: new Date(),
      reply: reply?.slice(0, 500) || null,
    },
  });

  emitToUser(fb.reviewerId, "feedback:acknowledged", {
    feedbackId,
    taskId: fb.taskId,
    reply: updated.reply,
  });

  return updated;
}

/**
 * F-FB-01: Feedback queue (Admin / Leads)
 */
export async function getFeedbackQueue(actor: UserContext) {
  if (!can(actor, "give_feedback")) {
    return [];
  }

  return await db.task.findMany({
    where: {
      status: TaskStatus.DONE,
      feedbackState: FeedbackState.PENDING,
      deletedAt: null,
      mode: "SOLO",
    },
    include: {
      owner: { select: { id: true, name: true, role: true, avatarUrl: true } },
      timeLogs: { select: { minutes: true } },
    },
    orderBy: { doneAt: "asc" },
  });
}

/**
 * F-FB-06: Feedback received by a user
 */
export async function getUserFeedbackSummary(actor: UserContext, targetUserId: string) {
  if (!can(actor, "view_feedback", { targetUserId })) {
    throw new Error("Unauthorized to view feedback");
  }

  const list = await db.taskFeedback.findMany({
    where: { userId: targetUserId },
    include: {
      task: { select: { id: true, number: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const total = list.length;
  const avgRating = total > 0
    ? Number((list.reduce((acc, f) => acc + f.rating, 0) / total).toFixed(1))
    : 0;
  const reworkCount = list.filter((f) => f.outcome === FeedbackOutcome.REWORK).length;
  const reworkRate = total > 0 ? Number(((reworkCount / total) * 100).toFixed(1)) : 0;

  // Tally chips
  const chipCounts: Record<string, number> = {};
  list.forEach((f) => {
    f.chips.forEach((c) => {
      chipCounts[c] = (chipCounts[c] || 0) + 1;
    });
  });

  return {
    items: list,
    total,
    avgRating,
    reworkCount,
    reworkRate,
    topChips: Object.entries(chipCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([chip, count]) => ({ chip, count })),
  };
}
