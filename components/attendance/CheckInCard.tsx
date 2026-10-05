"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { LogIn, LogOut, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { checkInAction, checkOutAction } from "@/app/(app)/attendance/actions";

export function CheckInCard({ record, user }: { record: any, user: any }) {
  const isCheckedIn = record?.lastOutAt === null && record?.firstInAt != null;
  const inTime = record?.firstInAt ? new Date(record.firstInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";
  const workMode = record?.mode || "OFFICE";
  const workedHours = record?.workedMinutes ? `${Math.floor(record.workedMinutes / 60)}h ${record.workedMinutes % 60}m` : "0h 0m";

  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      if (isCheckedIn) {
        const res = await checkOutAction();
        if (res.success) toast.success("Checked out for today");
        else toast.error(res.error || "Failed to check out");
      } else {
        const res = await checkInAction(user?.remoteAllowed ? "REMOTE" : "OFFICE");
        if (res.success) toast.success("Checked in for today");
        else toast.error(res.error || "Failed to check in");
      }
    });
  };

  return (
    <div className="bg-surface rounded-panel border border-line p-5 shadow-xs">
      

      <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold text-ink">Daily Attendance Protocol (v1.1)</h2>
        </div>
        <Link
          href="/attendance"
          prefetch={true}
          className="text-[11px] font-mono text-primary font-semibold hover:underline"
        >
          View Register &rarr;
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isCheckedIn ? "bg-primary animate-pulse" : "bg-mutedText/40"
              }`}
            />
            <span className="text-xs font-bold text-ink">
              {isCheckedIn
                ? `In since ${inTime} • ${workMode} (Verified)`
                : "Not currently checked in"}
            </span>
          </div>
          <div className="text-[11px] text-mutedText font-mono">
            {isCheckedIn
              ? `Total time logged today: ${workedHours} (Office Start: 09:00 IST)`
              : "Working hours: 09:00 – 18:00 IST (Mon–Sat)"}
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className={`px-5 py-2.5 rounded-control text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto disabled:opacity-60 ${
            isCheckedIn
              ? "bg-danger hover:bg-danger/90 text-white"
              : "bg-primary hover:bg-primary-hover text-white"
          }`}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isCheckedIn ? (
            <LogOut className="h-4 w-4" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          <span>{isPending ? "Updating..." : isCheckedIn ? "Check Out" : "Check In"}</span>
        </button>
      </div>
    </div>
  );
}
