"use client";

import { Task, User, TaskMode, TaskStatus } from "@prisma/client";
import { TaskCard } from "./TaskCard";
import { CheckCircle2, Clock, ArrowRight } from "lucide-react";

interface TaskWithRelations extends Task {
  owner?: User | null;
}

interface ThreeColumnsProps {
  iOwe: TaskWithRelations[];
  imChasing: TaskWithRelations[];
  shared: TaskWithRelations[];
  currentUserId?: string;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onPassTurn?: (taskId: string) => void;
}

export function ThreeColumns({
  iOwe,
  imChasing,
  shared,
  currentUserId,
  onStatusChange,
  onPassTurn,
}: ThreeColumnsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. I Owe */}
      <div className="bg-surface rounded-panel border border-line p-4 shadow-xs flex flex-col min-h-[380px]">
        <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-ink">I Owe</h2>
          </div>
          <span className="px-2 py-0.5 bg-ground text-ink text-[11px] font-mono rounded font-semibold">
            {iOwe.length}
          </span>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto">
          {iOwe.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-mutedText">
              <p className="text-xs">No tasks you owe.</p>
              <p className="text-[11px] text-mutedText mt-1">Press / to add one.</p>
            </div>
          ) : (
            iOwe.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                currentUserId={currentUserId}
                onStatusChange={onStatusChange}
                onPassTurn={onPassTurn}
              />
            ))
          )}
        </div>
      </div>

      {/* 2. I'm Chasing */}
      <div className="bg-surface rounded-panel border border-line p-4 shadow-xs flex flex-col min-h-[380px]">
        <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-chasing" />
            <h2 className="text-sm font-semibold text-ink">I&apos;m Chasing</h2>
          </div>
          <span className="px-2 py-0.5 bg-chasing-tint text-chasing text-[11px] font-mono rounded font-semibold">
            {imChasing.length}
          </span>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto">
          {imChasing.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-mutedText">
              <p className="text-xs">You are not chasing any tasks.</p>
              <p className="text-[11px] text-mutedText mt-1">Assigned tasks with nudges appear here.</p>
            </div>
          ) : (
            imChasing.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                currentUserId={currentUserId}
                onStatusChange={onStatusChange}
                onPassTurn={onPassTurn}
              />
            ))
          )}
        </div>
      </div>

      {/* 3. Shared */}
      <div className="bg-surface rounded-panel border border-line p-4 shadow-xs flex flex-col min-h-[380px]">
        <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-shared" />
            <h2 className="text-sm font-semibold text-ink">Shared</h2>
          </div>
          <span className="px-2 py-0.5 bg-shared-tint text-shared text-[11px] font-mono rounded font-semibold">
            {shared.length}
          </span>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto">
          {shared.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-mutedText">
              <p className="text-xs">No active shared tasks.</p>
              <p className="text-[11px] text-mutedText mt-1">Shows whose turn it is on mutual work.</p>
            </div>
          ) : (
            shared.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                currentUserId={currentUserId}
                onStatusChange={onStatusChange}
                onPassTurn={onPassTurn}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
