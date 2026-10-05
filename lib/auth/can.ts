import { RoleKey } from "@prisma/client";
import { AppRole } from "./roles";

export type ActionKey =
  | "manage_users"
  | "manage_campuses"
  | "manage_team_types"
  | "create_edit_teams"
  | "manage_team_members"
  | "create_task"
  | "assign_task"
  | "edit_delete_task"
  | "view_task"
  | "create_followup"
  | "approve_followup"
  | "inbox_receive"
  | "chat_create_group"
  | "chat_post"
  | "docs_edit"
  | "dev_hub_edit"
  | "reports_kpi_jpr"
  | "reports_jpa"
  | "jpa_score_enter"
  | "settings_manage"
  | "audit_log_view"
  // Platform Governance (Owner Only)
  | "manage_role_matrix"
  | "system_setup"
  | "danger_zone_actions"
  // v1.1 Actions (SPEC §3.2)
  | "todo_manage"
  | "check_in_out"
  | "view_attendance"
  | "approve_attendance"
  | "edit_any_attendance"
  | "manage_timelog"
  | "view_timesheets"
  | "give_feedback"
  | "view_feedback"
  | "reply_feedback"
  | "manage_cert_templates"
  | "issue_certificates"
  | "view_own_certificates";

export interface UserContext {
  id: string;
  role: AppRole | RoleKey;
  teamIds?: string[];
  ledTeamIds?: string[];
  name?: string | null;
}

export type AuthUser = UserContext;

export interface ResourceContext {
  ownerId?: string;
  creatorId?: string;
  teamId?: string;
  targetUserId?: string;
  isShared?: boolean;
}

/**
 * Authoritative permission check per SPEC §3.2 & Role Matrix
 * - Platform Admin (Owner): Full, unconditional access across all actions including role matrix & setup.
 * - IT Manager: Main operational leader across all tasks, teams, attendance, certificates, reports.
 */
export function can(
  user: UserContext,
  action: ActionKey,
  resource?: ResourceContext
): boolean {
  // Platform Admin (Owner) has supreme access across all features, governance and danger zone
  if (user.role === "PLATFORM_ADMIN") {
    return true;
  }

  // Owner-exclusive actions: Cannot be performed by other roles
  if (action === "manage_role_matrix" || action === "system_setup" || action === "danger_zone_actions") {
    return false;
  }

  // IT Manager (Sri) has full operational authority across Command Center workflows
  if (user.role === "IT_MANAGER" || user.role === RoleKey.ADMIN) {
    return true;
  }

  switch (action) {
    case "manage_users":
    case "manage_campuses":
    case "manage_team_types":
    case "approve_followup":
    case "settings_manage":
    case "audit_log_view":
    case "edit_any_attendance":
    case "manage_cert_templates":
      return false; // Platform Admin & IT Manager only

    case "create_edit_teams":
    case "manage_team_members":
      if (user.role === RoleKey.LEAD) {
        if (!resource?.teamId) return true;
        return (user.ledTeamIds ?? []).includes(resource.teamId);
      }
      return false;

    case "create_task":
      if (user.role === RoleKey.GUEST) return false; // Guest can only create Requests
      return true;

    case "assign_task":
      if (user.role === RoleKey.LEAD || user.role === RoleKey.DEVELOPER || user.role === RoleKey.MEMBER) {
        if (!resource?.teamId) return true;
        return (user.teamIds ?? []).includes(resource.teamId);
      }
      return false;

    case "edit_delete_task":
      if (user.role === RoleKey.LEAD) {
        if (resource?.teamId && (user.ledTeamIds ?? []).includes(resource.teamId)) return true;
        return resource?.ownerId === user.id || resource?.creatorId === user.id;
      }
      return resource?.ownerId === user.id || resource?.creatorId === user.id;

    case "view_task":
      if (user.role === RoleKey.GUEST) {
        return resource?.creatorId === user.id || resource?.ownerId === user.id;
      }
      if (resource?.ownerId === user.id || resource?.creatorId === user.id) return true;
      if (resource?.teamId && (user.teamIds ?? []).includes(resource.teamId)) return true;
      return false;

    case "create_followup":
      if (user.role === RoleKey.LEAD) return true;
      if (user.role === RoleKey.DEVELOPER || user.role === RoleKey.MEMBER) {
        return resource?.ownerId === user.id || resource?.creatorId === user.id;
      }
      return false;

    case "inbox_receive":
      return user.role !== RoleKey.GUEST;

    case "chat_create_group":
      return user.role === RoleKey.LEAD;

    case "chat_post":
      return true;

    case "docs_edit":
      if (user.role === RoleKey.GUEST) return false;
      if (user.role === RoleKey.INTERN) {
        return resource?.ownerId === user.id || resource?.creatorId === user.id;
      }
      return true;

    case "dev_hub_edit":
      return user.role === RoleKey.LEAD || user.role === RoleKey.DEVELOPER;

    case "reports_kpi_jpr":
      if (user.role === RoleKey.LEAD) return true;
      if (user.role === RoleKey.GUEST) return resource?.isShared === true;
      return true;

    case "reports_jpa":
      if (user.role === RoleKey.LEAD) {
        return resource?.targetUserId ? true : false;
      }
      return resource?.targetUserId === user.id;

    case "jpa_score_enter":
      return user.role === RoleKey.LEAD;

    // v1.1 Handlers
    case "todo_manage":
      if (user.role === RoleKey.GUEST) return false;
      if (!resource?.ownerId) return true;
      return resource.ownerId === user.id;

    case "check_in_out":
      return user.role !== RoleKey.GUEST;

    case "view_attendance":
      if (user.role === RoleKey.GUEST) return false;
      if (user.role === RoleKey.LEAD) {
        if (!resource?.targetUserId || resource.targetUserId === user.id) return true;
        if (resource.teamId && (user.ledTeamIds ?? []).includes(resource.teamId)) return true;
        return true;
      }
      if (!resource?.targetUserId) return true;
      return resource.targetUserId === user.id;

    case "approve_attendance":
      return user.role === RoleKey.LEAD;

    case "manage_timelog":
      if (user.role === RoleKey.GUEST) return false;
      if (user.role === RoleKey.LEAD) return true;
      if (!resource?.ownerId) return true;
      return resource.ownerId === user.id;

    case "view_timesheets":
      if (user.role === RoleKey.GUEST) return false;
      if (user.role === RoleKey.LEAD) return true;
      if (!resource?.targetUserId) return true;
      return resource.targetUserId === user.id;

    case "give_feedback":
      return user.role === RoleKey.LEAD;

    case "view_feedback":
      if (user.role === RoleKey.GUEST) return false;
      if (user.role === RoleKey.LEAD) return true;
      if (!resource?.targetUserId) return true;
      return resource.targetUserId === user.id;

    case "reply_feedback":
      if (!resource?.targetUserId) return true;
      return resource.targetUserId === user.id;

    case "issue_certificates":
      return user.role === RoleKey.LEAD; // Leads propose, Admin issues (both have access to function with differing states)

    case "view_own_certificates":
      if (user.role === RoleKey.GUEST) return false;
      if (!resource?.targetUserId) return true;
      return resource.targetUserId === user.id;

    default:
      return false;
  }
}
