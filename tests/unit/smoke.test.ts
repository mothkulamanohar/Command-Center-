import { describe, it, expect } from "vitest";
import { formatOrgTime, formatOrgDate, formatOrgTimeOnly } from "@/lib/time";

describe("Time & Date Helpers (lib/time.ts)", () => {
  it("formats dates into Asia/Kolkata correctly", () => {
    // 2026-09-24T12:00:00Z is 17:30 IST (+05:30)
    const utcDate = new Date("2026-09-24T12:00:00Z");
    const formatted = formatOrgTime(utcDate, "yyyy-MM-dd HH:mm");
    expect(formatted).toBe("2026-09-24 17:30");
  });

  it("formats date-only correctly", () => {
    const utcDate = new Date("2026-09-24T12:00:00Z");
    const dateOnly = formatOrgDate(utcDate);
    expect(dateOnly).toBe("24 Sep 2026");
  });

  it("formats time-only correctly", () => {
    const utcDate = new Date("2026-09-24T12:00:00Z");
    const timeOnly = formatOrgTimeOnly(utcDate);
    expect(timeOnly).toBe("17:30");
  });
});
