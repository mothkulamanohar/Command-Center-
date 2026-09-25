import { describe, it, expect, vi } from "vitest";
import { ReportBugSchema, reportBug } from "@/lib/services/dev";
import { getDocTemplates } from "@/lib/services/doc";
import { Priority, RoleKey } from "@prisma/client";
import { UserContext } from "@/lib/auth/can";

vi.mock("@/lib/db", () => {
  return {
    db: {
      $transaction: vi.fn(async (cb: (tx: any) => Promise<any>) => {
        const tx = {
          task: {
            create: vi.fn().mockImplementation(({ data }: { data: any }) => ({
              id: "task-bug-1",
              ...data,
            })),
          },
        };
        return cb(tx);
      }),
    },
  };
});

vi.mock("@/lib/services/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(true),
}));

describe("Track E: Dev Hub & Bug Reporting (SPEC §13 F-DEV-04)", () => {
  const adminActor: UserContext = {
    id: "usr-sri",
    role: RoleKey.ADMIN,
    name: "Sri (IT Manager)",
  };

  it("validates bug report schema correctly", () => {
    const valid = {
      title: "Broken submit button on admissions portal",
      steps: "1. Open form\n2. Fill fields\n3. Click Submit",
      severity: "HIGH" as const,
    };
    const parsed = ReportBugSchema.parse(valid);
    expect(parsed.title).toBe(valid.title);
    expect(parsed.severity).toBe("HIGH");

    // Invalid input: title too short
    expect(() =>
      ReportBugSchema.parse({
        title: "x",
        steps: "Some steps to reproduce",
      })
    ).toThrow();

    // Invalid input: steps too short
    expect(() =>
      ReportBugSchema.parse({
        title: "Valid title",
        steps: "123",
      })
    ).toThrow();
  });

  it("creates bug task with CRITICAL mapped to URGENT priority", async () => {
    const bug = await reportBug(adminActor, {
      title: "Core database latency spike",
      steps: "1. Run query\n2. Observe 10s wait",
      severity: "CRITICAL",
    });

    expect(bug.title).toBe("[BUG] Core database latency spike");
    expect(bug.priority).toBe(Priority.URGENT);
    expect(bug.tags).toContain("bug");
    expect(bug.tags).toContain("critical");
  });

  it("creates bug task with MEDIUM priority default", async () => {
    const bug = await reportBug(adminActor, {
      title: "Minor CSS misalignment in header",
      steps: "1. Zoom to 150%\n2. Header overlaps",
      severity: "MEDIUM",
    });

    expect(bug.priority).toBe(Priority.MEDIUM);
    expect(bug.tags).toContain("medium");
  });
});

describe("Track E: Canonical Document Templates (SPEC §12.2 F-DOC-03)", () => {
  it("provides canonical SOP, Incident Postmortem, Meeting Notes, and Project Brief templates", () => {
    const templates = getDocTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(4);

    const templateIds = templates.map((t) => t.id);
    expect(templateIds).toContain("sop");
    expect(templateIds).toContain("incident");
    expect(templateIds).toContain("meeting");
    expect(templateIds).toContain("project");

    const sop = templates.find((t) => t.id === "sop");
    expect(sop?.name).toContain("Standard Operating Procedure");
    expect(sop?.template).toContain("## 1. Objective");
    expect(sop?.template).toContain("## 2. Prerequisites & Safety");
    expect(sop?.template).toContain("## 3. Step-by-Step Execution");
    expect(sop?.template).toContain("## 4. Verification & Testing");

    const incident = templates.find((t) => t.id === "incident");
    expect(incident?.name).toContain("Incident Postmortem");
    expect(incident?.template).toContain("## Root Cause");
    expect(incident?.template).toContain("## Corrective Actions");
  });
});
