"use client";

import { useState } from "react";
import { Search, Award, CheckCircle2, ArrowRight, Globe, ExternalLink, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PublicVerifySearchPage() {
  const router = useRouter();
  const [certInput, setCertInput] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = certInput.trim().toUpperCase();
    if (!cleanId) return;
    router.push(`/verify/${cleanId}`);
  };

  return (
    <div className="w-full max-w-xl bg-surface rounded-panel border border-line shadow-panel p-6 sm:p-8 space-y-6 animate-in fade-in">
      {/* College Official Verification Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
          Certificate Verification
        </h1>
        <p className="text-xs text-mutedText leading-relaxed max-w-md mx-auto">
          Official Public Credential Verification Portal for St. Mary&apos;s University (SMRU).
          Enter the certificate number or security code to verify authenticity.
        </p>
      </div>

      {/* SMRU Integration Flow Indicator */}
      <div className="bg-ground/70 border border-line rounded-control p-3 text-[11px] text-mutedText">
        <div className="font-semibold text-ink text-[11px] mb-1 flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-blue-600" />
          <span>Official University Verification Pathway:</span>
        </div>
        <div className="font-mono text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
          SMRU Website &rarr; Certificate Verification &rarr; Enter Certificate Number &rarr; Verify &rarr; Certificate Valid
        </div>
      </div>

      {/* Search / Verification Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink mb-1.5 font-mono">
            Enter Certificate Number or Verification Code *
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-mutedText" />
            <input
              type="text"
              required
              placeholder="e.g. ICC-ACH-2026-0001 or K7Q2M9XA4D"
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-ground border border-line rounded-control text-sm text-ink uppercase font-mono tracking-wider focus:outline-none focus:border-primary shadow-xs"
            />
          </div>
          <p className="text-[10px] text-mutedText mt-1">
            Example Certificate No: <strong className="font-mono text-slate-800 dark:text-slate-200">ICC-ACH-2026-0001</strong>
          </p>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-bold transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Verify Certificate</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {/* Official SMRU University Website Link */}
      <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-mutedText">
          <span>Official SMRU Website:</span>
          <a
            href="https://smru.edu.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1 font-mono"
            title="Visit St. Mary's University Website"
          >
            <span>https://smru.edu.in/</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <span className="text-[10px] text-mutedText font-mono">
          Live Backend Validation
        </span>
      </div>

      <div className="text-[10px] text-mutedText text-center font-mono">
        All certificates are validated securely against the official university database. Private personal data is never exposed.
      </div>
    </div>
  );
}
