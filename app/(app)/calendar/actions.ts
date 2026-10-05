"use server";

import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createEvent } from "@/lib/services/event";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";
import { EventKind } from "@prisma/client";

export interface CalendarActionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function getCalendarItemsAction(year?: number, month?: number): Promise<CalendarActionResult> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized", data: [] };

  try {
    const events = await prisma.event.findMany({
      include: { attendees: true },
      orderBy: { startAt: "asc" },
    });

    const holidays = await prisma.holiday.findMany({
      orderBy: { date: "asc" },
    });

    const tasks = await prisma.task.findMany({
      where: {
        dueAt: { not: null },
        deletedAt: null,
      },
      select: {
        id: true,
        number: true,
        title: true,
        dueAt: true,
        priority: true,
      },
      take: 50,
    });

    const todos = await prisma.todoItem.findMany({
      where: {
        userId: user.id,
        date: { not: null },
        deletedAt: null,
      },
      take: 50,
    });

    const calendarItems = [
      ...events.map((e) => ({
        id: e.id,
        title: e.title,
        kind: e.kind as string,
        date: format(e.startAt, "yyyy-MM-dd"),
        time: e.allDay ? "All Day" : format(e.startAt, "hh:mm a"),
      })),
      ...holidays.map((h) => ({
        id: h.id,
        title: h.name,
        kind: "HOLIDAY",
        date: format(h.date, "yyyy-MM-dd"),
        time: "All Day",
      })),
      ...tasks.map((t) => ({
        id: t.id,
        title: `[T-${t.number}] ${t.title}`,
        kind: "DEADLINE",
        date: format(t.dueAt!, "yyyy-MM-dd"),
        time: format(t.dueAt!, "hh:mm a"),
      })),
      ...todos.map((td) => ({
        id: td.id,
        title: `[Todo] ${td.title}`,
        kind: "TODO",
        date: format(td.date!, "yyyy-MM-dd"),
        time: td.startAt ? format(td.startAt, "hh:mm a") : "Scheduled",
      })),
    ];

    return { success: true, data: calendarItems };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load calendar", data: [] };
  }
}

export async function createCalendarEventAction(params: {
  title: string;
  kind?: EventKind;
  date: string;
  time?: string;
  location?: string;
  notes?: string;
}): Promise<CalendarActionResult> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const startAt = new Date(`${params.date}T${params.time ? (params.time.includes(":") ? params.time : "10:00") : "10:00"}:00`);
    const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);

    const event = await createEvent(user, {
      title: params.title,
      kind: params.kind || EventKind.MEETING,
      startAt,
      endAt,
      allDay: !params.time,
      location: params.location,
      notes: params.notes,
      attendeeIds: [user.id],
    });

    revalidatePath("/calendar");
    return { success: true, data: event };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create event" };
  }
}
