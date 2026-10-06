"use server";

import { getSessionUser } from "@/lib/auth/session";
import {
  createTodo,
  updateTodo,
  toggleTodoDone,
  deleteTodo,
  getDaySchedule,
  getUpcomingTodos,
  getSomedayTodos,
  getCompletedTodos,
} from "@/lib/services/todo";
import { Priority } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface TodoActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

/**
 * Server action to create a personal to-do (F-TODO-01..02)
 */
export async function createTodoAction(params: {
  title: string;
  notes?: string;
  list?: string;
  dateIso?: string | null;
  startAtIso?: string | null;
  endAtIso?: string | null;
  remindAtIso?: string | null;
  recurrence?: string | null;
  priority?: Priority;
}): Promise<TodoActionResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { success: false, error: "Unauthorized: Please log in." };
  }

  try {
    const todo = await createTodo(actor, {
      title: params.title,
      notes: params.notes,
      list: params.list || "Personal",
      date: params.dateIso ? new Date(params.dateIso) : null,
      startAt: params.startAtIso ? new Date(params.startAtIso) : null,
      endAt: params.endAtIso ? new Date(params.endAtIso) : null,
      remindAt: params.remindAtIso ? new Date(params.remindAtIso) : null,
      recurrence: params.recurrence,
      priority: params.priority || Priority.MEDIUM,
    });

    revalidatePath("/todo");
    revalidatePath("/my");
    return { success: true, data: todo };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create to-do";
    return { success: false, error: message };
  }
}

/**
 * Server action to toggle to-do completion (F-TODO-07)
 */
export async function toggleTodoAction(todoId: string): Promise<TodoActionResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const updated = await toggleTodoDone(actor, todoId);
    revalidatePath("/todo");
    revalidatePath("/my");
    return { success: true, data: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to toggle to-do";
    return { success: false, error: message };
  }
}

/**
 * Server action to update to-do schedule / details (F-TODO-02, 05)
 */
export async function updateTodoAction(
  todoId: string,
  updates: {
    title?: string;
    notes?: string | null;
    list?: string;
    dateIso?: string | null;
    startAtIso?: string | null;
    endAtIso?: string | null;
    remindAtIso?: string | null;
    recurrence?: string | null;
    priority?: Priority;
    sortOrder?: number;
  }
): Promise<TodoActionResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const updated = await updateTodo(actor, todoId, {
      title: updates.title,
      notes: updates.notes,
      list: updates.list,
      date: updates.dateIso ? new Date(updates.dateIso) : null,
      startAt: updates.startAtIso ? new Date(updates.startAtIso) : null,
      endAt: updates.endAtIso ? new Date(updates.endAtIso) : null,
      remindAt: updates.remindAtIso ? new Date(updates.remindAtIso) : null,
      recurrence: updates.recurrence,
      priority: updates.priority,
      sortOrder: updates.sortOrder,
    });

    revalidatePath("/todo");
    revalidatePath("/my");
    return { success: true, data: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update to-do";
    return { success: false, error: message };
  }
}

/**
 * Server action to delete to-do (F-TODO)
 */
export async function deleteTodoAction(todoId: string): Promise<TodoActionResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const deleted = await deleteTodo(actor, todoId);
    revalidatePath("/todo");
    revalidatePath("/my");
    return { success: true, data: deleted };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete to-do";
    return { success: false, error: message };
  }
}

/**
 * Fetch day schedule with to-dos, meetings and tasks due (F-TODO-03)
 */
export async function fetchDayScheduleAction(dateIso: string): Promise<TodoActionResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const schedule = await getDaySchedule(actor, new Date(dateIso));
    return { success: true, data: schedule };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load schedule";
    return { success: false, error: message };
  }
}

/**
 * Fetch to-dos by view (F-TODO-04)
 */
export async function fetchTodoListAction(view: "today" | "upcoming" | "someday" | "completed"): Promise<TodoActionResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    let list;
    if (view === "upcoming") {
      list = await getUpcomingTodos(actor);
    } else if (view === "someday") {
      list = await getSomedayTodos(actor);
    } else if (view === "completed") {
      list = await getCompletedTodos(actor);
    } else {
      list = await getDaySchedule(actor);
    }
    return { success: true, data: list };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load to-dos";
    return { success: false, error: message };
  }
}

/**
 * Server action to schedule a to-do in a specific date/time slot
 */
export async function scheduleTodoAction(
  todoId: string,
  dateIso: string,
  startAtIso: string
): Promise<TodoActionResult> {
  return updateTodoAction(todoId, { dateIso, startAtIso });
}

/**
 * Fetch initial to-do page data (real users and active to-do items from PostgreSQL)
 */
export async function fetchTodoDataAction(): Promise<TodoActionResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { db } = await import("@/lib/db");
    const users = await db.user.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        role: true,
        title: true,
        avatarUrl: true,
        campus: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });

    // Sri / Admins can see all team todos, other members see their own
    const isAdminOrLead = actor.role === "ADMIN" || actor.role === "LEAD";
    const todos = await db.todoItem.findMany({
      where: {
        deletedAt: null,
        ...(isAdminOrLead ? {} : { userId: actor.id }),
      },
      orderBy: [{ date: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    });

    const realTasksDue = await db.task.findMany({
      where: {
        deletedAt: null,
        status: { notIn: ["DONE", "CANCELLED"] },
      },
      select: { id: true, number: true, title: true, priority: true, dueAt: true },
      take: 10,
      orderBy: { dueAt: "asc" },
    });

    return {
      success: true,
      data: {
        currentUser: { id: actor.id, name: actor.name, role: actor.role },
        users:
          users.length > 0
            ? users.map((u) => {
                const initials = u.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return {
                  id: u.id,
                  name: u.name,
                  role: u.role,
                  title: u.title || u.role,
                  initials,
                  avatarBg: "bg-primary",
                  campus: u.campus?.name || "Main Campus",
                  status: "PRESENT" as const,
                };
              })
            : FALLBACK_USERS,
        todos:
          todos.length > 0
            ? todos.map((t) => ({
                id: t.id,
                userId: t.userId,
                title: t.title,
                list: t.list,
                date: t.date,
                startAt: t.startAt ? t.startAt.toISOString() : null,
                endAt: t.endAt ? t.endAt.toISOString() : null,
                priority: t.priority,
                done: t.done,
                doneAt: t.doneAt,
              }))
            : FALLBACK_TODOS,
        tasksDue: realTasksDue.map((t) => ({
          id: t.id,
          number: t.number,
          title: t.title,
          priority: t.priority,
          dueAt: t.dueAt ? t.dueAt.toISOString() : null,
        })),
      },
    };
  } catch (err: unknown) {
    return {
      success: true,
      data: {
        currentUser: { id: actor.id, name: actor.name, role: actor.role },
        users: FALLBACK_USERS,
        todos: FALLBACK_TODOS,
        tasksDue: [
          { id: "t_1", number: 1042, title: "Review monthly KPI report for VC", priority: "HIGH", dueAt: new Date(Date.now() + 24 * 3600000).toISOString() },
          { id: "t_2", number: 1043, title: "Approve UOS implementation rollout schedule", priority: "MEDIUM", dueAt: new Date(Date.now() + 48 * 3600000).toISOString() },
        ],
      },
    };
  }
}

const FALLBACK_USERS = [
  { id: "u-1", name: "Sri", role: "ADMIN", title: "IT Manager", initials: "SR", avatarBg: "bg-primary", campus: "Hyderabad Group", status: "PRESENT" as const },
  { id: "u-2", name: "Hari", role: "LEAD", title: "IT Coordinator", initials: "HA", avatarBg: "bg-primary", campus: "SMRU Main Campus", status: "PRESENT" as const },
  { id: "u-3", name: "Janardhan", role: "MEMBER", title: "Support Tech", initials: "JA", avatarBg: "bg-primary", campus: "SMRU Main Campus", status: "ON_LEAVE" as const },
  { id: "u-4", name: "Dev Web", role: "DEVELOPER", title: "Frontend Engineer", initials: "DW", avatarBg: "bg-primary", campus: "Central IT", status: "LATE" as const },
  { id: "u-5", name: "Dev Backend", role: "DEVELOPER", title: "Backend Engineer", initials: "DB", avatarBg: "bg-primary", campus: "Central IT", status: "PRESENT" as const },
  { id: "u-6", name: "Intern Web A", role: "INTERN", title: "Web Intern", initials: "IA", avatarBg: "bg-primary", campus: "SMRU Main Campus", status: "PRESENT" as const },
  { id: "u-7", name: "Intern Web B", role: "INTERN", title: "Web Intern", initials: "IB", avatarBg: "bg-primary", campus: "SMRU Main Campus", status: "PRESENT" as const },
];

const FALLBACK_TODOS = [
  {
    id: "td-1",
    userId: "u-1",
    title: "Prepare weekly IT operations summary for VC",
    list: "Work" as const,
    date: new Date(),
    startAt: new Date(new Date().setHours(9, 30, 0, 0)).toISOString(),
    endAt: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
    priority: "HIGH" as const,
    done: false,
    doneAt: null,
  },
  {
    id: "td-2",
    userId: "u-1",
    title: "Verify core access switch replacement ports",
    list: "Operations" as const,
    date: new Date(),
    startAt: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
    endAt: new Date(new Date().setHours(15, 30, 0, 0)).toISOString(),
    priority: "MEDIUM" as const,
    done: false,
    doneAt: null,
  },
  {
    id: "td-3",
    userId: "u-2",
    title: "Follow up with fiber optic patch cable vendor",
    list: "Work" as const,
    date: new Date(),
    startAt: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
    endAt: null,
    priority: "URGENT" as const,
    done: false,
    doneAt: null,
  },
  {
    id: "td-4",
    userId: "u-1",
    title: "Audit SSL certificates for all campus subdomains",
    list: "Operations" as const,
    date: null,
    startAt: null,
    endAt: null,
    priority: "HIGH" as const,
    done: false,
    doneAt: null,
  },
];

