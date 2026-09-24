"use client";

import { useState } from "react";
import { ThreeColumns } from "@/components/tasks/ThreeColumns";
import { Clock, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Task, User, TaskMode, Priority, TaskStatus, TaskSource } from "@prisma/client";
import { MorningBriefCard } from "@/components/brief/MorningBriefCard";
import { ApprovalQueueModal, PendingApprovalItem } from "@/components/followups/ApprovalQueueModal";
import { MorningBriefData } from "@/lib/services/brief";

type TaskWithRelations = Task & { owner?: User | null };

const MOCK_BRIEF: MorningBriefData = {
  date: "Thu, 24 Sep",
  meetingsToday: [],
  dueToday: [
    { id: "t_1", number: 1042, title: "Review monthly KPI report for VC", priority: "HIGH" },
  ],
  overdue: [],
  leadershipAsks: [
    { id: "t_1", number: 1042, title: "Review monthly KPI report for VC", requesterName: "VC Office" },
  ],
  chasesToday: [
    { id: "fu_1", targetName: "Hari", taskTitle: "Fix admission form verification", tone: "DAILY" },
  ],
  stuckItems: [],
  yesterdayBlockers: [],
  downSites: [],
  newRequestsCount: 1,
  summaryText: "Good morning Sri!\n- **1 task** due today, **0 overdue**.\n- **1 open leadership ask** from VC Office.\n- **1 automated follow-up** going out to Hari at 09:30.\n- **1 new request** waiting in your Inbox.",
};

const MOCK_PENDING_APPROVALS: PendingApprovalItem[] = [
  {
    id: "fu_app_1",
    targetName: "Janardhan",
    targetRole: "Support Tech",
    isSenior: true,
    taskTitle: "SMRU Main Lab Switch Migration",
    draftText: "Dear Janardhan sir, a quick check on 'SMRU Main Lab Switch Migration' (due tomorrow). Any update? — sent for Sri",
    cadence: "DAILY",
    createdAt: "Today 08:30 AM",
  },
];

export default function ConsolePage() {
  const sriId = "u_sri";
  const [iOwe, setIOwe] = useState<TaskWithRelations[]>([
    {
      id: "t_1",
      number: 1042,
      title: "Review monthly KPI report for VC",
      description: null,
      ownerId: sriId,
      requesterId: "u_vc",
      requesterName: "VC Office",
      createdById: "u_vc",
      mode: TaskMode.SOLO,
      partnerId: null,
      turnUserId: null,
      turnNote: null,
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      startAt: null,
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      doneAt: null,
      doneById: null,
      blockedReason: null,
      teamId: null,
      projectId: null,
      campusId: null,
      tags: ["leadership", "kpi"],
      source: TaskSource.LEADERSHIP,
      recurrence: null,
      parentId: null,
      checklist: [],
      estimateHours: 2,
      lastActivityAt: new Date(),
      reopenCount: 0,
      requestId: null,
      messageId: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "t_2",
      number: 1043,
      title: "Approve UOS implementation rollout schedule",
      description: null,
      ownerId: sriId,
      requesterId: "u_hari",
      requesterName: null,
      createdById: "u_hari",
      mode: TaskMode.SOLO,
      partnerId: null,
      turnUserId: null,
      turnNote: null,
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      startAt: null,
      dueAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      doneAt: null,
      doneById: null,
      blockedReason: null,
      teamId: null,
      projectId: null,
      campusId: null,
      tags: ["uos"],
      source: TaskSource.MANUAL,
      recurrence: null,
      parentId: null,
      checklist: [],
      estimateHours: 1,
      lastActivityAt: new Date(),
      reopenCount: 0,
      requestId: null,
      messageId: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const [imChasing, setImChasing] = useState<TaskWithRelations[]>([
    {
      id: "t_3",
      number: 1044,
      title: "Fix admission form verification on smru.in",
      description: null,
      ownerId: "u_hari",
      requesterId: sriId,
      requesterName: null,
      createdById: sriId,
      mode: TaskMode.SOLO,
      partnerId: null,
      turnUserId: null,
      turnNote: null,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      startAt: null,
      dueAt: new Date(Date.now() + 18 * 60 * 60 * 1000),
      doneAt: null,
      doneById: null,
      blockedReason: null,
      teamId: null,
      projectId: null,
      campusId: null,
      tags: ["admissions"],
      source: TaskSource.COMMAND,
      recurrence: null,
      parentId: null,
      checklist: [],
      estimateHours: 3,
      lastActivityAt: new Date(),
      reopenCount: 0,
      requestId: null,
      messageId: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const [shared, setShared] = useState<TaskWithRelations[]>([
    {
      id: "t_4",
      number: 1045,
      title: "Renew smru.in SSL & DNS mapping",
      description: null,
      ownerId: sriId,
      requesterId: sriId,
      requesterName: null,
      createdById: sriId,
      mode: TaskMode.SHARED,
      partnerId: "u_hari",
      turnUserId: sriId,
      turnNote: "Sign off checklist",
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      startAt: null,
      dueAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      doneAt: null,
      doneById: null,
      blockedReason: null,
      teamId: null,
      projectId: null,
      campusId: null,
      tags: ["dns", "ssl"],
      source: TaskSource.COMMAND,
      recurrence: null,
      parentId: null,
      checklist: [],
      estimateHours: 1,
      lastActivityAt: new Date(),
      reopenCount: 0,
      requestId: null,
      messageId: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const [approvals, setApprovals] = useState<PendingApprovalItem[]>(MOCK_PENDING_APPROVALS);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    if (newStatus === TaskStatus.DONE) {
      setIOwe((prev) => prev.filter((t) => t.id !== taskId));
      showToast("Task completed");
    }
  };

  const handlePassTurn = (taskId: string) => {
    setShared((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, turnUserId: t.partnerId, turnNote: "Awaiting partner confirmation" }
          : t
      )
    );
    showToast("Turn passed to partner");
  };

  const handleApprove = (id: string, text: string) => {
    setApprovals((prev) => prev.filter((item) => item.id !== id));
    showToast("Follow-up approved & sent on your behalf!");
  };

  const handleSkip = (id: string) => {
    setApprovals((prev) => prev.filter((item) => item.id !== id));
    showToast("Follow-up skipped for this cycle");
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-surface px-4 py-2.5 rounded-control text-xs font-medium shadow-panel border border-line flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Sri’s Console</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Command Center Active • Plain-English Command Bar (/) Enabled
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface border border-line rounded-control text-xs text-ink shadow-xs">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-[11px]">Auto Follow-ups Running</span>
        </div>
      </div>

      {/* Quick Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-surface rounded-card border border-line shadow-xs">
          <div className="text-xs text-mutedText font-medium">I owe</div>
          <div className="text-2xl font-bold text-ink mt-1">{iOwe.length}</div>
          <div className="text-[11px] text-mutedText font-mono mt-1">Due this week</div>
        </div>
        <div className="p-4 bg-surface rounded-card border border-line shadow-xs">
          <div className="text-xs text-mutedText font-medium">I&apos;m chasing</div>
          <div className="text-2xl font-bold text-chasing mt-1">{imChasing.length}</div>
          <div className="text-[11px] text-mutedText font-mono mt-1">1 active daily chase</div>
        </div>
        <div className="p-4 bg-surface rounded-card border border-line shadow-xs">
          <div className="text-xs text-mutedText font-medium">Shared (Whose turn)</div>
          <div className="text-2xl font-bold text-shared mt-1">{shared.length}</div>
          <div className="text-[11px] text-shared font-mono mt-1">Your turn: 1</div>
        </div>
        <div className="p-4 bg-surface rounded-card border border-line shadow-xs">
          <div className="text-xs text-mutedText font-medium">Inbox Requests</div>
          <div className="text-2xl font-bold text-primary mt-1">1</div>
          <div className="text-[11px] text-mutedText font-mono mt-1">Awaiting Sri</div>
        </div>
      </div>

      {/* Interactive 3 Columns */}
      <ThreeColumns
        iOwe={iOwe}
        imChasing={imChasing}
        shared={shared}
        currentUserId={sriId}
        onStatusChange={handleStatusChange}
        onPassTurn={handlePassTurn}
      />

      {/* Row of 3 Cards: Morning Brief, Inbox, Follow-ups awaiting approval */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MorningBriefCard initialData={MOCK_BRIEF} onRefresh={() => showToast("Morning brief refreshed")} />

        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink font-mono">
                Inbox Awaiting
              </h3>
            </div>
            <p className="text-xs text-mutedText leading-relaxed">
              1 new request from VC Office: &ldquo;Placement statistics summary by Friday&rdquo;.
            </p>
          </div>
          <a
            href="/inbox"
            className="mt-4 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            Review Inbox &rarr;
          </a>
        </div>

        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-chasing" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink font-mono">
                  Follow-ups Approval
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
                ? `Follow-up to ${approvals[0]?.targetName} drafted and waiting your review.`
                : "No follow-ups currently awaiting approval."}
            </p>
          </div>
          {approvals.length > 0 && (
            <button
              type="button"
              onClick={() => setShowApprovalModal(true)}
              className="mt-4 text-xs font-semibold text-chasing hover:underline inline-flex items-center gap-1 self-start"
            >
              Review & Approve ({approvals.length}) &rarr;
            </button>
          )}
        </div>
      </div>

      <ApprovalQueueModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        items={approvals}
        onApprove={handleApprove}
        onSkip={handleSkip}
      />
    </div>
  );
}
