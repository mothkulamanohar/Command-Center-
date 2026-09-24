"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, Paperclip, Award, Square, Play, Hash } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (text: string, kind?: string, meta?: Record<string, unknown>) => void;
  channelName: string;
  isAnnouncementOnly?: boolean;
}

export function MessageInput({
  onSendMessage,
  channelName,
  isAnnouncementOnly = false,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    onSendMessage(text.trim());
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const insertKudosTemplate = () => {
    setText("/kudos @ ");
    textareaRef.current?.focus();
  };

  const insertTaskRef = () => {
    setText((prev) => (prev ? `${prev} T-` : "T-"));
    textareaRef.current?.focus();
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Send simulated voice note message
    const duration = recordingSeconds;
    onSendMessage(
      `Voice note (${duration}s)`,
      "VOICE",
      { duration, waveform: [30, 60, 45, 80, 100, 70, 50, 90, 65, 40] }
    );
  };

  if (isAnnouncementOnly) {
    return (
      <div className="p-3 bg-surface-alt border-t border-line text-center text-xs text-mutedText font-mono">
        This is an announcement-only channel. Only team leads and admins can broadcast here.
      </div>
    );
  }

  return (
    <div className="p-3 border-t border-line bg-surface">
      {/* Quick helper shortcuts */}
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={insertKudosTemplate}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-mutedText hover:text-ink bg-surface-alt hover:bg-ground border border-line transition-colors"
          title="Send peer recognition (SPEC F-CHAT-14)"
        >
          <Award className="h-3 w-3 text-chasing" />
          <span>/kudos</span>
        </button>
        <button
          type="button"
          onClick={insertTaskRef}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-mutedText hover:text-ink bg-surface-alt hover:bg-ground border border-line transition-colors"
          title="Reference a task chip (SPEC F-CHAT-08)"
        >
          <Hash className="h-3 w-3 text-primary" />
          <span>T-xxxx</span>
        </button>
      </div>

      {isRecording ? (
        <div className="flex items-center justify-between p-2 rounded-control bg-danger/10 border border-danger/30 text-danger animate-pulse">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-danger animate-ping" />
            <span className="text-xs font-mono font-semibold">
              Recording Voice Note ({recordingSeconds}s)...
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRecording(false)}
              className="text-xs text-mutedText hover:text-ink px-2 py-1"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStopRecording}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-control bg-danger text-white text-xs font-semibold hover:bg-danger/90"
            >
              <Square className="h-3 w-3 fill-current" />
              <span>Send Voice Note</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="relative flex items-end gap-2 bg-ground border border-line rounded-control p-1.5 focus-within:border-primary transition-colors">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${channelName} (use T-xxxx to link task, /kudos to appreciate)...`}
            className="flex-1 max-h-32 bg-transparent text-xs text-ink placeholder:text-mutedText/70 resize-none px-2 py-1 focus:outline-none"
          />

          <div className="flex items-center gap-1 shrink-0 pb-0.5">
            <button
              type="button"
              onClick={() => setIsRecording(true)}
              className="p-1.5 rounded text-mutedText hover:text-ink hover:bg-surface-alt transition-colors"
              title="Record Voice Note (SPEC F-CHAT-11)"
            >
              <Mic className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="p-1.5 rounded-control bg-primary text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-opacity"
              title="Send message (Enter)"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
