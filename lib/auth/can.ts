import { RoleKey } from "@prisma/client";

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
  | "audit_log_view";

export interface UserContext {
  id: string;
  role: RoleKey;
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
 * Authoritative permission check per SPEC §3.2
 * UI hides what can denies, but server is the real guard.
 */
export function can(
  user: UserContext,
  action: ActionKey,
  resource?: ResourceContext
): boolean {
  // Admin has unconditional access to all operations
  if (user.role === RoleKey.ADMIN) {
    return true;
  }

  switch (action) {
    case "manage_users":
    case "manage_campuses":
    case "manage_team_types":
    case "approve_followup":
    case "settings_manage":
    case "audit_log_view":
      return false; // Admin only

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

    default:
      return false;
  }
}
