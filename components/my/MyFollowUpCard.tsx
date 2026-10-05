"use client";

import { MessageSquare } from "lucide-react";

export interface MyFollowUp {
  id: string;
  fromName: string;
  cadence: string;
  lastNudge: string;
  taskTitle: string;
  answered: boolean;
}

interface MyFollowUpCardProps {
  followups: MyFollowUp[];
  onReply: (fuId: string, reply: string) => void;
}

export function MyFollowUpCard({ followups, onReply }: MyFollowUpCardProps) {
  return (
    <div className="bg-surface rounded-panel border border-line p-5 shadow-xs min-h-[300px] flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-chasing" />
          <h2 className="text-sm font-semibold text-ink">Follow-ups Waiting on Me</h2>
        </div>
        {followups.length > 0 && (
          <span className="text-[10px] font-mono bg-chasing/10 text-chasing border border-chasing/20 px-1.5 py-0.5 rounded font-bold">
            {followups.filter((f) => !f.answered).length} Pending
          </span>
        )}
      </div>

      <div className="space-y-2.5 flex-1">
        {followups.length === 0 ? (
          <div className="py-12 text-center text-xs text-mutedText font-mono">
            No active follow-ups waiting on you. All caught up!
          </div>
        ) : (
          followups.map((fu) => (
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
                    onClick={() => onReply(fu.id, "Done")}
                    className="px-2 py-0.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded text-[10px] font-medium transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                  <button
                    type="button"
                    onClick={() => onReply(fu.id, "Working on it")}
                    className="px-2 py-0.5 bg-ground hover:bg-surface-alt border border-line text-ink rounded text-[10px] font-medium transition-colors cursor-pointer"
                  >
                    Working on it
                  </button>
                  <button
                    type="button"
                    onClick={() => onReply(fu.id, "Blocked")}
                    className="px-2 py-0.5 bg-danger/10 hover:bg-danger text-danger hover:text-white rounded text-[10px] font-medium transition-colors cursor-pointer"
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
          ))
        )}
      </div>
    </div>
  );
}
