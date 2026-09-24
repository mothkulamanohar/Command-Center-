import { db } from "@/lib/db";
import { emitToUser } from "@/lib/socket";

export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_DUE"
  | "TASK_OVERDUE"
  | "TASK_DONE"
  | "SHARED_TURN"
  | "FOLLOWUP_RECEIVED"
  | "FOLLOWUP_REPLY"
  | "FOLLOWUP_APPROVAL"
  | "ESCALATION"
  | "NEW_REQUEST"
  | "MENTION"
  | "ANNOUNCEMENT"
  | "UPDATE_REMINDER"
  | "SITE_DOWN";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType | string;
  title: string;
  body?: string;
  url?: string;
}

/**
 * F-NOTIF-01: In-app notification creation with real-time push via Socket.IO
 */
export async function createNotification(input: CreateNotificationInput) {
  const notif = await db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      url: input.url,
    },
  });

  // Emit to user's real-time socket room
  emitToUser(input.userId, "notification:new", {
    id: notif.id,
    type: notif.type,
    title: notif.title,
    body: notif.body,
    url: notif.url,
    createdAt: notif.createdAt,
  });

  return notif;
}

/**
 * Get notifications for a user with unread count
 */
export async function getUserNotifications(userId: string, filter?: string) {
  const where: { userId: string; readAt?: null; type?: string } = { userId };

  if (filter === "UNREAD") {
    where.readAt = null;
  } else if (filter && filter !== "ALL") {
    where.type = filter;
  }

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.notification.count({
      where: { userId, readAt: null },
    }),
  ]);

  return { notifications, unreadCount };
}

/**
 * Mark a single notification as read
 */
export async function markNotificationRead(id: string, userId: string) {
  return await db.notification.updateMany({
    where: { id, userId },
    data: { readAt: new Date() },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: string) {
  return await db.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

/**
 * F-NOTIF-02: Register Push Subscription (Web Push)
 */
export async function registerPushSubscription(
  userId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  userAgent?: string
) {
  return await db.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      userId,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent,
    },
    create: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent,
    },
  });
}
