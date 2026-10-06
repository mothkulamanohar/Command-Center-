"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Send, CheckCircle2 } from "lucide-react";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { DailyUpdateModal } from "@/components/updates/DailyUpdateModal";
import { MyTaskListCard, MyTask } from "@/components/my/MyTaskListCard";
import { MyFollowUpCard, MyFollowUp } from "@/components/my/MyFollowUpCard";
import { CheckInCard } from "@/components/attendance/CheckInCard";
import { TodayScheduleCard, ScheduleSlot } from "@/components/todo/TodayScheduleCard";
import {
  getMySpaceDataAction,
  postMyDailyUpdateAction,
  markMyTaskDoneAction,
  passMyTaskTurnAction,
  replyMyFollowUpAction,
} from "./actions";

import { INITIAL_TASKS, INITIAL_FOLLOWUPS } from "@/lib/mock/mySpaceData";

export default function MySpaceClient({ record, currentUser }: any) {
  const [tasks, setTasks] = useState<MyTask[]>(INITIAL_TASKS);
  const [followups, setFollowups] = useState<MyFollowUp[]>(() =>
    INITIAL_FOLLOWUPS.map((f) => ({ ...f, answered: !!f.answered }))
  );
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [unscheduledCount, setUnscheduledCount] = useState<number>(0);
  const [prefill, setPrefill] = useState<{ donePrefill: string; nextPrefill: string }>({
    donePrefill: "• T-1042: Reviewed admission form deployment",
    nextPrefill: "• T-1043: Sign off on UOS staging credentials",
  });
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updatePosted, setUpdatePosted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    const res = await getMySpaceDataAction();
    if (res.success && res.data) {
      if (res.data.tasks && res.data.tasks.length > 0) {
        setTasks(res.data.tasks as any);
      }
      if (res.data.followups && res.data.followups.length > 0) {
        setFollowups(res.data.followups);
      }
      if (res.data.prefill) {
        setPrefill(res.data.prefill);
      }
      setUpdatePosted(res.data.isUpdatePosted);
      if (res.data.schedule?.slots && res.data.schedule.slots.length > 0) {
        setScheduleSlots(res.data.schedule.slots as ScheduleSlot[]);
        setUnscheduledCount(res.data.schedule.unscheduledCount);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshData();

    const handleUpdate = () => refreshData();
    window.addEventListener("icc-tasks-updated", handleUpdate);
    return () => window.removeEventListener("icc-tasks-updated", handleUpdate);
  }, []);

  useEffect(() => {
    const handleOpenUpdate = () => setIsUpdateModalOpen(true);
    window.addEventListener("open-daily-update", handleOpenUpdate);
    return () => window.removeEventListener("open-daily-update", handleOpenUpdate);
  }, []);

  const handleMarkDone = async (taskId: string, title: string) => {
    // Optimistic local update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: t.status === "DONE" ? "OPEN" as const : "DONE" as const }
          : t
      )
    );
    const target = tasks.find((t) => t.id === taskId);
    const wasDone = target?.status === "DONE";
    toast.success(wasDone ? `Restored to open: "${title}"` : `Marked done: "${title}"`);
    try {
      const res = await markMyTaskDoneAction(taskId);
      if (res.success) refreshData();
    } catch {}
  };

  const handlePassTurn = async (taskId: string, title: string) => {
    // Optimistic local update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, whoseTurn: t.whoseTurn === "ME" ? "PARTNER" as const : "ME" as const }
          : t
      )
    );
    toast.success(`Passed turn on "${title}"`);
    try {
      const res = await passMyTaskTurnAction(taskId);
      if (res.success) refreshData();
    } catch {}
  };

  const handleFollowupReply = async (fuId: string, reply: string) => {
    // Optimistic local update
    setFollowups((prev) =>
      prev.map((fu) => (fu.id === fuId ? { ...fu, answered: true } : fu))
    );
    toast.success(`Sent reply: "${reply}"`);
    try {
      const res = await replyMyFollowUpAction(fuId, reply);
      if (res.success) refreshData();
    } catch {}
  };

  const handlePostUpdate = async (data: { done: string; next: string; blockers?: string }) => {
    // Optimistic local update
    setUpdatePosted(true);
    toast.success("Daily update posted to team channels!");
    try {
      const res = await postMyDailyUpdateAction(data);
      if (res.success) refreshData();
    } catch {}
  };

  const openNewTask = () => {
    window.dispatchEvent(
      new CustomEvent("open-command-bar", { detail: { query: "Add: " } })
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink tracking-tight">My Space</h1>
        <p className="text-xs text-mutedText mt-0.5 font-mono">
          Personal Workspace • Tasks, Follow-ups, and Daily Update
        </p>
      </div>

      {/* v1.1 Check-In Card (F-MY-08) */}
      <CheckInCard record={record} user={currentUser} />

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
          <div className="p-3 bg-primary/10 border border-primary/30 rounded-control text-xs text-primary font-medium font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Today&apos;s daily update has been posted to your team channels!</span>
            </div>
            <button
              type="button"
              onClick={() => setIsUpdateModalOpen(true)}
              className="text-xs text-primary underline hover:text-primary-hover font-semibold cursor-pointer"
            >
              Edit Update
            </button>
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

      {/* v1.1 Today's Schedule (F-MY-09) */}
      <TodayScheduleCard slots={scheduleSlots} unscheduledCount={unscheduledCount} />

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
        initialDone={prefill.donePrefill}
        initialNext={prefill.nextPrefill}
        onSubmit={handlePostUpdate}
      />
    </div>
  );
}
