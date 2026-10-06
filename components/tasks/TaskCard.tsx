"use client";

import { Task, User, Priority, TaskMode, TaskStatus } from "@prisma/client";
import { formatOrgDate } from "@/lib/time";
import { CheckCircle2, Circle, Clock, ArrowRight, AlertTriangle, UserCheck } from "lucide-react";
import { useState, useEffect, memo } from "react";

interface TaskWithRelations extends Task {
  owner?: User | null;
}

interface TaskCardProps {
  task: TaskWithRelations;
  currentUserId?: string;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onPassTurn?: (taskId: string) => void;
}

export const TaskCard = memo(function TaskCard({ task, currentUserId, onStatusChange, onPassTurn }: TaskCardProps) {
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const isDone = status === TaskStatus.DONE;
  const isOverdue = task.dueAt && new Date(task.dueAt) < new Date() && !isDone;

  useEffect(() => {
    setStatus(task.status);
  }, [task.status]);

  const toggleDone = () => {
    const nextStatus = isDone ? TaskStatus.TODO : TaskStatus.DONE;
    setStatus(nextStatus);
    onStatusChange?.(task.id, nextStatus);
  };

  const priorityColors: Record<Priority, string> = {
    LOW: "text-mutedText bg-ground",
    MEDIUM: "text-ink bg-surface-alt",
    HIGH: "text-chasing bg-chasing-tint font-semibold",
    URGENT: "text-danger bg-danger-tint font-bold",
  };

  return (
    <div className="p-3.5 bg-surface rounded-card border border-line hover:border-mutedText/40 transition-all shadow-xs space-y-2 group">
      {/* Top Row: Checkbox, Title, and ID */}
      <div className="flex items-start justify-between gap-2">
        <div
          onClick={toggleDone}
          className="flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer select-none"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleDone();
            }}
            className="mt-0.5 text-mutedText hover:text-primary transition-colors shrink-0 cursor-pointer"
            aria-label={`Mark task T-${task.number} ${isDone ? "incomplete" : "done"}`}
          >
            {isDone ? (
              <CheckCircle2 className="h-4 w-4 text-[#3FB8AC]" />
            ) : (
              <Circle className="h-4 w-4 text-line group-hover:text-mutedText" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <span
              className={`text-xs font-medium leading-snug line-clamp-2 transition-colors ${
                isDone ? "line-through text-mutedText" : "text-ink group-hover:text-primary"
              }`}
            >
              {task.title}
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono text-mutedText shrink-0">
          T-{task.number}
        </span>
      </div>

      {/* Middle Row: Note line / Whose turn if SHARED */}
      {task.mode === TaskMode.SHARED && (
        <div className="flex items-center justify-between text-[11px] font-mono py-1 px-2 bg-shared-tint rounded text-shared">
          <div className="flex items-center gap-1.5 truncate">
            <ArrowRight className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {task.turnUserId === currentUserId ? "Your turn" : "Their turn"}:{" "}
              {task.turnNote || "Awaiting action"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onPassTurn?.(task.id)}
            className={`ml-2 px-2 py-0.5 rounded text-[10px] font-medium shrink-0 transition-colors shadow-xs cursor-pointer ${
              task.turnUserId === currentUserId
                ? "bg-shared text-white hover:opacity-90"
                : "bg-surface text-shared border border-shared/30 hover:bg-shared hover:text-white"
            }`}
          >
            {task.turnUserId === currentUserId ? "Pass ball" : "Take turn"}
          </button>
        </div>
      )}

      {/* Bottom Row: Metadata & Tags */}
      <div className="flex items-center justify-between pt-1 border-t border-line/40 text-[11px] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {task.owner && (
            <span className="inline-flex items-center gap-1 text-mutedText font-mono">
              <UserCheck className="h-3 w-3" />
              <span>{task.owner.displayName || task.owner.name}</span>
            </span>
          )}
          {task.source === "LEADERSHIP" && (
            <span className="px-1.5 py-0.2 bg-danger-tint text-danger rounded text-[9px] font-bold font-mono">
              LEADERSHIP
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className={`px-1.5 py-0.2 rounded text-[10px] ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
          {task.dueAt && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] ${
                isOverdue ? "text-danger font-semibold" : "text-mutedText"
              }`}
            >
              {isOverdue && <AlertTriangle className="h-3 w-3" />}
              <span>{formatOrgDate(task.dueAt)}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
