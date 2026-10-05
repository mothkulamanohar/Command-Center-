"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/can";
import { createTask, passTaskTurn } from "@/lib/services/task";
import { Priority, TaskMode, TaskSource, FUCadence } from "@prisma/client";
import { revalidatePath } from "next/cache";

const AssignTaskSchema = z.object({
  title: z.string().min(1).max(200),
  ownerName: z.string().min(1),
  cadence: z.string().optional(),
  due: z.string().or(z.date()).optional().nullable(),
});

const AddTaskSchema = z.object({
  title: z.string().min(1).max(200),
  requesterName: z.string().optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
});

const PassTurnSchema = z.object({
  taskTitle: z.string().min(1),
  partnerName: z.string().min(1),
  note: z.string().optional(),
});

/**
 * Server action for Command Bar: Assign Task with Chasing
 */
export async function executeCommandAssignTaskAction(input: z.infer<typeof AssignTaskSchema>) {
  const actor = await getSessionUser();
  if (!actor) return { success: false, error: "Unauthorized" };

  if (!can(actor, "create_task")) {
    return { success: false, error: "Forbidden: insufficient permissions to create tasks" };
  }

  const parsed = AssignTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid parameters for assignment" };
  }

  try {
    const { title, ownerName, cadence, due } = parsed.data;

    // Find the target user by name/email
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { contains: ownerName, mode: "insensitive" } },
          { email: { contains: ownerName, mode: "insensitive" } },
        ],
      },
    });

    const assignedOwnerId = targetUser?.id || actor.id;
    const dueDate = due ? new Date(due) : new Date(Date.now() + 86400000 * 2);

    const task = await createTask(actor, {
      title,
      ownerId: assignedOwnerId,
      dueAt: dueDate,
      source: TaskSource.COMMAND,
      priority: Priority.HIGH,
    });

    // Create follow-up chase record if cadence specified
    const fuCadence = cadence === "DAILY" ? FUCadence.DAILY : FUCadence.DAILY;
    await prisma.followUp.create({
      data: {
        taskId: task.id,
        onBehalfOfId: actor.id,
        targetId: assignedOwnerId,
        cadence: fuCadence,
        template: "GENTLE",
        nextRunAt: new Date(Date.now() + 86400000), // Next run tomorrow
        status: "ACTIVE",
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "COMMAND_ASSIGN_TASK",
        entity: "Task",
        entityId: task.id,
        after: {
          title: task.title,
          ownerId: assignedOwnerId,
          ownerName: targetUser?.name || ownerName,
          cadence: fuCadence,
          dueAt: dueDate,
        },
      },
    });

    revalidatePath("/console");
    revalidatePath("/tasks");
    return {
      success: true,
      taskId: task.id,
      taskNumber: task.number,
      assignedTo: targetUser?.name || ownerName,
    };
  } catch (err: any) {
    console.error("executeCommandAssignTaskAction error:", err);
    return { success: false, error: err.message || "Failed to assign task" };
  }
}

/**
 * Server action for Command Bar: Add Task to "I Owe"
 */
export async function executeCommandAddTaskAction(input: z.infer<typeof AddTaskSchema>) {
  const actor = await getSessionUser();
  if (!actor) return { success: false, error: "Unauthorized" };

  if (!can(actor, "create_task")) {
    return { success: false, error: "Forbidden: insufficient permissions to create tasks" };
  }

  const parsed = AddTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid task details" };
  }

  try {
    const { title, requesterName, priority } = parsed.data;

    let requesterId: string | undefined;
    if (requesterName) {
      const requester = await prisma.user.findFirst({
        where: {
          OR: [
            { name: { contains: requesterName, mode: "insensitive" } },
            { email: { contains: requesterName, mode: "insensitive" } },
          ],
        },
      });
      requesterId = requester?.id;
    }

    const task = await createTask(actor, {
      title,
      ownerId: actor.id,
      requesterName: requesterName || "VC Office",
      requesterId,
      priority,
      source: TaskSource.COMMAND,
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "COMMAND_ADD_TASK",
        entity: "Task",
        entityId: task.id,
        after: { title: task.title, priority, requesterName },
      },
    });

    revalidatePath("/console");
    revalidatePath("/tasks");
    return { success: true, taskId: task.id, taskNumber: task.number };
  } catch (err: any) {
    console.error("executeCommandAddTaskAction error:", err);
    return { success: false, error: err.message || "Failed to add task" };
  }
}

/**
 * Server action for Command Bar: Pass Turn on Shared Task
 */
export async function executeCommandPassTurnAction(input: z.infer<typeof PassTurnSchema>) {
  const actor = await getSessionUser();
  if (!actor) return { success: false, error: "Unauthorized" };

  const parsed = PassTurnSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid pass turn parameters" };
  }

  try {
    const { taskTitle, partnerName, note } = parsed.data;

    // Find the partner user
    const partner = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { contains: partnerName, mode: "insensitive" } },
          { email: { contains: partnerName, mode: "insensitive" } },
        ],
      },
    });

    const partnerId = partner?.id || actor.id;

    // Find a matching task or create a shared task if it doesn't exist
    let task = await prisma.task.findFirst({
      where: {
        title: { contains: taskTitle, mode: "insensitive" },
        mode: TaskMode.SHARED,
      },
    });

    if (!task) {
      // Find any task by title
      task = await prisma.task.findFirst({
        where: {
          title: { contains: taskTitle, mode: "insensitive" },
        },
      });

      if (task) {
        // Upgrade to shared task
        task = await prisma.task.update({
          where: { id: task.id },
          data: {
            mode: TaskMode.SHARED,
            partnerId,
            turnUserId: partnerId,
          },
        });
      } else {
        // Create new shared task
        task = await createTask(actor, {
          title: taskTitle,
          mode: TaskMode.SHARED,
          partnerId,
          turnUserId: partnerId,
          source: TaskSource.COMMAND,
        });
      }
    }

    await passTaskTurn(actor, task.id, partnerId, note);

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "COMMAND_PASS_TURN",
        entity: "Task",
        entityId: task.id,
        after: {
          taskTitle: task.title,
          partnerId,
          partnerName: partner?.name || partnerName,
          note,
        },
      },
    });

    revalidatePath("/console");
    return { success: true, taskId: task.id };
  } catch (err: any) {
    console.error("executeCommandPassTurnAction error:", err);
    return { success: false, error: err.message || "Failed to pass turn" };
  }
}
