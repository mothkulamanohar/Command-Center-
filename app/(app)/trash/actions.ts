"use server";

import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/services/audit";
import { revalidatePath } from "next/cache";
import { differenceInDays, format } from "date-fns";

export async function getTrashItemsAction() {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized", data: [] };

  try {
    const deletedTasks = await db.task.findMany({
      where: {
        deletedAt: { not: null },
      },
      orderBy: { deletedAt: "desc" },
    });

    const items = deletedTasks.map((t) => {
      const delDate = t.deletedAt ? new Date(t.deletedAt) : new Date();
      const elapsedDays = differenceInDays(new Date(), delDate);
      const daysRemaining = Math.max(0, 30 - elapsedDays);

      return {
        id: t.id,
        type: "TASK" as const,
        title: `T-${t.number}: ${t.title}`,
        deletedAt: format(delDate, "d MMM yyyy"),
        daysRemaining,
      };
    });

    return { success: true, data: items };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load trash items", data: [] };
  }
}

export async function restoreItemAction(id: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const restored = await db.task.update({
      where: { id },
      data: { deletedAt: null },
    });

    await logAudit(db, {
      actorId: user.id,
      action: "TASK_RESTORE",
      entity: "Task",
      entityId: id,
    });

    revalidatePath("/trash");
    revalidatePath("/console");
    revalidatePath("/my");
    return { success: true, data: restored };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to restore item" };
  }
}

export async function deletePermanentAction(id: string) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Platform Owner only." };
  }

  try {
    await db.task.delete({
      where: { id },
    });

    await logAudit(db, {
      actorId: user.id,
      action: "TASK_HARD_DELETE",
      entity: "Task",
      entityId: id,
    });

    revalidatePath("/trash");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete item" };
  }
}

export async function emptyTrashAction() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Platform Owner only." };
  }

  try {
    const res = await db.task.deleteMany({
      where: { deletedAt: { not: null } },
    });

    await logAudit(db, {
      actorId: user.id,
      action: "EMPTY_TRASH",
      entity: "Task",
      entityId: "BULK",
      after: { count: res.count },
    });

    revalidatePath("/trash");
    return { success: true, data: res.count };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to empty trash" };
  }
}
