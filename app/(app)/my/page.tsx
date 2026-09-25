"use client";

import { useState, useEffect } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { DailyUpdateModal } from "@/components/updates/DailyUpdateModal";
import { MyTaskListCard } from "@/components/my/MyTaskListCard";
import { MyFollowUpCard } from "@/components/my/MyFollowUpCard";
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

  useEffect(() => {
    const handleCommand = (e: Event) => {
      const customEvent = e as CustomEvent<{
        intent: string;
        input: string;
        slots: Record<string, any>;
      }>;
      const { intent, slots, input } = customEvent.detail || {};

      if (intent === "ADD_TASK") {
        const rawTitle = slots?.title || input.replace(/^(add:\s*|add\s+)/i, "");
        const cleanTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
        const newTask: MyTask = {
          id: `t-${Date.now()}`,
          ref: `T-${Math.floor(1046 + Math.random() * 500)}`,
          title: cleanTitle,
          dueText: "Tomorrow 18:00",
          priority: slots?.priority || "HIGH",
          status: "OPEN",
        };
        setTasks((prev) => [newTask, ...prev]);
        showToast(`Added to your tasks: "${cleanTitle}"`);
      }
    };

    window.addEventListener("command-executed", handleCommand);
    return () => window.removeEventListener("command-executed", handleCommand);
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
        <MyTaskListCard
          tasks={tasks}
          onNewTask={openNewTask}
          onMarkDone={handleMarkDone}
          onPassTurn={handlePassTurn}
        />

        <MyFollowUpCard
          followups={followups}
          onReply={handleFollowupReply}
        />
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
