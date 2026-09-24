"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { changePasswordAction } from "./actions";
import { Lock, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(changePasswordAction, { success: false });

  useEffect(() => {
    if (state.success) {
      router.push("/console");
    }
  }, [state, router]);

  return (
    <div className="min-h-screen bg-ground flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 rounded-panel bg-primary text-white items-center justify-center mb-3 shadow-xs">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-ink tracking-tight">
            Update Your Password
          </h1>
          <p className="text-xs text-mutedText mt-1 font-mono">
            First login or security requirement (minimum 10 characters)
          </p>
        </div>

        <div className="bg-surface rounded-panel border border-line p-8 shadow-sm">
          {state.error && (
            <div className="mb-6 p-3.5 bg-danger-tint border border-danger/20 rounded-control text-xs text-danger font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-danger" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label
                htmlFor="oldPassword"
                className="block text-xs font-semibold text-ink uppercase tracking-wider font-mono mb-1.5"
              >
                Current / Temporary Password
              </label>
              <input
                id="oldPassword"
                name="oldPassword"
                type="password"
                required
                className="w-full px-3.5 py-2.5 bg-ground border border-line rounded-control text-xs text-ink placeholder:text-mutedText focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono"
              />
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-xs font-semibold text-ink uppercase tracking-wider font-mono mb-1.5"
              >
                New Password (min 10 characters)
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={10}
                className="w-full px-3.5 py-2.5 bg-ground border border-line rounded-control text-xs text-ink placeholder:text-mutedText focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold text-ink uppercase tracking-wider font-mono mb-1.5"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={10}
                className="w-full px-3.5 py-2.5 bg-ground border border-line rounded-control text-xs text-ink placeholder:text-mutedText focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-semibold tracking-wide transition-colors shadow-xs disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{isPending ? "Updating Password..." : "Set New Password & Continue"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
