import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

/**
 * Hash a plain text password with bcrypt (cost factor 12 per SPEC §16.1)
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a plain text password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Validate password requirements per SPEC F-AUTH-04 (Min 10 characters)
 */
export function validatePasswordStrength(password: string): { valid: boolean; reason?: string } {
  if (!password || password.length < 10) {
    return { valid: false, reason: "Password must be at least 10 characters long" };
  }
  return { valid: true };
}

/**
 * Generate a secure one-time password for new users or password resets
 */
export function generateOneTimePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
