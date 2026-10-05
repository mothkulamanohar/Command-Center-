"use server";

import { authenticateUser } from "@/lib/services/user";
import { createSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { RoleKey } from "@prisma/client";

export interface LoginActionResult {
  success: boolean;
  error?: string;
  mustChangePw?: boolean;
}

// Fallback in-memory tracking if database is offline or restarting
const fallbackAttempts = new Map<string, { count: number; lockedUntil: number }>();
const FALLBACK_DEFAULT_HASH = "$2a$12$7kPsk2rU3YpEms2o1U05F.uLd3QoE09qGk3eW.44BvGg49B61E8Uq"; // ChangeMe!2026

export async function loginAction(
  prevState: unknown,
  formData: FormData
): Promise<LoginActionResult> {
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const password = (formData.get("password") as string) || "";
  const keepMeSignedIn = formData.get("keepMeSignedIn") === "on";

  if (!email || !password) {
    return { success: false, error: "Email or password is wrong" };
  }

  // 1. Check fallback memory lockout first
  const now = Date.now();
  const attemptRecord = fallbackAttempts.get(email);
  if (attemptRecord && attemptRecord.lockedUntil > now) {
    const minutesLeft = Math.ceil((attemptRecord.lockedUntil - now) / 60000);
    return {
      success: false,
      error: `Account is locked due to 5 failed attempts. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`,
    };
  }

  try {
    // 2. Try primary database authentication with bcrypt & DB lockout (SPEC F-AUTH-01)
    const result = await authenticateUser({
      email,
      password,
      keepMeSignedIn,
    });

    if (result.success && result.user) {
      fallbackAttempts.delete(email);
      await createSession(result.user.id, keepMeSignedIn);
      return {
        success: true,
        mustChangePw: result.user.mustChangePw,
      };
    }

    if (result.error && result.error.includes("locked")) {
      return { success: false, error: result.error };
    }
  } catch (dbErr) {
    // 3. Fallback authentication when PostgreSQL container is offline in dev
    if (process.env.NODE_ENV === "development") {
      const isSri = email === "sri@smru.in" || email.startsWith("sri");
      const isHari = email === "hari@smru.in" || email.startsWith("hari");

      if (isSri || isHari) {
      const isValid = await verifyPassword(password, FALLBACK_DEFAULT_HASH).catch(() => password === "ChangeMe!2026");
      if (isValid) {
        fallbackAttempts.delete(email);
        const userId = isHari ? "u_hari" : "u_sri";
        await createSession(userId, keepMeSignedIn);
        return { success: true, mustChangePw: false };
      }
    }
  }
}
  // Record failed attempt for 5-attempt/15-min lockout per SPEC F-AUTH-01
  const cur = fallbackAttempts.get(email) || { count: 0, lockedUntil: 0 };
  const newCount = cur.count + 1;
  if (newCount >= 5) {
    fallbackAttempts.set(email, { count: 0, lockedUntil: now + 15 * 60 * 1000 });
    return {
      success: false,
      error: "Account is locked due to 5 failed attempts. Please try again in 15 minutes.",
    };
  } else {
    fallbackAttempts.set(email, { count: newCount, lockedUntil: 0 });
  }

  return { success: false, error: "Email or password is wrong" };
}
