import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateOneTimePassword,
} from "@/lib/auth/password";

describe("Password Security & Policy (F-AUTH-04)", () => {
  it("enforces minimum 10 characters length policy", () => {
    expect(validatePasswordStrength("short").valid).toBe(false);
    expect(validatePasswordStrength("123456789").valid).toBe(false);
    expect(validatePasswordStrength("1234567890").valid).toBe(true);
    expect(validatePasswordStrength("SecurePassword!2026").valid).toBe(true);
  });

  it("hashes and verifies passwords accurately with bcrypt", async () => {
    const raw = "ChangeMe!2026";
    const hashed = await hashPassword(raw);
    expect(hashed).not.toBe(raw);
    expect(hashed.startsWith("$2")).toBe(true); // bcrypt prefix

    const match = await verifyPassword(raw, hashed);
    expect(match).toBe(true);

    const wrongMatch = await verifyPassword("WrongPassword!", hashed);
    expect(wrongMatch).toBe(false);
  });

  it("generates random 12-character one-time passwords", () => {
    const pwd1 = generateOneTimePassword();
    const pwd2 = generateOneTimePassword();
    expect(pwd1.length).toBe(12);
    expect(pwd2.length).toBe(12);
    expect(pwd1).not.toBe(pwd2);
  });
});
