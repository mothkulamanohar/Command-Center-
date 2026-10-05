"use client";

import { UserCheck, Plus, CheckCircle2, Clock, ArrowRightLeft } from "lucide-react";

export interface MyTask {
  id: string;
  ref: string;
  title: string;
  dueText: string;
  partner?: string;
  whoseTurn?: "ME" | "PARTNER";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "DONE";
}

interface MyTaskListCardProps {
  tasks: MyTask[];
  onNewTask: () => void;
  onMarkDone: (taskId: string, title: string) => void;
  onPassTurn: (taskId: string, title: string) => void;
}

export function MyTaskListCard({
  tasks,
  onNewTask,
  onMarkDone,
  onPassTurn,
}: MyTaskListCardProps) {
  return (
    <div className="bg-surface rounded-panel border border-line p-5 shadow-xs min-h-[300px] flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-ink">My Tasks (I Owe)</h2>
        </div>
        <div className="flex items-center gap-2">
          {tasks.length > 0 && (
            <span className="text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-bold">
              {tasks.filter((t) => t.status !== "DONE").length} Open
            </span>
          )}
          <button
            type="button"
            onClick={onNewTask}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      <div className="space-y-2.5 flex-1">
        {tasks.length === 0 ? (
          <div className="py-12 text-center text-xs text-mutedText font-mono">
            No pending tasks assigned to you. Click &ldquo;New Task&rdquo; to create one.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 rounded-control border border-line flex flex-col gap-2 transition-all ${
                task.status === "DONE" ? "bg-ground opacity-60" : "bg-surface hover:border-primary/50"
              }`}
            >
              <div
                onClick={() => onMarkDone(task.id, task.title)}
                className="flex items-start justify-between gap-2 cursor-pointer select-none"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-ground rounded text-mutedText font-semibold shrink-0">
                    {task.ref}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      task.status === "DONE" ? "line-through text-mutedText" : "text-ink hover:text-primary"
                    }`}
                  >
                    {task.title}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                    task.priority === "URGENT"
                      ? "bg-danger/10 text-danger"
                      : task.priority === "HIGH"
                      ? "bg-chasing/10 text-chasing"
                      : "bg-ground text-mutedText"
                  }`}
                >
                  {task.priority}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-mutedText border-t border-line/60 pt-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  <span>{task.dueText}</span>
                  {task.partner && (
                    <span className="font-mono text-primary ml-1">
                      (Partner: {task.partner})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {task.partner && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPassTurn(task.id, task.title);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-surface-alt hover:bg-ground border border-line rounded text-[10px] font-medium text-ink transition-colors cursor-pointer"
                    >
                      <ArrowRightLeft className="h-3 w-3" />
                      <span>Pass Turn</span>
                    </button>
                  )}
                  {task.status !== "DONE" ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkDone(task.id, task.title);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary hover:bg-primary-hover text-white rounded text-[10px] font-medium transition-colors shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Done</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkDone(task.id, task.title);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-primary hover:bg-primary/10 border border-primary/20 font-mono font-semibold cursor-pointer transition-colors"
                      title="Click to restore to open"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Completed (Undo)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
