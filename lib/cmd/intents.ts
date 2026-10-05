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
  // v1.1 Intents (SPEC §8.3)
  "ADD_TODO",
  "SCHEDULE_TODO",
  "DONE_TODO",
  "SET_ESTIMATE",
  "START_TIMER",
  "STOP_TIMER",
  "LOG_TIME",
  "CHECK_IN",
  "CHECK_OUT",
  "APPLY_LEAVE",
  "QUERY_ATTENDANCE",
  "GIVE_FEEDBACK",
  "ISSUE_CERTIFICATE",
] as const;

export type IntentType = typeof IntentKeys[number];

export interface CommandSlots {
  title?: string;
  owner?: string;
  requester?: string;
  requesterName?: string;
  due?: Date | string | null;
  start?: Date | string | null; // v1.1
  end?: Date | string | null; // v1.1
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
  durationMinutes?: number | null; // v1.1
  rating?: number | null; // v1.1
  mode?: string | null; // v1.1
}

export interface ParseResult {
  intent: IntentType;
  slots: CommandSlots;
  confidence: number;
  preview?: string;
}
