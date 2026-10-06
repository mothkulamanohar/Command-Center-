import crypto from "crypto";
import { db, checkDbAvailable } from "@/lib/db";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import {
  findRegisteredUserByEmail,
  findRegisteredUserByMobile,
  findRegisteredUserById,
  resetRegisteredUserPassword,
  normalizeMobile,
} from "@/lib/auth/registeredUsers";
import {
  sendRecoverySms,
  sendRecoveryEmail,
  getSmsProviderStatus,
  getEmailProviderStatus,
} from "@/lib/services/communication";
import { logAudit } from "@/lib/services/audit";

export interface RecoveryRequestResult {
  success: boolean;
  configured?: boolean;
  message?: string;
  error?: string;
  method?: "mobile" | "email";
  cooldownSeconds?: number;
}

export interface VerificationResult {
  success: boolean;
  resetToken?: string;
  error?: string;
  attemptsLeft?: number;
}

export interface ResetPasswordResult {
  success: boolean;
  message?: string;
  error?: string;
}

// In-memory active recovery session
interface RecoverySession {
  sessionId: string;
  userId: string;
  method: "mobile" | "email";
  identifier: string; // normalized mobile or email
  codeHash: string;
  salt: string;
  createdAt: number;
  expiresAt: number; // 10 minutes from creation
  attemptsLeft: number; // max 3 attempts
  lastSentAt: number;
}

// In-memory active single-use reset tokens
interface ActiveResetToken {
  userId: string;
  nonce: string;
  expiresAt: number;
}

const activeSessions = new Map<string, RecoverySession>(); // key: identifier
const activeResetTokens = new Map<string, ActiveResetToken>(); // key: tokenNonce
const requestRateLimits = new Map<string, number[]>(); // key: identifier, value: timestamps

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RESET_TOKEN_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 3;
const MAX_REQUESTS_PER_WINDOW = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getSecretKey(): string {
  return process.env.AUTH_SECRET || "icc-account-recovery-secret-key-32chars";
}

function hashCode(code: string, salt: string): string {
  return crypto
    .createHmac("sha256", getSecretKey())
    .update(`${code}:${salt}`)
    .digest("hex");
}

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const timestamps = requestRateLimits.get(identifier) || [];
  const valid = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (valid.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  valid.push(now);
  requestRateLimits.set(identifier, valid);
  return true;
}

/**
 * Request Mobile OTP for Account Recovery
 */
export async function requestMobileOtp(
  rawMobile: string
): Promise<RecoveryRequestResult> {
  const cleaned = rawMobile.replace(/\D/g, "");
  if (cleaned.length < 10) {
    return {
      success: false,
      error: "Please enter a valid 10-digit registered mobile number.",
    };
  }

  const normalized = normalizeMobile(rawMobile);
  const last10 = cleaned.slice(-10);

  // Check rate limit
  if (!checkRateLimit(last10)) {
    return {
      success: false,
      error: "Too many recovery attempts. Please try again after 15 minutes.",
    };
  }

  // Check resend cooldown
  const existingSession = activeSessions.get(last10);
  const now = Date.now();
  if (
    existingSession &&
    now - existingSession.lastSentAt < RESEND_COOLDOWN_MS
  ) {
    const remaining = Math.ceil(
      (RESEND_COOLDOWN_MS - (now - existingSession.lastSentAt)) / 1000
    );
    return {
      success: false,
      error: `Please wait ${remaining} second${remaining > 1 ? "s" : ""} before requesting a new OTP.`,
      cooldownSeconds: remaining,
    };
  }

  // Check provider status
  const providerStatus = getSmsProviderStatus();
  if (!providerStatus.isConfigured) {
    return {
      success: false,
      configured: false,
      method: "mobile",
      error: "Mobile OTP recovery is currently unavailable. Please use email recovery.",
    };
  }

  // Find user by phone number
  let targetUserId: string | null = null;
  try {
    const isOnline = await checkDbAvailable();
    if (isOnline) {
      const dbUser = await db.user.findFirst({
        where: { phone: { contains: last10 } },
      });
      if (dbUser) {
        targetUserId = dbUser.id;
      }
    }
  } catch {
    // Database offline
  }

  if (!targetUserId) {
    const regUser = findRegisteredUserByMobile(rawMobile);
    if (regUser && regUser.active) {
      targetUserId = regUser.id;
    }
  }

  // If user does not exist or is inactive, do NOT generate OTP, do NOT send SMS, return safe message
  if (!targetUserId) {
    return {
      success: true,
      method: "mobile",
      message:
        "If the information matches an existing account, a verification code will be sent.",
      cooldownSeconds: 60,
    };
  }

  // Generate secure 6-digit numeric OTP
  const otp = crypto.randomInt(100000, 1000000).toString();
  const salt = crypto.randomBytes(16).toString("hex");
  const codeHash = hashCode(otp, salt);

  // Invalidate any previous session for this identifier
  activeSessions.delete(last10);

  // Store new session with 10-minute expiry and max 3 attempts
  activeSessions.set(last10, {
    sessionId: crypto.randomUUID(),
    userId: targetUserId,
    method: "mobile",
    identifier: last10,
    codeHash,
    salt,
    createdAt: now,
    expiresAt: now + OTP_EXPIRY_MS,
    attemptsLeft: MAX_ATTEMPTS,
    lastSentAt: now,
  });

  // Dispatch OTP via real SMS provider
  const sendResult = await sendRecoverySms(normalized, otp);
  if (!sendResult.success) {
    activeSessions.delete(last10);
    return {
      success: false,
      configured: sendResult.configured,
      error: "Mobile OTP recovery is currently unavailable. Please use email recovery.",
    };
  }

  return {
    success: true,
    method: "mobile",
    message: "OTP sent to your registered mobile number.",
    cooldownSeconds: 60,
  };
}

/**
 * Request Email Verification Code for Account Recovery
 */
export async function requestEmailVerification(
  rawEmail: string
): Promise<RecoveryRequestResult> {
  const normalized = (rawEmail || "").trim().toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return {
      success: false,
      error: "Please enter a valid registered work email address.",
    };
  }

  // Check rate limit
  if (!checkRateLimit(normalized)) {
    return {
      success: false,
      error: "Too many recovery attempts. Please try again after 15 minutes.",
    };
  }

  // Check resend cooldown
  const existingSession = activeSessions.get(normalized);
  const now = Date.now();
  if (
    existingSession &&
    now - existingSession.lastSentAt < RESEND_COOLDOWN_MS
  ) {
    const remaining = Math.ceil(
      (RESEND_COOLDOWN_MS - (now - existingSession.lastSentAt)) / 1000
    );
    return {
      success: false,
      error: `Please wait ${remaining} second${remaining > 1 ? "s" : ""} before requesting a new code.`,
      cooldownSeconds: remaining,
    };
  }

  // Check provider status
  const providerStatus = getEmailProviderStatus();
  if (!providerStatus.isConfigured) {
    return {
      success: false,
      configured: false,
      method: "email",
      error: "Email recovery is currently unavailable. Please contact the system administrator.",
    };
  }

  // Find user by email
  let targetUserId: string | null = null;
  try {
    const isOnline = await checkDbAvailable();
    if (isOnline) {
      const dbUser = await db.user.findUnique({
        where: { email: normalized },
      });
      if (dbUser) {
        targetUserId = dbUser.id;
      }
    }
  } catch {
    // Database offline
  }

  if (!targetUserId) {
    const regUser = findRegisteredUserByEmail(normalized);
    if (regUser && regUser.active) {
      targetUserId = regUser.id;
    }
  }

  // If user does not exist or is inactive, do NOT generate code, do NOT send email, return safe message
  if (!targetUserId) {
    return {
      success: true,
      method: "email",
      message:
        "If the information matches an existing account, a verification code will be sent.",
      cooldownSeconds: 60,
    };
  }

  // Generate secure 6-digit numeric verification code
  const code = crypto.randomInt(100000, 1000000).toString();
  const salt = crypto.randomBytes(16).toString("hex");
  const codeHash = hashCode(code, salt);

  // Invalidate any previous session for this identifier
  activeSessions.delete(normalized);

  // Store new session with 10-minute expiry and max 3 attempts
  activeSessions.set(normalized, {
    sessionId: crypto.randomUUID(),
    userId: targetUserId,
    method: "email",
    identifier: normalized,
    codeHash,
    salt,
    createdAt: now,
    expiresAt: now + OTP_EXPIRY_MS,
    attemptsLeft: MAX_ATTEMPTS,
    lastSentAt: now,
  });

  // Dispatch code via real email service
  const sendResult = await sendRecoveryEmail(normalized, code);
  if (!sendResult.success) {
    activeSessions.delete(normalized);
    return {
      success: false,
      configured: sendResult.configured,
      error: "Email recovery is currently unavailable. Please contact the system administrator.",
    };
  }

  return {
    success: true,
    method: "email",
    message: "Verification code sent to your registered email.",
    cooldownSeconds: 60,
  };
}

/**
 * Verify OTP or Email Verification Code
 */
export async function verifyRecoveryOtpOrCode(
  method: "mobile" | "email",
  rawIdentifier: string,
  enteredCode: string
): Promise<VerificationResult> {
  const code = (enteredCode || "").trim();
  if (!/^\d{6}$/.test(code)) {
    return {
      success: false,
      error: "Please enter a valid 6-digit numeric verification code.",
    };
  }

  const lookupKey =
    method === "mobile"
      ? rawIdentifier.replace(/\D/g, "").slice(-10)
      : rawIdentifier.trim().toLowerCase();

  const session = activeSessions.get(lookupKey);
  const now = Date.now();

  if (!session) {
    return {
      success: false,
      error: "No active verification session found. Please request a new code.",
    };
  }

  // Check expiry (10 minutes)
  if (now > session.expiresAt) {
    activeSessions.delete(lookupKey);
    return {
      success: false,
      error: "Verification code has expired. Please request a new code.",
    };
  }

  // Check attempts remaining
  if (session.attemptsLeft <= 0) {
    activeSessions.delete(lookupKey);
    return {
      success: false,
      error:
        "Too many failed attempts. This code has been invalidated. Please request a new code.",
    };
  }

  // Timing safe HMAC comparison
  const calculatedHash = hashCode(code, session.salt);
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(calculatedHash, "hex"),
    Buffer.from(session.codeHash, "hex")
  );

  if (!isMatch) {
    session.attemptsLeft -= 1;
    if (session.attemptsLeft <= 0) {
      activeSessions.delete(lookupKey);
      return {
        success: false,
        attemptsLeft: 0,
        error:
          "Invalid verification code. Maximum attempts exceeded. Please request a new code.",
      };
    }
    return {
      success: false,
      attemptsLeft: session.attemptsLeft,
      error: `Invalid verification code. ${session.attemptsLeft} attempt${session.attemptsLeft > 1 ? "s" : ""} remaining.`,
    };
  }

  // Verification succeeded! Invalidate recovery session immediately (single-use)
  const userId = session.userId;
  activeSessions.delete(lookupKey);

  // Generate signed, single-use reset token
  const nonce = crypto.randomUUID();
  const tokenExpiresAt = now + RESET_TOKEN_EXPIRY_MS;
  const tokenPayload = `${userId}:${tokenExpiresAt}:${nonce}`;
  const signature = crypto
    .createHmac("sha256", getSecretKey())
    .update(tokenPayload)
    .digest("hex");
  const resetToken = `${tokenPayload}:${signature}`;

  // Register active reset token
  activeResetTokens.set(nonce, {
    userId,
    nonce,
    expiresAt: tokenExpiresAt,
  });

  return {
    success: true,
    resetToken,
  };
}

/**
 * Reset Password using verified Reset Token
 */
export async function resetUserPasswordWithRecoveryToken(
  resetToken: string,
  newPassword: string,
  confirmPassword: string
): Promise<ResetPasswordResult> {
  // Validate match
  if (!newPassword || newPassword !== confirmPassword) {
    return {
      success: false,
      error: "New password and confirm password do not match.",
    };
  }

  // Validate length & strength per SPEC F-AUTH-04
  const strength = validatePasswordStrength(newPassword);
  if (!strength.valid) {
    return {
      success: false,
      error: strength.reason || "Password must be at least 10 characters long.",
    };
  }

  // Verify token format: userId:expiresAt:nonce:signature
  const parts = (resetToken || "").split(":");
  if (parts.length !== 4) {
    return {
      success: false,
      error:
        "Reset session is invalid. Please start the recovery process again.",
    };
  }

  const [userId, expiresAtStr, nonce, receivedSignature] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  const now = Date.now();

  if (isNaN(expiresAt) || now > expiresAt) {
    activeResetTokens.delete(nonce);
    return {
      success: false,
      error:
        "Password reset session has expired. Please start the recovery process again.",
    };
  }

  // Verify HMAC signature
  const expectedPayload = `${userId}:${expiresAtStr}:${nonce}`;
  const expectedSignature = crypto
    .createHmac("sha256", getSecretKey())
    .update(expectedPayload)
    .digest("hex");

  const isSigValid = crypto.timingSafeEqual(
    Buffer.from(receivedSignature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );

  if (!isSigValid) {
    return {
      success: false,
      error:
        "Invalid reset token signature. Please start the recovery process again.",
    };
  }

  // Check if nonce is active (single-use check)
  const activeToken = activeResetTokens.get(nonce);
  if (!activeToken || activeToken.userId !== userId) {
    return {
      success: false,
      error:
        "This reset token has already been used or is expired. Please start over.",
    };
  }

  // Invalidate reset token immediately (single-use)
  activeResetTokens.delete(nonce);

  // Verify that target account exists in database or registered catalog
  const regUser = findRegisteredUserById(userId);
  let dbUserExists = false;
  try {
    const isOnline = await checkDbAvailable();
    if (isOnline) {
      const dbUser = await db.user.findUnique({ where: { id: userId } });
      if (dbUser && dbUser.active) {
        dbUserExists = true;
      }
    }
  } catch {}

  if (!regUser && !dbUserExists) {
    return {
      success: false,
      error: "Account not found. Password recovery is only permitted for existing registered accounts.",
    };
  }

  // Update password in existing database and registered users store
  try {
    const isOnline = await checkDbAvailable();
    if (isOnline) {
      const newHash = await hashPassword(newPassword);
      await db.user.update({
        where: { id: userId },
        data: {
          passwordHash: newHash,
          mustChangePw: false,
          failedLogins: 0,
          lockedUntil: null,
        },
      });

      await logAudit(db, {
        actorId: userId,
        action: "PASSWORD_RECOVERY_RESET",
        entity: "User",
        entityId: userId,
      });
    }
  } catch {
    // Database offline or table missing, update registered users catalog
  }

  // Update registered users catalog
  const catalogResult = await resetRegisteredUserPassword(userId, newPassword);
  if (!catalogResult.success) {
    // Fallback: check if user exists in DB
    const isOnline = await checkDbAvailable().catch(() => false);
    if (!isOnline) {
      return {
        success: false,
        error: catalogResult.error || "Unable to update account password.",
      };
    }
  }

  return {
    success: true,
    message: "Password reset successfully.",
  };
}

/**
 * Automated test helper functions
 */
export function _expireSessionForTest(rawIdentifier: string): void {
  const lookupKey = rawIdentifier.includes("@")
    ? rawIdentifier.trim().toLowerCase()
    : rawIdentifier.replace(/\D/g, "").slice(-10);

  const session = activeSessions.get(lookupKey);
  if (session) {
    session.expiresAt = Date.now() - 1000; // expired in past
  }
}

export function _clearRecoveryStateForTest(): void {
  activeSessions.clear();
  activeResetTokens.clear();
  requestRateLimits.clear();
}
