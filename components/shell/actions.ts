"use server";

import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function stopRunningTimerAction(timeLogId: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const timeLog = await db.timeLog.findUnique({
      where: { id: timeLogId },
    });

    if (!timeLog || timeLog.userId !== user.id) {
      return { success: false, error: "Timer not found" };
    }

    const now = new Date();
    const minutes = Math.max(1, Math.round((now.getTime() - timeLog.startedAt.getTime()) / 60000));

    await db.$transaction(async (tx) => {
      await tx.timeLog.update({
        where: { id: timeLogId },
        data: {
          endedAt: now,
          minutes,
        },
      });

      // Update actualMinutes on task
      await tx.task.update({
        where: { id: timeLog.taskId },
        data: {
          actualMinutes: { increment: minutes },
        },
      });
    });

    revalidatePath("/console");
    revalidatePath("/my");
    revalidatePath("/timesheet");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to stop timer" };
  }
}

export async function getHeaderNotificationsAction() {
  const user = await getSessionUser();
  if (!user) return { success: false, data: [] };

  try {
    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return {
      success: true,
      data: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        time: n.createdAt.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestamp: n.createdAt.getTime(),
        read: Boolean(n.readAt),
        type: n.type as any,
        link: n.url || "/console",
      })),
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch notifications", data: [] };
  }
}

export async function markAllHeaderNotificationsReadAction() {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    await db.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to mark notifications read" };
  }
}

export async function markSingleNotificationReadAction(notificationId: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    await db.notification.updateMany({
      where: { id: notificationId, userId: user.id },
      data: { readAt: new Date() },
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to mark notification read" };
  }
}

