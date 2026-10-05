import { z } from "zod";
import { db } from "@/lib/db";
import { can, UserContext } from "@/lib/auth/can";
import { logAudit } from "@/lib/services/audit";
import { TaskStatus, TimeLogSource, Prisma } from "@prisma/client";
import { emitToUser } from "@/lib/socket";
import { startOfWeek, endOfWeek, addDays, format } from "date-fns";

export const ManualTimeLogSchema = z.object({
  taskId: z.string(),
  date: z.date().default(() => new Date()),
  minutes: z.number().int().min(1).max(1440),
  note: z.string().optional(),
});

/**
 * F-DUR-03: Start timer on a task.
 * Enforces one running timer per user.
 */
export async function startTimer(actor: UserContext, taskId: string) {
  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");

  if (!can(actor, "manage_timelog", { ownerId: task.ownerId })) {
    throw new Error("Unauthorized to track time on this task");
  }

  const now = new Date();

  return await db.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Stop any currently running timer for this user
    const existingRunning = await tx.timeLog.findFirst({
      where: { userId: actor.id, endedAt: null },
      include: { task: true },
    });

    if (existingRunning) {
      const elapsed = Math.max(1, Math.round((now.getTime() - existingRunning.startedAt.getTime()) / 60000));
      await tx.timeLog.update({
        where: { id: existingRunning.id },
        data: { endedAt: now, minutes: elapsed },
      });

      // Recalculate actualMinutes on the previously tracked task
      const allPrevLogs = await tx.timeLog.findMany({
        where: { taskId: existingRunning.taskId, endedAt: { not: null } },
        select: { minutes: true },
      });
      const prevTotal = allPrevLogs.reduce((acc, l) => acc + (l.minutes || 0), 0);
      await tx.task.update({
        where: { id: existingRunning.taskId },
        data: { actualMinutes: prevTotal },
      });
    }

    // 2. Start new TimeLog
    const log = await tx.timeLog.create({
      data: {
        taskId,
        userId: actor.id,
        startedAt: now,
        source: TimeLogSource.TIMER,
      },
    });

    // 3. Move task to IN_PROGRESS if TODO, set workStartedAt if null
    const updates: Prisma.TaskUpdateInput = {
      lastActivityAt: now,
    };
    if (!task.workStartedAt) {
      updates.workStartedAt = now;
    }
    if (task.status === TaskStatus.TODO) {
      updates.status = TaskStatus.IN_PROGRESS;
    }

    await tx.task.update({
      where: { id: taskId },
      data: updates,
    });

    emitToUser(actor.id, "timer:changed", {
      taskId,
      running: true,
      logId: log.id,
      startedAt: now.toISOString(),
      taskTitle: task.title,
      taskNumber: task.number,
    });

    return log;
  });
}

/**
 * F-DUR-03: Stop timer
 */
export async function stopTimer(actor: UserContext, taskId?: string) {
  const whereClause: Prisma.TimeLogWhereInput = {
    userId: actor.id,
    endedAt: null,
  };
  if (taskId) {
    whereClause.taskId = taskId;
  }

  const running = await db.timeLog.findFirst({
    where: whereClause,
    include: { task: true },
  });
  if (!running) return null;

  const now = new Date();
  const minutes = Math.max(1, Math.round((now.getTime() - running.startedAt.getTime()) / 60000));

  return await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const updatedLog = await tx.timeLog.update({
      where: { id: running.id },
      data: { endedAt: now, minutes },
    });

    const allLogs = await tx.timeLog.findMany({
      where: { taskId: running.taskId, endedAt: { not: null } },
      select: { minutes: true },
    });
    const totalMinutes = allLogs.reduce((acc, l) => acc + (l.minutes || 0), 0);

    await tx.task.update({
      where: { id: running.taskId },
      data: { actualMinutes: totalMinutes, lastActivityAt: now },
    });

    emitToUser(actor.id, "timer:changed", {
      taskId: running.taskId,
      running: false,
      logId: running.id,
      minutes,
    });

    return updatedLog;
  });
}

/**
 * F-DUR-05: Manual time log
 */
export async function logManualTime(actor: UserContext, input: z.input<typeof ManualTimeLogSchema>) {
  const data = ManualTimeLogSchema.parse(input);
  const task = await db.task.findUnique({ where: { id: data.taskId } });
  if (!task) throw new Error("Task not found");

  if (!can(actor, "manage_timelog", { ownerId: task.ownerId })) {
    throw new Error("Unauthorized to log time on this task");
  }

  const startedAt = new Date(data.date);
  const endedAt = new Date(startedAt.getTime() + data.minutes * 60000);

  return await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const log = await tx.timeLog.create({
      data: {
        taskId: data.taskId,
        userId: actor.id,
        startedAt,
        endedAt,
        minutes: data.minutes,
        note: data.note,
        source: TimeLogSource.MANUAL,
      },
    });

    const allLogs = await tx.timeLog.findMany({
      where: { taskId: data.taskId, endedAt: { not: null } },
      select: { minutes: true },
    });
    const totalMinutes = allLogs.reduce((acc, l) => acc + (l.minutes || 0), 0);

    await tx.task.update({
      where: { id: data.taskId },
      data: { actualMinutes: totalMinutes, lastActivityAt: new Date() },
    });

    await tx.taskComment.create({
      data: {
        taskId: data.taskId,
        authorId: actor.id,
        kind: "TIMELOG",
        body: {
          minutes: data.minutes,
          note: data.note || null,
          text: `Logged ${Math.floor(data.minutes / 60)}h ${data.minutes % 60}m`,
        },
      },
    });

    await logAudit(tx, {
      actorId: actor.id,
      action: "LOG_TIME",
      entity: "TimeLog",
      entityId: log.id,
      after: { taskId: data.taskId, minutes: data.minutes },
    });

    return log;
  });
}

/**
 * Returns currently active running timer for user
 */
export async function getRunningTimer(userId: string) {
  return await db.timeLog.findFirst({
    where: { userId, endedAt: null },
    include: {
      task: {
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          estimateHours: true,
          actualMinutes: true,
        },
      },
    },
  });
}

/**
 * F-DUR-07: Get user timesheet for a week
 */
export async function getUserTimesheet(userId: string, weekDate = new Date()) {
  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });

  const logs = await db.timeLog.findMany({
    where: {
      userId,
      startedAt: { gte: weekStart, lte: weekEnd },
      endedAt: { not: null },
    },
    include: {
      task: {
        select: { id: true, number: true, title: true, estimateHours: true },
      },
    },
    orderBy: { startedAt: "asc" },
  });

  // Organize by Task ID and Day (0 = Mon .. 5 = Sat)
  const taskMap = new Map<string, {
    task: { id: string; number: number; title: string; estimateHours: number | null };
    days: number[]; // 6 slots: Mon to Sat
    totalMinutes: number;
  }>();

  for (const log of logs) {
    if (!taskMap.has(log.taskId)) {
      taskMap.set(log.taskId, {
        task: log.task,
        days: [0, 0, 0, 0, 0, 0],
        totalMinutes: 0,
      });
    }
    const item = taskMap.get(log.taskId)!;
    const dayIndex = Math.min(5, Math.max(0, Math.floor((log.startedAt.getTime() - weekStart.getTime()) / (86400000))));
    const mins = log.minutes || 0;
    item.days[dayIndex] += mins;
    item.totalMinutes += mins;
  }

  const daysTotals = [0, 0, 0, 0, 0, 0];
  taskMap.forEach((entry) => {
    entry.days.forEach((mins, idx) => {
      daysTotals[idx] += mins;
    });
  });

  return {
    weekStart,
    weekEnd,
    rows: Array.from(taskMap.values()),
    daysTotals,
    grandTotalMinutes: daysTotals.reduce((a, b) => a + b, 0),
  };
}

/**
 * F-DUR-04: Auto-stop running timers at 18:30
 */
export async function autoStopRunningTimers() {
  const running = await db.timeLog.findMany({
    where: { endedAt: null },
    include: { task: true },
  });

  const now = new Date();
  const stopped: string[] = [];

  for (const timer of running) {
    const minutes = Math.max(1, Math.round((now.getTime() - timer.startedAt.getTime()) / 60000));
    await db.timeLog.update({
      where: { id: timer.id },
      data: { endedAt: now, minutes, autoStopped: true },
    });

    const allLogs = await db.timeLog.findMany({
      where: { taskId: timer.taskId, endedAt: { not: null } },
      select: { minutes: true },
    });
    const totalMinutes = allLogs.reduce((acc, l) => acc + (l.minutes || 0), 0);

    await db.task.update({
      where: { id: timer.taskId },
      data: { actualMinutes: totalMinutes },
    });

    emitToUser(timer.userId, "timer:changed", {
      taskId: timer.taskId,
      running: false,
      logId: timer.id,
      autoStopped: true,
    });
    stopped.push(timer.id);
  }

  return stopped;
}
