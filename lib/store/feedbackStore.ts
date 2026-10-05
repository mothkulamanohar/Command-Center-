"use client";

import { broadcastStoreUpdate } from "./sync";
import { auditStore } from "./auditStore";
import { taskStore } from "./taskStore";
import { TaskStatus } from "@prisma/client";

export interface PendingFeedbackTask {
  id: string;
  ref: string;
  title: string;
  ownerName: string;
  completedAt: string;
  actualDuration: string;
  estimate: string;
}

export interface FeedbackSubmission {
  id: string;
  taskRef: string;
  taskTitle: string;
  reviewerName: string;
  rating: number; // 1..5
  quality?: number;
  timeliness?: number;
  communication?: number;
  comment?: string;
  chips: string[];
  outcome: "ACCEPTED" | "REWORK";
  ackAt?: string;
  reply?: string;
  createdAt: string;
}

const STORAGE_KEY = "icc_feedback_v1";

function getInitialFeedbackData(): {
  queue: PendingFeedbackTask[];
  submissions: FeedbackSubmission[];
} {
  return {
    queue: [
      {
        id: "task-1045",
        ref: "T-1045",
        title: "Configure campus Wi-Fi geofence verification",
        ownerName: "Hari",
        completedAt: "Today 11:20",
        actualDuration: "2h 45m",
        estimate: "3h",
      },
      {
        id: "task-1046",
        ref: "T-1046",
        title: "Export monthly attendance CSV for review",
        ownerName: "Intern Web A",
        completedAt: "Today 10:15",
        actualDuration: "45m",
        estimate: "1h",
      },
    ],
    submissions: [
      {
        id: "fb-1",
        taskRef: "T-1042",
        taskTitle: "Fix fee calculation on admission portal",
        reviewerName: "Sri (Admin)",
        rating: 5,
        quality: 5,
        timeliness: 5,
        communication: 4,
        chips: ["Great work", "On time"],
        comment: "Excellent turnaround and accurate handling of edge case deductions.",
        outcome: "ACCEPTED",
        ackAt: "Today, 11:30 AM",
        reply: "Thank you sir, thoroughly verified with the accounts team.",
        createdAt: "Today",
      },
    ],
  };
}

class FeedbackStore {
  private data: { queue: PendingFeedbackTask[]; submissions: FeedbackSubmission[] } =
    getInitialFeedbackData();
  private isLoaded = false;

  private load() {
    if (typeof window === "undefined") return getInitialFeedbackData();
    if (this.isLoaded) return this.data;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.data = JSON.parse(stored);
      } else {
        this.data = getInitialFeedbackData();
        this.save();
      }
    } catch {
      this.data = getInitialFeedbackData();
    }
    this.isLoaded = true;
    return this.data;
  }

  private save(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {}
    broadcastStoreUpdate("icc-feedback-updated", this.data);
  }

  public getQueue(): PendingFeedbackTask[] {
    return [...this.load().queue];
  }

  public getSubmissions(): FeedbackSubmission[] {
    return [...this.load().submissions];
  }

  public submitFeedback(input: {
    taskRef: string;
    taskTitle: string;
    reviewerName?: string;
    rating: number;
    quality?: number;
    timeliness?: number;
    communication?: number;
    comment?: string;
    chips: string[];
    isRework?: boolean;
  }): FeedbackSubmission {
    const current = this.load();
    const outcome = input.isRework ? "REWORK" : "ACCEPTED";
    const d = new Date();
    const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    const submission: FeedbackSubmission = {
      id: `fb-${Date.now()}`,
      taskRef: input.taskRef,
      taskTitle: input.taskTitle,
      reviewerName: input.reviewerName || "Sri (Admin)",
      rating: input.rating,
      quality: input.quality,
      timeliness: input.timeliness,
      communication: input.communication,
      comment: input.comment,
      chips: input.chips,
      outcome,
      createdAt: dateStr,
    };

    // Remove from queue
    const updatedQueue = current.queue.filter((q) => q.ref !== input.taskRef);

    this.data = {
      queue: updatedQueue,
      submissions: [submission, ...current.submissions],
    };
    this.save();

    // If Rework -> reopen task in taskStore
    if (input.isRework) {
      const allTasks = taskStore.getTasks();
      const task = [...allTasks.iOwe, ...allTasks.imChasing, ...allTasks.shared].find(
        (t) => `T-${t.number}` === input.taskRef || t.id === input.taskRef
      );
      if (task) {
        taskStore.updateTaskStatus(task.id, TaskStatus.TODO);
      }
    }

    auditStore.logEvent({
      action: "FEEDBACK",
      entity: `Task ${input.taskRef}`,
      details: `Submitted ${input.rating}★ feedback (${outcome}) for "${input.taskTitle}"`,
    });

    return submission;
  }

  public addPendingTask(item: PendingFeedbackTask): void {
    const current = this.load();
    if (current.queue.some((q) => q.ref === item.ref || q.id === item.id)) return;
    this.data = {
      ...current,
      queue: [item, ...current.queue],
    };
    this.save();
  }

  public acknowledgeFeedback(id: string): void {
    const current = this.load();
    const d = new Date();
    const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

    this.data = {
      ...current,
      submissions: current.submissions.map((s) =>
        s.id === id ? { ...s, ackAt: `Today, ${timeStr}` } : s
      ),
    };
    this.save();
  }

  public replyFeedback(id: string, reply: string): void {
    const current = this.load();
    const d = new Date();
    const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

    this.data = {
      ...current,
      submissions: current.submissions.map((s) =>
        s.id === id ? { ...s, ackAt: s.ackAt || `Today, ${timeStr}`, reply } : s
      ),
    };
    this.save();
  }
}

export const feedbackStore = new FeedbackStore();
