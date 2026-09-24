"use client";

import { Award, Sparkles, Heart } from "lucide-react";

interface KudosCardProps {
  fromName: string;
  toName: string;
  reason: string;
  timestamp: string;
}

export function KudosCard({ fromName, toName, reason, timestamp }: KudosCardProps) {
  return (
    <div className="my-2 p-4 bg-ground border border-chasing/30 rounded-panel shadow-xs space-y-2 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-control bg-chasing text-white shadow-xs">
            <Award className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <span>{fromName}</span>
              <span className="text-mutedText font-normal">sent kudos to</span>
              <span className="text-chasing font-bold">@{toName}</span>
            </div>
            <div className="text-[10px] text-mutedText font-mono">{timestamp}</div>
          </div>
        </div>
        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-chasing-tint text-chasing rounded-control text-[10px] font-mono font-semibold">
          <Sparkles className="h-3 w-3" />
          <span>KUDOS</span>
        </div>
      </div>

      <div className="text-xs text-ink pl-8 pr-2 font-medium leading-relaxed">
        &ldquo;{reason}&rdquo;
      </div>

      <div className="pl-8 pt-1 text-[10px] text-mutedText font-mono flex items-center gap-1">
        <Heart className="h-3 w-3 text-danger fill-danger" />
        <span>Counted toward {toName}&apos;s weekly recognition & JPA appraisal</span>
      </div>
    </div>
  );
}
