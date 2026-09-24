import { describe, it, expect } from "vitest";
import { can } from "@/lib/auth/can";
import { RoleKey } from "@prisma/client";

describe("Permissions Guard (lib/auth/can.ts)", () => {
  const admin = { id: "u_admin", role: RoleKey.ADMIN };
  const lead = {
    id: "u_lead",
    role: RoleKey.LEAD,
    teamIds: ["team_1"],
    ledTeamIds: ["team_1"],
  };
  const dev = { id: "u_dev", role: RoleKey.DEVELOPER, teamIds: ["team_1"] };
  const intern = { id: "u_intern", role: RoleKey.INTERN, teamIds: ["team_1"] };
  const guest = { id: "u_guest", role: RoleKey.GUEST };

  it("grants Admin unrestricted access to any action", () => {
    expect(can(admin, "manage_users")).toBe(true);
    expect(can(admin, "settings_manage")).toBe(true);
    expect(can(admin, "approve_followup")).toBe(true);
  });

  it("restricts admin actions for non-admins", () => {
    expect(can(lead, "manage_users")).toBe(false);
    expect(can(dev, "settings_manage")).toBe(false);
    expect(can(intern, "manage_team_types")).toBe(false);
    expect(can(guest, "manage_campuses")).toBe(false);
  });

  it("enforces team-level permissions for Leads", () => {
    expect(can(lead, "create_edit_teams", { teamId: "team_1" })).toBe(true);
    expect(can(lead, "create_edit_teams", { teamId: "team_2" })).toBe(false);
  });

  it("allows Developers to edit Dev Hub but denies Interns from editing", () => {
    expect(can(dev, "dev_hub_edit")).toBe(true);
    expect(can(intern, "dev_hub_edit")).toBe(false);
  });

  it("restricts Guests from creating internal tasks but allows viewing own requests", () => {
    expect(can(guest, "create_task")).toBe(false);
    expect(can(guest, "view_task", { creatorId: "u_guest" })).toBe(true);
    expect(can(guest, "view_task", { creatorId: "u_other" })).toBe(false);
  });
});
