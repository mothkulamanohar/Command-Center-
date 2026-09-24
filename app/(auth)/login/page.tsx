"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "./actions";
import { Shield, Lock, Mail, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(loginAction, { success: false });

  useEffect(() => {
    if (state.success) {
      if (state.mustChangePw) {
        router.push("/change-password");
      } else {
        router.push("/console");
      }
    }
  }, [state, router]);

  return (
    <div className="min-h-screen bg-ground flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-panel bg-ink text-white items-center justify-center font-mono font-bold text-xl shadow-md border border-[#262A33] mb-4">
            ICC
          </div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            IT Command Center
          </h1>
          <p className="text-xs text-mutedText mt-1 font-mono">
            Self-hosted IT Operations & Workflow Console
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface rounded-panel border border-line p-8 shadow-sm">
          {state.error && (
            <div className="mb-6 p-3.5 bg-danger-tint border border-danger/20 rounded-control text-xs text-danger font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 shrink-0 text-danger" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="space-y-4">
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
                  required
                  placeholder="name@smru.in"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-ground border border-line rounded-control text-xs text-ink placeholder:text-mutedText focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                />
                <Mail className="h-4 w-4 text-mutedText absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-ink uppercase tracking-wider font-mono mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-ground border border-line rounded-control text-xs text-ink placeholder:text-mutedText focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                />
                <Lock className="h-4 w-4 text-mutedText absolute left-3 top-3" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-mutedText select-none cursor-pointer">
                <input
                  type="checkbox"
                  name="keepMeSignedIn"
                  className="rounded border-line text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span>Keep me signed in (30 days)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-semibold tracking-wide transition-colors shadow-xs disabled:opacity-50"
            >
              <span>{isPending ? "Signing in..." : "Sign in to Command Center"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Footer Notice */}
        <div className="mt-8 text-center text-xs text-mutedText font-mono">
          Private system • Access restricted to authorized personnel
        </div>
      </div>
    </div>
  );
}
