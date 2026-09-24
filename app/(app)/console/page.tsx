import { CheckCircle2, Clock, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";

export default function ConsolePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">
            Sri’s Console
          </h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Phase 0: Environment & Shell Active • Mon–Sat, 09:00–18:00 IST
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface border border-line rounded-control text-xs text-ink shadow-xs">
          <span className="h-2 w-2 rounded-full bg-[#3FB8AC] animate-pulse"></span>
          <span className="font-mono text-[11px]">System Online</span>
        </div>
      </div>

      {/* Quick Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-surface rounded-card border border-line shadow-xs">
          <div className="text-xs text-mutedText font-medium">I owe</div>
          <div className="text-2xl font-bold text-ink mt-1">0</div>
          <div className="text-[11px] text-[#3FB8AC] font-mono mt-1">All clear</div>
        </div>
        <div className="p-4 bg-surface rounded-card border border-line shadow-xs">
          <div className="text-xs text-mutedText font-medium">I&apos;m chasing</div>
          <div className="text-2xl font-bold text-chasing mt-1">0</div>
          <div className="text-[11px] text-mutedText font-mono mt-1">0 active nudges</div>
        </div>
        <div className="p-4 bg-surface rounded-card border border-line shadow-xs">
          <div className="text-xs text-mutedText font-medium">Shared (Whose turn)</div>
          <div className="text-2xl font-bold text-shared mt-1">0</div>
          <div className="text-[11px] text-mutedText font-mono mt-1">0 pending turns</div>
        </div>
        <div className="p-4 bg-surface rounded-card border border-line shadow-xs">
          <div className="text-xs text-mutedText font-medium">Inbox Requests</div>
          <div className="text-2xl font-bold text-primary mt-1">0</div>
          <div className="text-[11px] text-mutedText font-mono mt-1">0 waiting action</div>
        </div>
      </div>

      {/* 3 Columns Preview Area (SPEC §10.1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: I Owe */}
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs flex flex-col min-h-[320px]">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-ink">I Owe</h2>
            </div>
            <span className="px-2 py-0.5 bg-ground text-ink text-[11px] font-mono rounded">
              0
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-mutedText">
            <p className="text-xs">No tasks you owe right now.</p>
            <p className="text-[11px] text-mutedText mt-1">
              Type in the command bar or press Add to create one.
            </p>
          </div>
        </div>

        {/* Column 2: I'm Chasing */}
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs flex flex-col min-h-[320px]">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-chasing" />
              <h2 className="text-sm font-semibold text-ink">I&apos;m Chasing</h2>
            </div>
            <span className="px-2 py-0.5 bg-chasing-tint text-chasing text-[11px] font-mono rounded font-semibold">
              0
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-mutedText">
            <p className="text-xs">You are not chasing any tasks.</p>
            <p className="text-[11px] text-mutedText mt-1">
              Tasks assigned to others with follow-ups appear here.
            </p>
          </div>
        </div>

        {/* Column 3: Shared */}
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs flex flex-col min-h-[320px]">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-shared" />
              <h2 className="text-sm font-semibold text-ink">Shared</h2>
            </div>
            <span className="px-2 py-0.5 bg-shared-tint text-shared text-[11px] font-mono rounded font-semibold">
              0
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-mutedText">
            <p className="text-xs">No active two-sided tasks.</p>
            <p className="text-[11px] text-mutedText mt-1">
              Shows whose turn it is when collaborating on a task.
            </p>
          </div>
        </div>
      </div>

      {/* Row of 3 Cards: Morning Brief, Inbox, Follow-ups awaiting approval */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink font-mono">
              Morning Brief
            </h3>
          </div>
          <p className="text-xs text-mutedText leading-relaxed">
            Generated at 08:00 on working days. Summarizes today&apos;s meetings,
            due items, and overnight replies.
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
            New requests waiting for Accept / Delegate / Schedule / Decline.
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
            Follow-ups to senior leadership drafted by the system, waiting for Sri&apos;s
            tap before sending.
          </p>
        </div>
      </div>
    </div>
  );
}
