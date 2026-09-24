import { describe, it, expect } from "vitest";
import { generateFollowUpText, calculateNextRun } from "@/lib/services/followup";
import { FUCadence } from "@prisma/client";

describe("Follow-up Engine (F-FU)", () => {
  it("generates gentle tone follow-up by default", () => {
    const text = generateFollowUpText({
      template: "GENTLE",
      targetName: "Hari",
      taskTitle: "Lab switch replacement",
      dueDateStr: "25/09/2026",
      senderName: "Sri",
    });

    expect(text).toContain("Hi Hari");
    expect(text).toContain("quick check on \"Lab switch replacement\"");
    expect(text).toContain("sent for Sri");
  });

  it("generates firm tone follow-up when overdue with overdue days count", () => {
    const text = generateFollowUpText({
      template: "FIRM",
      targetName: "Janardhan",
      taskTitle: "UPS battery check",
      overdueDays: 4,
      senderName: "Sri",
      honorific: "Sir",
    });

    expect(text).toContain("Dear Sir Janardhan");
    expect(text).toContain("is now 4 days overdue");
    expect(text).toContain("sent for Sri");
  });

  it("calculates next run accurately for DAILY cadence", () => {
    const next = calculateNextRun(FUCadence.DAILY);
    const now = new Date();
    // Next run should be roughly 1 day ahead
    const diffHours = (next.getTime() - now.getTime()) / (1000 * 60 * 60);
    expect(diffHours).toBeGreaterThan(12);
    expect(diffHours).toBeLessThan(36);
  });

  it("calculates next run for EVERY_N_DAYS cadence", () => {
    const next = calculateNextRun(FUCadence.EVERY_N_DAYS, 3);
    const now = new Date();
    const diffHours = (next.getTime() - now.getTime()) / (1000 * 60 * 60);
    expect(diffHours).toBeGreaterThan(60);
    expect(diffHours).toBeLessThan(84);
  });

  it("calculates next run for WEEKLY cadence", () => {
    const next = calculateNextRun(FUCadence.WEEKLY);
    const now = new Date();
    const diffHours = (next.getTime() - now.getTime()) / (1000 * 60 * 60);
    expect(diffHours).toBeGreaterThan(150);
    expect(diffHours).toBeLessThan(180);
  });
});
