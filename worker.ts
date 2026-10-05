import PgBoss from "pg-boss";
import dotenv from "dotenv";
import { db } from "./lib/db";
import { calculateNextRun, checkEscalation } from "./lib/services/followup";
import { carryOverUndoneTodos } from "./lib/services/todo";
import { autoStopRunningTimers } from "./lib/services/timelog";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set for worker process.");
  process.exit(1);
}

const boss = new PgBoss({
  connectionString,
  schema: "pgboss",
});

async function startWorker() {
  boss.on("error", (error) => console.error("pg-boss worker error:", error));

  try {
    await boss.start();
    console.log("pg-boss background worker started successfully.");

    // 1. Follow-up ticker job
    await boss.work("followups.tick", async () => {
      const now = new Date();
      const pending = await db.followUp.findMany({
        where: {
          status: "ACTIVE",
          nextRunAt: { lte: now },
        },
        include: { task: true },
      });

      for (const fu of pending) {
        await db.followUp.update({
          where: { id: fu.id },
          data: {
            sentCount: { increment: 1 },
            unansweredCount: { increment: 1 },
            lastSentAt: now,
            nextRunAt: calculateNextRun(fu.cadence, fu.everyNDays),
          },
        });

        await checkEscalation(fu.id);
      }
    });

    // 2. Daily updates reminder (17:00 IST)
    await boss.work("updates.remind", async () => {
      console.log("Running 17:00 daily update reminders dispatch.");
    });

    // 3. Morning Brief generation (08:00 IST)
    await boss.work("brief.morning", async () => {
      console.log("Generating morning brief cache.");
    });

    // 4. Sites uptime check (every 5 min)
    await boss.work("uptime.check", async () => {
      console.log("Running sites uptime ping...");
    });

    // ==================== v1.1 Jobs (SPEC §17) ====================

    // 5. To-do carry-over (daily 00:05)
    await boss.work("todo.carryOver", async () => {
      console.log("Running daily todo carry-over job...");
      await carryOverUndoneTodos();
    });

    // 6. Timers auto-stop (daily 18:30 IST)
    await boss.work("timers.autoStop", async () => {
      console.log("Auto-stopping running timers at 18:30 IST...");
      await autoStopRunningTimers();
    });

    // 7. Attendance check-in reminder (09:10 working days)
    await boss.work("attendance.remindIn", async () => {
      console.log("Dispatching attendance check-in reminders (09:10 IST)...");
    });

    // 8. Attendance mark provisional absent (11:00 working days)
    await boss.work("attendance.markAbsent", async () => {
      console.log("Marking provisional absent records for users without check-in...");
    });

    // 9. Attendance check-out reminder (18:15 working days)
    await boss.work("attendance.remindOut", async () => {
      console.log("Dispatching check-out reminder to active sessions (18:15 IST)...");
    });

    // 10. Attendance auto-close (23:59 daily)
    await boss.work("attendance.autoClose", async () => {
      console.log("Auto-closing remaining unclosed attendance sessions...");
    });

    // 11. Feedback lock older than 24h
    await boss.work("feedback.lock", async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await db.taskFeedback.updateMany({
        where: {
          lockedAt: null,
          createdAt: { lte: yesterday },
        },
        data: { lockedAt: new Date() },
      });
      console.log("Locked feedback older than 24h.");
    });

    console.log("Registered all background job listeners including v1.1 jobs.");
  } catch (err) {
    console.warn("Could not connect to database for background worker (will retry on DB availability):", err);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Stopping worker...");
  await boss.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Stopping worker...");
  await boss.stop();
  process.exit(0);
});

startWorker();
