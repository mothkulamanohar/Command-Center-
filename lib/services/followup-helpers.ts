import { FUCadence } from "@prisma/client";

export function generateFollowUpText(params: {
  template: string;
  targetName: string;
  taskTitle: string;
  dueDateStr?: string;
  overdueDays?: number;
  senderName: string;
  honorific?: string | null;
}): string {
  const { template, targetName, taskTitle, dueDateStr, overdueDays, senderName, honorific } = params;
  const greeting = honorific ? `Dear ${honorific} ${targetName}` : `Hi ${targetName}`;

  if (template === "FIRM" && (overdueDays ?? 0) > 0) {
    return `${greeting}, "${taskTitle}" is now ${overdueDays} days overdue. Please update today or let us know what is blocking it. — sent for ${senderName}`;
  }

  if (template === "NORMAL") {
    return `${greeting}, "${taskTitle}" is due ${dueDateStr || "soon"}. Please share the current status or a new target date. — sent for ${senderName}`;
  }

  // GENTLE default
  return `${greeting}, a quick check on "${taskTitle}" (due ${dueDateStr || "soon"}). Any update? — sent for ${senderName}`;
}

/**
 * Calculate next run time based on cadence
 */
export function calculateNextRun(cadence: FUCadence, everyNDays?: number | null): Date {
  const now = new Date();
  const next = new Date(now);

  switch (cadence) {
    case FUCadence.ONCE:
    case FUCadence.DAILY:
      next.setDate(next.getDate() + 1);
      break;
    case FUCadence.EVERY_N_DAYS:
      next.setDate(next.getDate() + (everyNDays ?? 2));
      break;
    case FUCadence.WEEKLY:
      next.setDate(next.getDate() + 7);
      break;
    default:
      next.setDate(next.getDate() + 1);
      break;
  }

  // Default to 09:30 IST (04:00 UTC)
  next.setUTCHours(4, 0, 0, 0);
  return next;
}
