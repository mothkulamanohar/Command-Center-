import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { format as dateFnsFormat } from "date-fns";

export const ORG_TIMEZONE = process.env.TZ || "Asia/Kolkata";

/**
 * Format a UTC date string or Date object into Asia/Kolkata timezone
 */
export function formatOrgTime(
  date: Date | string | number,
  formatString: string = "dd MMM yyyy, HH:mm"
): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return formatInTimeZone(d, ORG_TIMEZONE, formatString);
}

/**
 * Get current time in org timezone
 */
export function nowInOrgTime(): Date {
  return toZonedTime(new Date(), ORG_TIMEZONE);
}

/**
 * Format date-only (e.g. 24 Sep 2026)
 */
export function formatOrgDate(date: Date | string | number): string {
  return formatOrgTime(date, "dd MMM yyyy");
}

/**
 * Format time-only (e.g. 18:00)
 */
export function formatOrgTimeOnly(date: Date | string | number): string {
  return formatOrgTime(date, "HH:mm");
}

/**
 * Format notification timestamp into user-friendly localized time
 * E.g., "Today, 11:35 AM" or "01 Oct, 11:35 AM"
 */
export function formatNotificationTime(date?: Date | string | number | null): string {
  if (!date) {
    return `Today, ${formatOrgTime(new Date(), "hh:mm a")}`;
  }
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return `Today, ${formatOrgTime(new Date(), "hh:mm a")}`;
  }

  try {
    const now = new Date();
    const dateStr = formatInTimeZone(d, ORG_TIMEZONE, "yyyy-MM-dd");
    const nowStr = formatInTimeZone(now, ORG_TIMEZONE, "yyyy-MM-dd");
    const timeStr = formatInTimeZone(d, ORG_TIMEZONE, "hh:mm a");

    if (dateStr === nowStr) {
      return `Today, ${timeStr}`;
    }

    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = formatInTimeZone(yesterday, ORG_TIMEZONE, "yyyy-MM-dd");
    if (dateStr === yesterdayStr) {
      return `Yesterday, ${timeStr}`;
    }

    return formatInTimeZone(d, ORG_TIMEZONE, "dd MMM, hh:mm a");
  } catch {
    return formatOrgTime(d, "dd MMM, hh:mm a");
  }
}
