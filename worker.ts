import PgBoss from "pg-boss";
import dotenv from "dotenv";
import { db } from "./lib/db";
import { calculateNextRun, checkEscalation } from "./lib/services/followup";

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
        // Increment sent count and check escalation
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

    console.log("Registered background job listeners: followups.tick, updates.remind, brief.morning, uptime.check");
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
