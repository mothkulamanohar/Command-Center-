import { db } from "@/lib/db";
import { UserContext } from "@/lib/auth/can";

export interface MorningBriefData {
  date: string;
  meetingsToday: { id: string; title: string; time: string; location?: string | null }[];
  dueToday: { id: string; number: number; title: string; priority: string }[];
  overdue: { id: string; number: number; title: string; dueAt: string }[];
  leadershipAsks: { id: string; number: number; title: string; requesterName?: string | null }[];
  chasesToday: { id: string; targetName: string; taskTitle: string; tone: string }[];
  stuckItems: { id: string; number: number; title: string; daysStale: number }[];
  yesterdayBlockers: { userName: string; blockerText: string }[];
  downSites: { id: string; domain: string; status: string }[];
  newRequestsCount: number;
  summaryText: string;
}

export interface EveningWrapData {
  date: string;
  doneTodayCount: number;
  doneTasks: { number: number; title: string; ownerName: string }[];
  slippedCount: number;
  slippedTasks: { number: number; title: string; ownerName: string }[];
  missedUpdatesUsers: string[];
  tomorrowTopTasks: { number: number; title: string; ownerName: string; priority: string }[];
  summaryText: string;
}

/**
 * F-NOTIF-04: Morning Brief generation (08:00 IST)
 */
export async function generateMorningBrief(user: UserContext): Promise<MorningBriefData> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // 1. Due today & Overdue
  const [dueTodayTasks, overdueTasks] = await Promise.all([
    db.task.findMany({
      where: {
        ownerId: user.id,
        dueAt: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["DONE", "CANCELLED"] },
      },
      take: 5,
    }),
    db.task.findMany({
      where: {
        ownerId: user.id,
        dueAt: { lt: startOfDay },
        status: { notIn: ["DONE", "CANCELLED"] },
      },
      take: 5,
    }),
  ]);

  // 2. Open leadership asks
  const leadershipTasks = await db.task.findMany({
    where: {
      source: "LEADERSHIP",
      status: { notIn: ["DONE", "CANCELLED"] },
    },
    take: 5,
  });

  // 3. Follow-ups scheduled for today
  const chases = await db.followUp.findMany({
    where: {
      onBehalfOfId: user.id,
      status: "ACTIVE",
      nextRunAt: { lte: endOfDay },
    },
    include: { task: true },
    take: 5,
  });

  // 4. Stuck tasks (no activity in >= 3 days)
  const stuck = await db.task.findMany({
    where: {
      ownerId: user.id,
      status: { in: ["TODO", "IN_PROGRESS", "BLOCKED"] },
      lastActivityAt: { lt: threeDaysAgo },
    },
    take: 5,
  });

  // 5. Yesterday's blockers from daily updates
  const yesterdayUpdates = await db.dailyUpdate.findMany({
    where: {
      blockers: { not: null },
    },
    orderBy: { postedAt: "desc" },
    take: 5,
  });

  // 6. New pending requests
  const newRequestsCount = await db.request.count({
    where: { state: "NEW" },
  });

  const dueToday = dueTodayTasks.map((t) => ({
    id: t.id,
    number: t.number,
    title: t.title,
    priority: t.priority,
  }));

  const overdue = overdueTasks.map((t) => ({
    id: t.id,
    number: t.number,
    title: t.title,
    dueAt: t.dueAt ? t.dueAt.toLocaleDateString("en-IN") : "Overdue",
  }));

  const leadershipAsks = leadershipTasks.map((t) => ({
    id: t.id,
    number: t.number,
    title: t.title,
    requesterName: t.requesterName,
  }));

  const chasesToday = chases.map((c) => ({
    id: c.id,
    targetName: "Team member",
    taskTitle: c.task.title,
    tone: c.template,
  }));

  const stuckItems = stuck.map((s) => ({
    id: s.id,
    number: s.number,
    title: s.title,
    daysStale: Math.floor((now.getTime() - s.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24)),
  }));

  const yesterdayBlockers = yesterdayUpdates.map((u) => ({
    userName: "Team Member",
    blockerText: u.blockers || "",
  }));

  const userRecord = await db.user.findUnique({
    where: { id: user.id },
    select: { name: true },
  });
  const displayName = userRecord?.name || "Sri";

  const summaryLines = [
    `Good morning, ${displayName}! Here is your briefing for today:`,
    `- **${dueToday.length} tasks** due today, **${overdue.length} overdue**.`,
    leadershipAsks.length > 0
      ? `- **${leadershipAsks.length} open leadership ask(s)** requiring tracking.`
      : null,
    chasesToday.length > 0
      ? `- **${chasesToday.length} automated follow-up(s)** scheduled for dispatch.`
      : null,
    newRequestsCount > 0 ? `- **${newRequestsCount} new request(s)** in your inbox.` : null,
  ].filter(Boolean);

  return {
    date: now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
    meetingsToday: [],
    dueToday,
    overdue,
    leadershipAsks,
    chasesToday,
    stuckItems,
    yesterdayBlockers,
    downSites: [],
    newRequestsCount,
    summaryText: summaryLines.join("\n"),
  };
}

/**
 * F-NOTIF-05: Evening Wrap generation (18:30 IST)
 */
export async function generateEveningWrap(): Promise<EveningWrapData> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  // 1. Done today
  const doneToday = await db.task.findMany({
    where: {
      status: "DONE",
      doneAt: { gte: startOfDay, lte: endOfDay },
    },
    include: { owner: true },
  });

  // 2. Slipped today (due today but not done)
  const slipped = await db.task.findMany({
    where: {
      status: { notIn: ["DONE", "CANCELLED"] },
      dueAt: { gte: startOfDay, lte: endOfDay },
    },
    include: { owner: true },
  });

  const doneTasks = doneToday.map((t) => ({
    number: t.number,
    title: t.title,
    ownerName: t.owner.name,
  }));

  const slippedTasks = slipped.map((t) => ({
    number: t.number,
    title: t.title,
    ownerName: t.owner.name,
  }));

  const summary = `Evening wrap: ${doneTasks.length} task(s) completed today across all campuses. ${slippedTasks.length} slipped past today's target.`;

  return {
    date: now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
    doneTodayCount: doneTasks.length,
    doneTasks,
    slippedCount: slippedTasks.length,
    slippedTasks,
    missedUpdatesUsers: [],
    tomorrowTopTasks: [],
    summaryText: summary,
  };
}
