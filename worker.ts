import PgBoss from "pg-boss";
import dotenv from "dotenv";

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

    // Register job handlers
    await boss.work("heartbeat", async (jobs) => {
      for (const job of jobs) {
        console.log(`Worker heartbeat received: ${job.id}`);
      }
    });

    console.log("Registered background job listeners.");
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
