"use client";

import { CheckCircle2, Clock, AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";

interface TaskChipProps {
  taskNumber: number;
  title?: string;
  status?: string;
  ownerName?: string;
}

export function TaskChip({
  taskNumber,
  title = "Task",
  status = "IN_PROGRESS",
  ownerName = "Hari",
}: TaskChipProps) {
  const isDone = status === "DONE";

  return (
    <Link
      href="/console"
      className="inline-flex items-center gap-2 px-2.5 py-1 my-1 bg-surface-alt hover:bg-surface border border-line rounded-control text-xs text-ink transition-colors shadow-2xs group"
    >
      <div className="flex items-center gap-1 font-mono font-semibold text-primary">
        <span>T-{taskNumber}</span>
      </div>
      <span className="text-mutedText truncate max-w-[200px]">{title}</span>
      <div className="flex items-center gap-1 pl-1 border-l border-line text-[10px] font-mono text-mutedText">
        {isDone ? (
          <span className="text-[#3FB8AC] flex items-center gap-0.5">
            <CheckCircle2 className="h-3 w-3" /> Done
          </span>
        ) : (
          <span className="text-chasing flex items-center gap-0.5">
            <Clock className="h-3 w-3" /> {ownerName}
          </span>
        )}
      </div>
      <ExternalLink className="h-3 w-3 text-line group-hover:text-mutedText" />
    </Link>
  );
}
