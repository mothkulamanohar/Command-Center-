import { describe, it, expect } from "vitest";
import {
  calculateTasksCompleted,
  calculateOnTimeDelivery,
  calculateOverdueOpen,
  calculateDailyUpdateCompliance,
  calculateFollowUpsAnswered,
  calculateLeadershipAsksClosed,
  calculateWebsiteUptime,
  mapPercentageToScore,
  calculateJpaOverallScore,
  getRatingLabel,
  formatReportFileName,
} from "@/lib/services/kpi";

describe("KPI Formulas (SPEC §13.1)", () => {
  it("computes tasks completed excluding cancelled", () => {
    const tasks = [
      { id: "1", status: "DONE", doneAt: new Date() },
      { id: "2", status: "DONE", doneAt: new Date() },
      { id: "3", status: "CANCELLED", doneAt: new Date() },
      { id: "4", status: "TODO" },
    ];
    expect(calculateTasksCompleted(tasks)).toBe(2);
  });

  it("computes on-time delivery percentage accurately", () => {
    const now = new Date();
    const tasks = [
      // Finished on time
      {
        id: "1",
        status: "DONE",
        dueAt: new Date(now.getTime() + 10000),
        doneAt: now,
      },
      // Finished late
      {
        id: "2",
        status: "DONE",
        dueAt: new Date(now.getTime() - 10000),
        doneAt: now,
      },
      // Finished on time (exact)
      {
        id: "3",
        status: "DONE",
        dueAt: now,
        doneAt: now,
      },
    ];
    // 2 out of 3 on time = 67%
    expect(calculateOnTimeDelivery(tasks)).toBe(67);
  });

  it("computes overdue open tasks", () => {
    const periodEnd = new Date("2026-09-24T18:00:00Z");
    const tasks = [
      { id: "1", status: "TODO", dueAt: new Date("2026-09-23T18:00:00Z") }, // overdue
      { id: "2", status: "IN_PROGRESS", dueAt: new Date("2026-09-22T18:00:00Z") }, // overdue
      { id: "3", status: "TODO", dueAt: new Date("2026-09-25T18:00:00Z") }, // not overdue
      { id: "4", status: "DONE", dueAt: new Date("2026-09-20T18:00:00Z") }, // done -> not counted
    ];
    expect(calculateOverdueOpen(tasks, periodEnd)).toBe(2);
  });

  it("computes daily update compliance percentage", () => {
    expect(calculateDailyUpdateCompliance(9, 10)).toBe(90);
    expect(calculateDailyUpdateCompliance(5, 5)).toBe(100);
    expect(calculateDailyUpdateCompliance(0, 10)).toBe(0);
  });

  it("computes follow-ups answered percentage", () => {
    expect(calculateFollowUpsAnswered(8, 10)).toBe(80);
    expect(calculateFollowUpsAnswered(0, 5)).toBe(0);
  });

  it("computes leadership asks closed percentage", () => {
    const leadershipTasks = [
      { id: "1", status: "DONE" },
      { id: "2", status: "DONE" },
      { id: "3", status: "IN_PROGRESS" },
    ];
    expect(calculateLeadershipAsksClosed(leadershipTasks)).toBe(67);
  });

  it("computes website uptime percentage with 2 decimals", () => {
    const checks = [
      { ok: true },
      { ok: true },
      { ok: true },
      { ok: false }, // 3 out of 4 = 75.00%
    ];
    expect(calculateWebsiteUptime(checks)).toBe(75.0);
  });
});

describe("JPA Appraisal Scoring (SPEC §13.2)", () => {
  it("maps percentages to 5-point scale accurately", () => {
    expect(mapPercentageToScore(96)).toBe(5.0);
    expect(mapPercentageToScore(87)).toBe(4.0);
    expect(mapPercentageToScore(72)).toBe(3.0);
    expect(mapPercentageToScore(55)).toBe(2.0);
    expect(mapPercentageToScore(40)).toBe(1.0);
  });

  it("calculates overall JPA weighted score and rating label", () => {
    // Delivery 25%, Timeliness 25%, Reliability 15%, Responsiveness 10%, Quality 10%, Lead review 15%
    const scores = {
      delivery: 4.5,
      timeliness: 5.0,
      reliability: 4.0,
      responsiveness: 4.0,
      quality: 4.0,
      leadReview: 4.5,
    };
    const overall = calculateJpaOverallScore(scores);
    // 4.5*0.25 + 5*0.25 + 4*0.15 + 4*0.10 + 4*0.10 + 4.5*0.15 = 1.125 + 1.25 + 0.6 + 0.4 + 0.4 + 0.675 = 4.45 -> 4.5
    expect(overall).toBe(4.5);
    expect(getRatingLabel(overall)).toBe("Exceeds");
  });

  it("assigns correct ratings per thresholds", () => {
    expect(getRatingLabel(4.3)).toBe("Exceeds");
    expect(getRatingLabel(3.8)).toBe("Meets");
    expect(getRatingLabel(2.9)).toBe("Developing");
    expect(getRatingLabel(2.1)).toBe("Needs support");
  });
});

describe("Report File Naming (SPEC §13.5)", () => {
  it("formats file name per convention IT_{Type}_{Audience}_{Scope}_{PeriodTag}.{ext}", () => {
    const fileName = formatReportFileName({
      type: "Weekly",
      audience: "VC",
      scope: "All",
      periodTag: "W39-2026",
      extension: "pdf",
    });
    expect(fileName).toBe("IT_Weekly_VC_All_W39-2026.pdf");
  });
});
