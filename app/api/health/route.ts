import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const timestamp = new Date().toISOString();
  let dbStatus = "disconnected";

  try {
    // Ping DB
    await db.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (error) {
    dbStatus = `unreachable: ${error instanceof Error ? error.message : "unknown"}`;
  }

  const isHealthy = dbStatus === "connected";

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp,
      system: {
        app: "online",
        database: dbStatus,
        version: "1.0.0",
        phase: "Phase 0 (Setup)",
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
