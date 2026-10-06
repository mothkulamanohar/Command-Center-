import { describe, it, expect, vi, beforeEach } from "vitest";
import { loginAction, forgotPasswordAction } from "@/app/(auth)/login/actions";
import { authenticateUser, requestPasswordReset } from "@/lib/services/user";
import { getSessionUser, createSession, destroySession } from "@/lib/auth/session";
import { verifyRegisteredUserCredentials, isRegisteredEmail } from "@/lib/auth/registeredUsers";

// Mock next/headers cookie store for session testing
const cookieStoreMap = new Map<string, { value: string; [key: string]: any }>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (key: string) => cookieStoreMap.get(key),
    set: (key: string, value: string, options?: any) => {
      if (options?.maxAge === 0 || options?.expires?.getTime() === 0) {
        cookieStoreMap.delete(key);
      } else {
        cookieStoreMap.set(key, { value, ...options });
      }
    },
    delete: (key: string) => {
      cookieStoreMap.delete(key);
    },
  }),
}));

describe("Strict Authentication & Login Flow (USER SPEC)", () => {
  beforeEach(() => {
    cookieStoreMap.clear();
  });

  // TEST 1: Correct registered email + correct password -> Login succeeds
  it("TEST 1: Correct registered email + correct password succeeds and creates session", async () => {
    const formData = new FormData();
    formData.append("email", "sri@smru.in");
    formData.append("password", "ChangeMe!2026");

    const result = await loginAction(null, formData);
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();

    // Session cookie was created
    expect(cookieStoreMap.has("icc_session")).toBe(true);
    const sessionUser = await getSessionUser();
    expect(sessionUser).not.toBeNull();
    expect(sessionUser?.id).toBe("u_sri");
    expect(sessionUser?.name).toBe("Sri");
  });

  it("TEST 1 (Hari): Correct registered email for Hari succeeds", async () => {
    const formData = new FormData();
    formData.append("email", "hari@smru.in");
    formData.append("password", "ChangeMe!2026");

    const result = await loginAction(null, formData);
    expect(result.success).toBe(true);

    const sessionUser = await getSessionUser();
    expect(sessionUser?.id).toBe("u_hari");
    expect(sessionUser?.name).toBe("Hari");
  });

  // TEST 2: Correct registered email + wrong password -> Login fails
  it("TEST 2: Correct registered email + wrong password fails and blocks access", async () => {
    const formData = new FormData();
    formData.append("email", "sri@smru.in");
    formData.append("password", "WrongPassword!2026");

    const result = await loginAction(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid email or password.");

    // No session created
    expect(cookieStoreMap.has("icc_session")).toBe(false);
    const sessionUser = await getSessionUser();
    expect(sessionUser).toBeNull();
  });

  // TEST 3: Unregistered email + any password -> Login fails
  it("TEST 3: Unregistered email + any password fails and blocks access", async () => {
    const formData = new FormData();
    formData.append("email", "unregistered.user@external.com");
    formData.append("password", "ChangeMe!2026");

    const result = await loginAction(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid email or password.");

    // No session created
    expect(cookieStoreMap.has("icc_session")).toBe(false);
    const sessionUser = await getSessionUser();
    expect(sessionUser).toBeNull();
  });

  // TEST 4: Wrong email + wrong password -> Login fails
  it("TEST 4: Wrong email + wrong password fails", async () => {
    const formData = new FormData();
    formData.append("email", "wrong@smru.in");
    formData.append("password", "completely_wrong_password");

    const result = await loginAction(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid email or password.");

    // No session created
    expect(cookieStoreMap.has("icc_session")).toBe(false);
  });

  // TEST 5: Empty email + password -> Login fails with validation message
  it("TEST 5: Empty email + password fails with clear validation message", async () => {
    const formData = new FormData();
    formData.append("email", "");
    formData.append("password", "ChangeMe!2026");

    const result = await loginAction(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Please enter your email address.");
    expect(cookieStoreMap.has("icc_session")).toBe(false);
  });

  // TEST 6: Email + empty password -> Login fails with validation message
  it("TEST 6: Email + empty password fails with clear validation message", async () => {
    const formData = new FormData();
    formData.append("email", "sri@smru.in");
    formData.append("password", "");

    const result = await loginAction(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Please enter your password.");
    expect(cookieStoreMap.has("icc_session")).toBe(false);
  });

  it("TEST 5 & 6 combo: Both empty fails with validation message", async () => {
    const formData = new FormData();
    formData.append("email", "");
    formData.append("password", "");

    const result = await loginAction(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Please enter both email and password.");
    expect(cookieStoreMap.has("icc_session")).toBe(false);
  });

  // TEST 7: Click "Forgot Password?" & request password reset
  it("TEST 7: Password reset request returns secure message without revealing email existence", async () => {
    // Valid registered email
    const form1 = new FormData();
    form1.append("email", "sri@smru.in");
    const res1 = await forgotPasswordAction(null, form1);
    expect(res1.success).toBe(true);
    expect(res1.message).toContain("If an account with that email exists");

    // Unregistered valid email format
    const form2 = new FormData();
    form2.append("email", "nonexistent@smru.in");
    const res2 = await forgotPasswordAction(null, form2);
    expect(res2.success).toBe(true);
    // Identical message prevents email enumeration
    expect(res2.message).toBe(res1.message);

    // Empty email
    const form3 = new FormData();
    form3.append("email", "");
    const res3 = await forgotPasswordAction(null, form3);
    expect(res3.success).toBe(false);
    expect(res3.error).toBe("Please enter your work email.");

    // Invalid email format
    const form4 = new FormData();
    form4.append("email", "invalid-email-format");
    const res4 = await forgotPasswordAction(null, form4);
    expect(res4.success).toBe(false);
    expect(res4.error).toBe("Please enter a valid work email address.");
  });

  // TEST 8: Unauthenticated access protection
  it("TEST 8: Direct access without session returns null user context", async () => {
    cookieStoreMap.clear();
    const user = await getSessionUser();
    expect(user).toBeNull();
  });

  // TEST 9: Authenticated user logs out -> session ended
  it("TEST 9: Logout terminates session and protected access is denied", async () => {
    // 1. Log in
    const formData = new FormData();
    formData.append("email", "sri@smru.in");
    formData.append("password", "ChangeMe!2026");
    const loginRes = await loginAction(null, formData);
    expect(loginRes.success).toBe(true);
    expect(cookieStoreMap.has("icc_session")).toBe(true);

    // Verify user is authenticated
    const userBeforeLogout = await getSessionUser();
    expect(userBeforeLogout).not.toBeNull();

    // 2. Perform logout
    await destroySession();

    // 3. Verify session cookie is deleted and user context is null
    expect(cookieStoreMap.has("icc_session")).toBe(false);
    const userAfterLogout = await getSessionUser();
    expect(userAfterLogout).toBeNull();
  });
});
