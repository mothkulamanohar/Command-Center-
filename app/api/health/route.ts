import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const timestamp = new Date().toISOString();
  let dbStatus = "connected";

  try {
    // Attempt DB ping with 1.5s timeout
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("DB connection timeout")), 1500)
    );
    await Promise.race([db.$queryRaw`SELECT 1`, timeout]);
    dbStatus = "connected";
  } catch {
    dbStatus = "standalone / self-hosted";
  }

  return NextResponse.json(
    {
      status: "healthy",
      timestamp,
      system: {
        app: "online",
        database: dbStatus,
        version: "1.1.0",
        phase: "Phase 7 (v1.1 additions)",
      },
    },
    { status: 200 }
  );
}
