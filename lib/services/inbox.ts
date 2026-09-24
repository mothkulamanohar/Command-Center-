import { z } from "zod";
import { db } from "@/lib/db";
import { can, UserContext } from "@/lib/auth/can";
import { logAudit } from "@/lib/services/audit";
import { Priority, RequestState, TaskSource, TaskStatus } from "@prisma/client";
import { emitToUser } from "@/lib/socket";

export const CreateRequestSchema = z.object({
  toUserId: z.string(),
  text: z.string().min(1),
  why: z.string().optional(),
  dueAt: z.date().optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
});

export const DeclineRequestSchema = z.object({
  requestId: z.string(),
  reason: z.string().min(1, "Decline reason is required"),
});

/**
 * F-INBOX-01: Raise a request
 */
export async function createRequest(actor: UserContext, input: z.infer<typeof CreateRequestSchema>) {
  const data = CreateRequestSchema.parse(input);

  return await db.$transaction(async (tx) => {
    const request = await tx.request.create({
      data: {
        fromUserId: actor.id,
        toUserId: data.toUserId,
        text: data.text,
        why: data.why,
        dueAt: data.dueAt,
        priority: data.priority,
        state: RequestState.NEW,
      },
    });

    emitToUser(data.toUserId, "request:new", { requestId: request.id, text: request.text });

    await logAudit(tx, {
      actorId: actor.id,
      action: "CREATE_REQUEST",
      entity: "Request",
      entityId: request.id,
    });

    return request;
  });
}

/**
 * F-INBOX-03: Accept request -> creates Task (owner=me, requester=them, source=INBOX)
 */
export async function acceptRequest(actor: UserContext, requestId: string) {
  const req = await db.request.findUnique({ where: { id: requestId } });
  if (!req || req.toUserId !== actor.id) {
    throw new Error("Request not found or not addressed to you");
  }

  return await db.$transaction(async (tx) => {
    // 1. Create Task
    const task = await tx.task.create({
      data: {
        title: req.text,
        ownerId: actor.id,
        requesterId: req.fromUserId,
        createdById: actor.id,
        priority: req.priority,
        dueAt: req.dueAt,
        source: TaskSource.INBOX,
        requestId: req.id,
      },
    });

    // 2. Update Request state
    const updated = await tx.request.update({
      where: { id: requestId },
      data: {
        state: RequestState.ACCEPTED,
        firstActionAt: req.firstActionAt || new Date(),
      },
    });

    emitToUser(req.fromUserId, "request:accepted", {
      requestId,
      taskId: task.id,
      by: actor.id,
    });

    await logAudit(tx, {
      actorId: actor.id,
      action: "ACCEPT_REQUEST",
      entity: "Request",
      entityId: requestId,
      after: { taskId: task.id },
    });

    return { request: updated, task };
  });
}

/**
 * F-INBOX-04: Delegate request
 */
export async function delegateRequest(
  actor: UserContext,
  requestId: string,
  delegateToUserId: string,
  note?: string
) {
  const req = await db.request.findUnique({ where: { id: requestId } });
  if (!req || req.toUserId !== actor.id) {
    throw new Error("Request not found or not addressed to you");
  }

  return await db.$transaction(async (tx) => {
    // Create task owned by delegatee, requester is original requester, createdById is actor
    // Appears in actor's "I'm chasing" per SPEC F-INBOX-04
    const task = await tx.task.create({
      data: {
        title: note ? `${req.text} (${note})` : req.text,
        ownerId: delegateToUserId,
        requesterId: req.fromUserId,
        createdById: actor.id,
        priority: req.priority,
        dueAt: req.dueAt,
        source: TaskSource.INBOX,
        requestId: req.id,
      },
    });

    const updated = await tx.request.update({
      where: { id: requestId },
      data: {
        state: RequestState.DELEGATED,
        delegatedToId: delegateToUserId,
        firstActionAt: req.firstActionAt || new Date(),
      },
    });

    emitToUser(req.fromUserId, "request:delegated", { requestId, delegatedTo: delegateToUserId });
    emitToUser(delegateToUserId, "task:assigned", { taskId: task.id, title: task.title });

    return { request: updated, task };
  });
}

/**
 * F-INBOX-06: Decline request
 */
export async function declineRequest(
  actor: UserContext,
  input: z.infer<typeof DeclineRequestSchema>
) {
  const data = DeclineRequestSchema.parse(input);
  const req = await db.request.findUnique({ where: { id: data.requestId } });
  if (!req || req.toUserId !== actor.id) {
    throw new Error("Request not found or not addressed to you");
  }

  return await db.$transaction(async (tx) => {
    const updated = await tx.request.update({
      where: { id: data.requestId },
      data: {
        state: RequestState.DECLINED,
        declineReason: data.reason,
        firstActionAt: req.firstActionAt || new Date(),
      },
    });

    emitToUser(req.fromUserId, "request:declined", {
      requestId: data.requestId,
      reason: data.reason,
    });

    return updated;
  });
}
