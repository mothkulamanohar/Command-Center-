"use client";

import { useState, useEffect } from "react";
import {
  UserCheck,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRightLeft,
  AlertCircle,
} from "lucide-react";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { DailyUpdateModal } from "@/components/updates/DailyUpdateModal";
import {
  MyTask,
  MyFollowUp,
  INITIAL_TASKS,
  INITIAL_FOLLOWUPS,
} from "@/lib/mock/mySpaceData";

export default function MySpacePage() {
  const [tasks, setTasks] = useState<MyTask[]>(INITIAL_TASKS);
  const [followups, setFollowups] = useState<MyFollowUp[]>(INITIAL_FOLLOWUPS);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updatePosted, setUpdatePosted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const handleOpenUpdate = () => setIsUpdateModalOpen(true);
    window.addEventListener("open-daily-update", handleOpenUpdate);
    return () => window.removeEventListener("open-daily-update", handleOpenUpdate);
  }, []);

  const handleMarkDone = (taskId: string, title: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "DONE" } : t))
    );
    showToast(`Marked done: "${title}"`);
  };

  const handlePassTurn = (taskId: string, title: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, whoseTurn: t.whoseTurn === "ME" ? "PARTNER" : "ME" }
          : t
      )
    );
    showToast(`Passed turn on "${title}"`);
  };

  const handleFollowupReply = (fuId: string, reply: string) => {
    setFollowups((prev) =>
      prev.map((fu) => (fu.id === fuId ? { ...fu, answered: true } : fu))
    );
    showToast(`Sent reply: "${reply}"`);
  };

  const openNewTask = () => {
    window.dispatchEvent(
      new CustomEvent("open-command-bar", { detail: { query: "Add: " } })
    );
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-surface px-4 py-2.5 rounded-control text-xs font-medium shadow-panel border border-line flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span>{toast}</span>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-ink tracking-tight">My Space</h1>
        <p className="text-xs text-mutedText mt-0.5 font-mono">
          Personal Workspace • Tasks, Follow-ups, and Daily Update
        </p>
      </div>

      {/* Onboarding Checklist (F-AUTH-09) */}
      <OnboardingCard onOpenDailyUpdate={() => setIsUpdateModalOpen(true)} />

      {/* Daily Update Prompt Box (SPEC §10.3) */}
      <div className="bg-surface rounded-panel border border-line p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-ink">Daily Update (Due by 18:00)</h2>
          </div>
          <span className="px-2 py-0.5 bg-ground text-mutedText text-[11px] font-mono rounded">
            Takes &lt; 30 seconds
          </span>
        </div>

        {updatePosted ? (
          <div className="p-3 bg-[#3FB8AC]/10 border border-[#3FB8AC]/30 rounded-control text-xs text-[#0E6E66] font-medium font-mono">
            ✔ Today&apos;s daily update has been posted to your team channels!
          </div>
        ) : (
          <>
            <p className="text-xs text-mutedText mb-4 leading-relaxed">
              Pre-fills with tasks completed today and tasks due tomorrow. Shared to your team chats with Done, Next, and Blockers.
            </p>
            <button
              type="button"
              onClick={() => setIsUpdateModalOpen(true)}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-medium rounded-control transition-colors shadow-xs cursor-pointer"
            >
              Post Today&apos;s Update
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* My Tasks */}
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs min-h-[300px] flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-ink">My Tasks (I Owe)</h2>
            </div>
            <button
              type="button"
              onClick={openNewTask}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Task</span>
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-3 rounded-control border border-line flex flex-col gap-2 transition-all ${
                  task.status === "DONE" ? "bg-ground opacity-60" : "bg-surface hover:border-primary/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-ground rounded text-mutedText font-semibold shrink-0">
                      {task.ref}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        task.status === "DONE" ? "line-through text-mutedText" : "text-ink"
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
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
                        • Turn: {task.whoseTurn === "ME" ? "Mine" : task.partner}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {task.partner && task.status !== "DONE" && (
                      <button
                        type="button"
                        onClick={() => handlePassTurn(task.id, task.title)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-surface-alt hover:bg-ground border border-line rounded text-[10px] font-medium text-ink transition-colors cursor-pointer"
                      >
                        <ArrowRightLeft className="h-3 w-3" />
                        <span>Pass Turn</span>
                      </button>
                    )}
                    {task.status !== "DONE" ? (
                      <button
                        type="button"
                        onClick={() => handleMarkDone(task.id, task.title)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary hover:bg-primary-hover text-white rounded text-[10px] font-medium transition-colors shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Done</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-primary font-mono font-semibold">Completed</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Follow-ups to Me */}
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs min-h-[300px] flex flex-col">
          <div className="flex items-center gap-2 pb-3 border-b border-line mb-3">
            <MessageSquare className="h-4 w-4 text-chasing" />
            <h2 className="text-sm font-semibold text-ink">Follow-ups Waiting on Me</h2>
          </div>

          <div className="space-y-2.5 flex-1">
            {followups.map((fu) => (
              <div
                key={fu.id}
                className={`p-3 rounded-control border border-line flex flex-col gap-2 ${
                  fu.answered ? "bg-ground opacity-60" : "bg-surface"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-ink">{fu.fromName}</span>
                    <span className="text-[10px] font-mono text-mutedText ml-2">({fu.cadence})</span>
                  </div>
                  <span className="text-[10px] text-mutedText font-mono">{fu.lastNudge}</span>
                </div>

                <div className="text-xs text-mutedText bg-ground/60 p-2 rounded border border-line/50">
                  &ldquo;{fu.taskTitle}&rdquo;
                </div>

                {!fu.answered ? (
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-mutedText font-mono mr-1">Quick Reply:</span>
                    <button
                      type="button"
                      onClick={() => handleFollowupReply(fu.id, "Done")}
                      className="px-2 py-0.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded text-[10px] font-medium transition-colors"
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFollowupReply(fu.id, "Working on it")}
                      className="px-2 py-0.5 bg-ground hover:bg-surface-alt border border-line text-ink rounded text-[10px] font-medium transition-colors"
                    >
                      Working on it
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFollowupReply(fu.id, "Blocked")}
                      className="px-2 py-0.5 bg-danger/10 hover:bg-danger text-danger hover:text-white rounded text-[10px] font-medium transition-colors"
                    >
                      Blocked
                    </button>
                  </div>
                ) : (
                  <div className="text-[10px] font-mono text-primary font-semibold">
                    ✔ Reply sent
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Update Modal Dialog */}
      <DailyUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        initialDone="• T-1042: Reviewed admission form deployment"
        initialNext="• T-1043: Sign off on UOS staging credentials"
        onSubmit={(data) => {
          setUpdatePosted(true);
          showToast("Daily update submitted to team channels!");
        }}
      />
    </div>
  );
}
