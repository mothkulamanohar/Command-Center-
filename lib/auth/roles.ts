import { RoleKey } from "@prisma/client";

export type AppRole =
  | "PLATFORM_ADMIN"
  | "IT_MANAGER"
  | "LEAD"
  | "DEVELOPER"
  | "MEMBER"
  | "INTERN"
  | "GUEST";

export interface RoleDefinition {
  key: AppRole;
  label: string;
  name: string;
  title: string;
  badge: string;
  color: string;
  badgeBg: string;
  description: string;
  isOwner?: boolean;
}

export const ROLE_DEFINITIONS: Record<AppRole, RoleDefinition> = {
  PLATFORM_ADMIN: {
    key: "PLATFORM_ADMIN",
    label: "Platform Admin (Owner)",
    name: "Platform Admin",
    title: "System Owner",
    badge: "OWNER",
    color: "#A855F7",
    badgeBg: "bg-purple-900/40 text-purple-300 border-purple-700/50",
    description: "Supreme platform owner with full system access, complete role matrix governance, tenant control, system security, audit logs, and destructive permissions.",
    isOwner: true,
  },
  IT_MANAGER: {
    key: "IT_MANAGER",
    label: "IT Manager (Sri)",
    name: "Sri",
    title: "IT Manager",
    badge: "OPERATIONS",
    color: "#3B82F6",
    badgeBg: "bg-blue-900/40 text-blue-300 border-blue-700/50",
    description: "Main operational leader running day-to-day command center workflows: task distribution, daily chase, team assignments, attendance rules, certificates, reports, and approvals.",
  },
  LEAD: {
    key: "LEAD",
    label: "Team Lead (Hari)",
    name: "Hari",
    title: "Campus Lead",
    badge: "LEAD",
    color: "#10B981",
    badgeBg: "bg-emerald-900/40 text-emerald-300 border-emerald-700/50",
    description: "Leads campus or functional teams, delegates tasks, manages team members, and conducts field operations.",
  },
  DEVELOPER: {
    key: "DEVELOPER",
    label: "Developer (Dev Web)",
    name: "Dev Web",
    title: "Frontend Lead",
    badge: "DEV",
    color: "#06B6D4",
    badgeBg: "bg-cyan-900/40 text-cyan-300 border-cyan-700/50",
    description: "Engineers web features, accesses the Dev Hub, handles technical tasks, and logs work time.",
  },
  MEMBER: {
    key: "MEMBER",
    label: "Member (Janardhan)",
    name: "Janardhan",
    title: "Support Tech",
    badge: "MEMBER",
    color: "#64748B",
    badgeBg: "bg-slate-800 text-slate-300 border-slate-700",
    description: "Team member who receives tasks, executes daily duties, checks in attendance, and chats with team.",
  },
  INTERN: {
    key: "INTERN",
    label: "Intern (Intern A)",
    name: "Intern A",
    title: "Web Intern",
    badge: "INTERN",
    color: "#F59E0B",
    badgeBg: "bg-amber-900/40 text-amber-300 border-amber-700/50",
    description: "Intern participant completing designated learning tasks, tracking attendance, and receiving certificates.",
  },
  GUEST: {
    key: "GUEST",
    label: "Guest (VC Office)",
    name: "VC Office",
    title: "Executive Stakeholder",
    badge: "GUEST",
    color: "#EC4899",
    badgeBg: "bg-pink-900/40 text-pink-300 border-pink-700/50",
    description: "Executive leader who submits high-level requests and views one-click KPI / progress reports.",
  },
};

export interface PrivilegeCategory {
  category: string;
  privileges: {
    id: string;
    label: string;
    description: string;
    allowedRoles: AppRole[];
  }[];
}

export const COMPLETE_ROLE_MATRIX: PrivilegeCategory[] = [
  {
    category: "Platform Governance & Ownership",
    privileges: [
      {
        id: "role_matrix_manage",
        label: "Manage Role Matrix & Permissions",
        description: "Configure system-wide privileges, role definitions, and access rules.",
        allowedRoles: ["PLATFORM_ADMIN"],
      },
      {
        id: "system_setup",
        label: "Platform Setup & System Provisioning",
        description: "Initial system bootstrap, environment parameters, database reset.",
        allowedRoles: ["PLATFORM_ADMIN"],
      },
      {
        id: "audit_log_view",
        label: "Audit Log & Security Oversight",
        description: "Inspect immutable audit trails of all system events and authentication logs.",
        allowedRoles: ["PLATFORM_ADMIN", "IT_MANAGER"],
      },
      {
        id: "platform_settings",
        label: "Global Settings & Infrastructure",
        description: "Manage LLM endpoints, storage parameters, security policies.",
        allowedRoles: ["PLATFORM_ADMIN", "IT_MANAGER"],
      },
      {
        id: "danger_zone_actions",
        label: "Destructive / Trash Recovery Actions",
        description: "Purge databases, hard-delete records, restore system snapshots.",
        allowedRoles: ["PLATFORM_ADMIN"],
      },
    ],
  },
  {
    category: "Command Center & Operations",
    privileges: [
      {
        id: "daily_briefings",
        label: "Morning Brief & Operations Broadcast",
        description: "Review and publish morning operational briefing for leadership.",
        allowedRoles: ["PLATFORM_ADMIN", "IT_MANAGER"],
      },
      {
        id: "task_assign_chase",
        label: "Task Assignment & Daily Chase",
        description: "Assign tasks with automated chase workflows to team members.",
        allowedRoles: ["PLATFORM_ADMIN", "IT_MANAGER", "LEAD"],
      },
      {
        id: "inbox_approvals",
        label: "Follow-up & Request Approvals",
        description: "Review, accept, delegate, or decline requests from stakeholders.",
        allowedRoles: ["PLATFORM_ADMIN", "IT_MANAGER", "LEAD"],
      },
      {
        id: "manage_teams",
        label: "Create & Reorganize Teams",
        description: "Establish campus teams, assign team leads, and set team goals.",
        allowedRoles: ["PLATFORM_ADMIN", "IT_MANAGER", "LEAD"],
      },
    ],
  },
  {
    category: "Attendance & Working Protocol",
    privileges: [
      {
        id: "attendance_manage_all",
        label: "Manage Entire Attendance Register",
        description: "View full organization attendance register, export CSV, set grace periods.",
        allowedRoles: ["PLATFORM_ADMIN", "IT_MANAGER"],
      },
      {
        id: "approve_attendance_regularization",
        label: "Approve Attendance & Leave Requests",
        description: "Review and grant biometric/location override requests and leaves.",
        allowedRoles: ["PLATFORM_ADMIN", "IT_MANAGER", "LEAD"],
      },
      {
        id: "check_in_out",
        label: "Daily Check-in & Mode Selection",
        description: "Check in with Office, Campus, Remote, or Field verification.",
        allowedRoles: ["PLATFORM_ADMIN", "IT_MANAGER", "LEAD", "DEVELOPER", "MEMBER", "INTERN"],
      },
    ],
  },
  {
    category: "Quality, Evaluation & Certificates",
    privileges: [
      {
        id: "manage_cert_templates",
        label: "Configure Certificate Templates",
        description: "Design and approve university certificate formats and QR verification rules.",
        allowedRoles: ["PLATFORM_ADMIN", "IT_MANAGER"],
      },
      {
        id: "issue_certificates",
        label: "Issue Verifiable Certificates",
        description: "Officially issue certificates to interns and developers.",
        allowedRoles: ["PLATFORM_ADMIN", "IT_MANAGER"],
      },
      {
        id: "give_task_feedback",
        label: "Provide Star Ratings & Feedback",
        description: "Review completed tasks and submit feedback with star ratings.",
        allowedRoles: ["PLATFORM_ADMIN", "IT_MANAGER", "LEAD"],
      },
      {
        id: "view_kpi_jpr_reports",
        label: "Generate One-Click Executive Reports",
        description: "Produce weekly KPI, JPA, and JPR report packs for leadership.",
        allowedRoles: ["PLATFORM_ADMIN", "IT_MANAGER", "LEAD", "GUEST"],
      },
    ],
  },
  {
    category: "Technical & Developer Collaboration",
    privileges: [
      {
        id: "dev_hub_edit",
        label: "Dev Hub & Architecture Blueprint",
        description: "Manage microservices, repository endpoints, and release pipelines.",
        allowedRoles: ["PLATFORM_ADMIN", "IT_MANAGER", "LEAD", "DEVELOPER"],
      },
      {
        id: "chat_create_channels",
        label: "Create Public & Team Channels",
        description: "Spin up team discussions and announcement channels.",
        allowedRoles: ["PLATFORM_ADMIN", "IT_MANAGER", "LEAD"],
      },
      {
        id: "chat_post_kudos",
        label: "Participate in Chat & Kudos",
        description: "Post messages, share links, and grant peer recognition.",
        allowedRoles: ["PLATFORM_ADMIN", "IT_MANAGER", "LEAD", "DEVELOPER", "MEMBER", "INTERN", "GUEST"],
      },
    ],
  },
];
