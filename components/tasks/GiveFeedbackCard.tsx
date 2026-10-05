"use client";

import { useState, useEffect } from "react";
import { Star, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getPendingFeedbackQueueAction } from "@/app/(app)/feedback/actions";

interface PendingTask {
  id?: string;
  ref: string;
  title: string;
  ownerName: string;
  actualDuration: string;
}

export function GiveFeedbackCard() {
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getPendingFeedbackQueueAction().then((res) => {
      if (res.success && res.data) {
        setPendingTasks(res.data);
      }
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="bg-surface rounded-panel border border-line p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink font-mono">
              Give Feedback (v1.1)
            </h3>
          </div>
          <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
            {pendingTasks.length} Pending
          </span>
        </div>

        <p className="text-xs text-mutedText leading-relaxed mb-3">
          Rate completed tasks assigned to individuals (1–5 stars & optional rework).
        </p>

        {pendingTasks.length === 0 && !isLoading ? (
          <div className="p-4 rounded-control bg-ground border border-line text-xs text-center text-mutedText flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>All completed tasks have been reviewed.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingTasks.slice(0, 3).map((task) => (
              <div
                key={task.ref}
                className="p-2.5 rounded-control bg-ground border border-line text-xs flex items-center justify-between"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-primary">
                    <span>{task.ref}</span>
                    <span className="text-mutedText font-normal">({task.ownerName})</span>
                  </div>
                  <div className="text-ink truncate font-medium">{task.title}</div>
                </div>
                <span className="text-[10px] font-mono text-mutedText shrink-0">
                  {task.actualDuration}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 flex items-center justify-between">
        <Link
          href="/feedback/give"
          prefetch={true}
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          <span>Start Feedback Mode</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
