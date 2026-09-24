"use client";

import { useState } from "react";
import { UserCheck, MessageSquare, Send } from "lucide-react";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { DailyUpdateModal } from "@/components/updates/DailyUpdateModal";

export default function MySpacePage() {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updatePosted, setUpdatePosted] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink tracking-tight">My Space</h1>
        <p className="text-xs text-mutedText mt-0.5 font-mono">
          Personal Workspace • Tasks, Follow-ups, and Daily Update
        </p>
      </div>

      {/* Onboarding Checklist (F-AUTH-09) */}
      <OnboardingCard />

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
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-medium rounded-control transition-colors shadow-xs"
            >
              Post Today&apos;s Update
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* My Tasks */}
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs min-h-[260px] flex flex-col">
          <div className="flex items-center gap-2 pb-3 border-b border-line">
            <UserCheck className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-ink">My Tasks</h2>
          </div>
          <div className="flex-1 flex items-center justify-center text-center p-6 text-mutedText text-xs">
            No active tasks assigned to you.
          </div>
        </div>

        {/* Follow-ups to Me */}
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs min-h-[260px] flex flex-col">
          <div className="flex items-center gap-2 pb-3 border-b border-line">
            <MessageSquare className="h-4 w-4 text-chasing" />
            <h2 className="text-sm font-semibold text-ink">Follow-ups to Me</h2>
          </div>
          <div className="flex-1 flex items-center justify-center text-center p-6 text-mutedText text-xs">
            No pending follow-ups or requests waiting on you.
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
        }}
      />
    </div>
  );
}
