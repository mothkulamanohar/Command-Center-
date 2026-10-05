"use client";

import { useState } from "react";
import { Search, Award, CheckCircle2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PublicVerifySearchPage() {
  const router = useRouter();
  const [certCode, setCertCode] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = certCode.trim().toUpperCase();
    if (!cleanCode) return;
    router.push(`/verify/${cleanCode}`);
  };

  return (
    <div className="w-full max-w-lg bg-surface rounded-panel border border-line shadow-panel p-6 sm:p-8 space-y-6 animate-in fade-in">
      <div className="text-center space-y-2">
        <Award className="h-10 w-10 text-primary mx-auto" />
        <h1 className="text-xl font-bold text-ink tracking-tight">Verify a Certificate</h1>
        <p className="text-xs text-mutedText leading-relaxed">
          Enter the unique 10-character verification code or certificate number printed on the document or scanned from the QR code.
        </p>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink mb-1.5 font-mono">
            Verification Code or Number
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-mutedText" />
            <input
              type="text"
              required
              placeholder="e.g. K7Q2M9XA4D"
              value={certCode}
              onChange={(e) => setCertCode(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-ground border border-line rounded-control text-sm text-ink uppercase font-mono tracking-wider focus:outline-none focus:border-primary shadow-xs"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-bold transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Verify Document</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="pt-4 border-t border-line text-[11px] text-mutedText text-center space-y-1">
        <p>This verification portal confirms credentials issued by SMRU IT Command Center.</p>
        <p className="font-mono text-[10px]">No sensitive student or faculty personal data is exposed.</p>
      </div>
    </div>
  );
}
