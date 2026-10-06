import { z } from "zod";
import { db } from "@/lib/db";
import { can, UserContext } from "@/lib/auth/can";
import { format, startOfYear, endOfYear } from "date-fns";

export const HolidaySchema = z.object({
  date: z.date(),
  name: z.string().min(1).max(100),
  type: z.enum(["NATIONAL", "REGIONAL", "OPTIONAL"]).default("NATIONAL"),
  campusIds: z.array(z.string()).default([]),
});

import { getFestivalsForYear } from "./festivalData";

export async function getHolidays(year = new Date().getFullYear(), campusId?: string) {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 11, 31));

  let dbHolidays: any[] = [];
  try {
    dbHolidays = await db.holiday.findMany({
      where: {
        date: { gte: yearStart, lte: yearEnd },
      },
      orderBy: { date: "asc" },
    });
  } catch {
    // Database offline fallback
    dbHolidays = [];
  }

  const festivals = getFestivalsForYear(year).map((f) => ({
    id: `hol-${f.date}-${f.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
    date: new Date(`${f.date}T00:00:00.000Z`),
    name: f.name,
    type: f.type,
    campusIds: [] as string[],
  }));

  const existingDatesAndNames = new Set(
    dbHolidays.map((h) => `${format(h.date, "yyyy-MM-dd")}_${h.name.toLowerCase().trim()}`)
  );

  const merged = [
    ...dbHolidays,
    ...festivals.filter((f) => !existingDatesAndNames.has(`${f.date.toISOString().split("T")[0]}_${f.name.toLowerCase().trim()}`)),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  if (!campusId) return merged;

  return merged.filter((h) => !h.campusIds || h.campusIds.length === 0 || h.campusIds.includes(campusId));
}

export async function createHoliday(actor: UserContext, input: z.input<typeof HolidaySchema>) {
  if (!can(actor, "settings_manage")) {
    throw new Error("Unauthorized to manage holidays");
  }

  const data = HolidaySchema.parse(input);
  return await db.holiday.upsert({
    where: { date: data.date },
    update: {
      name: data.name,
      type: data.type,
      campusIds: data.campusIds,
    },
    create: {
      date: data.date,
      name: data.name,
      type: data.type,
      campusIds: data.campusIds,
    },
  });
}

export async function deleteHoliday(actor: UserContext, date: Date) {
  if (!can(actor, "settings_manage")) {
    throw new Error("Unauthorized to manage holidays");
  }
  return await db.holiday.delete({ where: { date } });
}

export async function importHolidaysCsv(actor: UserContext, csv: string) {
  if (!can(actor, "settings_manage")) {
    throw new Error("Unauthorized to import holidays");
  }

  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  let count = 0;

  for (const line of lines) {
    // Format: YYYY-MM-DD, Holiday Name, Type, CampusCode(optional)
    const parts = line.split(",").map((s) => s.trim());
    if (parts.length >= 2) {
      const dateStr = parts[0];
      const name = parts[1];
      const type = parts[2] || "NATIONAL";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;

      const date = new Date(`${dateStr}T00:00:00.000Z`);
      await db.holiday.upsert({
        where: { date },
        update: { name, type },
        create: { date, name, type, campusIds: [] },
      });
      count++;
    }
  }

  return { importedCount: count };
}
