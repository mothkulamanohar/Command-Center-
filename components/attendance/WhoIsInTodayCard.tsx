"use client";

import { useState, useEffect } from "react";
import { Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getWhoIsInTodaySummaryAction } from "@/app/(app)/attendance/actions";

interface AttendanceSummary {
  inCount: number;
  lateCount: number;
  remoteCount: number;
  leaveCount: number;
  notYetCount: number;
  pendingRequestsCount: number;
}

export function WhoIsInTodayCard() {
  const [summary, setSummary] = useState<AttendanceSummary>({
    inCount: 0,
    lateCount: 0,
    remoteCount: 0,
    leaveCount: 0,
    notYetCount: 0,
    pendingRequestsCount: 0,
  });

  useEffect(() => {
    getWhoIsInTodaySummaryAction().then((res) => {
      if (res.success && res.data) {
        setSummary(res.data as AttendanceSummary);
      }
    });
  }, []);

  return (
    <div className="bg-surface rounded-panel border border-line p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink font-mono">
              Who&apos;s In Today (v1.1)
            </h3>
          </div>
          <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
            Live Protocol
          </span>
        </div>

        {/* Breakdown Chips */}
        <div className="flex flex-wrap gap-1.5 py-2">
          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[11px] font-mono font-bold">
            In {summary.inCount}
          </span>
          <span className="px-2 py-0.5 rounded bg-chasing-tint text-chasing border border-chasing/20 text-[11px] font-mono font-bold">
            Late {summary.lateCount}
          </span>
          <span className="px-2 py-0.5 rounded bg-ground text-ink border border-line text-[11px] font-mono font-semibold">
            Remote {summary.remoteCount}
          </span>
          <span className="px-2 py-0.5 rounded bg-shared-tint text-shared border border-shared/20 text-[11px] font-mono font-bold">
            Leave {summary.leaveCount}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#FBE3E0] text-[#B42318] border border-[#B42318]/20 text-[11px] font-mono font-bold">
            Not in {summary.notYetCount}
          </span>
        </div>

        <p className="text-xs text-mutedText mt-2 leading-relaxed">
          Office IP &amp; Geofence verified. {summary.pendingRequestsCount} pending regularization &amp; leave request{summary.pendingRequestsCount === 1 ? "" : "s"} awaiting review.
        </p>
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-line mt-3">
        <Link
          href="/attendance/requests"
          prefetch={true}
          className="text-xs font-semibold text-chasing hover:underline"
        >
          Review Requests ({summary.pendingRequestsCount}) &rarr;
        </Link>
        <Link
          href="/attendance"
          prefetch={true}
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          <span>Open Today Board</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
