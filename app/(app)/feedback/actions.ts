"use server";

import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  giveTaskFeedback,
  acknowledgeFeedback,
} from "@/lib/services/feedback";
import { FeedbackOutcome, TaskStatus, FeedbackState } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getPendingFeedbackQueueAction() {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized", data: [] };

  try {
    // Find completed tasks where feedback is empty
    const tasks = await db.task.findMany({
      where: {
        status: TaskStatus.DONE,
        feedback: { none: {} },
        deletedAt: null,
      },
      include: {
        owner: { select: { id: true, name: true } },
        timeLogs: { select: { minutes: true } },
      },
      orderBy: { doneAt: "desc" },
      take: 20,
    });

    const queue = tasks.map((t) => {
      const totalMinutes = t.timeLogs.reduce((acc: number, cur) => acc + (cur.minutes || 0), 0);
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      const actualDuration = totalMinutes > 0 ? `${hours}h ${mins}m` : "45m";

      return {
        id: t.id,
        ref: `T-${t.number}`,
        title: t.title,
        ownerName: t.owner?.name || "Team Member",
        actualDuration,
      };
    });

    return { success: true, data: queue };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load queue", data: [] };
  }
}

export async function getFeedbackSubmissionsAction() {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized", data: [] };

  try {
    const submissions = await db.taskFeedback.findMany({
      include: {
        task: { select: { id: true, number: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const userIds = Array.from(new Set([
      ...submissions.map((s) => s.reviewerId),
      ...submissions.map((s) => s.userId),
    ]));
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const mapped = submissions.map((s) => ({
      id: s.id,
      taskRef: s.task ? `T-${s.task.number}` : "Task",
      taskTitle: s.task ? s.task.title : "Completed Task",
      reviewerName: userMap.get(s.reviewerId) || "Reviewer",
      rating: s.rating,
      comment: s.comment || "",
      chips: s.chips || [],
      outcome: s.outcome as "ACCEPTED" | "REWORK",
      createdAt: s.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      reply: s.reply,
      ackAt: s.ackAt ? s.ackAt.toISOString() : null,
    }));

    return { success: true, data: mapped };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load feedback", data: [] };
  }
}

export async function submitTaskFeedbackAction(params: {
  taskId: string;
  rating: number;
  comment?: string;
  chips?: string[];
  isRework?: boolean;
}) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const feedback = await giveTaskFeedback(user, {
      taskId: params.taskId,
      rating: params.rating,
      comment: params.comment,
      chips: params.chips || [],
      outcome: params.isRework ? FeedbackOutcome.REWORK : FeedbackOutcome.ACCEPTED,
    });

    revalidatePath("/feedback");
    revalidatePath("/feedback/give");
    revalidatePath("/console");
    return { success: true, data: feedback };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to submit feedback" };
  }
}

export async function acknowledgeFeedbackAction(feedbackId: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const updated = await acknowledgeFeedback(user, feedbackId);
    revalidatePath("/feedback");
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to acknowledge feedback" };
  }
}

export async function replyFeedbackAction(feedbackId: string, replyText: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const updated = await acknowledgeFeedback(user, feedbackId, replyText);
    revalidatePath("/feedback");
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to reply to feedback" };
  }
}
