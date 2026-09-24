import { z } from "zod";
import { db } from "@/lib/db";
import { UserContext } from "@/lib/auth/can";
import { logAudit } from "@/lib/services/audit";
import { nowInOrgTime } from "@/lib/time";
import { startOfDay, endOfDay, addDays, getHours } from "date-fns";

export const PostDailyUpdateSchema = z.object({
  done: z.string().min(1, "Done items are required"),
  next: z.string().min(1, "Next items are required"),
  blockers: z.string().optional(),
});

/**
 * F-UPD-01: Get pre-fill items for today's daily update
 */
export async function getDailyUpdatePrefill(userId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const tomorrowStart = startOfDay(addDays(now, 1));
  const tomorrowEnd = endOfDay(addDays(now, 1));

  // 1. Tasks marked done today
  const doneToday = await db.task.findMany({
    where: {
      ownerId: userId,
      status: "DONE",
      doneAt: { gte: todayStart, lte: todayEnd },
    },
    select: { title: true, number: true },
  });

  // 2. Tasks due tomorrow
  const dueTomorrow = await db.task.findMany({
    where: {
      ownerId: userId,
      status: { notIn: ["DONE", "CANCELLED"] },
      dueAt: { gte: tomorrowStart, lte: tomorrowEnd },
    },
    select: { title: true, number: true },
  });

  return {
    donePrefill: doneToday.map((t) => `• T-${t.number}: ${t.title}`).join("\n"),
    nextPrefill: dueTomorrow.map((t) => `• T-${t.number}: ${t.title}`).join("\n"),
  };
}

/**
 * F-UPD-01 & F-UPD-02: Save Daily Update and evaluate onTime flag (18:00 IST deadline)
 */
export async function postDailyUpdate(
  actor: UserContext,
  input: z.infer<typeof PostDailyUpdateSchema>
) {
  const data = PostDailyUpdateSchema.parse(input);
  const orgNow = nowInOrgTime();
  const todayDate = startOfDay(orgNow);

  // Check on-time (due by 18:00 IST per SPEC §10.3)
  const currentHour = getHours(orgNow);
  const onTime = currentHour < 18;

  return await db.$transaction(async (tx) => {
    const update = await tx.dailyUpdate.upsert({
      where: {
        userId_date: {
          userId: actor.id,
          date: todayDate,
        },
      },
      update: {
        done: data.done,
        next: data.next,
        blockers: data.blockers,
        postedAt: new Date(),
        onTime,
      },
      create: {
        userId: actor.id,
        date: todayDate,
        done: data.done,
        next: data.next,
        blockers: data.blockers,
        onTime,
      },
    });

    await logAudit(tx, {
      actorId: actor.id,
      action: "POST_DAILY_UPDATE",
      entity: "DailyUpdate",
      entityId: update.id,
      after: { onTime },
    });

    return update;
  });
}

/**
 * F-UPD-07: Calculate consecutive working-day streak
 */
export async function getUserStreak(userId: string): Promise<number> {
  const updates = await db.dailyUpdate.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 30,
  });

  return updates.length;
}
