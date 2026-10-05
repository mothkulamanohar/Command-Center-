import { describe, it, expect } from "vitest";
import { calculateWorkingTime, isWorkingDay } from "@/lib/time/working";

describe("Working Time Calculation (F-DUR-08 / lib/time/working.ts)", () => {
  it("calculates same-day working hours within 09:00 - 18:00 window", () => {
    // 10:00 to 14:30 on a Wednesday (2026-09-30)
    const start = new Date("2026-09-30T04:30:00.000Z"); // 10:00 IST (+5:30)
    const end = new Date("2026-09-30T09:00:00.000Z"); // 14:30 IST
    const res = calculateWorkingTime(start, end);

    expect(res.workingMinutes).toBe(270); // 4.5 hours
    expect(res.workingHours).toBe(4.5);
  });

  it("clips time outside working hours (before 09:00 and after 18:00)", () => {
    // 08:00 to 20:00 on a Wednesday (2026-09-30)
    const start = new Date("2026-09-30T02:30:00.000Z"); // 08:00 IST
    const end = new Date("2026-09-30T14:30:00.000Z"); // 20:00 IST
    const res = calculateWorkingTime(start, end);

    // Full 9-hour working window (09:00 to 18:00)
    expect(res.workingMinutes).toBe(540);
    expect(res.workingHours).toBe(9);
    expect(res.workingDays).toBe(1);
  });

  it("excludes Sunday (week off) across multi-day span", () => {
    // Saturday 09:00 to Monday 18:00 (Saturday + Sunday + Monday)
    // 2026-10-03 (Sat) to 2026-10-05 (Mon)
    const start = new Date("2026-10-03T03:30:00.000Z"); // Sat 09:00 IST
    const end = new Date("2026-10-05T12:30:00.000Z"); // Mon 18:00 IST
    const res = calculateWorkingTime(start, end);

    // Only Sat (9h) + Mon (9h) = 18h = 1080 mins
    expect(res.workingMinutes).toBe(1080);
    expect(res.workingHours).toBe(18);
    expect(res.workingDays).toBe(2);
  });

  it("excludes holidays and approved leave days", () => {
    // Tue 2026-09-29 09:00 to Thu 2026-10-01 18:00
    // Wednesday 2026-09-30 is a holiday
    const start = new Date("2026-09-29T03:30:00.000Z");
    const end = new Date("2026-10-01T12:30:00.000Z");
    const res = calculateWorkingTime(start, end, {
      holidays: ["2026-09-30"],
    });

    // 2 working days (Tue + Thu) = 18 hours
    expect(res.workingHours).toBe(18);
    expect(res.workingDays).toBe(2);
  });
});
