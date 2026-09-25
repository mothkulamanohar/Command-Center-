import { prisma } from "@/lib/db";
import { can, AuthUser } from "@/lib/auth/can";
import { logAudit } from "./audit";
import { createNotification } from "./notify";
import { EventKind } from "@prisma/client";

export interface CreateEventInput {
  title: string;
  kind?: EventKind;
  startAt: Date;
  endAt: Date;
  allDay?: boolean;
  location?: string;
  notes?: string;
  taskId?: string;
  docId?: string;
  attendeeIds?: string[];
}

export interface ListEventsFilter {
  userId?: string;
  teamId?: string;
  from?: Date;
  to?: Date;
  kind?: EventKind;
}

export async function listEvents(filter: ListEventsFilter = {}) {
  const where: any = {};
  if (filter.kind) where.kind = filter.kind;
  if (filter.from || filter.to) {
    where.startAt = {};
    if (filter.from) where.startAt.gte = filter.from;
    if (filter.to) where.startAt.lte = filter.to;
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      attendees: true,
    },
    orderBy: { startAt: "asc" },
  });

  return events;
}

export async function createEvent(actor: AuthUser, input: CreateEventInput) {
  if (!can(actor, "create_task")) {
    throw new Error("Unauthorized to create events");
  }

  const event = await prisma.event.create({
    data: {
      title: input.title,
      kind: input.kind || EventKind.MEETING,
      startAt: input.startAt,
      endAt: input.endAt,
      allDay: input.allDay || false,
      location: input.location,
      notes: input.notes,
      ownerId: actor.id,
      taskId: input.taskId,
      docId: input.docId,
      attendees: {
        create: (input.attendeeIds || []).map((userId) => ({
          userId,
          status: userId === actor.id ? "ACCEPTED" : "INVITED",
        })),
      },
    },
    include: {
      attendees: true,
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "CREATE",
    entity: "Event",
    entityId: event.id,
    diff: { title: event.title, kind: event.kind, startAt: event.startAt },
  });

  // Notify invited attendees
  for (const attendeeId of input.attendeeIds || []) {
    if (attendeeId !== actor.id) {
      await createNotification({
        userId: attendeeId,
        type: "EVENT_INVITE",
        title: `Invited to: ${event.title}`,
        body: `${actor.name || "A team member"} scheduled a meeting for ${event.startAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
        url: `/calendar`,
      });
    }
  }

  return event;
}

export async function respondToEvent(actor: AuthUser, eventId: string, status: "ACCEPTED" | "DECLINED") {
  const attendee = await prisma.eventAttendee.upsert({
    where: {
      eventId_userId: {
        eventId,
        userId: actor.id,
      },
    },
    update: { status },
    create: {
      eventId,
      userId: actor.id,
      status,
    },
  });

  return attendee;
}

export async function deleteEvent(actor: AuthUser, eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");

  if (actor.role !== "ADMIN" && event.ownerId !== actor.id) {
    throw new Error("Unauthorized to delete event");
  }

  await prisma.eventAttendee.deleteMany({ where: { eventId } });
  await prisma.event.delete({ where: { id: eventId } });

  await logAudit({
    actorId: actor.id,
    action: "DELETE",
    entity: "Event",
    entityId: eventId,
    diff: { title: event.title },
  });

  return { success: true };
}

/**
 * Generates an iCalendar (RFC 5545 .ics) standard feed per SPEC §12.1 (F-CAL-07)
 */
export function generateIcsFeed(events: Array<{
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  location?: string | null;
  notes?: string | null;
}>): string {
  const formatUtc = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IT Command Center//Calendar Engine//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const ev of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${ev.id}@commandcenter.local`);
    lines.push(`DTSTAMP:${formatUtc(new Date())}`);
    lines.push(`DTSTART:${formatUtc(new Date(ev.startAt))}`);
    lines.push(`DTEND:${formatUtc(new Date(ev.endAt))}`);
    lines.push(`SUMMARY:${ev.title.replace(/\n/g, "\\n")}`);
    if (ev.location) lines.push(`LOCATION:${ev.location.replace(/\n/g, "\\n")}`);
    if (ev.notes) lines.push(`DESCRIPTION:${ev.notes.replace(/\n/g, "\\n")}`);
    lines.push("STATUS:CONFIRMED");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
