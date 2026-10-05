"use server";

import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { TaskStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getTeamsAction() {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized", data: [] };

  try {
    const teams = await db.team.findMany({
      where: { archived: false },
      include: {
        campus: { select: { id: true, name: true } },
        type: { select: { id: true, name: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, role: true, email: true } },
          },
        },
        tasks: {
          where: { deletedAt: null },
          select: { id: true, status: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const leadIds = teams.map((t) => t.leadId).filter((id): id is string => Boolean(id));
    const leads = await db.user.findMany({
      where: { id: { in: leadIds } },
      select: { id: true, name: true, role: true },
    });
    const leadMap = new Map(leads.map((l) => [l.id, l]));

    const mapped = teams.map((t) => {
      const openTasks = t.tasks.filter((tk) => tk.status !== TaskStatus.DONE && tk.status !== TaskStatus.CANCELLED).length;
      const doneTasks = t.tasks.filter((tk) => tk.status === TaskStatus.DONE).length;
      const totalTasks = t.tasks.length;
      const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 100;

      const members = t.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        role: m.user.role,
        email: m.user.email,
        isOnline: true,
        attendanceStatus: "PRESENT" as const,
      }));

      const lead = t.leadId ? leadMap.get(t.leadId) : null;
      const leadName = lead ? `${lead.name} (${lead.role})` : "Unassigned";

      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        type: t.type?.name || "General Team",
        campus: t.campus?.name || "Main Campus",
        leadName,
        memberCount: members.length,
        openTasks,
        totalTasks,
        progressPct,
        status: openTasks === 0 ? "Completed" : "Active",
        description: t.description || "Operational cross-functional team.",
        members,
      };
    });

    return { success: true, data: mapped };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load teams", data: [] };
  }
}

export async function createTeamAction(params: {
  name: string;
  type?: string;
  campus?: string;
  leadName?: string;
  description?: string;
}) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const { createTeam } = await import("@/lib/services/org");
    const slug = params.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Find or pick a teamType
    let teamType = await db.teamType.findFirst({
      where: { name: { contains: params.type || "General", mode: "insensitive" } },
    });
    if (!teamType) {
      teamType = await db.teamType.findFirst();
      if (!teamType) {
        teamType = await db.teamType.create({ data: { name: "Campus Team", color: "#EFEDE6" } });
      }
    }

    // Find or pick campus
    const campus = await db.campus.findFirst({
      where: { name: { contains: params.campus || "Main", mode: "insensitive" } },
    });

    // Find lead user if specified, otherwise user
    let lead = user;
    if (params.leadName) {
      const foundLead = await db.user.findFirst({
        where: { name: { contains: params.leadName, mode: "insensitive" } },
      });
      if (foundLead) lead = foundLead;
    }

    const team = await createTeam(user, {
      name: params.name,
      slug,
      typeId: teamType.id,
      campusId: campus?.id,
      leadId: lead.id,
      description: params.description,
      memberUserIds: [lead.id],
    });

    revalidatePath("/teams");
    revalidatePath("/chat");
    return { success: true, data: team };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create team" };
  }
}

export async function updateTeamSettingsAction(
  teamId: string,
  params: { name: string; description?: string }
) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const { updateTeamSettings } = await import("@/lib/services/org");
    const team = await updateTeamSettings(user, teamId, params);
    revalidatePath("/teams");
    return { success: true, data: team };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update team settings" };
  }
}

export async function addTeamMemberAction(teamId: string, userId: string, roleTitle?: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const { addTeamMember } = await import("@/lib/services/org");
    const member = await addTeamMember(user, teamId, userId, roleTitle || "Member");
    revalidatePath("/teams");
    revalidatePath("/chat");
    return { success: true, data: member };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to add team member" };
  }
}

export async function removeTeamMemberAction(teamId: string, userId: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const { removeTeamMember } = await import("@/lib/services/org");
    await removeTeamMember(user, teamId, userId);
    revalidatePath("/teams");
    revalidatePath("/chat");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to remove team member" };
  }
}

export async function getActiveUsersAction() {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized", data: [] };

  try {
    const users = await db.user.findMany({
      where: { active: true },
      select: { id: true, name: true, role: true, email: true },
      orderBy: { name: "asc" },
    });
    return { success: true, data: users };
  } catch (error: any) {
    return { success: false, error: error.message, data: [] };
  }
}

