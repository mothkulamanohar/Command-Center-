import { TeamCardData, TeamMember } from "@/components/teams/ManageTeamModal";

export const INITIAL_TEAMS: TeamCardData[] = [
  {
    id: "tm-1",
    name: "SMRU Campus IT",
    slug: "smru-campus-it",
    type: "Campus Team",
    campus: "SMRU Main Campus",
    leadName: "Hari (Coordinator)",
    memberCount: 5,
    openTasks: 4,
    status: "On-site",
    description: "Physical hardware, core fiber routing, lab switch infrastructure, and on-premise support.",
    members: [
      { id: "u-2", name: "Hari", role: "Campus Lead", email: "hari@smru.in", isOnline: true, attendanceStatus: "PRESENT" },
      { id: "u-3", name: "Janardhan", role: "Support Tech", email: "janardhan@smru.in", isOnline: false, attendanceStatus: "ON_LEAVE" },
      { id: "u-8", name: "Prakash", role: "Network Specialist", email: "prakash@smru.in", isOnline: true, attendanceStatus: "PRESENT" },
      { id: "u-9", name: "Rakesh", role: "Field Tech", email: "rakesh@smru.in", isOnline: true, attendanceStatus: "PRESENT" },
      { id: "u-1", name: "Sri", role: "Admin / Manager", email: "sri@smru.in", isOnline: true, attendanceStatus: "PRESENT" },
    ],
  },
  {
    id: "tm-2",
    name: "Developers",
    slug: "dev-team",
    type: "Dev Team",
    campus: "Central IT",
    leadName: "Sri (IT Manager)",
    memberCount: 3,
    openTasks: 2,
    status: "Core",
    description: "Web application engineering, microservices, API integrations, and Command Center roadmap.",
    members: [
      { id: "u-1", name: "Sri", role: "IT Manager", email: "sri@smru.in", isOnline: true, attendanceStatus: "PRESENT" },
      { id: "u-4", name: "Dev Web", role: "Frontend Lead", email: "dev.web@smru.in", isOnline: true, attendanceStatus: "LATE" },
      { id: "u-5", name: "Dev Backend", role: "Backend Engineer", email: "dev.api@smru.in", isOnline: true, attendanceStatus: "PRESENT" },
    ],
  },
  {
    id: "tm-3",
    name: "UOS Rollout",
    slug: "uos-rollout",
    type: "Implementation",
    campus: "Multi-Campus",
    leadName: "Hari",
    memberCount: 4,
    openTasks: 3,
    status: "In Progress",
    description: "University Operating System rollout across Main Campus and affiliated regional colleges.",
    members: [
      { id: "u-2", name: "Hari", role: "Rollout Lead", email: "hari@smru.in", isOnline: true, attendanceStatus: "PRESENT" },
      { id: "u-1", name: "Sri", role: "Executive Lead", email: "sri@smru.in", isOnline: true, attendanceStatus: "PRESENT" },
      { id: "u-4", name: "Dev Web", role: "Software Integration", email: "dev.web@smru.in", isOnline: true, attendanceStatus: "LATE" },
      { id: "u-10", name: "Ananya", role: "Operations Specialist", email: "ananya@smru.in", isOnline: true, attendanceStatus: "PRESENT" },
    ],
  },
  {
    id: "tm-4",
    name: "Remote Support",
    slug: "remote-support",
    type: "Support",
    campus: "Remote",
    leadName: "Hari",
    memberCount: 2,
    openTasks: 1,
    status: "Remote",
    description: "Tier-1 ticket dispatch, remote assistance, staff onboarding, and device provisioning.",
    members: [
      { id: "u-2", name: "Hari", role: "Support Lead", email: "hari@smru.in", isOnline: true, attendanceStatus: "PRESENT" },
      { id: "u-3", name: "Janardhan", role: "Helpdesk Specialist", email: "janardhan@smru.in", isOnline: false, attendanceStatus: "ON_LEAVE" },
    ],
  },
  {
    id: "tm-5",
    name: "Interns · Web Batch Sep '26",
    slug: "interns-sep-26",
    type: "Interns",
    campus: "SMRU",
    leadName: "Hari",
    memberCount: 3,
    openTasks: 5,
    status: "Training",
    description: "Undergraduate IT interns undergoing practical server rack maintenance and frontend web modules.",
    members: [
      { id: "u-6", name: "Intern Web A", role: "Frontend Intern", email: "intern.a@smru.in", isOnline: true, attendanceStatus: "PRESENT" },
      { id: "u-7", name: "Intern Web B", role: "Backend Intern", email: "intern.b@smru.in", isOnline: false, attendanceStatus: "NOT_IN" },
      { id: "u-2", name: "Hari", role: "Mentor", email: "hari@smru.in", isOnline: true, attendanceStatus: "PRESENT" },
    ],
  },
];

export function getTeamPresence(slugOrId: string): { present: number; total: number } {
  const team = INITIAL_TEAMS.find((t) => t.slug === slugOrId || t.id === slugOrId);
  if (!team) {
    if (slugOrId === "general-announcements") {
      return { present: 14, total: 16 };
    }
    return { present: 0, total: 0 };
  }
  const present = team.members.filter(
    (m) => m.attendanceStatus === "PRESENT" || m.attendanceStatus === "LATE" || m.isOnline
  ).length;
  return { present, total: team.members.length };
}
