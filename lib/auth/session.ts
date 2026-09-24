import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "@/lib/db";
import { RoleKey } from "@prisma/client";
import { UserContext } from "@/lib/auth/can";

const COOKIE_NAME = "icc_session";
const SECRET = process.env.AUTH_SECRET || "fallback-secret-development-key-32-chars-min";

export interface SessionPayload {
  userId: string;
  expiresAt: number;
}

/**
 * Sign session payload with HMAC-SHA256
 */
function signPayload(payload: string): string {
  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(payload);
  return `${payload}.${hmac.digest("hex")}`;
}

/**
 * Verify and decode HMAC-signed session string
 */
function verifySessionString(sessionString: string): SessionPayload | null {
  const parts = sessionString.split(".");
  if (parts.length !== 2) return null;

  const [payloadBase64, signature] = parts;
  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(payloadBase64);
  const expectedSignature = hmac.digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(payloadBase64, "base64").toString("utf-8");
    const payload = JSON.parse(jsonStr) as SessionPayload;
    if (Date.now() > payload.expiresAt) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Create a session and set HTTP-only cookie
 * 30 days if keepSignedIn is true, else 12 hours (SPEC F-AUTH-01)
 */
export async function createSession(userId: string, keepSignedIn: boolean = false): Promise<void> {
  const durationMs = keepSignedIn
    ? 30 * 24 * 60 * 60 * 1000 // 30 days
    : 12 * 60 * 60 * 1000;      // 12 hours

  const expiresAt = Date.now() + durationMs;
  const payload: SessionPayload = { userId, expiresAt };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");
  const token = signPayload(payloadBase64);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

/**
 * Clear session cookie
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Get the currently authenticated user context from session
 */
export async function getSessionUser(): Promise<UserContext | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie?.value) return null;

  const verified = verifySessionString(sessionCookie.value);
  if (!verified) return null;

  try {
    const user = await db.user.findUnique({
      where: { id: verified.userId },
      select: {
        id: true,
        role: true,
        active: true,
        mustChangePw: true,
        memberships: {
          select: {
            teamId: true,
            isLead: true,
          },
        },
      },
    });

    if (!user || !user.active) return null;

    const teamIds = user.memberships.map((m) => m.teamId);
    const ledTeamIds = user.memberships.filter((m) => m.isLead).map((m) => m.teamId);

    return {
      id: user.id,
      role: user.role,
      teamIds,
      ledTeamIds,
    };
  } catch (error) {
    console.error("Error retrieving session user:", error);
    return null;
  }
}
