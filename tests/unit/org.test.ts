import { describe, it, expect } from "vitest";
import { CreateCampusSchema, CreateTeamTypeSchema, CreateTeamSchema } from "@/lib/services/org";
import { SupportMode } from "@prisma/client";

describe("Organization Validation Schemas (F-ORG-01 to F-ORG-03)", () => {
  it("validates Campus schema correctly", () => {
    const valid = CreateCampusSchema.safeParse({
      name: "SMRU Main Campus",
      code: "SMRU",
      mode: SupportMode.ONSITE,
    });
    expect(valid.success).toBe(true);

    const invalid = CreateCampusSchema.safeParse({
      name: "",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates TeamType schema with stages and custom fields", () => {
    const valid = CreateTeamTypeSchema.safeParse({
      name: "Implementation",
      color: "#F6E4D0",
      stages: ["Data collected", "Trained", "Go-live"],
      customFields: [
        { key: "lead_mentor", label: "Mentor", type: "text" },
      ],
    });
    expect(valid.success).toBe(true);
  });

  it("validates Team schema and enforces slug format", () => {
    const valid = CreateTeamSchema.safeParse({
      name: "Developers Team",
      slug: "developers-team",
      typeId: "type_1",
    });
    expect(valid.success).toBe(true);

    // Rejects spaces or special chars in slug
    const invalidSlug = CreateTeamSchema.safeParse({
      name: "Developers Team",
      slug: "Developers Team!",
      typeId: "type_1",
    });
    expect(invalidSlug.success).toBe(false);
  });
});
