"use client";

import { useState } from "react";
import { ThreeColumns } from "@/components/tasks/ThreeColumns";
import { Clock, ShieldAlert, CheckCircle2 } from "lucide-react";
import { TaskStatus } from "@prisma/client";
import { MorningBriefCard } from "@/components/brief/MorningBriefCard";
import { ApprovalQueueModal, PendingApprovalItem } from "@/components/followups/ApprovalQueueModal";
import { MorningBriefData } from "@/lib/services/brief";

import {
  MOCK_BRIEF,
  MOCK_PENDING_APPROVALS,
  getInitialConsoleTasks,
  TaskWithRelations,
} from "@/lib/mock/consoleData";

export default function ConsolePage() {
  const sriId = "u_sri";
  const initial = getInitialConsoleTasks(sriId);
  const [iOwe, setIOwe] = useState<TaskWithRelations[]>(initial.iOwe);
  const [imChasing, setImChasing] = useState<TaskWithRelations[]>(initial.imChasing);
  const [shared, setShared] = useState<TaskWithRelations[]>(initial.shared);

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
