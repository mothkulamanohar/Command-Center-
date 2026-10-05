/**
 * Duration parsing and formatting utilities per SPEC §7.4 (F-DUR-01)
 */

export interface ParsedDuration {
  hours: number;
  minutes: number;
  totalMinutes: number;
}

/**
 * Parses user input strings like "30m", "2h", "2h 30m", "1.5h", "3d", "2 days"
 * @param input raw input string
 * @param hoursPerDay hours per working day (default 8 from settings)
 */
export function parseDuration(input: string, hoursPerDay = 8): ParsedDuration | null {
  if (!input || typeof input !== "string") return null;
  const str = input.trim().toLowerCase();

  // Pattern: matches combinations of days, hours, and minutes
  // e.g. "3d", "2 days", "2h 30m", "1.5h", "45m"
  let totalMinutes = 0;
  let matched = false;

  // Day match: (\d+(?:\.\d+)?)\s*(?:d|day|days)
  const dayMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:d|days?)\b/);
  if (dayMatch) {
    const days = parseFloat(dayMatch[1]);
    totalMinutes += Math.round(days * hoursPerDay * 60);
    matched = true;
  }

  // Hour match: (\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours?)\b
  const hourMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:h|hrs?|hours?)\b/);
  if (hourMatch) {
    const hours = parseFloat(hourMatch[1]);
    totalMinutes += Math.round(hours * 60);
    matched = true;
  }

  // Minute match: (\d+)\s*(?:m|min|mins|minutes?)\b
  const minMatch = str.match(/(\d+)\s*(?:m|mins?|minutes?)\b/);
  if (minMatch) {
    const mins = parseInt(minMatch[1], 10);
    totalMinutes += mins;
    matched = true;
  }

  // Decimal hours without unit (e.g. "1.5")
  if (!matched && /^\d+(\.\d+)?$/.test(str)) {
    const val = parseFloat(str);
    totalMinutes = Math.round(val * 60);
    matched = true;
  }

  if (!matched || totalMinutes <= 0 || isNaN(totalMinutes)) {
    return null;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    hours,
    minutes,
    totalMinutes,
  };
}

/**
 * Formats total minutes into human readable "2h 30m", "45m", "3h"
 */
export function formatMinutes(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${mins}m`;
}

/**
 * Formats hours into "Est. 2h 30m"
 */
export function formatEstimateHours(hours: number | null | undefined): string {
  if (hours === null || hours === undefined || isNaN(hours) || hours <= 0) {
    return "";
  }
  const totalMinutes = Math.round(hours * 60);
  return `Est. ${formatMinutes(totalMinutes)}`;
}
