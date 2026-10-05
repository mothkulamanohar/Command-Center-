"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const router = useRouter();
  const [progress, setProgress] = useState(false);

  useEffect(() => {
    // Pre-fetch main dashboard immediately for instantaneous transition
    router.prefetch("/console");

    // Trigger smooth visual progress fill
    const progressTimer = setTimeout(() => {
      setProgress(true);
    }, 50);

    // Automatically redirect to the main Command Center dashboard after 2 seconds (SPEC requirement)
    const redirectTimer = setTimeout(() => {
      router.push("/console");
    }, 2000);

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <div className="min-h-screen w-full bg-[#F7F6F2] flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-300">
      {/* Centered Welcome Container */}
      <div className="flex flex-col items-center justify-center text-center max-w-md w-full mx-auto space-y-6">
        {/* COMMAND CENTER LOGO */}
        <div className="relative group">
          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-[#1B365D] text-white flex items-center justify-center font-mono font-bold text-3xl sm:text-4xl shadow-xl shadow-[#1B365D]/15 border-2 border-[#22426E] transition-transform duration-300 group-hover:scale-105">
            ICC
          </div>
          {/* Subtle status indicator dot */}
          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[#1E56D8] border-2 border-[#F7F6F2] flex items-center justify-center shadow-xs">
            <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
          </div>
        </div>

        {/* WELCOME TEXT */}
        <div className="space-y-2">
          <div className="text-xs sm:text-sm font-mono uppercase tracking-[0.25em] text-[#1E56D8] font-bold">
            WELCOME TO
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1B365D] tracking-tight font-sans">
            COMMAND CENTER
          </h1>
          <p className="text-xs text-[#64748B] font-mono tracking-wider uppercase mt-1">
            IT Operations &amp; Workflow Console
          </p>
        </div>

        {/* 2-Second Smooth Animated Progress Line */}
        <div className="w-48 sm:w-56 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden border border-[#CBD5E1]/40 mt-4">
          <div
            style={{ transitionDuration: "1950ms" }}
            className={`h-full bg-[#1E56D8] rounded-full transition-all ease-out ${
              progress ? "w-full" : "w-0"
            }`}
          />
        </div>

        <p className="text-[11px] text-[#94A3B8] font-mono">
          Loading workspace...
        </p>
      </div>
    </div>
  );
}
