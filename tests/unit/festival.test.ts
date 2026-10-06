import { describe, it, expect, vi } from "vitest";
import { getFestivalsForYear, getFestivalCalendarItems } from "@/lib/services/festivalData";

vi.mock("@/lib/auth/session", () => ({
  getSessionUser: async () => ({
    id: "usr-sri",
    email: "sri@smru.in",
    name: "Sri",
    role: "IT_MANAGER",
  }),
}));

import { getCalendarItemsAction } from "@/app/(app)/calendar/actions";

describe("Festival and Holiday Calendar Data (USER REQUIREMENT)", () => {
  it("provides festivals and holidays across ALL 12 MONTHS for 2026", () => {
    const festivals2026 = getFestivalsForYear(2026);
    expect(festivals2026.length).toBeGreaterThanOrEqual(25);

    // Group by month (1 to 12)
    const monthsWithHolidays = new Set<number>();
    for (const f of festivals2026) {
      const month = parseInt(f.date.split("-")[1], 10);
      monthsWithHolidays.add(month);
    }

    // Every single month from 1 (January) to 12 (December) must have festivals
    for (let m = 1; m <= 12; m++) {
      expect(monthsWithHolidays.has(m)).toBe(true);
    }
  });

  it("verifies accurate 2026 dates for major Indian and Telangana festivals", () => {
    const items = getFestivalCalendarItems(2026);
    const byDate = new Map(items.map((i) => [i.date, i.title]));

    // January
    expect(byDate.get("2026-01-26")).toBe("Republic Day");
    expect(byDate.get("2026-01-14")).toBe("Makar Sankranti / Pongal");
    expect(byDate.get("2026-01-15")).toBe("Kanuma");

    // February
    expect(byDate.get("2026-02-15")).toBe("Maha Shivaratri");

    // March
    expect(byDate.get("2026-03-04")).toBe("Holi");
    expect(byDate.get("2026-03-19")).toBe("Ugadi");
    expect(byDate.get("2026-03-27")).toBe("Ram Navami");
    expect(byDate.get("2026-03-31")).toBe("Mahavir Jayanti");

    // April
    expect(byDate.get("2026-04-03")).toBe("Good Friday");
    expect(byDate.get("2026-04-05")).toBe("Easter");

    // May
    expect(byDate.get("2026-05-27")).toBe("Bakrid / Eid al-Adha");
    expect(byDate.get("2026-05-31")).toBe("Buddha Purnima");

    // June
    expect(byDate.get("2026-06-02")).toBe("Telangana Formation Day");
    expect(byDate.get("2026-06-26")).toBe("Muharram");

    // July
    expect(byDate.get("2026-07-19")).toBe("Bonalu");

    // August
    expect(byDate.get("2026-08-15")).toBe("Independence Day");
    expect(byDate.get("2026-08-26")).toBe("Milad-un-Nabi");

    // September
    expect(byDate.get("2026-09-04")).toBe("Janmashtami");
    expect(byDate.get("2026-09-14")).toBe("Ganesh Chaturthi");
    expect(byDate.get("2026-09-16")).toBe("Onam");

    // October
    expect(byDate.get("2026-10-02")).toBe("Gandhi Jayanti");
    expect(byDate.get("2026-10-12")).toBe("Bathukamma Starts");
    expect(byDate.get("2026-10-20")).toBe("Dussehra");

    // November
    expect(byDate.get("2026-11-08")).toBe("Diwali");
    expect(byDate.get("2026-11-10")).toBe("Bhai Dooj");
    expect(byDate.get("2026-11-24")).toBe("Guru Nanak Jayanti");

    // December
    expect(byDate.get("2026-12-25")).toBe("Christmas");
  });

  it("verifies accurate year-specific dates for 2025 vs 2026 (lunar calendar accuracy)", () => {
    const f2025 = new Map(getFestivalsForYear(2025).map((f) => [f.name, f.date]));
    const f2026 = new Map(getFestivalsForYear(2026).map((f) => [f.name, f.date]));

    // Fixed date festivals stay on the same date
    expect(f2025.get("Republic Day")).toBe("2025-01-26");
    expect(f2026.get("Republic Day")).toBe("2026-01-26");
    expect(f2025.get("Independence Day")).toBe("2025-08-15");
    expect(f2026.get("Independence Day")).toBe("2026-08-15");

    // Lunar festivals change dates accurately
    expect(f2025.get("Maha Shivaratri")).toBe("2025-02-26");
    expect(f2026.get("Maha Shivaratri")).toBe("2026-02-15");

    expect(f2025.get("Holi")).toBe("2025-03-14");
    expect(f2026.get("Holi")).toBe("2026-03-04");

    expect(f2025.get("Diwali / Deepavali")).toBe("2025-10-20");
    expect(f2026.get("Diwali")).toBe("2026-11-08");
  });

  it("getCalendarItemsAction preserves existing user meetings and deadlines without duplication", async () => {
    const res = await getCalendarItemsAction(2026, 9);
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data)).toBe(true);

    const items = res.data;

    // Check that existing meeting is preserved
    const syncMeeting = items.find((i: any) => i.title.includes("Campus IT Weekly Operations Sync"));
    expect(syncMeeting).toBeDefined();
    expect(syncMeeting.date).toBe("2026-10-06");

    // Check that existing deadline is preserved
    const kpiDeadline = items.find((i: any) => i.title.includes("T-1042"));
    expect(kpiDeadline).toBeDefined();
    expect(kpiDeadline.date).toBe("2026-10-07");

    // Check that festivals are included
    const gandhiJayanti = items.find((i: any) => i.title === "Gandhi Jayanti");
    expect(gandhiJayanti).toBeDefined();
    expect(gandhiJayanti.date).toBe("2026-10-02");

    // Check that there are NO duplicates
    const gandhiCount = items.filter((i: any) => i.title === "Gandhi Jayanti" && i.date === "2026-10-02").length;
    expect(gandhiCount).toBe(1);

    const dussehraCount = items.filter((i: any) => i.title.includes("Dussehra") && i.date === "2026-10-20").length;
    expect(dussehraCount).toBe(1);
  });
});
