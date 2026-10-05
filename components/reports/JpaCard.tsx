"use client";

import { Award, Star, CheckCircle, ThumbsUp } from "lucide-react";
import { getRatingLabel } from "@/lib/services/kpi";

export interface JpaProfile {
  name: string;
  role: string;
  period: string;
  scores: {
    delivery: number;
    timeliness: number;
    reliability: number;
    attendance?: number;
    responsiveness: number;
    quality: number;
    leadReview: number;
  };
  overallScore: number;
  kudosReceivedCount: number;
  strengths: string[];
  improvements: string[];
}

interface JpaCardProps {
  jpa: JpaProfile;
}

export function JpaCard({ jpa }: JpaCardProps) {
  const rating = getRatingLabel(jpa.overallScore);

  return (
    <div className="bg-surface rounded-panel border border-line p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-line gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-ink">{jpa.name}</h3>
            <span className="text-[10px] font-mono text-mutedText bg-ground px-1.5 py-0.5 rounded border border-line">
              {jpa.role}
            </span>
          </div>
          <p className="text-[11px] text-mutedText font-mono mt-0.5">
            Appraisal Period: {jpa.period}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-xl font-bold font-mono text-ink tracking-tight">
              {jpa.overallScore} / 5.0
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
              rating === "Exceeds"
                ? "bg-primary/10 text-primary border-primary/30"
                : rating === "Meets"
                ? "bg-shared/10 text-shared border-shared/30"
                : "bg-chasing/10 text-chasing border-chasing/30"
            }`}
          >
            {rating}
          </span>
        </div>
      </div>

      {/* 7 Component Breakdown (SPEC §13.2 v1.1) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-2.5 rounded-control bg-surface-alt border border-line">
          <div className="text-[10px] text-mutedText font-mono uppercase">Delivery (20%)</div>
          <div className="text-sm font-bold text-ink font-mono mt-1">{jpa.scores.delivery} / 5</div>
        </div>

        <div className="p-2.5 rounded-control bg-surface-alt border border-line">
          <div className="text-[10px] text-mutedText font-mono uppercase">Timeliness (20%)</div>
          <div className="text-sm font-bold text-ink font-mono mt-1">{jpa.scores.timeliness} / 5</div>
        </div>

        <div className="p-2.5 rounded-control bg-surface-alt border border-line">
          <div className="text-[10px] text-mutedText font-mono uppercase">Reliability (10%)</div>
          <div className="text-sm font-bold text-ink font-mono mt-1">{jpa.scores.reliability} / 5</div>
        </div>

        <div className="p-2.5 rounded-control bg-surface-alt border border-line">
          <div className="text-[10px] text-mutedText font-mono uppercase">Attendance (10%)</div>
          <div className="text-sm font-bold text-ink font-mono mt-1">
            {jpa.scores.attendance ?? 5.0} / 5
          </div>
        </div>

        <div className="p-2.5 rounded-control bg-surface-alt border border-line">
          <div className="text-[10px] text-mutedText font-mono uppercase">Responsiveness (10%)</div>
          <div className="text-sm font-bold text-ink font-mono mt-1">{jpa.scores.responsiveness} / 5</div>
        </div>

        <div className="p-2.5 rounded-control bg-surface-alt border border-line">
          <div className="text-[10px] text-mutedText font-mono uppercase">Quality (15%)</div>
          <div className="text-sm font-bold text-ink font-mono mt-1">{jpa.scores.quality} / 5</div>
        </div>

        <div className="p-2.5 rounded-control bg-surface-alt border border-line">
          <div className="text-[10px] text-mutedText font-mono uppercase">Lead Review (15%)</div>
          <div className="text-sm font-bold text-ink font-mono mt-1">{jpa.scores.leadReview} / 5</div>
        </div>
      </div>

      {/* Recognition line */}
      <div className="p-2.5 rounded-control bg-primary/5 border border-primary/20 flex items-center gap-2 text-xs">
        <Award className="h-4 w-4 text-chasing shrink-0" />
        <span className="text-ink">
          Peer recognition: <strong className="font-mono">{jpa.kudosReceivedCount} Kudos</strong> received this cycle.
        </span>
      </div>

      {/* Strengths & Improvement Areas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-ink uppercase tracking-wider font-mono">
            Auto-Drafted Strengths:
          </span>
          <ul className="space-y-1">
            {jpa.strengths.map((str, idx) => (
              <li key={idx} className="text-mutedText flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 text-primary shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-ink uppercase tracking-wider font-mono">
            Growth Focus Areas:
          </span>
          <ul className="space-y-1">
            {jpa.improvements.map((imp, idx) => (
              <li key={idx} className="text-mutedText flex items-center gap-1.5">
                <Star className="h-3 w-3 text-chasing shrink-0" />
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
