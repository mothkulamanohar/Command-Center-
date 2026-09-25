import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { can, AuthUser } from "@/lib/auth/can";
import { logAudit } from "./audit";

export interface SaveDocInput {
  id?: string;
  spaceId: string;
  parentId?: string;
  title: string;
  content: Prisma.InputJsonValue; // JSON or markdown text
  template?: string;
}

export async function listDocSpaces() {
  return await prisma.docSpace.findMany({
    include: {
      _count: { select: { docs: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createDocSpace(actor: AuthUser, name: string, teamId?: string, projectId?: string) {
  if (actor.role !== "ADMIN" && actor.role !== "LEAD") {
    throw new Error("Unauthorized to create doc spaces");
  }

  const space = await prisma.docSpace.create({
    data: { name, teamId, projectId },
  });

  await logAudit({
    actorId: actor.id,
    action: "CREATE",
    entity: "DocSpace",
    entityId: space.id,
    diff: { name },
  });

  return space;
}

export async function listDocs(spaceId?: string, search?: string) {
  const where: Prisma.DocWhereInput = { deletedAt: null };
  if (spaceId) where.spaceId = spaceId;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
    ];
  }

  return await prisma.doc.findMany({
    where,
    include: {
      space: true,
      versions: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getDocById(id: string) {
  return await prisma.doc.findUnique({
    where: { id },
    include: {
      space: true,
      versions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}

export async function saveDoc(actor: AuthUser, input: SaveDocInput) {
  if (input.id) {
    const existing = await prisma.doc.findUnique({ where: { id: input.id } });
    if (!existing) throw new Error("Document not found");

    // Snapshot existing version before update (SPEC F-DOC-04)
    await prisma.docVersion.create({
      data: {
        docId: existing.id,
        content: (existing.content ?? {}) as Prisma.InputJsonValue,
        byId: existing.updatedById,
      },
    });

    const updated = await prisma.doc.update({
      where: { id: input.id },
      data: {
        title: input.title,
        content: input.content,
        template: input.template,
        updatedById: actor.id,
      },
    });

    await logAudit({
      actorId: actor.id,
      action: "UPDATE",
      entity: "Doc",
      entityId: updated.id,
      diff: { title: updated.title },
    });

    return updated;
  } else {
    const created = await prisma.doc.create({
      data: {
        spaceId: input.spaceId,
        parentId: input.parentId,
        title: input.title,
        content: input.content,
        template: input.template,
        updatedById: actor.id,
      },
    });

    await logAudit({
      actorId: actor.id,
      action: "CREATE",
      entity: "Doc",
      entityId: created.id,
      diff: { title: created.title },
    });

    return created;
  }
}

export async function deleteDoc(actor: AuthUser, docId: string) {
  const doc = await prisma.doc.findUnique({ where: { id: docId } });
  if (!doc) throw new Error("Document not found");

  if (actor.role !== "ADMIN" && doc.updatedById !== actor.id) {
    throw new Error("Unauthorized to delete document");
  }

  const updated = await prisma.doc.update({
    where: { id: docId },
    data: { deletedAt: new Date() },
  });

  await logAudit({
    actorId: actor.id,
    action: "DELETE",
    entity: "Doc",
    entityId: docId,
    diff: { title: doc.title },
  });

  return updated;
}

/**
 * Canonical Document Templates per SPEC §12.2 (F-DOC-03)
 */
export function getDocTemplates() {
  return [
    {
      id: "sop",
      name: "Standard Operating Procedure (SOP)",
      template: `# Standard Operating Procedure: [Title]
## 1. Objective
Describe the outcome and scope.

## 2. Prerequisites & Safety
- Tool/access requirements
- Safety precautions

## 3. Step-by-Step Execution
1. Step one
2. Step two

## 4. Verification & Testing
How to verify normal operation after completion.`,
    },
    {
      id: "incident",
      name: "Incident Postmortem",
      template: `# Incident Report: [Incident Title]
## Date & Severity
- Date: [Date]
- Severity: [Low/Medium/High/Critical]
- Downtime: [Duration]

## Summary
Brief description of the outage or service degradation.

## Root Cause
Detailed technical explanation.

## Corrective Actions
- [ ] Action item 1
- [ ] Action item 2`,
    },
    {
      id: "meeting",
      name: "Meeting Notes",
      template: `# Meeting Notes: [Topic]
**Date:** [Date] | **Attendees:** [Names]

## Agenda & Discussion
- Point 1
- Point 2

## Action Items
- [ ] Task 1 (Assignee: ...)
- [ ] Task 2 (Assignee: ...)`,
    },
    {
      id: "project",
      name: "Project Brief",
      template: `# Project Brief: [Project Name]
## Executive Summary
Problem statement and proposed solution.

## Architecture & Technology Stack
- Frontend / Backend / Database

## Milestone Schedule
- Phase 1: Foundation
- Phase 2: Rollout`,
    },
  ];
}
