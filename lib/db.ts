import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  rawPrisma: PrismaClient | undefined;
};

// Check if PostgreSQL port 5432 is reachable
let isPostgresOnline = false;
let lastCheckTimestamp = 0;
let checkInProgress: Promise<boolean> | null = null;

export function checkDbAvailable(): Promise<boolean> {
  if (typeof window !== "undefined") return Promise.resolve(false);

  const now = Date.now();
  const cacheTtl = isPostgresOnline ? 10000 : 15000;
  if (now - lastCheckTimestamp < cacheTtl) {
    return Promise.resolve(isPostgresOnline);
  }
  if (checkInProgress) return checkInProgress;

  checkInProgress = new Promise<boolean>((resolve) => {
    try {
      const net = require("net");
      const url = process.env.DATABASE_URL || "";
      let host = "127.0.0.1";
      let port = 5432;
      try {
        const parsed = new URL(url.replace(/^postgresql:\/\//, "http://"));
        host = parsed.hostname || "127.0.0.1";
        port = parseInt(parsed.port || "5432", 10);
      } catch {}

      const socket = net.createConnection({ host, port, timeout: 80 });
      socket.on("connect", () => {
        socket.destroy();
        isPostgresOnline = true;
        lastCheckTimestamp = Date.now();
        checkInProgress = null;
        resolve(true);
      });
      socket.on("error", () => {
        socket.destroy();
        isPostgresOnline = false;
        lastCheckTimestamp = Date.now();
        checkInProgress = null;
        resolve(false);
      });
      socket.on("timeout", () => {
        socket.destroy();
        isPostgresOnline = false;
        lastCheckTimestamp = Date.now();
        checkInProgress = null;
        resolve(false);
      });
    } catch {
      isPostgresOnline = false;
      lastCheckTimestamp = Date.now();
      checkInProgress = null;
      resolve(false);
    }
  });

  return checkInProgress;
}

const realPrisma =
  globalForPrisma.rawPrisma ??
  new PrismaClient({
    log: [], // Suppress noisy unhandled engine stderr logs when running offline
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.rawPrisma = realPrisma;

export const db: PrismaClient = new Proxy(realPrisma, {
  get(target: any, prop: string | symbol) {
    if (typeof prop === "string" && (prop.startsWith("$") || prop.startsWith("_"))) {
      if (prop === "$connect" || prop === "$disconnect") {
        return async () => {};
      }
      return target[prop];
    }
    const model = target[prop];
    if (!model || typeof model !== "object") return model;

    return new Proxy(model, {
      get(mTarget: any, mProp: string | symbol) {
        const method = mTarget[mProp];
        if (typeof method !== "function") return method;

        return async function (...args: any[]) {
          const isOnline = await checkDbAvailable();
          if (!isOnline) {
            throw new Error(`Database connection offline: PostgreSQL at localhost:5432 is unreachable.`);
          }
          return method.apply(mTarget, args);
        };
      },
    });
  },
}) as PrismaClient;

export const prisma = db;
