import { z } from "zod";
import { db } from "@/lib/db";
import { can, UserContext } from "@/lib/auth/can";
import { logAudit } from "@/lib/services/audit";
import { SupportMode, ChannelKind } from "@prisma/client";

// Input Schemas
export const CreateCampusSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  mode: z.nativeEnum(SupportMode).default(SupportMode.REMOTE),
  leadId: z.string().optional(),
  address: z.string().optional(),
});

export const CreateTeamTypeSchema = z.object({
  name: z.string().min(1),
  color: z.string().default("#EFEDE6"),
  stages: z.array(z.string()).default([]),
  customFields: z.array(z.object({
    key: z.string(),
    label: z.string(),
    type: z.string(),
    options: z.array(z.string()).optional(),
  })).default([]),
});

export const CreateTeamSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  typeId: z.string(),
  campusId: z.string().optional(),
  leadId: z.string().optional(),
  description: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  memberUserIds: z.array(z.string()).default([]),
});

/**
 * F-ORG-01: Campuses CRUD
 */
export async function createCampus(actor: UserContext, input: z.infer<typeof CreateCampusSchema>) {
  if (!can(actor, "manage_campuses")) {
    throw new Error("Unauthorized: Only Admins can create campuses");
  }
  const data = CreateCampusSchema.parse(input);

  return await db.$transaction(async (tx) => {
    const campus = await tx.campus.create({ data });
    await logAudit(tx, {
      actorId: actor.id,
      action: "CREATE_CAMPUS",
      entity: "Campus",
      entityId: campus.id,
      after: { name: campus.name, mode: campus.mode },
    });
    return campus;
  });
}

export async function archiveCampus(actor: UserContext, campusId: string) {
  if (!can(actor, "manage_campuses")) {
    throw new Error("Unauthorized: Only Admins can archive campuses");
  }

  return await db.$transaction(async (tx) => {
    const campus = await tx.campus.update({
      where: { id: campusId },
      data: { archived: true },
    });
    await logAudit(tx, {
      actorId: actor.id,
      action: "ARCHIVE_CAMPUS",
      entity: "Campus",
      entityId: campusId,
    });
    return campus;
  });
}

/**
 * F-ORG-02: Team types CRUD
 */
export async function createTeamType(actor: UserContext, input: z.infer<typeof CreateTeamTypeSchema>) {
  if (!can(actor, "manage_team_types")) {
    throw new Error("Unauthorized: Only Admins can create team types");
  }
  const data = CreateTeamTypeSchema.parse(input);

  return await db.$transaction(async (tx) => {
    const teamType = await tx.teamType.create({
      data: {
        name: data.name,
        color: data.color,
        stages: data.stages,
        customFields: data.customFields,
      },
    });
    await logAudit(tx, {
      actorId: actor.id,
      action: "CREATE_TEAM_TYPE",
      entity: "TeamType",
      entityId: teamType.id,
    });
    return teamType;
  });
}

/**
 * F-ORG-03 & F-ORG-04: Teams CRUD & auto-provisioning
 * Creating a team auto-creates its chat group (#team-slug) and a Docs folder.
 */
export async function createTeam(actor: UserContext, input: z.infer<typeof CreateTeamSchema>) {
  if (!can(actor, "create_edit_teams")) {
    throw new Error("Unauthorized: Not allowed to create teams");
  }
  const data = CreateTeamSchema.parse(input);

  return await db.$transaction(async (tx) => {
    // 1. Create Team
    const team = await tx.team.create({
      data: {
        name: data.name,
        slug: data.slug,
        typeId: data.typeId,
        campusId: data.campusId,
        leadId: data.leadId,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });

    // 2. Add lead and members to TeamMember
    const membersToCreate: { teamId: string; userId: string; isLead: boolean }[] = [];
    if (data.leadId) {
      membersToCreate.push({ teamId: team.id, userId: data.leadId, isLead: true });
    }
    const uniqueMemberIds = Array.from(new Set(data.memberUserIds));
    for (const userId of uniqueMemberIds) {
      if (userId !== data.leadId) {
        membersToCreate.push({ teamId: team.id, userId, isLead: false });
      }
    }
    if (membersToCreate.length > 0) {
      await tx.teamMember.createMany({ data: membersToCreate });
    }

    // 3. Auto-create chat channel (#team-slug) per SPEC F-ORG-03
    const channel = await tx.channel.create({
      data: {
        name: team.name,
        slug: `team-${team.slug}`,
        kind: ChannelKind.TEAM,
        teamId: team.id,
        isPrivate: false,
      },
    });

    // Add members to the channel
    if (membersToCreate.length > 0) {
      await tx.channelMember.createMany({
        data: membersToCreate.map((m) => ({
          channelId: channel.id,
          userId: m.userId,
        })),
      });
    }

    // 4. Auto-create Docs folder (DocSpace) per SPEC F-ORG-03
    await tx.docSpace.create({
      data: {
        name: team.name,
        teamId: team.id,
      },
    });

    // 5. Audit Log
    await logAudit(tx, {
      actorId: actor.id,
      action: "CREATE_TEAM",
      entity: "Team",
      entityId: team.id,
      after: { name: team.name, slug: team.slug, channelId: channel.id },
    });

    return team;
  });
}

/**
 * Update Team Settings (name, description)
 */
export async function updateTeamSettings(
  actor: UserContext,
  teamId: string,
  data: { name: string; description?: string }
) {
  if (!can(actor, "create_edit_teams")) {
    throw new Error("Unauthorized to edit team settings");
  }

  const team = await db.team.update({
    where: { id: teamId },
    data: {
      name: data.name,
      description: data.description,
    },
  });

  await logAudit(db, {
    actorId: actor.id,
    action: "UPDATE_TEAM",
    entity: "Team",
    entityId: teamId,
    after: { name: team.name },
  });

  return team;
}

/**
 * Add Member to Team & Team Chat Channel
 */
export async function addTeamMember(
  actor: UserContext,
  teamId: string,
  userId: string,
  roleTitle: string = "Member"
) {
  if (!can(actor, "create_edit_teams")) {
    throw new Error("Unauthorized to add team members");
  }

  return await db.$transaction(async (tx) => {
    const isLead = roleTitle.toLowerCase() === "lead";
    const member = await tx.teamMember.upsert({
      where: { teamId_userId: { teamId, userId } },
      create: {
        teamId,
        userId,
        isLead,
      },
      update: {
        isLead,
      },
      include: {
        user: { select: { id: true, name: true, role: true, email: true } },
      },
    });

    // Also add to team channel
    const channel = await tx.channel.findFirst({
      where: { teamId, kind: ChannelKind.TEAM },
    });
    if (channel) {
      await tx.channelMember.upsert({
        where: { channelId_userId: { channelId: channel.id, userId } },
        create: { channelId: channel.id, userId },
        update: {},
      });
    }

    await logAudit(tx, {
      actorId: actor.id,
      action: "ADD_TEAM_MEMBER",
      entity: "TeamMember",
      entityId: member.id,
      after: { teamId, userId, roleTitle },
    });

    return member;
  });
}

/**
 * Remove Member from Team & Team Chat Channel
 */
export async function removeTeamMember(
  actor: UserContext,
  teamId: string,
  userId: string
) {
  if (!can(actor, "create_edit_teams")) {
    throw new Error("Unauthorized to remove team members");
  }

  return await db.$transaction(async (tx) => {
    await tx.teamMember.deleteMany({
      where: { teamId, userId },
    });

    const channel = await tx.channel.findFirst({
      where: { teamId, kind: ChannelKind.TEAM },
    });
    if (channel) {
      await tx.channelMember.deleteMany({
        where: { channelId: channel.id, userId },
      });
    }

    await logAudit(tx, {
      actorId: actor.id,
      action: "REMOVE_TEAM_MEMBER",
      entity: "TeamMember",
      entityId: `${teamId}_${userId}`,
    });

    return { success: true };
  });
}

/**
 * F-ORG-01: Toggle Campus Support Mode (ONSITE <-> REMOTE)
 */
export async function toggleCampusSupportMode(actor: UserContext, campusId: string) {
  if (!can(actor, "manage_campuses")) {
    throw new Error("Unauthorized: Only Admins can manage campuses");
  }

  const campus = await db.campus.findUniqueOrThrow({ where: { id: campusId } });
  const nextMode = campus.mode === SupportMode.ONSITE ? SupportMode.REMOTE : SupportMode.ONSITE;

  const updated = await db.campus.update({
    where: { id: campusId },
    data: { mode: nextMode },
  });

  await logAudit(db, {
    actorId: actor.id,
    action: "UPDATE_CAMPUS_MODE",
    entity: "Campus",
    entityId: campusId,
    after: { mode: nextMode },
  });

  return updated;
}

