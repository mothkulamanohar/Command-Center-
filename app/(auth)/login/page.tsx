"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  loginAction,
  requestMobileOtpAction,
  requestEmailCodeAction,
  verifyRecoveryCodeAction,
  resetPasswordAction,
} from "./actions";
import {
  Shield,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Mail,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  CheckCircle2,
  X,
  KeyRound,
  RefreshCw,
  AlertCircle,
  Check,
  Loader2,
  Smartphone,
} from "lucide-react";

type RecoveryMethod = "mobile" | "email";
type RecoveryStep =
  | "CHOOSE_METHOD"
  | "ENTER_IDENTIFIER"
  | "VERIFY_CODE"
  | "CREATE_PASSWORD"
  | "SUCCESS";

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(loginAction, { success: false });
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("sri@smru.in");
  const [password, setPassword] = useState("ChangeMe!2026");

  // ==========================================
  // REAL ACCOUNT RECOVERY STATE
  // ==========================================
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryMethod, setRecoveryMethod] = useState<RecoveryMethod>("mobile");
  const [recoveryStep, setRecoveryStep] = useState<RecoveryStep>("CHOOSE_METHOD");

  const [mobileInput, setMobileInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isRecoveryPending, setIsRecoveryPending] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    router.prefetch("/welcome");
    router.prefetch("/console");
  }, [router]);

  useEffect(() => {
    if (state.success) {
      if (state.mustChangePw) {
        router.push("/change-password");
      } else {
        router.push("/welcome");
      }
    }
  }, [state, router]);

  // Cooldown countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus OTP input on step change
  useEffect(() => {
    if (recoveryStep === "VERIFY_CODE") {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [recoveryStep]);

  // Open Recovery Modal cleanly
  const handleOpenRecovery = () => {
    setShowRecoveryModal(true);
    setRecoveryMethod("mobile");
    setRecoveryStep("CHOOSE_METHOD");
    setRecoveryError(null);
    setRecoverySuccessMsg(null);
    setMobileInput("");
    setEmailInput(email && email.includes("@") ? email : "");
    setOtpCode("");
    setResetToken(null);
    setNewPassword("");
    setConfirmPassword("");
  };

  // Choose method & proceed
  const handleSelectMethod = (method: RecoveryMethod) => {
    setRecoveryMethod(method);
    setRecoveryStep("ENTER_IDENTIFIER");
    setRecoveryError(null);
    setRecoverySuccessMsg(null);
  };

  // Request OTP / Email Code
  const handleSendOtpOrCode = async (isResend = false) => {
    if (isRecoveryPending) return;
    setRecoveryError(null);
    setRecoverySuccessMsg(null);

    if (recoveryMethod === "mobile") {
      const cleanMobile = mobileInput.replace(/\D/g, "");
      if (cleanMobile.length < 10) {
        setRecoveryError("Please enter a valid 10-digit registered mobile number.");
        return;
      }

      setIsRecoveryPending(true);
      try {
        const formData = new FormData();
        formData.append("mobile", mobileInput.trim());
        const res = await requestMobileOtpAction(null, formData);

        if (!res.success) {
          setRecoveryError(
            res.error || "Mobile OTP recovery is currently unavailable. Please use email recovery."
          );
          return;
        }

        const masked = "******" + cleanMobile.slice(-4);
        setRecoverySuccessMsg(`OTP sent to: ${masked}`);
        setCooldown(res.cooldownSeconds || 60);
        setRecoveryStep("VERIFY_CODE");
      } catch {
        setRecoveryError("Mobile OTP recovery is currently unavailable. Please use email recovery.");
      } finally {
        setIsRecoveryPending(false);
      }
    } else {
      // Email method
      const trimmedEmail = emailInput.trim().toLowerCase();
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        setRecoveryError("Please enter a valid registered work email address.");
        return;
      }

      setIsRecoveryPending(true);
      try {
        const formData = new FormData();
        formData.append("email", trimmedEmail);
        const res = await requestEmailCodeAction(null, formData);

        if (!res.success) {
          setRecoveryError(
            res.error ||
              "Email recovery is currently unavailable. Please contact the system administrator."
          );
          return;
        }

        setRecoverySuccessMsg(`Verification code sent to ${trimmedEmail}`);
        setCooldown(res.cooldownSeconds || 60);
        setRecoveryStep("VERIFY_CODE");
      } catch {
        setRecoveryError(
          "Email recovery is currently unavailable. Please contact the system administrator."
        );
      } finally {
        setIsRecoveryPending(false);
      }
    }
  };

  // Verify Code
  const handleVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isRecoveryPending) return;
    setRecoveryError(null);

    const cleanCode = otpCode.trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      setRecoveryError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsRecoveryPending(true);
    try {
      const formData = new FormData();
      formData.append("method", recoveryMethod);
      formData.append(
        "identifier",
        recoveryMethod === "mobile" ? mobileInput.trim() : emailInput.trim()
      );
      formData.append("code", cleanCode);

      const res = await verifyRecoveryCodeAction(null, formData);
      if (!res.success) {
        setRecoveryError(res.error || "Invalid verification code. Please try again.");
        return;
      }

      setResetToken(res.resetToken!);
      setRecoveryStep("CREATE_PASSWORD");
      setRecoverySuccessMsg(null);
    } catch {
      setRecoveryError("An unexpected error occurred during verification. Please try again.");
    } finally {
      setIsRecoveryPending(false);
    }
  };

  // Reset Password
  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isRecoveryPending) return;
    setRecoveryError(null);

    if (newPassword.length < 10) {
      setRecoveryError("Password must be at least 10 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setRecoveryError("New password and confirm password do not match.");
      return;
    }

    setIsRecoveryPending(true);
    try {
      const formData = new FormData();
      formData.append("resetToken", resetToken || "");
      formData.append("newPassword", newPassword);
      formData.append("confirmPassword", confirmPassword);

      const res = await resetPasswordAction(null, formData);
      if (!res.success) {
        setRecoveryError(res.error || "Failed to reset password. Please try again.");
        return;
      }

      setRecoveryStep("SUCCESS");
    } catch {
      setRecoveryError("An unexpected error occurred while resetting password.");
    } finally {
      setIsRecoveryPending(false);
    }
  };

  // Return to Login after reset
  const handleReturnToLogin = () => {
    setShowRecoveryModal(false);
    if (recoveryMethod === "email" && emailInput) {
      setEmail(emailInput);
    }
    setPassword("");
  };

  const errorMessage = state.error;
  const isSmsUnavailable =
    recoveryError === "Mobile OTP recovery is currently unavailable. Please use email recovery.";

  return (
    <div className="min-h-screen bg-ground flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-surface rounded-panel border border-line p-6 sm:p-8 shadow-xs space-y-5">
          {/* Logo & Welcome Header inside Login Card */}
          <div className="flex flex-col items-center justify-center text-center pb-3 border-b border-line/60">
            <div className="h-12 w-12 rounded-panel bg-[#1B365D] text-white flex items-center justify-center font-mono font-bold text-lg shadow-sm border border-[#22426E] mb-2">
              ICC
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
              WELCOME TO
            </span>
            <h1 className="text-xl font-bold text-ink tracking-tight">
              Command Center
            </h1>
            <p className="text-xs text-mutedText font-mono mt-0.5">
              SMRU IT Operations &amp; Workflow Console
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-danger-tint border border-danger/20 rounded-control text-xs text-danger font-medium flex items-center gap-2 animate-in fade-in">
              <Shield className="h-4 w-4 shrink-0 text-danger" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Email & Password Form */}
          <form action={formAction} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-ink uppercase tracking-wider font-mono mb-1.5"
              >
                Work Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@smru.in"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-ground border border-line rounded-control text-xs text-ink placeholder:text-mutedText focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                />
                <Mail className="h-4 w-4 text-mutedText absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-ink uppercase tracking-wider font-mono"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-ground border border-line rounded-control text-xs text-ink placeholder:text-mutedText focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                />
                {/* Interactive Lock/Unlock Button on the left */}
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-mutedText hover:text-primary transition-colors cursor-pointer rounded focus:outline-none"
                  title={
                    showPassword
                      ? "Password revealed — Click to lock & hide"
                      : "Password hidden — Click to unlock & show"
                  }
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <Unlock className="h-4 w-4 text-primary animate-in zoom-in-75 duration-150" />
                  ) : (
                    <Lock className="h-4 w-4 text-mutedText hover:text-ink transition-colors" />
                  )}
                </button>
                {/* Eye toggle on the right */}
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-mutedText hover:text-primary transition-colors cursor-pointer rounded focus:outline-none"
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-primary animate-in zoom-in-75 duration-150" />
                  ) : (
                    <Eye className="h-4 w-4 text-mutedText hover:text-ink transition-colors" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-mutedText select-none cursor-pointer">
                <input
                  type="checkbox"
                  name="keepMeSignedIn"
                  defaultChecked
                  className="rounded border-line text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span>Keep me signed in (30 days)</span>
              </label>
              <button
                type="button"
                id="forgot-password-link"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpenRecovery();
                }}
                className="text-xs text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer transition-colors focus:outline-none"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-semibold tracking-wide transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <span>{isPending ? "Signing in..." : "Sign in with Email"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Switcher */}
          {process.env.NODE_ENV !== "production" && (
            <div className="pt-3 border-t border-line/60">
              <div className="text-[10px] font-mono uppercase tracking-wider text-mutedText font-semibold mb-2 flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-primary" />
                <span>1-Click Demo Accounts</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setEmail("sri@smru.in");
                    setPassword("ChangeMe!2026");
                  }}
                  className="p-2 bg-ground hover:bg-surface-alt border border-line rounded-control text-left transition-colors cursor-pointer"
                >
                  <div className="font-semibold text-ink text-[11px]">Sri (IT Manager)</div>
                  <div className="text-[10px] text-mutedText font-mono">Role: ADMIN</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("hari@smru.in");
                    setPassword("ChangeMe!2026");
                  }}
                  className="p-2 bg-ground hover:bg-surface-alt border border-line rounded-control text-left transition-colors cursor-pointer"
                >
                  <div className="font-semibold text-ink text-[11px]">Hari (Coordinator)</div>
                  <div className="text-[10px] text-mutedText font-mono">Role: LEAD</div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Notice */}
        <div className="mt-4 text-center text-xs text-mutedText font-mono">
          Private system • Access restricted to authorized SMRU personnel
        </div>
      </div>

      {/* ======================================================== */}
      {/* DEDICATED FORGOT PASSWORD / ACCOUNT RECOVERY MODAL       */}
      {/* ======================================================== */}
      {showRecoveryModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="recovery-modal-title"
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
        >
          <div className="bg-surface rounded-panel border border-line p-6 sm:p-8 shadow-xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200 relative">
            {/* Close Button */}
            <button
              type="button"
              id="close-recovery-modal"
              onClick={() => setShowRecoveryModal(false)}
              className="absolute top-4 right-4 p-1 text-mutedText hover:text-ink transition-colors rounded cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex flex-col items-center justify-center text-center pb-2 border-b border-line/50">
              <div className="h-10 w-10 rounded-panel bg-[#1B365D]/10 text-primary flex items-center justify-center mb-2">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <h2 id="recovery-modal-title" className="text-base font-bold text-ink">
                FORGOT PASSWORD?
              </h2>
              <p className="text-xs text-mutedText font-mono mt-0.5">
                Account Recovery
              </p>
            </div>

            {/* Error Banner with Direct Email Fallback Action if SMS is Unavailable */}
            {recoveryError && (
              <div className="space-y-2 animate-in fade-in">
                <div className="p-3 bg-danger-tint border border-danger/20 rounded-control text-xs text-danger font-medium flex items-start gap-2">
                  <Shield className="h-4 w-4 shrink-0 text-danger mt-0.5" />
                  <span className="leading-snug">{recoveryError}</span>
                </div>

                {isSmsUnavailable && (
                  <button
                    type="button"
                    onClick={() => handleSelectMethod("email")}
                    className="w-full py-2.5 px-3 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Recover using Email</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Success / Status Banner */}
            {recoverySuccessMsg && recoveryStep !== "SUCCESS" && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-control text-xs text-emerald-400 font-medium flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                <span className="leading-snug">{recoverySuccessMsg}</span>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 1: CHOOSE RECOVERY METHOD                           */}
            {/* ======================================================== */}
            {recoveryStep === "CHOOSE_METHOD" && (
              <div className="space-y-4 pt-1 animate-in fade-in">
                <p className="text-xs text-ink/80 text-center font-medium">
                  Choose a recovery method:
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {/* Option 1: Mobile OTP */}
                  <button
                    type="button"
                    id="choose-mobile-recovery"
                    onClick={() => handleSelectMethod("mobile")}
                    className="p-3.5 rounded-control border border-line bg-ground hover:bg-surface-alt hover:border-primary/50 text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-panel bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Smartphone className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-ink group-hover:text-primary transition-colors">
                          Recover using Mobile OTP
                        </div>
                        <div className="text-[11px] text-mutedText font-mono mt-0.5">
                          Receive one-time password via mobile SMS
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-mutedText group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* Option 2: Email */}
                  <button
                    type="button"
                    id="choose-email-recovery"
                    onClick={() => handleSelectMethod("email")}
                    className="p-3.5 rounded-control border border-line bg-ground hover:bg-surface-alt hover:border-primary/50 text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-panel bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-ink group-hover:text-primary transition-colors">
                          Recover using Email
                        </div>
                        <div className="text-[11px] text-mutedText font-mono mt-0.5">
                          Receive verification code at registered email
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-mutedText group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(false)}
                    className="w-full py-2 text-xs text-mutedText hover:text-ink font-mono transition-colors cursor-pointer text-center"
                  >
                    Return to Login
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 2: ENTER IDENTIFIER (Mobile or Email)               */}
            {/* ======================================================== */}
            {recoveryStep === "ENTER_IDENTIFIER" && (
              <div className="space-y-4 pt-1 animate-in fade-in">
                {recoveryMethod === "mobile" ? (
                  <div>
                    <label
                      htmlFor="registered-mobile"
                      className="block text-xs font-semibold text-ink uppercase tracking-wider font-mono mb-1.5"
                    >
                      Enter your registered mobile number
                    </label>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-3 py-2.5 rounded-l-control border border-r-0 border-line bg-surface-alt text-xs font-mono text-ink font-semibold">
                        +91
                      </span>
                      <input
                        id="registered-mobile"
                        type="tel"
                        maxLength={10}
                        value={mobileInput}
                        onChange={(e) =>
                          setMobileInput(e.target.value.replace(/\D/g, "").slice(0, 10))
                        }
                        placeholder="____________"
                        className="w-full py-2.5 px-3 bg-ground border border-line rounded-r-control text-xs text-ink placeholder:text-mutedText focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="registered-email"
                      className="block text-xs font-semibold text-ink uppercase tracking-wider font-mono mb-1.5"
                    >
                      Enter your registered email address
                    </label>
                    <div className="relative">
                      <input
                        id="registered-email"
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="name@smru.in"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-ground border border-line rounded-control text-xs text-ink placeholder:text-mutedText focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                      />
                      <Mail className="h-4 w-4 text-mutedText absolute left-3 top-3" />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    id={recoveryMethod === "mobile" ? "send-otp-btn" : "send-email-code-btn"}
                    onClick={() => handleSendOtpOrCode(false)}
                    disabled={
                      isRecoveryPending ||
                      (recoveryMethod === "mobile"
                        ? mobileInput.replace(/\D/g, "").length < 10
                        : !emailInput.trim())
                    }
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-semibold tracking-wide transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isRecoveryPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>
                          {recoveryMethod === "mobile" ? "Sending OTP..." : "Sending Code..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <span>{recoveryMethod === "mobile" ? "Send OTP" : "Send Code"}</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryStep("CHOOSE_METHOD");
                      setRecoveryError(null);
                    }}
                    className="w-full py-2 flex items-center justify-center gap-1.5 text-xs text-mutedText hover:text-ink font-mono transition-colors cursor-pointer text-center"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back</span>
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 3: VERIFY OTP / CODE                                */}
            {/* ======================================================== */}
            {recoveryStep === "VERIFY_CODE" && (
              <form onSubmit={handleVerifyCode} noValidate className="space-y-4 pt-1 animate-in fade-in">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="verification-otp"
                      className="block text-xs font-semibold text-ink uppercase tracking-wider font-mono"
                    >
                      {recoveryMethod === "mobile"
                        ? "Enter the OTP sent to your mobile"
                        : "Enter verification code"}
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      ref={otpInputRef}
                      id="verification-otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) =>
                        setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="_ _ _ _ _ _"
                      className="w-full text-center tracking-[0.5em] text-base font-bold py-2.5 px-3 bg-ground border border-line rounded-control text-ink placeholder:text-mutedText/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                    />
                  </div>

                  <p className="text-[11px] text-mutedText font-mono mt-1.5 text-center">
                    {recoveryMethod === "mobile"
                      ? `OTP sent to: ******${mobileInput.slice(-4) || "XXXX"}`
                      : `Code sent to: ${emailInput}`}
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="submit"
                    id={recoveryMethod === "mobile" ? "verify-otp-btn" : "verify-email-code-btn"}
                    disabled={isRecoveryPending || otpCode.trim().length !== 6}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-semibold tracking-wide transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isRecoveryPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {recoveryMethod === "mobile" ? "Verify OTP" : "Verify Code"}
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-1 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryStep("ENTER_IDENTIFIER");
                        setRecoveryError(null);
                        setOtpCode("");
                      }}
                      className="text-mutedText hover:text-ink transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      <span>Back</span>
                    </button>

                    <button
                      type="button"
                      id={recoveryMethod === "mobile" ? "resend-otp-btn" : "resend-email-code-btn"}
                      onClick={() => handleSendOtpOrCode(true)}
                      disabled={cooldown > 0 || isRecoveryPending}
                      className="text-primary hover:text-primary-hover disabled:text-mutedText disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1.5 font-medium"
                    >
                      <RefreshCw
                        className={`h-3 w-3 ${isRecoveryPending ? "animate-spin" : ""}`}
                      />
                      <span>
                        {cooldown > 0
                          ? `Resend ${recoveryMethod === "mobile" ? "OTP" : "Code"} in ${cooldown}s`
                          : `Resend ${recoveryMethod === "mobile" ? "OTP" : "Code"}`}
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ======================================================== */}
            {/* STEP 4: CREATE NEW PASSWORD                              */}
            {/* ======================================================== */}
            {recoveryStep === "CREATE_PASSWORD" && (
              <form onSubmit={handleResetPassword} noValidate className="space-y-4 pt-1 animate-in fade-in">
                <div className="text-center pb-1">
                  <h3 className="text-sm font-bold text-ink">Create New Password</h3>
                  <p className="text-[11px] text-mutedText font-mono mt-0.5">
                    Your verification was successful. Set a secure password for your account.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="recovery-new-password"
                    className="block text-xs font-semibold text-ink uppercase tracking-wider font-mono mb-1.5"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="recovery-new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 10 characters"
                      className="w-full pl-9 pr-10 py-2.5 bg-ground border border-line rounded-control text-xs text-ink placeholder:text-mutedText focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                    />
                    <Lock className="h-4 w-4 text-mutedText absolute left-3 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-mutedText hover:text-primary transition-colors cursor-pointer rounded focus:outline-none"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="recovery-confirm-password"
                    className="block text-xs font-semibold text-ink uppercase tracking-wider font-mono mb-1.5"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="recovery-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-9 pr-10 py-2.5 bg-ground border border-line rounded-control text-xs text-ink placeholder:text-mutedText focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                    />
                    <Lock className="h-4 w-4 text-mutedText absolute left-3 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-mutedText hover:text-primary transition-colors cursor-pointer rounded focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Requirements Checklist */}
                <div className="p-3 bg-ground border border-line rounded-control space-y-1.5 text-[11px] font-mono">
                  <div className="text-[10px] uppercase font-bold text-mutedText mb-1">
                    Password Requirements:
                  </div>
                  <div className="flex items-center gap-2">
                    {newPassword.length >= 10 ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border border-line shrink-0" />
                    )}
                    <span
                      className={
                        newPassword.length >= 10 ? "text-emerald-400 font-medium" : "text-mutedText"
                      }
                    >
                      Minimum 10 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/[A-Z]/.test(newPassword) ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border border-line shrink-0" />
                    )}
                    <span
                      className={
                        /[A-Z]/.test(newPassword) ? "text-emerald-400 font-medium" : "text-mutedText"
                      }
                    >
                      Uppercase letter (A-Z)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/[0-9]/.test(newPassword) ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border border-line shrink-0" />
                    )}
                    <span
                      className={
                        /[0-9]/.test(newPassword) ? "text-emerald-400 font-medium" : "text-mutedText"
                      }
                    >
                      Number (0-9)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {newPassword.length > 0 && newPassword === confirmPassword ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border border-line shrink-0" />
                    )}
                    <span
                      className={
                        newPassword.length > 0 && newPassword === confirmPassword
                          ? "text-emerald-400 font-medium"
                          : "text-mutedText"
                      }
                    >
                      Passwords match
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    id="reset-password-submit-btn"
                    disabled={
                      isRecoveryPending ||
                      newPassword.length < 10 ||
                      newPassword !== confirmPassword
                    }
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-semibold tracking-wide transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isRecoveryPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Resetting Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ======================================================== */}
            {/* STEP 5: SUCCESSFUL RESET                                 */}
            {/* ======================================================== */}
            {recoveryStep === "SUCCESS" && (
              <div className="space-y-4 pt-2 text-center animate-in zoom-in-95 duration-200">
                <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-ink">
                    Password reset successfully.
                  </h3>
                  <p className="text-xs text-mutedText font-mono mt-1 leading-relaxed max-w-xs mx-auto">
                    Your password has been securely updated. You can now log in using your registered email and new password.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    id="go-to-login-btn"
                    onClick={handleReturnToLogin}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-semibold tracking-wide transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Return to Login</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
