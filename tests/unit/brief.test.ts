import { describe, it, expect, vi } from "vitest";
import { generateMorningBrief } from "@/lib/services/brief";
import { RoleKey } from "@prisma/client";
import { UserContext } from "@/lib/auth/can";

vi.mock("@/lib/db", () => {
  const now = new Date();
  const pastDate = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000); // 4 days ago

  return {
    db: {
      task: {
        findMany: vi.fn().mockImplementation(async ({ where }: { where: any }) => {
          if (where.source === "LEADERSHIP") {
            return [
              {
                id: "task-lead-1",
                number: 1042,
                title: "VC Placement Summary",
                requesterName: "VC Office",
              },
            ];
          }
          if (where.lastActivityAt) {
            return [
              {
                id: "task-stuck-1",
                number: 1030,
                title: "Core switch firmware review",
                lastActivityAt: pastDate,
              },
            ];
          }
          if (where.dueAt?.lt) {
            return [
              {
                id: "task-od-1",
                number: 1038,
                title: "Renew SSL cert",
                dueAt: new Date(now.getTime() - 24 * 3600 * 1000),
              },
            ];
          }
          // Due today
          return [
            {
              id: "task-today-1",
              number: 1045,
              title: "Approve UOS rollout plan",
              priority: "HIGH",
            },
          ];
        }),
      },
      followUp: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "fu-1",
            template: "DAILY",
            task: { title: "Fix fee portal" },
          },
        ]),
      },
      dailyUpdate: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "up-1",
            blockers: "Waiting on switch arrival from vendor",
          },
        ]),
      },
      request: {
        count: vi.fn().mockResolvedValue(2),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: "u-sri", name: "Sri (IT Manager)" }),
      },
    },
  };
});

describe("Track D: Morning Brief Generator (SPEC §9 F-NOTIF-04)", () => {
  const actor: UserContext = {
    id: "u-sri",
    role: RoleKey.ADMIN,
    name: "Sri (IT Manager)",
  };

  it("generates structured morning briefing with due today, overdue, and leadership asks", async () => {
    const brief = await generateMorningBrief(actor);

    expect(brief.dueToday.length).toBeGreaterThan(0);
    expect(brief.dueToday[0]?.title).toBe("Approve UOS rollout plan");

    expect(brief.overdue.length).toBeGreaterThan(0);
    expect(brief.overdue[0]?.title).toBe("Renew SSL cert");

    expect(brief.leadershipAsks.length).toBe(1);
    expect(brief.leadershipAsks[0]?.requesterName).toBe("VC Office");

    expect(brief.newRequestsCount).toBe(2);
  });

  it("calculates stuck items with daysStale correctly", async () => {
    const brief = await generateMorningBrief(actor);

    expect(brief.stuckItems.length).toBe(1);
    expect(brief.stuckItems[0]?.daysStale).toBeGreaterThanOrEqual(3);
    expect(brief.stuckItems[0]?.title).toBe("Core switch firmware review");
  });

  it("generates markdown summary text containing greeting and counts", async () => {
    const brief = await generateMorningBrief(actor);

    expect(brief.summaryText).toContain("Good morning, Sri (IT Manager)!");
    expect(brief.summaryText).toContain("**2 new request(s)** in your inbox");
  });
});
