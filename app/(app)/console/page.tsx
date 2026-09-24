"use client";

import { useState } from "react";
import { ThreeColumns } from "@/components/tasks/ThreeColumns";
import { Sparkles, Clock, ShieldAlert } from "lucide-react";
import { Task, User, TaskMode, Priority, TaskStatus, TaskSource } from "@prisma/client";

type TaskWithRelations = Task & { owner?: User | null };

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
      owner: {
        id: "u_hari",
        name: "Hari",
        displayName: "Hari (Coordinator)",
        email: "hari@smru.in",
        phone: null,
        passwordHash: "",
        mustChangePw: false,
        role: "LEAD",
        title: "IT Coordinator",
        honorific: null,
        aliases: [],
        avatarUrl: null,
        campusId: null,
        isSenior: false,
        active: true,
        startDate: null,
        endDate: null,
        quietFrom: "21:00",
        quietTo: "08:00",
        failedLogins: 0,
        lockedUntil: null,
        lastSeenAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        notifPrefs: {},
      },
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

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    if (newStatus === TaskStatus.DONE) {
      setIOwe((prev) => prev.filter((t) => t.id !== taskId));
    }
  };

  const handlePassTurn = (taskId: string) => {
    setShared((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              turnUserId: t.partnerId,
              turnNote: "Awaiting partner confirmation",
            }
          : t
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Sri’s Console</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Track B: Work Engine Active • Plain-English Command Bar (/) Enabled
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface border border-line rounded-control text-xs text-ink shadow-xs">
          <span className="h-2 w-2 rounded-full bg-[#3FB8AC] animate-pulse"></span>
          <span className="font-mono text-[11px]">Operations Active</span>
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

      {/* Interactive 3 Columns (SPEC §7.2 & §10.1) */}
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
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink font-mono">
              Morning Brief (08:00)
            </h3>
          </div>
          <p className="text-xs text-mutedText leading-relaxed">
            Good morning Sri. 2 tasks due today, 1 daily chase going out to Hari at 09:30, 0 stale items.
          </p>
        </div>

        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs">
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

        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-4 w-4 text-chasing" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink font-mono">
              Follow-ups Approval
            </h3>
          </div>
          <p className="text-xs text-mutedText leading-relaxed">
            Follow-up to Janardhan sir drafted: &ldquo;Hi Janardhan sir, a quick check on Lab Network status...&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
