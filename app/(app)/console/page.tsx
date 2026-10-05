"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { ThreeColumns } from "@/components/tasks/ThreeColumns";
import { Clock, ShieldAlert, CheckCircle2 } from "lucide-react";
import { TaskStatus, Task, User } from "@prisma/client";
import { MorningBriefCard } from "@/components/brief/MorningBriefCard";
import { ApprovalQueueModal, PendingApprovalItem } from "@/components/followups/ApprovalQueueModal";
import { MorningBriefData } from "@/lib/services/brief";
import {
  getMorningBriefAction,
  getConsoleTasksAction,
  updateConsoleTaskStatusAction,
  passConsoleTaskTurnAction,
  getPendingApprovalsAction,
  approveApprovalAction,
  rejectApprovalAction,
  getConsoleMetaAction,
} from "./actions";
import { GiveFeedbackCard } from "@/components/tasks/GiveFeedbackCard";
import { WhoIsInTodayCard } from "@/components/attendance/WhoIsInTodayCard";

interface ConsoleTaskWithRelations extends Task {
  owner?: User | null;
}

export default function ConsolePage() {
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [tasks, setTasks] = useState<{
    iOwe: ConsoleTaskWithRelations[];
    imChasing: ConsoleTaskWithRelations[];
    shared: ConsoleTaskWithRelations[];
  }>({ iOwe: [], imChasing: [], shared: [] });

  const [briefData, setBriefData] = useState<MorningBriefData | null>(null);
  const [inboxCount, setInboxCount] = useState<number>(0);
  const [approvals, setApprovals] = useState<PendingApprovalItem[]>([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const refreshTasks = () => {
    getConsoleTasksAction().then((res) => {
      if (res.success && res.data) {
        setTasks(res.data as any);
      }
    });
  };

  const refreshMeta = () => {
    getConsoleMetaAction().then((res) => {
      if (res.success && res.data) {
        setCurrentUser({ id: res.data.userId, name: res.data.userName || "Sri" });
        setInboxCount(res.data.inboxCount);
      }
    });
  };

  const refreshApprovals = () => {
    getPendingApprovalsAction().then((res) => {
      if (res.success && res.items) {
        setApprovals(res.items);
      }
    });
  };

  useEffect(() => {
    refreshTasks();
    refreshMeta();
    refreshApprovals();

    // Fetch morning brief
    getMorningBriefAction().then((res) => {
      if (res.success && res.data) {
        setBriefData(res.data);
      }
    });

    const handleTasksUpdate = () => {
      refreshTasks();
    };

    const handleCommand = (e: Event) => {
      const customEvent = e as CustomEvent<{
        intent: string;
        input: string;
        slots: Record<string, any>;
        preview: string;
      }>;
      const { intent, slots, input } = customEvent.detail || {};

      if (intent === "ADD_TASK") {
        toast.success(`Task added: "${slots?.title || input}"`);
        refreshTasks();
      } else if (intent === "ASSIGN_TASK" || intent === "ASSIGN_WITH_CHASE") {
        toast.success(`Task assigned to ${slots?.owner || "Hari"} (daily chase enabled)`);
        refreshTasks();
      } else if (intent === "PASS_TURN") {
        toast.success("Turn passed to partner on shared tasks");
        refreshTasks();
      } else if (intent === "QUERY_DAY") {
        toast.success("Summary: 1 task due today, 1 chase active, 1 inbox request");
      }
    };

    const handleInboxUpdate = () => {
      refreshMeta();
    };

    window.addEventListener("icc-tasks-updated", handleTasksUpdate);
    window.addEventListener("icc-inbox-updated", handleInboxUpdate);
    window.addEventListener("command-executed", handleCommand);
    return () => {
      window.removeEventListener("icc-tasks-updated", handleTasksUpdate);
      window.removeEventListener("icc-inbox-updated", handleInboxUpdate);
      window.removeEventListener("command-executed", handleCommand);
    };
  }, []);

  const iOwe = tasks.iOwe;
  const imChasing = tasks.imChasing;
  const shared = tasks.shared;

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const res = await updateConsoleTaskStatusAction(taskId, newStatus);
    if (res.success) {
      refreshTasks();
      toast.success(newStatus === TaskStatus.DONE ? "Task marked completed" : "Task restored to in-progress");
    } else {
      toast.error(res.error || "Failed to update task status");
    }
  };

  const handlePassTurn = async (taskId: string) => {
    const res = await passConsoleTaskTurnAction(taskId);
    if (res.success) {
      refreshTasks();
      toast.success("Turn updated successfully!");
    } else {
      toast.error(res.error || "Failed to pass turn");
    }
  };

  const handleApprove = async (id: string, text: string) => {
    const res = await approveApprovalAction(id, text);
    if (res.success) {
      setApprovals((prev) => prev.filter((item) => item.id !== id));
      toast.success("Approval processed successfully!");
      refreshApprovals();
    } else {
      toast.error(res.error || "Failed to approve item");
    }
  };

  const handleReject = async (id: string) => {
    const res = await rejectApprovalAction(id);
    if (res.success) {
      setApprovals((prev) => prev.filter((item) => item.id !== id));
      toast.success("Item rejected");
      refreshApprovals();
    } else {
      toast.error(res.error || "Failed to reject item");
    }
  };

  const handleSkip = (id: string) => {
    setApprovals((prev) => prev.filter((item) => item.id !== id));
    toast.info("Follow-up skipped for this cycle");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">
            {currentUser?.name || "Sri"}’s Console
          </h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Command Center Active • Plain-English Command Bar (/) Enabled
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface border border-line rounded-control text-xs text-ink shadow-xs">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-[11px]">Auto Follow-ups Running</span>
        </div>
      </div>

      {/* Quick Stats Banner (Clickable to open pages) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/my"
          prefetch={true}
          className="p-4 bg-surface rounded-card border border-line shadow-xs hover:border-primary/60 hover:shadow-sm transition-all cursor-pointer block group"
        >
          <div className="text-xs text-mutedText group-hover:text-primary font-medium transition-colors">I owe</div>
          <div className="text-2xl font-bold text-ink mt-1">{iOwe.length}</div>
          <div className="text-[11px] text-mutedText font-mono mt-1 flex items-center justify-between">
            <span>Due this week</span>
            <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
          </div>
        </Link>
        <Link
          href="/my"
          prefetch={true}
          className="p-4 bg-surface rounded-card border border-line shadow-xs hover:border-chasing/60 hover:shadow-sm transition-all cursor-pointer block group"
        >
          <div className="text-xs text-mutedText group-hover:text-chasing font-medium transition-colors">I&apos;m chasing</div>
          <div className="text-2xl font-bold text-chasing mt-1">{imChasing.length}</div>
          <div className="text-[11px] text-mutedText font-mono mt-1 flex items-center justify-between">
            <span>1 active daily chase</span>
            <span className="text-chasing opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
          </div>
        </Link>
        <Link
          href="/my"
          prefetch={true}
          className="p-4 bg-surface rounded-card border border-line shadow-xs hover:border-shared/60 hover:shadow-sm transition-all cursor-pointer block group"
        >
          <div className="text-xs text-mutedText group-hover:text-shared font-medium transition-colors">Shared (Whose turn)</div>
          <div className="text-2xl font-bold text-shared mt-1">{shared.length}</div>
          <div className="text-[11px] text-shared font-mono mt-1 flex items-center justify-between">
            <span>Your turn: {shared.filter((t) => currentUser?.id && t.turnUserId === currentUser.id).length}</span>
            <span className="text-shared opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
          </div>
        </Link>
        <Link
          href="/inbox"
          prefetch={true}
          className="p-4 bg-surface rounded-card border border-line shadow-xs hover:border-primary/60 hover:shadow-sm transition-all cursor-pointer block group"
        >
          <div className="text-xs text-mutedText group-hover:text-primary font-medium transition-colors">Inbox Requests</div>
          <div className="text-2xl font-bold text-primary mt-1">{inboxCount}</div>
          <div className="text-[11px] text-mutedText font-mono mt-1 flex items-center justify-between">
            <span>Awaiting {currentUser?.name || "You"}</span>
            <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
          </div>
        </Link>
      </div>

      {/* Interactive 3 Columns */}
      <ThreeColumns
        iOwe={iOwe}
        imChasing={imChasing}
        shared={shared}
        currentUserId={currentUser?.id || ""}
        onStatusChange={handleStatusChange}
        onPassTurn={handlePassTurn}
      />

      {/* Row of 3 Cards: Morning Brief, Inbox, Follow-ups awaiting approval */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {briefData ? (
          <MorningBriefCard 
            initialData={briefData} 
            onRefresh={() => {
              toast.success("Refreshing morning brief...");
              getMorningBriefAction().then(res => {
                if (res.success && res.data) {
                  setBriefData(res.data);
                  toast.success("Morning brief refreshed");
                }
              });
            }} 
          />
        ) : (
          <div className="bg-surface rounded-panel border border-line p-5 shadow-xs flex items-center justify-center">
            <span className="text-xs text-mutedText">Loading Morning Brief...</span>
          </div>
        )}

        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink font-mono">
                Inbox Awaiting
              </h3>
            </div>
            <p className="text-xs text-mutedText leading-relaxed">
              {inboxCount > 0
                ? `${inboxCount} pending requests awaiting ${currentUser?.name || "you"} in your inbox.`
                : "No pending inbox requests awaiting your action."}
            </p>
          </div>
          <Link
            href="/inbox"
            prefetch={true}
            className="mt-4 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            Review Inbox &rarr;
          </Link>
        </div>

        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-chasing" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink font-mono">
                  Pending Approvals
                </h3>
              </div>
              {approvals.length > 0 && (
                <span className="bg-chasing/10 text-chasing border border-chasing/20 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                  {approvals.length} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-mutedText leading-relaxed">
              {approvals.length > 0
                ? `${approvals.length} item${approvals.length > 1 ? "s" : ""} (attendance regularizations or follow-ups) waiting your review.`
                : "No pending items currently awaiting approval."}
            </p>
          </div>
          {approvals.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowApprovalModal(true)}
              className="mt-4 text-xs font-semibold text-chasing hover:underline inline-flex items-center gap-1 self-start"
            >
              Review & Approve ({approvals.length}) &rarr;
            </button>
          ) : (
            <span className="mt-4 text-xs text-mutedText/70 font-mono">All queues clear</span>
          )}
        </div>
      </div>

      {/* Row of 2 Cards (SPEC §10.1 v1.1): Give Feedback & Who's In Today */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GiveFeedbackCard />
        <WhoIsInTodayCard />
      </div>

      <ApprovalQueueModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        items={approvals}
        onApprove={handleApprove}
        onReject={handleReject}
        onSkip={handleSkip}
      />
    </div>
  );
}
