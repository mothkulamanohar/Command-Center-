import { PrismaClient, RoleKey, SupportMode, ChannelKind } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Command Center database per SPEC §20...");

  const defaultPasswordHash = await bcrypt.hash("ChangeMe!2026", 12);

  // 1. Seed Campuses
  const campuses = [
    { name: "SMRU", code: "SMRU", mode: SupportMode.ONSITE },
    { name: "Hyderabad Group", code: "HYD", mode: SupportMode.ONSITE },
    { name: "St. Mary's Group Chebrol", code: "CHB", mode: SupportMode.REMOTE },
    { name: "Guntur", code: "GNT", mode: SupportMode.REMOTE },
    { name: "St. Mary's Women's", code: "WMS", mode: SupportMode.REMOTE },
  ];

  const campusMap = new Map<string, string>();
  for (const c of campuses) {
    const campus = await prisma.campus.upsert({
      where: { name: c.name },
      update: { code: c.code, mode: c.mode },
      create: { name: c.name, code: c.code, mode: c.mode },
    });
    campusMap.set(c.name, campus.id);
  }

  // 2. Seed Team Types
  const teamTypes = [
    { name: "Campus team", color: "#EFEDE6", stages: [], builtIn: true },
    {
      name: "Implementation",
      color: "#F6E4D0",
      stages: [
        "Data collected",
        "Accounts created",
        "Trained",
        "Go-live",
        "First-week support",
      ],
      builtIn: true,
    },
    { name: "Dev team", color: "#E7E1F4", stages: [], builtIn: true },
    { name: "Interns", color: "#FBE3E0", stages: [], builtIn: true },
    { name: "Support", color: "#EFEDE6", stages: [], builtIn: true },
  ];

  const typeMap = new Map<string, string>();
  for (const t of teamTypes) {
    const type = await prisma.teamType.upsert({
      where: { name: t.name },
      update: { color: t.color, stages: t.stages, builtIn: t.builtIn },
      create: { name: t.name, color: t.color, stages: t.stages, builtIn: t.builtIn },
    });
    typeMap.set(t.name, type.id);
  }

  // 3. Seed Users
  const users = [
    {
      name: "Sri",
      email: "sri@smru.in",
      role: RoleKey.ADMIN,
      title: "IT Manager",
      campusId: campusMap.get("Hyderabad Group"),
      isSenior: false,
    },
    {
      name: "Hari",
      email: "hari@smru.in",
      role: RoleKey.LEAD,
      title: "IT Coordinator",
      aliases: ["Hari", "Hari garu"],
      campusId: campusMap.get("SMRU"),
      isSenior: false,
    },
    {
      name: "Janardhan",
      email: "janardhan@smru.in",
      role: RoleKey.MEMBER,
      title: "Senior Faculty & IT Member",
      honorific: "sir",
      isSenior: true, // Always approval mode per SPEC §9.4
    },
    {
      name: "Dev Web",
      email: "dev.web@smru.in",
      role: RoleKey.DEVELOPER,
      title: "Frontend Developer",
    },
    {
      name: "Dev Backend",
      email: "dev.backend@smru.in",
      role: RoleKey.DEVELOPER,
      title: "Backend Developer",
    },
    {
      name: "Intern Web A",
      email: "intern.a@smru.in",
      role: RoleKey.INTERN,
      title: "Web Intern",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-11-30"),
    },
    {
      name: "Intern Web B",
      email: "intern.b@smru.in",
      role: RoleKey.INTERN,
      title: "Web Intern",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-11-30"),
    },
    {
      name: "VC Office",
      email: "vc.office@smru.in",
      role: RoleKey.GUEST,
      title: "Vice Chancellor's Office",
      isSenior: true,
    },
    {
      name: "COO Office",
      email: "coo.office@smru.in",
      role: RoleKey.GUEST,
      title: "Chief Operating Officer's Office",
      isSenior: true,
    },
    {
      name: "CEO Office",
      email: "ceo.office@smru.in",
      role: RoleKey.GUEST,
      title: "Chief Executive Officer's Office",
      isSenior: true,
    },
  ];

  const userMap = new Map<string, string>();
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        title: u.title,
        campusId: u.campusId,
        isSenior: u.isSenior ?? false,
      },
      create: {
        name: u.name,
        email: u.email,
        passwordHash: defaultPasswordHash,
        mustChangePw: true,
        role: u.role,
        title: u.title,
        honorific: u.honorific,
        aliases: u.aliases ?? [],
        campusId: u.campusId,
        isSenior: u.isSenior ?? false,
        startDate: u.startDate,
        endDate: u.endDate,
      },
    });
    userMap.set(u.email, user.id);
  }

  // 4. Seed Teams & Auto-provision Channels + Docs
  const teams = [
    {
      name: "SMRU Campus IT",
      slug: "smru-campus-it",
      typeId: typeMap.get("Campus team")!,
      campusId: campusMap.get("SMRU"),
      leadId: userMap.get("hari@smru.in"),
      members: ["hari@smru.in", "janardhan@smru.in"],
    },
    {
      name: "Hyderabad Group",
      slug: "hyderabad-group",
      typeId: typeMap.get("Campus team")!,
      campusId: campusMap.get("Hyderabad Group"),
      leadId: userMap.get("sri@smru.in"),
      members: ["sri@smru.in"],
    },
    {
      name: "Remote Support",
      slug: "remote-support",
      typeId: typeMap.get("Support")!,
      leadId: userMap.get("hari@smru.in"),
      members: ["hari@smru.in"],
    },
    {
      name: "UOS Rollout",
      slug: "uos-rollout",
      typeId: typeMap.get("Implementation")!,
      campusId: campusMap.get("SMRU"),
      leadId: userMap.get("hari@smru.in"),
      members: ["hari@smru.in", "dev.backend@smru.in"],
    },
    {
      name: "Developers",
      slug: "developers",
      typeId: typeMap.get("Dev team")!,
      leadId: userMap.get("sri@smru.in"),
      members: ["sri@smru.in", "dev.web@smru.in", "dev.backend@smru.in"],
    },
    {
      name: "Interns · Web Batch Sep '26",
      slug: "interns-sep-26",
      typeId: typeMap.get("Interns")!,
      leadId: userMap.get("hari@smru.in"),
      members: ["hari@smru.in", "intern.a@smru.in", "intern.b@smru.in"],
    },
  ];

  for (const t of teams) {
    const team = await prisma.team.upsert({
      where: { slug: t.slug },
      update: {
        name: t.name,
        typeId: t.typeId,
        campusId: t.campusId,
        leadId: t.leadId,
      },
      create: {
        name: t.name,
        slug: t.slug,
        typeId: t.typeId,
        campusId: t.campusId,
        leadId: t.leadId,
      },
    });

    // Auto-create chat channel (#team-slug)
    await prisma.channel.upsert({
      where: { slug: `team-${team.slug}` },
      update: { name: team.name, teamId: team.id },
      create: {
        name: team.name,
        slug: `team-${team.slug}`,
        kind: ChannelKind.TEAM,
        teamId: team.id,
      },
    });

    // Auto-create team DocSpace
    const existingDocSpace = await prisma.docSpace.findFirst({
      where: { teamId: team.id },
    });
    if (!existingDocSpace) {
      await prisma.docSpace.create({
        data: { name: team.name, teamId: team.id },
      });
    }

    // Add memberships
    for (const email of t.members) {
      const uId = userMap.get(email);
      if (uId) {
        await prisma.teamMember.upsert({
          where: { teamId_userId: { teamId: team.id, userId: uId } },
          update: { isLead: uId === t.leadId },
          create: { teamId: team.id, userId: uId, isLead: uId === t.leadId },
        });
      }
    }
  }

  // 5. Seed Sites Registry per SPEC §20
  const sites = [
    { domain: "smru.edu.in", url: "https://smru.edu.in", ownerId: userMap.get("sri@smru.in") },
    { domain: "smru.in", url: "https://smru.in", ownerId: userMap.get("sri@smru.in") },
    { domain: "womens.smru.in", url: "https://womens.smru.in", ownerId: userMap.get("hari@smru.in") },
    { domain: "chebrol.smru.in", url: "https://chebrol.smru.in", ownerId: userMap.get("hari@smru.in") },
    { domain: "group.smru.in", url: "https://group.smru.in", ownerId: userMap.get("sri@smru.in") },
  ];

  for (const s of sites) {
    await prisma.site.upsert({
      where: { domain: s.domain },
      update: { url: s.url, ownerId: s.ownerId },
      create: { domain: s.domain, url: s.url, ownerId: s.ownerId },
    });
  }

  // 6. Seed Tasks and Follow-ups
  const sriId = userMap.get("sri@smru.in")!;
  const hariId = userMap.get("hari@smru.in")!;
  const vcId = userMap.get("vc.office@smru.in")!;

  const t1 = await prisma.task.upsert({
    where: { id: "t_1" },
    update: {},
    create: {
      id: "t_1",
      number: 1042,
      title: "Review monthly KPI report for VC",
      ownerId: sriId,
      requesterId: vcId,
      requesterName: "VC Office",
      createdById: vcId,
      status: "TODO",
      priority: "HIGH",
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      source: "LEADERSHIP"
    }
  });

  const t3 = await prisma.task.upsert({
    where: { id: "t_3" },
    update: {},
    create: {
      id: "t_3",
      number: 1044,
      title: "Fix admission form verification on smru.in",
      ownerId: hariId,
      requesterId: sriId,
      createdById: sriId,
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueAt: new Date(Date.now() + 18 * 60 * 60 * 1000),
      source: "COMMAND"
    }
  });

  await prisma.followUp.upsert({
    where: { id: "fu_1" },
    update: {},
    create: {
      id: "fu_1",
      taskId: t3.id,
      onBehalfOfId: sriId,
      targetId: hariId,
      cadence: "DAILY",
      template: "GENTLE",
      nextRunAt: new Date(Date.now() - 1000 * 60 * 60), // Due an hour ago, will fire today
    }
  });

  console.log("Database seeded successfully with all roles, campuses, teams, and sites!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
