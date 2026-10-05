"use client";

import { useState } from "react";
import { TaskChip } from "./TaskChip";
import { KudosCard } from "./KudosCard";
import { extractTaskRefs } from "@/lib/services/chat";
import { MoreHorizontal, Smile, CheckSquare, PlusCircle, Copy, Check } from "lucide-react";

export interface ChatMessage {
  id: string;
  authorName: string;
  authorRole: string;
  body: string;
  kind: string;
  meta?: Record<string, unknown>;
  createdAt: string;
  reactions?: { emoji: string; count: number; userReacted?: boolean }[];
}

interface MessageItemProps {
  message: ChatMessage;
  onMakeTask?: (text: string) => void;
  onMakeRequest?: (text: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

export function MessageItem({
  message,
  onMakeTask,
  onMakeRequest,
  onReact,
}: MessageItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const taskRefs = extractTaskRefs(message.body);

  if (message.kind === "KUDOS") {
    const target = (message.meta?.kudosTarget as string) || "Team";
    const reason = (message.meta?.kudosReason as string) || message.body;
    return (
      <KudosCard
        fromName={message.authorName}
        toName={target}
        reason={reason}
        timestamp={message.createdAt}
      />
    );
  }

  return (
    <div className="py-2.5 px-3 hover:bg-surface-alt/70 rounded-card transition-colors group relative">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-control bg-primary text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
            {message.authorName.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-xs font-semibold text-ink">{message.authorName}</span>
          <span className="text-[10px] font-mono text-mutedText">{message.authorRole}</span>
          <span className="text-[10px] text-mutedText font-mono">{message.createdAt}</span>
        </div>

        {/* Hover Action Menu (F-CHAT-07) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-surface border border-line rounded-control px-1 py-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => onReact?.(message.id, "👍")}
            className="p-1 hover:bg-ground rounded text-xs text-mutedText hover:text-ink cursor-pointer"
            aria-label="React thumbs up"
          >
            👍
          </button>
          <button
            type="button"
            onClick={() => onReact?.(message.id, "✔")}
            className="p-1 hover:bg-ground rounded text-xs text-mutedText hover:text-ink cursor-pointer"
            aria-label="React check"
          >
            ✔
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(message.body);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="p-1 hover:bg-ground rounded text-xs text-mutedText hover:text-ink cursor-pointer"
            aria-label="Copy message"
            title={copied ? "Copied!" : "Copy message"}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => onMakeTask?.(message.body)}
            className="p-1 hover:bg-ground rounded text-xs text-mutedText hover:text-ink cursor-pointer"
            aria-label="Convert message to Task"
            title="Make Task"
          >
            <CheckSquare className="h-3.5 w-3.5 text-primary" />
          </button>
          <button
            type="button"
            onClick={() => onMakeRequest?.(message.body)}
            className="p-1 hover:bg-ground rounded text-xs text-mutedText hover:text-ink cursor-pointer"
            aria-label="Convert message to Request"
            title="Make Request"
          >
            <PlusCircle className="h-3.5 w-3.5 text-shared" />
          </button>
        </div>
      </div>

      {/* Message Body */}
      <div className="mt-1 pl-8 text-xs text-ink leading-relaxed">
        {message.body}
      </div>

      {/* Live Task Chips rendering if T-xxxx present (F-CHAT-08) */}
      {taskRefs.length > 0 && (
        <div className="pl-8 pt-1 flex flex-wrap gap-2">
          {taskRefs.map((num) => (
            <TaskChip key={num} taskNumber={num} />
          ))}
        </div>
      )}

      {/* Emoji Reactions display */}
      {message.reactions && message.reactions.length > 0 && (
        <div className="pl-8 pt-1.5 flex flex-wrap gap-1.5">
          {message.reactions.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onReact?.(message.id, r.emoji)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-control text-xs border ${
                r.userReacted
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-surface border-line text-mutedText hover:border-mutedText"
              }`}
            >
              <span>{r.emoji}</span>
              <span className="font-mono text-[10px]">{r.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
