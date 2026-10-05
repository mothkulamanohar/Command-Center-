"use server";

import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  createRequest,
  acceptRequest,
  delegateRequest,
  declineRequest,
} from "@/lib/services/inbox";
import { Priority, RequestState } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getInboxRequestsAction() {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized", data: [] };

  try {
    const requests = await db.request.findMany({
      where: {
        toUserId: user.id,
      },
      orderBy: { createdAt: "desc" },
    });

    const activeUsers = await db.user.findMany({
      where: { active: true },
      select: { id: true, name: true, role: true, email: true },
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      data: {
        currentUser: { id: user.id, name: user.name, role: user.role },
        requests,
        activeUsers,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load requests", data: null };
  }
}

export async function createRequestAction(params: {
  toUserId: string;
  text: string;
  why?: string;
  priority?: Priority;
  dueAtIso?: string;
}) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const req = await createRequest(user, {
      toUserId: params.toUserId,
      text: params.text,
      why: params.why,
      priority: params.priority || Priority.MEDIUM,
      dueAt: params.dueAtIso ? new Date(params.dueAtIso) : undefined,
    });

    revalidatePath("/inbox");
    revalidatePath("/console");
    return { success: true, data: req };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create request" };
  }
}

export async function acceptRequestAction(requestId: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const res = await acceptRequest(user, requestId);
    revalidatePath("/inbox");
    revalidatePath("/console");
    revalidatePath("/my");
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to accept request" };
  }
}

export async function delegateRequestAction(requestId: string, delegateToUserId: string, note?: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const res = await delegateRequest(user, requestId, delegateToUserId, note);
    revalidatePath("/inbox");
    revalidatePath("/console");
    revalidatePath("/my");
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delegate request" };
  }
}

export async function declineRequestAction(requestId: string, reason: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const res = await declineRequest(user, { requestId, reason });
    revalidatePath("/inbox");
    revalidatePath("/console");
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to decline request" };
  }
}
