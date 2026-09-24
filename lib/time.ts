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
