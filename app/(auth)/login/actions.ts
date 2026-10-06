"use server";

import { authenticateUser, requestPasswordReset } from "@/lib/services/user";
import { createSession } from "@/lib/auth/session";

export interface LoginActionResult {
  success: boolean;
  error?: string;
  mustChangePw?: boolean;
}

export interface ForgotPasswordActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

export async function loginAction(
  prevState: unknown,
  formData: FormData
): Promise<LoginActionResult> {
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const password = (formData.get("password") as string) || "";
  const keepMeSignedIn = formData.get("keepMeSignedIn") === "on";

  // Strict field presence validation
  if (!email && !password) {
    return { success: false, error: "Please enter both email and password." };
  }
  if (!email) {
    return { success: false, error: "Please enter your email address." };
  }
  if (!password) {
    return { success: false, error: "Please enter your password." };
  }

  // Strict credential verification against DB or registered users catalog
  const result = await authenticateUser({
    email,
    password,
    keepMeSignedIn,
  });

  if (result.success && result.user) {
    await createSession(result.user.id, keepMeSignedIn);
    return {
      success: true,
      mustChangePw: result.user.mustChangePw ?? false,
    };
  }

  return {
    success: false,
    error: result.error || "Invalid email or password.",
  };
}

export async function forgotPasswordAction(
  prevState: unknown,
  formData: FormData
): Promise<ForgotPasswordActionResult> {
  const email = ((formData.get("email") as string) || "").trim();
  if (!email) {
    return { success: false, error: "Please enter your work email." };
  }
  return await requestPasswordReset(email);
}

// ==========================================
// REAL FORGOT PASSWORD & RECOVERY ACTIONS
// ==========================================

import {
  requestMobileOtp,
  requestEmailVerification,
  verifyRecoveryOtpOrCode,
  resetUserPasswordWithRecoveryToken,
  RecoveryRequestResult,
  VerificationResult,
  ResetPasswordResult,
} from "@/lib/services/recovery";
import {
  getSmsProviderStatus,
  getEmailProviderStatus,
} from "@/lib/services/communication";

export interface RequestRecoveryActionResult extends RecoveryRequestResult {}
export interface VerifyRecoveryActionResult extends VerificationResult {}
export interface ResetPasswordActionResult extends ResetPasswordResult {}

export interface ProviderStatusResult {
  smsConfigured: boolean;
  emailConfigured: boolean;
}

/**
 * Request real OTP via SMS to registered mobile number
 */
export async function requestMobileOtpAction(
  prevState: unknown,
  formData: FormData
): Promise<RequestRecoveryActionResult> {
  const mobile = ((formData.get("mobile") as string) || "").trim();
  if (!mobile) {
    return {
      success: false,
      error: "Please enter your registered mobile number.",
    };
  }
  return await requestMobileOtp(mobile);
}

/**
 * Request real verification code to registered email address
 */
export async function requestEmailCodeAction(
  prevState: unknown,
  formData: FormData
): Promise<RequestRecoveryActionResult> {
  const email = ((formData.get("email") as string) || "").trim();
  if (!email) {
    return {
      success: false,
      error: "Please enter your registered work email address.",
    };
  }
  return await requestEmailVerification(email);
}

/**
 * Verify 6-digit OTP or verification code
 */
export async function verifyRecoveryCodeAction(
  prevState: unknown,
  formData: FormData
): Promise<VerifyRecoveryActionResult> {
  const method = (formData.get("method") as string) === "mobile" ? "mobile" : "email";
  const identifier = ((formData.get("identifier") as string) || "").trim();
  const code = ((formData.get("code") as string) || "").trim();

  if (!identifier) {
    return {
      success: false,
      error: `Please provide your registered ${method === "mobile" ? "mobile number" : "work email"}.`,
    };
  }
  if (!code) {
    return {
      success: false,
      error: "Please enter the 6-digit verification code.",
    };
  }

  return await verifyRecoveryOtpOrCode(method, identifier, code);
}

/**
 * Reset password using verified recovery reset token
 */
export async function resetPasswordAction(
  prevState: unknown,
  formData: FormData
): Promise<ResetPasswordActionResult> {
  const resetToken = ((formData.get("resetToken") as string) || "").trim();
  const newPassword = (formData.get("newPassword") as string) || "";
  const confirmPassword = (formData.get("confirmPassword") as string) || "";

  if (!resetToken) {
    return {
      success: false,
      error: "Verification session is missing or expired. Please start recovery again.",
    };
  }
  if (!newPassword) {
    return {
      success: false,
      error: "Please enter a new password.",
    };
  }
  if (!confirmPassword) {
    return {
      success: false,
      error: "Please confirm your new password.",
    };
  }

  return await resetUserPasswordWithRecoveryToken(
    resetToken,
    newPassword,
    confirmPassword
  );
}

/**
 * Retrieve current configuration status for SMS and Email providers
 */
export async function getProviderStatusAction(): Promise<ProviderStatusResult> {
  const sms = getSmsProviderStatus();
  const email = getEmailProviderStatus();
  return {
    smsConfigured: sms.isConfigured,
    emailConfigured: email.isConfigured,
  };
}

