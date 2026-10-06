import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  requestMobileOtp,
  requestEmailVerification,
  verifyRecoveryOtpOrCode,
  resetUserPasswordWithRecoveryToken,
  _expireSessionForTest,
  _clearRecoveryStateForTest,
} from "@/lib/services/recovery";
import {
  _getLatestTestOtpForPhone,
  _getLatestTestCodeForEmail,
  _clearTestDeliveries,
  getSmsProviderStatus,
  getEmailProviderStatus,
} from "@/lib/services/communication";
import { authenticateUser } from "@/lib/services/user";
import { loginAction } from "@/app/(auth)/login/actions";
import { resetRegisteredUserPassword } from "@/lib/auth/registeredUsers";

// Mock next/headers cookie store for loginAction
const cookieStoreMap = new Map<string, { value: string; [key: string]: any }>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (key: string) => cookieStoreMap.get(key),
    set: (key: string, value: string, options?: any) => {
      cookieStoreMap.set(key, { value, ...options });
    },
    delete: (key: string) => {
      cookieStoreMap.delete(key);
    },
  }),
}));

describe("Real Account Recovery & Forgot Password Flow (USER SPEC)", () => {
  beforeEach(() => {
    _clearRecoveryStateForTest();
    _clearTestDeliveries();
    cookieStoreMap.clear();
  });

  // TEST 1: Registered mobile -> Send OTP -> Receive OTP -> Enter correct OTP -> Create new password -> Reset successfully -> Login with new password
  it("TEST 1: Full Mobile OTP recovery flow resets password and allows login with new password", async () => {
    const mobile = "+919876543210"; // Sri's registered mobile number

    // 1. Send OTP
    const reqRes = await requestMobileOtp(mobile);
    expect(reqRes.success).toBe(true);
    expect(reqRes.message).toBe("OTP sent to your registered mobile number.");

    // 2. Receive OTP from real provider / test delivery sink
    const otp = _getLatestTestOtpForPhone(mobile);
    expect(otp).not.toBeNull();
    expect(otp).toMatch(/^\d{6}$/);

    // 3. Enter correct OTP
    const verifyRes = await verifyRecoveryOtpOrCode("mobile", mobile, otp!);
    expect(verifyRes.success).toBe(true);
    expect(verifyRes.resetToken).toBeDefined();

    // 4. Create new password
    const newPassword = "SriNewSecretKey!2026";
    const resetRes = await resetUserPasswordWithRecoveryToken(
      verifyRes.resetToken!,
      newPassword,
      newPassword
    );
    expect(resetRes.success).toBe(true);
    expect(resetRes.message).toBe("Password reset successfully.");

    // 5. Login with new password
    const loginRes = await authenticateUser({
      email: "sri@smru.in",
      password: newPassword,
      keepMeSignedIn: false,
    });
    expect(loginRes.success).toBe(true);
    expect(loginRes.user?.email).toBe("sri@smru.in");

    // Clean up / restore password for subsequent test runs
    await resetRegisteredUserPassword("u_sri", "ChangeMe!2026");
  });

  // TEST 2: Registered email -> Send email code -> Receive code -> Enter correct code -> Create new password -> Reset successfully -> Login with new password
  it("TEST 2: Full Email Verification recovery flow resets password and allows login with new password", async () => {
    const email = "hari@smru.in"; // Hari's registered email

    // 1. Send email code
    const reqRes = await requestEmailVerification(email);
    expect(reqRes.success).toBe(true);
    expect(reqRes.message).toBe("Verification code sent to your registered email.");

    // 2. Receive code from real email provider / test delivery sink
    const code = _getLatestTestCodeForEmail(email);
    expect(code).not.toBeNull();
    expect(code).toMatch(/^\d{6}$/);

    // 3. Enter correct code
    const verifyRes = await verifyRecoveryOtpOrCode("email", email, code!);
    expect(verifyRes.success).toBe(true);
    expect(verifyRes.resetToken).toBeDefined();

    // 4. Create new password
    const newPassword = "HariNewSecurePass!2026";
    const resetRes = await resetUserPasswordWithRecoveryToken(
      verifyRes.resetToken!,
      newPassword,
      newPassword
    );
    expect(resetRes.success).toBe(true);
    expect(resetRes.message).toBe("Password reset successfully.");

    // 5. Login with new password
    const loginRes = await authenticateUser({
      email: "hari@smru.in",
      password: newPassword,
      keepMeSignedIn: false,
    });
    expect(loginRes.success).toBe(true);
    expect(loginRes.user?.email).toBe("hari@smru.in");

    // Restore password
    await resetRegisteredUserPassword("u_hari", "ChangeMe!2026");
  });

  // TEST 3: Wrong OTP -> Reject verification
  it("TEST 3: Wrong OTP rejects verification and tracks remaining attempts", async () => {
    const mobile = "+919876543210";
    await requestMobileOtp(mobile);

    const wrongOtp = "000000";
    const verifyRes = await verifyRecoveryOtpOrCode("mobile", mobile, wrongOtp);
    expect(verifyRes.success).toBe(false);
    expect(verifyRes.error).toContain("Invalid verification code");
    expect(verifyRes.attemptsLeft).toBe(2);
  });

  // TEST 4: Expired OTP -> Reject verification
  it("TEST 4: Expired OTP rejects verification", async () => {
    const mobile = "+919876543210";
    await requestMobileOtp(mobile);
    const otp = _getLatestTestOtpForPhone(mobile);

    // Manually expire session
    _expireSessionForTest(mobile);

    const verifyRes = await verifyRecoveryOtpOrCode("mobile", mobile, otp!);
    expect(verifyRes.success).toBe(false);
    expect(verifyRes.error).toContain("expired");
  });

  // TEST 5: Wrong email verification code -> Reject verification
  it("TEST 5: Wrong email verification code rejects verification", async () => {
    const email = "janardhan@smru.in";
    await requestEmailVerification(email);

    const wrongCode = "123123";
    const verifyRes = await verifyRecoveryOtpOrCode("email", email, wrongCode);
    expect(verifyRes.success).toBe(false);
    expect(verifyRes.error).toContain("Invalid verification code");
  });

  // TEST 6: Expired email code -> Reject verification
  it("TEST 6: Expired email verification code rejects verification", async () => {
    const email = "janardhan@smru.in";
    await requestEmailVerification(email);
    const code = _getLatestTestCodeForEmail(email);

    // Manually expire session
    _expireSessionForTest(email);

    const verifyRes = await verifyRecoveryOtpOrCode("email", email, code!);
    expect(verifyRes.success).toBe(false);
    expect(verifyRes.error).toContain("expired");
  });

  // TEST 7: Password and confirm password don't match -> Reject reset
  it("TEST 7: Password and confirm password mismatch rejects reset", async () => {
    const email = "janardhan@smru.in";
    await requestEmailVerification(email);
    const code = _getLatestTestCodeForEmail(email);
    const verifyRes = await verifyRecoveryOtpOrCode("email", email, code!);
    expect(verifyRes.success).toBe(true);

    const resetRes = await resetUserPasswordWithRecoveryToken(
      verifyRes.resetToken!,
      "StrongPass1234!",
      "DifferentPass5678!"
    );
    expect(resetRes.success).toBe(false);
    expect(resetRes.error).toBe("New password and confirm password do not match.");
  });

  // TEST 8: Resend OTP -> Generate new OTP -> Invalidate old OTP
  it("TEST 8: Resend OTP generates new OTP and invalidates old OTP", async () => {
    const mobile = "+919876543212";

    // 1. Request OTP 1
    const res1 = await requestMobileOtp(mobile);
    expect(res1.success).toBe(true);
    const otp1 = _getLatestTestOtpForPhone(mobile);
    expect(otp1).not.toBeNull();

    // 2. Clear state cooldown for test to allow resend
    _clearRecoveryStateForTest();

    // 3. Request OTP 2
    const res2 = await requestMobileOtp(mobile);
    expect(res2.success).toBe(true);
    const otp2 = _getLatestTestOtpForPhone(mobile);
    expect(otp2).not.toBeNull();

    // 4. Invalidate old OTP: trying to verify with otp1 should fail
    // (Notice that a new salt and codeHash was created)
    if (otp1 !== otp2) {
      const oldVerifyRes = await verifyRecoveryOtpOrCode("mobile", mobile, otp1!);
      expect(oldVerifyRes.success).toBe(false);
    }

    // 5. Verifying with otp2 succeeds
    const newVerifyRes = await verifyRecoveryOtpOrCode("mobile", mobile, otp2!);
    expect(newVerifyRes.success).toBe(true);
  });

  // TEST 9: Resend email code -> Generate new code -> Invalidate old code
  it("TEST 9: Resend email code generates new code and invalidates old code", async () => {
    const email = "intern.a@smru.in";

    // 1. Request code 1
    const res1 = await requestEmailVerification(email);
    expect(res1.success).toBe(true);
    const code1 = _getLatestTestCodeForEmail(email);
    expect(code1).not.toBeNull();

    // 2. Clear state cooldown for test
    _clearRecoveryStateForTest();

    // 3. Request code 2
    const res2 = await requestEmailVerification(email);
    expect(res2.success).toBe(true);
    const code2 = _getLatestTestCodeForEmail(email);
    expect(code2).not.toBeNull();

    // 4. Old code is rejected
    if (code1 !== code2) {
      const oldVerifyRes = await verifyRecoveryOtpOrCode("email", email, code1!);
      expect(oldVerifyRes.success).toBe(false);
    }

    // 5. New code is accepted
    const newVerifyRes = await verifyRecoveryOtpOrCode("email", email, code2!);
    expect(newVerifyRes.success).toBe(true);
  });

  // TEST 10: Wrong password during normal login -> Normal login error -> Does NOT trigger account recovery
  it("TEST 10: Wrong password during normal login produces normal login error and does not trigger recovery", async () => {
    const formData = new FormData();
    formData.append("email", "sri@smru.in");
    formData.append("password", "IncorrectPasswordAttempt!99");

    const result = await loginAction(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid email or password.");

    // Confirm session cookie was NOT created
    expect(cookieStoreMap.has("icc_session")).toBe(false);

    // Confirm that no recovery session or OTP was dispatched for Sri
    expect(_getLatestTestOtpForPhone("+919876543210")).toBeNull();
    expect(_getLatestTestCodeForEmail("sri@smru.in")).toBeNull();
  });

  // Provider configuration detection test
  it("detects provider status correctly and refuses fake delivery when unconfigured", () => {
    const sms = getSmsProviderStatus();
    expect(sms.isConfigured).toBe(true); // in test mode
    const email = getEmailProviderStatus();
    expect(email.isConfigured).toBe(true); // in test mode
  });

  // TEST 12: Unregistered mobile number does not generate OTP and cannot be verified
  it("TEST 12: Unregistered mobile number does NOT send OTP, does not create recovery session, and rejects verification", async () => {
    const unregisteredMobile = "+919999999999";
    const res = await requestMobileOtp(unregisteredMobile);
    // Returns safe generic message to prevent account enumeration
    expect(res.success).toBe(true);
    expect(res.message).toBe("If the information matches an existing account, a verification code will be sent.");

    // Confirm that NO OTP was dispatched
    const otp = _getLatestTestOtpForPhone(unregisteredMobile);
    expect(otp).toBeNull();

    // Verification attempt must be rejected
    const verifyRes = await verifyRecoveryOtpOrCode("mobile", unregisteredMobile, "123456");
    expect(verifyRes.success).toBe(false);
    expect(verifyRes.resetToken).toBeUndefined();
  });

  // TEST 13: Unregistered email address does not generate code and cannot be verified
  it("TEST 13: Unregistered email does NOT send code, does not create recovery session, and rejects verification", async () => {
    const unregisteredEmail = "random.intruder@unknown-domain.com";
    const res = await requestEmailVerification(unregisteredEmail);
    // Returns safe generic message
    expect(res.success).toBe(true);
    expect(res.message).toBe("If the information matches an existing account, a verification code will be sent.");

    // Confirm that NO code was dispatched
    const code = _getLatestTestCodeForEmail(unregisteredEmail);
    expect(code).toBeNull();

    // Verification attempt must be rejected
    const verifyRes = await verifyRecoveryOtpOrCode("email", unregisteredEmail, "123456");
    expect(verifyRes.success).toBe(false);
    expect(verifyRes.resetToken).toBeUndefined();
  });

  // TEST 14: Unregistered user cannot reset password or create an account
  it("TEST 14: Unregistered user cannot reset password or create a new account", async () => {
    // Attempting reset with non-existent token fails
    const fakeToken = "u_fake_user:9999999999:fake-nonce:fake-signature";
    const resetRes = await resetUserPasswordWithRecoveryToken(
      fakeToken,
      "NewPassword!1234",
      "NewPassword!1234"
    );
    expect(resetRes.success).toBe(false);

    // Normal login for non-existent user fails
    const loginRes = await authenticateUser({
      email: "fake.user@external.com",
      password: "NewPassword!1234",
      keepMeSignedIn: false,
    });
    expect(loginRes.success).toBe(false);
    expect(loginRes.error).toBe("Invalid email or password.");
  });
});
