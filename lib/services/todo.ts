import { z } from "zod";
import { db } from "@/lib/db";
import { can, UserContext } from "@/lib/auth/can";
import { Priority, Prisma } from "@prisma/client";
import { emitToUser } from "@/lib/socket";
import { startOfDay, endOfDay, addDays, format } from "date-fns";

export const CreateTodoSchema = z.object({
  title: z.string().min(1).max(200),
  notes: z.string().optional(),
  list: z.string().default("Personal"),
  date: z.date().nullable().optional(),
  startAt: z.date().nullable().optional(),
  endAt: z.date().nullable().optional(),
  remindAt: z.date().nullable().optional(),
  recurrence: z.string().nullable().optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  taskId: z.string().nullable().optional(),
});

export const UpdateTodoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  notes: z.string().nullable().optional(),
  list: z.string().optional(),
  date: z.date().nullable().optional(),
  startAt: z.date().nullable().optional(),
  endAt: z.date().nullable().optional(),
  remindAt: z.date().nullable().optional(),
  recurrence: z.string().nullable().optional(),
  priority: z.nativeEnum(Priority).optional(),
  sortOrder: z.number().int().optional(),
});

/**
 * F-TODO-01: Create personal to-do
 */
export async function createTodo(actor: UserContext, input: z.input<typeof CreateTodoSchema>) {
  if (!can(actor, "todo_manage", { ownerId: actor.id })) {
    throw new Error("Unauthorized to manage to-dos");
  }

  const data = CreateTodoSchema.parse(input);

  const todo = await db.todoItem.create({
    data: {
      userId: actor.id,
      title: data.title,
      notes: data.notes,
      list: data.list,
      date: data.date,
      startAt: data.startAt,
      endAt: data.endAt,
      remindAt: data.remindAt,
      recurrence: data.recurrence,
      priority: data.priority,
      taskId: data.taskId,
    },
  });

  emitToUser(actor.id, "todo:changed", { action: "create", id: todo.id });
  return todo;
}

/**
 * F-TODO-02: Update to-do
 */
export async function updateTodo(actor: UserContext, todoId: string, input: z.input<typeof UpdateTodoSchema>) {
  const existing = await db.todoItem.findUnique({ where: { id: todoId } });
  if (!existing || existing.deletedAt) throw new Error("To-do item not found");

  if (!can(actor, "todo_manage", { ownerId: existing.userId })) {
    throw new Error("Unauthorized to edit this to-do");
  }

  const data = UpdateTodoSchema.parse(input);

  const updated = await db.todoItem.update({
    where: { id: todoId },
    data: {
      ...data,
      reminded: data.remindAt ? false : existing.reminded,
    },
  });

  emitToUser(actor.id, "todo:changed", { action: "update", id: todoId });
  return updated;
}

/**
 * F-TODO-07: Toggle to-do completed
 */
export async function toggleTodoDone(actor: UserContext, todoId: string) {
  const existing = await db.todoItem.findUnique({ where: { id: todoId } });
  if (!existing || existing.deletedAt) throw new Error("To-do item not found");

  if (!can(actor, "todo_manage", { ownerId: existing.userId })) {
    throw new Error("Unauthorized to complete this to-do");
  }

  const nextDone = !existing.done;
  const now = new Date();

  const updated = await db.todoItem.update({
    where: { id: todoId },
    data: {
      done: nextDone,
      doneAt: nextDone ? now : null,
    },
  });

  // If completing a repeating to-do, generate next instance per F-TODO-07
  if (nextDone && existing.recurrence && existing.date) {
    const nextDate = addDays(existing.date, 1); // default daily recurrence shift
    await db.todoItem.create({
      data: {
        userId: existing.userId,
        title: existing.title,
        notes: existing.notes,
        list: existing.list,
        date: nextDate,
        startAt: existing.startAt ? addDays(existing.startAt, 1) : null,
        endAt: existing.endAt ? addDays(existing.endAt, 1) : null,
        remindAt: existing.remindAt ? addDays(existing.remindAt, 1) : null,
        recurrence: existing.recurrence,
        priority: existing.priority,
      },
    });
  }

  emitToUser(actor.id, "todo:changed", { action: "toggle", id: todoId, done: nextDone });
  return updated;
}

/**
 * Delete to-do (soft delete)
 */
export async function deleteTodo(actor: UserContext, todoId: string) {
  const existing = await db.todoItem.findUnique({ where: { id: todoId } });
  if (!existing || existing.deletedAt) throw new Error("To-do item not found");

  if (!can(actor, "todo_manage", { ownerId: existing.userId })) {
    throw new Error("Unauthorized to delete this to-do");
  }

  const updated = await db.todoItem.update({
    where: { id: todoId },
    data: { deletedAt: new Date() },
  });

  emitToUser(actor.id, "todo:changed", { action: "delete", id: todoId });
  return updated;
}

/**
 * F-TODO-03: Day schedule view
 * Returns scheduled to-dos, unscheduled to-dos, meetings, and tasks due on `date`.
 */
export async function getDaySchedule(actor: UserContext, targetDate: Date = new Date()) {
  const dayStart = startOfDay(targetDate);
  const dayEnd = endOfDay(targetDate);

  // 1. To-dos on this day
  const todos = await db.todoItem.findMany({
    where: {
      userId: actor.id,
      deletedAt: null,
      date: { gte: dayStart, lte: dayEnd },
    },
    orderBy: [{ startAt: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const scheduled = todos.filter((t) => t.startAt !== null);
  const unscheduled = todos.filter((t) => t.startAt === null);

  // 2. Events/Meetings for the user on this day (read-only)
  const events = await db.event.findMany({
    where: {
      startAt: { lte: dayEnd },
      endAt: { gte: dayStart },
      OR: [
        { ownerId: actor.id },
        { attendees: { some: { userId: actor.id } } },
      ],
    },
    select: {
      id: true,
      title: true,
      startAt: true,
      endAt: true,
      allDay: true,
      location: true,
      kind: true,
    },
    orderBy: { startAt: "asc" },
  });

  // 3. Tasks due today (read-only)
  const tasksDue = await db.task.findMany({
    where: {
      ownerId: actor.id,
      deletedAt: null,
      dueAt: { gte: dayStart, lte: dayEnd },
    },
    select: {
      id: true,
      number: true,
      title: true,
      priority: true,
      status: true,
      dueAt: true,
      estimateHours: true,
    },
  });

  return {
    date: targetDate,
    scheduled,
    unscheduled,
    events,
    tasksDue,
  };
}

/**
 * F-TODO-04: Upcoming to-dos (next 14 days)
 */
export async function getUpcomingTodos(actor: UserContext) {
  const today = startOfDay(new Date());
  const maxDate = endOfDay(addDays(today, 14));

  return await db.todoItem.findMany({
    where: {
      userId: actor.id,
      deletedAt: null,
      date: { gte: today, lte: maxDate },
      done: false,
    },
    orderBy: [{ date: "asc" }, { startAt: "asc" }],
  });
}

/**
 * F-TODO-04: Someday to-dos (no date set)
 */
export async function getSomedayTodos(actor: UserContext) {
  return await db.todoItem.findMany({
    where: {
      userId: actor.id,
      deletedAt: null,
      date: null,
      done: false,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * F-TODO-04: Completed to-dos (last 30 days)
 */
export async function getCompletedTodos(actor: UserContext) {
  const thirtyDaysAgo = addDays(new Date(), -30);
  return await db.todoItem.findMany({
    where: {
      userId: actor.id,
      deletedAt: null,
      done: true,
      doneAt: { gte: thirtyDaysAgo },
    },
    orderBy: { doneAt: "desc" },
  });
}

/**
 * F-TODO-08: Carry over undone past to-dos to today at 00:05
 */
export async function carryOverUndoneTodos() {
  const today = startOfDay(new Date());

  const overdue = await db.todoItem.findMany({
    where: {
      deletedAt: null,
      done: false,
      date: { lt: today },
    },
  });

  let carriedCount = 0;
  for (const item of overdue) {
    if (!item.date) continue;
    await db.todoItem.update({
      where: { id: item.id },
      data: {
        carriedFrom: item.carriedFrom || item.date,
        carryCount: (item.carryCount || 0) + 1,
        date: today,
        startAt: null, // Unscheduled for today
        endAt: null,
      },
    });
    carriedCount++;
  }

  return { carriedCount };
}
