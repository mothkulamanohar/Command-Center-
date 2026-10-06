"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Star, MessageSquare, CheckCircle2, AlertTriangle, ArrowRight, CornerDownRight, Filter } from "lucide-react";
import Link from "next/link";
import { formatNotificationTime } from "@/lib/time";
import {
  getFeedbackSubmissionsAction,
  acknowledgeFeedbackAction,
  replyFeedbackAction,
} from "./actions";

export interface FeedbackSubmission {
  id: string;
  taskRef: string;
  taskTitle: string;
  reviewerName: string;
  rating: number;
  comment: string;
  chips: string[];
  outcome: "ACCEPTED" | "REWORK";
  createdAt: string;
  reply?: string | null;
  ackAt?: string | null;
}

import { feedbackStore } from "@/lib/store/feedbackStore";

export default function MyFeedbackPage() {
  const [items, setItems] = useState<FeedbackSubmission[]>(() => feedbackStore.getSubmissions() as any);
  const [replyText, setReplyText] = useState<{ [id: string]: string }>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadFeedback = async () => {
    const res = await getFeedbackSubmissionsAction();
    if (res.success && res.data && res.data.length > 0) {
      setItems(res.data as any);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const avgRating = items.length > 0 ? (items.reduce((acc, cur) => acc + cur.rating, 0) / items.length).toFixed(1) : "5.0";
  const reworkCount = items.filter((i) => i.outcome === "REWORK").length;

  const handleAcknowledge = async (id: string) => {
    // Optimistic local update
    feedbackStore.acknowledgeFeedback(id);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ackAt: new Date().toISOString() } : i));
    toast.success("Feedback acknowledged");
    try {
      const res = await acknowledgeFeedbackAction(id);
      if (res.success) loadFeedback();
    } catch {}
  };

  const handleSendReply = async (id: string) => {
    const text = replyText[id];
    if (!text?.trim()) return;

    // Optimistic local update
    feedbackStore.replyFeedback(id, text.trim());
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, reply: text.trim() } : i));
    setActiveReplyId(null);
    toast.success("Reply sent to reviewer");
    try {
      const res = await replyFeedbackAction(id, text.trim());
      if (res.success) loadFeedback();
    } catch {}
  };

  return (
    <div className="space-y-6">
      

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Task Feedback</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Track H (F-FB-06): Performance Feedback, Star Ratings & Quality Reviews
          </p>
        </div>

        <Link
          href="/feedback/give"
          prefetch={true}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-semibold shadow-2xs self-start"
        >
          <span>Give Feedback Queue</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-surface rounded-card border border-line shadow-xs">
          <div className="text-xs text-mutedText font-medium">Average Rating</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-ink">{avgRating}</span>
            <div className="flex text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-4 w-4 ${
                    s <= Math.round(Number(avgRating)) ? "fill-amber-500" : "text-line"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-[11px] text-mutedText font-mono mt-1">Across {items.length} tasks</div>
        </div>

        <div className="p-4 bg-surface rounded-card border border-line shadow-xs">
          <div className="text-xs text-mutedText font-medium">Total Rated Tasks</div>
          <div className="text-2xl font-bold text-primary mt-1">{items.length}</div>
          <div className="text-[11px] text-mutedText font-mono mt-1">Completed & evaluated</div>
        </div>

        <div className="p-4 bg-surface rounded-card border border-line shadow-xs">
          <div className="text-xs text-mutedText font-medium">Rework Rate</div>
          <div className="text-2xl font-bold text-chasing mt-1">
            {((reworkCount / items.length) * 100).toFixed(0)}%
          </div>
          <div className="text-[11px] text-mutedText font-mono mt-1">{reworkCount} task requested rework</div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {items.map((fb) => (
          <div
            key={fb.id}
            className={`p-5 rounded-panel border bg-surface shadow-xs space-y-3 ${
              fb.outcome === "REWORK" ? "border-chasing/40" : "border-line"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                  {fb.taskRef}
                </span>
                <span className="font-bold text-ink text-sm">{fb.taskTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= fb.rating ? "fill-amber-500" : "text-line"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-mono font-bold text-ink">{fb.rating}/5</span>
                {fb.outcome === "REWORK" && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-danger/10 text-danger border border-danger/20">
                    Needs Rework
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs text-mutedText">
              Reviewed by <span className="font-semibold text-ink">{fb.reviewerName}</span> on {fb.createdAt}
            </div>

            {fb.chips.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {fb.chips.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded bg-ground border border-line text-[11px] font-medium text-ink"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}

            {fb.comment && (
              <p className="text-xs text-ink bg-ground/60 p-3 rounded-control border border-line leading-relaxed">
                &ldquo;{fb.comment}&rdquo;
              </p>
            )}

            {/* Acknowledgment & Reply Area */}
            <div className="pt-2 border-t border-line flex flex-col gap-2">
              {fb.reply ? (
                <div className="flex items-start gap-2 text-xs bg-primary/5 p-2.5 rounded-control border border-primary/15">
                  <CornerDownRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-primary">Your Reply: </span>
                    <span className="text-ink">{fb.reply}</span>
                  </div>
                </div>
              ) : activeReplyId === fb.id ? (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    placeholder="Write a response to the reviewer (max 500 characters)..."
                    value={replyText[fb.id] || ""}
                    onChange={(e) =>
                      setReplyText({ ...replyText, [fb.id]: e.target.value })
                    }
                    className="w-full p-2.5 bg-ground border border-line rounded-control text-xs text-ink focus:outline-none focus:border-primary"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveReplyId(null)}
                      className="px-3 py-1 text-xs text-mutedText hover:text-ink"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendReply(fb.id)}
                      className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-control"
                    >
                      Send Reply
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-mutedText font-mono">
                    {fb.ackAt ? `✔ Acknowledged (${fb.ackAt})` : "Pending acknowledgment"}
                  </span>
                  <div className="flex items-center gap-2">
                    {!fb.ackAt && (
                      <button
                        type="button"
                        onClick={() => handleAcknowledge(fb.id)}
                        className="px-2.5 py-1 bg-surface hover:bg-ground border border-line text-ink rounded-control text-xs font-medium cursor-pointer"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveReplyId(fb.id)}
                      className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-control text-xs font-semibold cursor-pointer"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
