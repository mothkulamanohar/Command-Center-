import { describe, it, expect } from "vitest";
import { parseDuration, formatMinutes, formatEstimateHours } from "@/lib/time/duration";

describe("Duration Parser & Formatter (F-DUR-01)", () => {
  it("parses minute inputs accurately", () => {
    expect(parseDuration("45m")?.totalMinutes).toBe(45);
    expect(parseDuration("30 mins")?.totalMinutes).toBe(30);
    expect(parseDuration("15min")?.totalMinutes).toBe(15);
  });

  it("parses hour inputs accurately", () => {
    expect(parseDuration("2h")?.totalMinutes).toBe(120);
    expect(parseDuration("1.5h")?.totalMinutes).toBe(90);
    expect(parseDuration("3 hours")?.totalMinutes).toBe(180);
  });

  it("parses combined hour and minute inputs", () => {
    const res = parseDuration("2h 30m");
    expect(res?.hours).toBe(2);
    expect(res?.minutes).toBe(30);
    expect(res?.totalMinutes).toBe(150);
  });

  it("parses day inputs with working day hours (default 8)", () => {
    expect(parseDuration("1d")?.totalMinutes).toBe(480);
    expect(parseDuration("3d")?.totalMinutes).toBe(1440);
    expect(parseDuration("2 days", 8)?.totalMinutes).toBe(960);
  });

  it("returns null on invalid inputs", () => {
    expect(parseDuration("")).toBeNull();
    expect(parseDuration("invalid")).toBeNull();
    expect(parseDuration("0m")).toBeNull();
  });

  it("formats minutes into human readable text", () => {
    expect(formatMinutes(45)).toBe("45m");
    expect(formatMinutes(120)).toBe("2h");
    expect(formatMinutes(150)).toBe("2h 30m");
    expect(formatMinutes(0)).toBe("0m");
  });

  it("formats estimate hours into badge string", () => {
    expect(formatEstimateHours(2.5)).toBe("Est. 2h 30m");
    expect(formatEstimateHours(1)).toBe("Est. 1h");
    expect(formatEstimateHours(null)).toBe("");
  });
});
