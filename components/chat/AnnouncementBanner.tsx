"use client";

import { useState } from "react";
import { Megaphone, Check } from "lucide-react";

interface AnnouncementBannerProps {
  id: string;
  title: string;
  content: string;
  acknowledgedCount: number;
  initialAcknowledged?: boolean;
  onAcknowledge?: (id: string) => void;
}

export function AnnouncementBanner({
  id,
  title,
  content,
  acknowledgedCount,
  initialAcknowledged = false,
  onAcknowledge,
}: AnnouncementBannerProps) {
  const [acknowledged, setAcknowledged] = useState(initialAcknowledged);
  const [count, setCount] = useState(acknowledgedCount);

  const handleAcknowledge = () => {
    if (!acknowledged) {
      setAcknowledged(true);
      setCount((c) => c + 1);
      onAcknowledge?.(id);
    }
  };

  return (
    <div className="bg-shared/10 border-b border-shared/25 px-4 py-2.5 flex items-center justify-between gap-4">
      <div className="flex items-start gap-2.5 min-w-0">
        <Megaphone className="h-4 w-4 text-shared shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-ink mr-2">{title}:</span>
          <span className="text-mutedText">{content}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[10px] font-mono text-mutedText">
          {count} acknowledged
        </span>
        <button
          type="button"
          onClick={handleAcknowledge}
          disabled={acknowledged}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-control text-xs font-semibold transition-all ${
            acknowledged
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-shared text-white hover:bg-shared/90 shadow-2xs"
          }`}
        >
          <Check className="h-3 w-3" />
          <span>{acknowledged ? "Acknowledged" : "Got it"}</span>
        </button>
      </div>
    </div>
  );
}
