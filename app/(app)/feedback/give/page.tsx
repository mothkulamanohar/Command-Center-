"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Star, CheckCircle2, RotateCcw, ArrowLeft, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  getPendingFeedbackQueueAction,
  submitTaskFeedbackAction,
} from "../actions";
import { feedbackStore } from "@/lib/store/feedbackStore";

export interface PendingFeedbackTask {
  id: string;
  ref: string;
  title: string;
  ownerName: string;
  actualDuration: string;
}

const CHIP_OPTIONS = [
  "Great work",
  "On time",
  "Needs more testing",
  "Please update status earlier",
  "Accurate implementation",
];

export default function GiveFeedbackPage() {
  const [queue, setQueue] = useState<PendingFeedbackTask[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rating, setRating] = useState<number>(5);
  const [selectedChips, setSelectedChips] = useState<string[]>(["Great work", "On time"]);
  const [comment, setComment] = useState("");
  const [isRework, setIsRework] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadQueue = async () => {
    try {
      const res = await getPendingFeedbackQueueAction();
      if (res.success && res.data && res.data.length > 0) {
        setQueue(res.data as any);
        setIsLoading(false);
        return;
      }
    } catch {}
    const local = feedbackStore.getQueue();
    if (local && local.length > 0) {
      setQueue(
        local.map((q) => ({
          id: q.id,
          ref: q.ref,
          title: q.title,
          ownerName: q.ownerName,
          actualDuration: q.actualDuration,
        }))
      );
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const currentTask = queue[currentIndex] || queue[0];

  const toggleChip = (chip: string) => {
    if (selectedChips.includes(chip)) {
      setSelectedChips(selectedChips.filter((c) => c !== chip));
    } else {
      setSelectedChips([...selectedChips, chip]);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTask || isSubmitting) return;

    if (rating <= 2 && !comment.trim()) {
      toast.error("Comment is required for ratings of 2 stars or lower");
      return;
    }

    if (isRework && !comment.trim()) {
      toast.error("Comment explaining rework requirement is required");
      return;
    }

    setIsSubmitting(true);
    feedbackStore.submitFeedback({
      taskRef: currentTask.ref,
      taskTitle: currentTask.title,
      rating,
      comment: comment.trim(),
      chips: selectedChips,
      isRework,
    });

    try {
      await submitTaskFeedbackAction({
        taskId: currentTask.id,
        rating,
        comment: comment.trim(),
        chips: selectedChips,
        isRework,
      });
    } catch {}

    setIsSubmitting(false);
    toast.success(
      isRework
        ? `Task ${currentTask.ref} marked for Rework with reviewer notes`
        : `Feedback saved for ${currentTask.ref} (${rating} stars)`
    );
    setCurrentIndex(0);
    setComment("");
    setIsRework(false);
    setRating(5);
    setSelectedChips(["Great work", "On time"]);
    loadQueue();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/feedback"
            className="p-1.5 rounded-control border border-line bg-surface hover:bg-ground text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-ink tracking-tight">Give Feedback</h1>
            <p className="text-xs text-mutedText mt-0.5 font-mono">
              Track H (F-FB-01..03): Admin & Lead Performance Review on Completed Tasks
            </p>
          </div>
        </div>
        <div className="text-xs font-mono font-bold text-primary px-2.5 py-1 rounded bg-primary/10 border border-primary/20">
          {queue.length} Pending
        </div>
      </div>

      {queue.length === 0 ? (
        <div className="p-12 text-center bg-surface rounded-panel border border-line space-y-3">
          <CheckCircle2 className="h-8 w-8 text-primary mx-auto" />
          <h3 className="text-sm font-bold text-ink">All Feedback Given!</h3>
          <p className="text-xs text-mutedText">
            No completed tasks are currently awaiting review.
          </p>
          <Link
            href="/console"
            className="inline-block mt-3 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-control"
          >
            Return to Console
          </Link>
        </div>
      ) : (
        <div className="bg-surface rounded-panel border border-line shadow-xs p-6 space-y-5">
          {/* Active Task Info */}
          <div className="p-4 rounded-card bg-ground border border-line space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-surface border border-line">
                {currentTask.ref}
              </span>
              <span className="text-[11px] font-mono text-mutedText">
                Status: Completed
              </span>
            </div>
            <h2 className="text-sm font-bold text-ink">{currentTask.title}</h2>
            <div className="flex items-center gap-4 text-xs text-mutedText pt-1 font-mono">
              <span>Assignee: <strong className="text-ink font-sans">{currentTask.ownerName}</strong></span>
              <span>Logged: <strong className="text-ink">{currentTask.actualDuration}</strong></span>
            </div>
          </div>

          <form onSubmit={handleSubmitFeedback} className="space-y-4">
            {/* 1-5 Star Rating */}
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">Overall Rating *</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 rounded hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        star <= rating
                          ? "fill-amber-500 text-amber-500"
                          : "text-line hover:text-amber-200"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-3 font-mono text-sm font-bold text-ink">{rating} / 5 Stars</span>
              </div>
            </div>

            {/* Quick Chips */}
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">Feedback Chips</label>
              <div className="flex flex-wrap gap-2">
                {CHIP_OPTIONS.map((chip) => {
                  const active = selectedChips.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => toggleChip(chip)}
                      className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
                        active
                          ? "bg-primary text-white border-primary"
                          : "bg-ground text-mutedText border-line hover:text-ink"
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Review Comment */}
            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                Review Comment {rating <= 2 || isRework ? "(Required)" : "(Optional)"}
              </label>
              <textarea
                rows={3}
                placeholder="Share guidance, praise, or specific areas for improvement..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-2.5 bg-ground border border-line rounded-control text-xs text-ink focus:outline-none focus:border-primary"
              />
            </div>

            {/* Outcome Toggle: Accept vs Rework */}
            <div className="p-3 bg-ground rounded-control border border-line flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-ink">Needs Rework?</div>
                <div className="text-[11px] text-mutedText">
                  Reopens this task to TODO with your comments attached for the owner.
                </div>
              </div>
              <input
                type="checkbox"
                checked={isRework}
                onChange={(e) => setIsRework(e.target.checked)}
                className="h-4 w-4 text-primary rounded border-line cursor-pointer"
              />
            </div>

            {/* Submit & Navigation */}
            <div className="pt-2 flex items-center justify-between border-t border-line">
              <span className="text-[11px] font-mono text-mutedText">
                Task {currentIndex + 1} of {queue.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-white font-semibold text-xs rounded-control transition-colors disabled:opacity-60 cursor-pointer ${
                    isRework
                      ? "bg-danger hover:bg-danger/90"
                      : "bg-primary hover:bg-primary-hover"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>{isRework ? "Requesting Rework..." : "Submitting..."}</span>
                    </>
                  ) : isRework ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Request Rework</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Submit Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
