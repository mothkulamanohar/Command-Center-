"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "./actions";
import { Shield, Lock, Unlock, Eye, EyeOff, Mail, ArrowRight, UserCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(loginAction, { success: false });
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("sri@smru.in");

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

  const errorMessage = state.error;

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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  defaultValue="ChangeMe!2026"
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-ground border border-line rounded-control text-xs text-ink placeholder:text-mutedText focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                />
                {/* Interactive Lock/Unlock Button on the left */}
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-mutedText hover:text-primary transition-colors cursor-pointer rounded focus:outline-none"
                  title={showPassword ? "Password revealed — Click to lock & hide" : "Password hidden — Click to unlock & show"}
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
          {process.env.NODE_ENV === "development" && (
            <div className="pt-3 border-t border-line/60">
              <div className="text-[10px] font-mono uppercase tracking-wider text-mutedText font-semibold mb-2 flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-primary" />
                <span>1-Click Demo Accounts</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setEmail("sri@smru.in")}
                  className="p-2 bg-ground hover:bg-surface-alt border border-line rounded-control text-left transition-colors cursor-pointer"
                >
                  <div className="font-semibold text-ink text-[11px]">Sri (IT Manager)</div>
                  <div className="text-[10px] text-mutedText font-mono">Role: ADMIN</div>
                </button>
                <button
                  type="button"
                  onClick={() => setEmail("hari@smru.in")}
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
    </div>
  );
}
