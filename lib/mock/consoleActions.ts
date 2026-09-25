import { Priority, TaskMode, TaskSource, TaskStatus } from "@prisma/client";
import { TaskWithRelations } from "./consoleData";

export function createCommandTask(
  input: string,
  slots: Record<string, any> | undefined,
  sriId: string
): TaskWithRelations {
  const rawTitle = slots?.title || input.replace(/^(add:\s*|add\s+)/i, "");
  const cleanTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);

  return {
    id: `t_${Date.now()}`,
    number: Math.floor(1046 + Math.random() * 500),
    title: cleanTitle,
    description: null,
    ownerId: sriId,
    requesterId: "u_vc",
    requesterName: slots?.requester || "VC Office",
    createdById: "u_vc",
    mode: TaskMode.SOLO,
    partnerId: null,
    turnUserId: null,
    turnNote: null,
    status: TaskStatus.TODO,
    priority: slots?.priority ? (slots.priority as Priority) : Priority.HIGH,
    startAt: null,
    dueAt: slots?.due ? new Date(slots.due) : new Date(Date.now() + 48 * 3600 * 1000),
    doneAt: null,
    doneById: null,
    blockedReason: null,
    teamId: null,
    projectId: null,
    campusId: null,
    tags: ["command", "leadership"],
    source: TaskSource.LEADERSHIP,
    recurrence: null,
    parentId: null,
    checklist: [],
    estimateHours: 2,
    lastActivityAt: new Date(),
    reopenCount: 0,
    requestId: null,
    messageId: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createCommandChase(
  input: string,
  slots: Record<string, any> | undefined,
  sriId: string
): TaskWithRelations {
  const targetName = slots?.owner || "Hari";
  const rawTitle = slots?.title || "Check fee page by tomorrow";
  const cleanTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);

  return {
    id: `t_${Date.now()}`,
    number: Math.floor(1046 + Math.random() * 500),
    title: cleanTitle,
    description: null,
    ownerId: "u_hari",
    owner: {
      id: "u_hari",
      email: "hari@smru.edu.in",
      name: targetName,
      displayName: targetName,
    } as any,
    requesterId: sriId,
    requesterName: "Sri",
    createdById: sriId,
    mode: TaskMode.SOLO,
    partnerId: null,
    turnUserId: null,
    turnNote: null,
    status: TaskStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    startAt: null,
    dueAt: new Date(Date.now() + 24 * 3600 * 1000),
    doneAt: null,
    doneById: null,
    blockedReason: null,
    teamId: null,
    projectId: null,
    campusId: null,
    tags: ["chase", "assigned"],
    source: TaskSource.COMMAND,
    recurrence: null,
    parentId: null,
    checklist: [],
    estimateHours: 3,
    lastActivityAt: new Date(),
    reopenCount: 0,
    requestId: null,
    messageId: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
