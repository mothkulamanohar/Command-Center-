import { z } from "zod";

export const IntentKeys = [
  "ADD_TASK",
  "ASSIGN_TASK",
  "ASSIGN_WITH_CHASE",
  "APPROVAL_FLAG",
  "SHARED_TASK",
  "PASS_TURN",
  "FOLLOW_UP",
  "MARK_DONE",
  "UPDATE_STATUS",
  "MOVE_DUE",
  "CHANGE_OWNER",
  "SET_PRIORITY",
  "DELETE",
  "COMMENT",
  "QUERY_DAY",
  "QUERY_CHASING",
  "QUERY_STATUS",
  "QUERY_FIND",
  "CREATE_TEAM",
  "CREATE_GROUP",
  "CREATE_CAMPUS",
  "ADD_MEMBER",
  "CREATE_EVENT",
  "POST_UPDATE",
  "MESSAGE",
  "REPORT",
  "OPEN",
  "UNDO",
  "HELP",
] as const;

export type IntentType = typeof IntentKeys[number];

export interface CommandSlots {
  title?: string;
  owner?: string;
  requester?: string;
  requesterName?: string;
  due?: Date | string | null;
  cadence?: "ONCE" | "DAILY" | "EVERY_N_DAYS" | "WEEKLY" | "BEFORE_DUE" | "AFTER_DUE";
  everyNDays?: number;
  needsApproval?: boolean;
  taskRef?: string; // e.g. T-1042
  team?: string;
  status?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  text?: string;
  query?: string;
  channel?: string;
  campus?: string;
  doneNotes?: string;
  nextNotes?: string;
  blockerNotes?: string;
  targetUser?: string;
}

export interface ParseResult {
  intent: IntentType;
  confidence: number;
  slots: CommandSlots;
  preview: string;
}
