import { describe, it, expect, vi } from "vitest";
import { GiveFeedbackSchema } from "@/lib/services/feedback";
import { FeedbackOutcome } from "@prisma/client";

describe("Task Feedback Schema & Validation (F-FB-01..03)", () => {
  it("validates valid 5-star positive feedback without comment", () => {
    const input = {
      taskId: "task-1",
      rating: 5,
      quality: 5,
      timeliness: 5,
      communication: 4,
      chips: ["Great work", "On time"],
      outcome: FeedbackOutcome.ACCEPTED,
    };
    const parsed = GiveFeedbackSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.rating).toBe(5);
      expect(parsed.data.chips).toHaveLength(2);
      expect(parsed.data.outcome).toBe(FeedbackOutcome.ACCEPTED);
    }
  });

  it("requires a comment when rating is 2 stars or lower (F-FB-02)", () => {
    const withoutComment = {
      taskId: "task-2",
      rating: 2,
      outcome: FeedbackOutcome.ACCEPTED,
    };
    const resWithout = GiveFeedbackSchema.safeParse(withoutComment);
    expect(resWithout.success).toBe(false);

    const withComment = {
      taskId: "task-2",
      rating: 2,
      comment: "Missed edge case validation on negative inputs",
      outcome: FeedbackOutcome.ACCEPTED,
    };
    const resWith = GiveFeedbackSchema.safeParse(withComment);
    expect(resWith.success).toBe(true);
  });

  it("requires a comment when outcome is REWORK (F-FB-03)", () => {
    const reworkWithoutComment = {
      taskId: "task-3",
      rating: 3,
      outcome: FeedbackOutcome.REWORK,
    };
    const resWithout = GiveFeedbackSchema.safeParse(reworkWithoutComment);
    expect(resWithout.success).toBe(false);

    const reworkWithComment = {
      taskId: "task-3",
      rating: 3,
      comment: "Needs responsive layout fixes on mobile screens",
      outcome: FeedbackOutcome.REWORK,
    };
    const resWith = GiveFeedbackSchema.safeParse(reworkWithComment);
    expect(resWith.success).toBe(true);
  });

  it("enforces rating range 1 to 5", () => {
    expect(GiveFeedbackSchema.safeParse({ taskId: "t", rating: 0, comment: "bad" }).success).toBe(false);
    expect(GiveFeedbackSchema.safeParse({ taskId: "t", rating: 6, comment: "good" }).success).toBe(false);
    expect(GiveFeedbackSchema.safeParse({ taskId: "t", rating: 1, comment: "needs overhaul" }).success).toBe(true);
    expect(GiveFeedbackSchema.safeParse({ taskId: "t", rating: 5 }).success).toBe(true);
  });
});

describe("Feedback Summary & Stats Calculations (F-FB-06, F-FB-10)", () => {
  it("calculates average rating, rework rate, and top chips tally correctly", () => {
    const list = [
      { rating: 5, outcome: "ACCEPTED", chips: ["Great work", "On time"] },
      { rating: 4, outcome: "ACCEPTED", chips: ["On time"] },
      { rating: 2, outcome: "REWORK", chips: ["Needs more testing"] },
      { rating: 5, outcome: "ACCEPTED", chips: ["Great work", "On time"] },
    ];

    const total = list.length;
    const avgRating = Number((list.reduce((acc, f) => acc + f.rating, 0) / total).toFixed(1));
    const reworkCount = list.filter((f) => f.outcome === "REWORK").length;
    const reworkRate = Number(((reworkCount / total) * 100).toFixed(1));

    const chipCounts: Record<string, number> = {};
    list.forEach((f) => {
      f.chips.forEach((c) => {
        chipCounts[c] = (chipCounts[c] || 0) + 1;
      });
    });

    const topChips = Object.entries(chipCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([chip, count]) => ({ chip, count }));

    expect(total).toBe(4);
    expect(avgRating).toBe(4.0); // (5+4+2+5)/4 = 4.0
    expect(reworkCount).toBe(1);
    expect(reworkRate).toBe(25.0); // 1/4 = 25%
    expect(topChips[0]).toEqual({ chip: "On time", count: 3 });
    expect(topChips[1]).toEqual({ chip: "Great work", count: 2 });
    expect(topChips[2]).toEqual({ chip: "Needs more testing", count: 1 });
  });

  it("handles empty feedback list gracefully", () => {
    const list: Array<{ rating: number; outcome: string; chips: string[] }> = [];
    const total = list.length;
    const avgRating = total > 0 ? Number((list.reduce((acc, f) => acc + f.rating, 0) / total).toFixed(1)) : 0;
    const reworkCount = list.filter((f) => f.outcome === "REWORK").length;
    const reworkRate = total > 0 ? Number(((reworkCount / total) * 100).toFixed(1)) : 0;

    expect(total).toBe(0);
    expect(avgRating).toBe(0);
    expect(reworkCount).toBe(0);
    expect(reworkRate).toBe(0);
  });
});
