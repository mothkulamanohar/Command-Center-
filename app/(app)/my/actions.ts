"use server";

import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { TaskStatus, TaskMode, Priority } from "@prisma/client";
import { startOfDay, endOfDay, format } from "date-fns";
import { getDailyUpdatePrefill, postDailyUpdate } from "@/lib/services/update";
import { markTaskDone, passTaskTurn } from "@/lib/services/task";
import { logAudit } from "@/lib/services/audit";
import { revalidatePath } from "next/cache";

export async function getMySpaceDataAction() {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // 1. User's open tasks + recently completed tasks
    const tasks = await db.task.findMany({
      where: {
        deletedAt: null,
        OR: [
          { ownerId: user.id },
          { turnUserId: user.id },
          { partnerId: user.id },
        ],
      },
      include: {
        owner: { select: { id: true, name: true } },
      },
      orderBy: [{ dueAt: "asc" }, { priority: "desc" }],
    });

    const partnerIds = tasks.map((t) => t.partnerId).filter((id): id is string => Boolean(id));
    const partners = await db.user.findMany({
      where: { id: { in: partnerIds } },
      select: { id: true, name: true },
    });
    const partnerMap = new Map(partners.map((p) => [p.id, p.name]));

    const mappedTasks = tasks.map((t) => {
      const isDone = t.status === TaskStatus.DONE;
      let dueText = "Due soon";
      if (t.dueAt) {
        const due = new Date(t.dueAt);
        const now = new Date();
        if (due.toDateString() === now.toDateString()) {
          dueText = "Today 18:00";
        } else {
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          if (due.toDateString() === tomorrow.toDateString()) {
            dueText = "Tomorrow 18:00";
          } else {
            dueText = due.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + " 18:00";
          }
        }
      }

      const isShared = t.mode === TaskMode.SHARED || Boolean(t.partnerId);
      const whoseTurn = isShared ? (t.turnUserId === user.id ? ("ME" as const) : ("PARTNER" as const)) : undefined;
      const partnerName = isShared
        ? (t.partnerId ? partnerMap.get(t.partnerId) : (t.ownerId !== user.id ? t.owner?.name : "Partner"))
        : undefined;

      return {
        id: t.id,
        ref: `T-${t.number}`,
        title: t.title,
        dueText,
        partner: partnerName,
        whoseTurn,
        priority: (t.priority as any) || "HIGH",
        status: isDone ? ("DONE" as const) : ("OPEN" as const),
      };
    });

    // 2. Real follow-ups where current user is the target, oldest first (SPEC Item 18)
    const followups = await db.followUp.findMany({
      where: {
        targetId: user.id,
        status: "ACTIVE",
      },
      include: {
        task: { select: { id: true, title: true, number: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Fetch onBehalfOf users
    const onBehalfIds = [...new Set(followups.map((f) => f.onBehalfOfId))];
    const authors = await db.user.findMany({
      where: { id: { in: onBehalfIds } },
      select: { id: true, name: true },
    });
    const authorMap = new Map(authors.map((a) => [a.id, a.name]));

    const mappedFollowups = followups.map((fu) => ({
      id: fu.id,
      fromName: authorMap.get(fu.onBehalfOfId) || "Sri",
      cadence: String(fu.cadence),
      lastNudge: fu.lastSentAt ? format(fu.lastSentAt, "HH:mm") : format(fu.createdAt, "HH:mm"),
      taskTitle: fu.task ? `T-${fu.task.number}: ${fu.task.title}` : "Task Follow-up",
      answered: fu.unansweredCount === 0 && fu.sentCount > 0 && !fu.needsApproval,
    }));

    // 3. Pre-fill for daily update (Item 21)
    const prefill = await getDailyUpdatePrefill(user.id);

    // 4. Check if today's daily update already posted (Item 9)
    const existingUpdate = await db.dailyUpdate.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: todayStart,
        },
      },
    });

    // 5. Today's schedule (Item 17)
    const events = await db.event.findMany({
      where: {
        startAt: { gte: todayStart, lte: todayEnd },
        OR: [{ ownerId: user.id }, { attendees: { some: { userId: user.id } } }],
      },
      orderBy: { startAt: "asc" },
    });

    const openTasksToday = await db.task.findMany({
      where: {
        ownerId: user.id,
        status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
        dueAt: { gte: todayStart, lte: todayEnd },
      },
    });

    const scheduleSlots: Array<{ time: string; title: string; kind: "MEETING" | "TASK" | "TODO"; timestamp: number }> = [];

    for (const ev of events) {
      scheduleSlots.push({
        time: `${format(ev.startAt, "HH:mm")} – ${format(ev.endAt, "HH:mm")}`,
        title: ev.title,
        kind: "MEETING",
        timestamp: ev.startAt.getTime(),
      });
    }

    let unscheduledTasksCount = 0;
    for (const t of openTasksToday) {
      if (t.startAt) {
        const end = t.dueAt || new Date(t.startAt.getTime() + 3600000);
        scheduleSlots.push({
          time: `${format(t.startAt, "HH:mm")} – ${format(end, "HH:mm")}`,
          title: `T-${t.number}: ${t.title}`,
          kind: "TASK",
          timestamp: t.startAt.getTime(),
        });
      } else {
        unscheduledTasksCount++;
      }
    }

    scheduleSlots.sort((a, b) => a.timestamp - b.timestamp);

    return {
      success: true,
      data: {
        tasks: mappedTasks,
        followups: mappedFollowups,
        prefill,
        isUpdatePosted: Boolean(existingUpdate),
        schedule: {
          slots: scheduleSlots.map((s) => ({ time: s.time, title: s.title, kind: s.kind })),
          unscheduledCount: unscheduledTasksCount,
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load My Space data" };
  }
}

export async function postMyDailyUpdateAction(input: { done: string; next: string; blockers?: string }) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    await postDailyUpdate(user, input);
    revalidatePath("/my");
    revalidatePath("/console");
    revalidatePath("/chat");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to post daily update" };
  }
}

export async function markMyTaskDoneAction(taskId: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const existing = await db.task.findUnique({ where: { id: taskId } });
    if (!existing) throw new Error("Task not found");

    if (existing.status === TaskStatus.DONE) {
      await db.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.IN_PROGRESS, doneAt: null, doneById: null, lastActivityAt: new Date() },
      });
      await logAudit(db, {
        actorId: user.id,
        action: "TASK_RESTORED",
        entity: "Task",
        entityId: taskId,
      });
      revalidatePath("/my");
      revalidatePath("/console");
      return { success: true, status: TaskStatus.IN_PROGRESS };
    } else {
      await markTaskDone(user, taskId);
      revalidatePath("/my");
      revalidatePath("/console");
      return { success: true, status: TaskStatus.DONE };
    }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update task" };
  }
}

export async function passMyTaskTurnAction(taskId: string, note?: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const task = await db.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error("Task not found");

    const targetUser = task.turnUserId === user.id
      ? (task.ownerId === user.id ? task.partnerId : task.ownerId)
      : user.id;

    if (!targetUser) throw new Error("No partner assigned to pass turn to");

    await passTaskTurn(user, taskId, targetUser, note);
    revalidatePath("/my");
    revalidatePath("/console");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to pass turn" };
  }
}

export async function replyMyFollowUpAction(fuId: string, reply: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const fu = await db.followUp.findUnique({ where: { id: fuId } });
    if (!fu) throw new Error("Follow-up not found");

    await db.$transaction(async (tx) => {
      await tx.taskComment.create({
        data: {
          taskId: fu.taskId,
          authorId: user.id,
          kind: "REPLY",
          body: { text: `Follow-up Reply: ${reply}` },
        },
      });

      await tx.followUp.update({
        where: { id: fuId },
        data: {
          unansweredCount: 0,
          lastSentAt: new Date(),
        },
      });

      await logAudit(tx, {
        actorId: user.id,
        action: "FOLLOWUP_REPLIED",
        entity: "FollowUp",
        entityId: fuId,
        after: { reply },
      });
    });

    revalidatePath("/my");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to reply to follow-up" };
  }
}
