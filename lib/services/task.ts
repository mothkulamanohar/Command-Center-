import { z } from "zod";
import { db } from "@/lib/db";
import { can, UserContext } from "@/lib/auth/can";
import { logAudit } from "@/lib/services/audit";
import { TaskStatus, Priority, TaskMode, TaskSource, Prisma } from "@prisma/client";
import { emitToUser } from "@/lib/socket";

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(140),
  description: z.record(z.unknown()).optional(),
  ownerId: z.string().optional(),
  requesterId: z.string().optional(),
  requesterName: z.string().optional(),
  mode: z.nativeEnum(TaskMode).default(TaskMode.SOLO),
  partnerId: z.string().optional(),
  turnUserId: z.string().optional(),
  turnNote: z.string().optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  dueAt: z.date().optional(),
  startAt: z.date().optional(),
  teamId: z.string().optional(),
  projectId: z.string().optional(),
  campusId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  source: z.nativeEnum(TaskSource).default(TaskSource.MANUAL),
  checklist: z.array(z.object({ text: z.string(), done: z.boolean() })).default([]),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(140).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  dueAt: z.date().nullable().optional(),
  ownerId: z.string().optional(),
  blockedReason: z.string().optional(),
});

/**
 * F-TASK-01: Create task with Leadership detection (F-TASK-14)
 */
export async function createTask(actor: UserContext, input: z.infer<typeof CreateTaskSchema>) {
  if (!can(actor, "create_task")) {
    throw new Error("Unauthorized to create tasks");
  }

  const data = CreateTaskSchema.parse(input);
  const ownerId: string = data.ownerId || actor.id;

  // Check senior person ask -> source=LEADERSHIP, priority=HIGH per F-TASK-14
  let isLeadership = data.source === TaskSource.LEADERSHIP;
  let priority = data.priority;

  if (data.requesterId) {
    const requesterUser = await db.user.findUnique({ where: { id: data.requesterId } });
    if (requesterUser?.isSenior) {
      isLeadership = true;
      priority = Priority.HIGH;
    }
  }

  return await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const task = await tx.task.create({
      data: {
        title: data.title,
        description: (data.description as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        ownerId,
        requesterId: data.requesterId,
        requesterName: data.requesterName,
        createdById: actor.id,
        mode: data.mode,
        partnerId: data.partnerId,
        turnUserId: data.mode === TaskMode.SHARED ? (data.turnUserId || actor.id) : null,
        turnNote: data.turnNote,
        priority,
        dueAt: data.dueAt,
        startAt: data.startAt,
        teamId: data.teamId,
        projectId: data.projectId,
        campusId: data.campusId,
        tags: data.tags,
        source: isLeadership ? TaskSource.LEADERSHIP : data.source,
        checklist: (data.checklist as unknown as Prisma.InputJsonValue) ?? [],
      },
    });

    await logAudit(tx, {
      actorId: actor.id,
      action: "CREATE_TASK",
      entity: "Task",
      entityId: task.id,
      after: { title: task.title, number: task.number, ownerId: task.ownerId },
    });

    // Notify assigned owner if not creator
    if (ownerId !== actor.id) {
      emitToUser(ownerId, "task:assigned", { taskId: task.id, title: task.title });
    }

    return task;
  });
}

/**
 * F-TASK-03: Whose-turn toggle ("Pass the ball")
 */
export async function passTaskTurn(
  actor: UserContext,
  taskId: string,
  newTurnUserId: string,
  note?: string
) {
  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task || task.mode !== TaskMode.SHARED) {
    throw new Error("Task not found or not a shared task");
  }

  return await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const updated = await tx.task.update({
      where: { id: taskId },
      data: {
        turnUserId: newTurnUserId,
        turnNote: note,
        lastActivityAt: new Date(),
      },
    });

    await tx.taskComment.create({
      data: {
        taskId,
        authorId: actor.id,
        kind: "ACTIVITY",
        body: { text: `Passed turn to ${newTurnUserId}${note ? `: ${note}` : ""}` },
      },
    });

    emitToUser(newTurnUserId, "task:your_turn", { taskId, title: task.title, note });
    return updated;
  });
}

/**
 * F-TASK-05: Mark task done
 */
export async function markTaskDone(actor: UserContext, taskId: string) {
  return await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const task = await tx.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.DONE,
        doneAt: new Date(),
        doneById: actor.id,
        lastActivityAt: new Date(),
      },
    });

    // Stop active follow-ups per SPEC F-TASK-05
    await tx.followUp.updateMany({
      where: { taskId, status: "ACTIVE" },
      data: { status: "STOPPED" },
    });

    // Notify requester
    if (task.requesterId && task.requesterId !== actor.id) {
      emitToUser(task.requesterId, "task:done", {
        taskId,
        title: task.title,
        doneBy: actor.id,
      });
    }

    await logAudit(tx, {
      actorId: actor.id,
      action: "TASK_DONE",
      entity: "Task",
      entityId: taskId,
    });

    return task;
  });
}

/**
 * SPEC §7.2: The Three Lists (I owe, I'm chasing, Shared)
 */
export async function getThreeLists(userId: string) {
  const openFilter = {
    deletedAt: null,
    status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
  };

  // 1. I owe
  const iOwe = await db.task.findMany({
    where: {
      ...openFilter,
      OR: [
        { mode: TaskMode.SOLO, ownerId: userId },
        { mode: TaskMode.SHARED, turnUserId: userId },
      ],
    },
    orderBy: [{ dueAt: "asc" }, { priority: "desc" }, { createdAt: "asc" }],
    include: { owner: true, team: true },
  });

  // 2. I'm chasing
  const imChasing = await db.task.findMany({
    where: {
      ...openFilter,
      mode: TaskMode.SOLO,
      ownerId: { not: userId },
      OR: [{ requesterId: userId }, { createdById: userId }],
    },
    orderBy: [{ dueAt: "asc" }, { priority: "desc" }, { createdAt: "asc" }],
    include: { owner: true, team: true, followUps: true },
  });

  // 3. Shared
  const shared = await db.task.findMany({
    where: {
      ...openFilter,
      mode: TaskMode.SHARED,
      OR: [{ ownerId: userId }, { partnerId: userId }],
    },
    orderBy: [{ dueAt: "asc" }, { priority: "desc" }],
    include: { owner: true, team: true },
  });

  return { iOwe, imChasing, shared };
}
