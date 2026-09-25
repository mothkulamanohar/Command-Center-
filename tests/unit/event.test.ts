import { describe, it, expect } from "vitest";
import { generateIcsFeed } from "@/lib/services/event";

describe("Calendar Event Service & ICS Feed (SPEC §12.1 F-CAL-07)", () => {
  it("generates valid RFC 5545 iCalendar feed format", () => {
    const sampleEvents = [
      {
        id: "ev-1",
        title: "SMRU IT Weekly Coordination Meeting",
        startAt: new Date("2026-09-25T10:00:00.000Z"),
        endAt: new Date("2026-09-25T11:00:00.000Z"),
        location: "IT Conference Room",
        notes: "Agenda: Switch migration status and UOS rollout",
      },
      {
        id: "ev-2",
        title: "smru.in SSL Certificate Renewal Deadline",
        startAt: new Date("2026-09-28T18:00:00.000Z"),
        endAt: new Date("2026-09-28T19:00:00.000Z"),
        location: "DNS Console",
        notes: null,
      },
    ];

    const ics = generateIcsFeed(sampleEvents);

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("UID:ev-1@commandcenter.local");
    expect(ics).toContain("SUMMARY:SMRU IT Weekly Coordination Meeting");
    expect(ics).toContain("LOCATION:IT Conference Room");
    expect(ics).toContain("UID:ev-2@commandcenter.local");
    expect(ics).toContain("SUMMARY:smru.in SSL Certificate Renewal Deadline");
    expect(ics).toContain("END:VCALENDAR");
  });
});
