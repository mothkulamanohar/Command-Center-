import * as chrono from "chrono-node";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { addDays, setHours, setMinutes, setSeconds, setMilliseconds, nextMonday, nextSaturday, lastDayOfMonth, isPast } from "date-fns";
import { ORG_TIMEZONE } from "@/lib/time";

/**
 * House rules date parser per SPEC §8.4
 * Timezone: Asia/Kolkata
 * Default due time: 18:00 IST
 */
export function parseDateExpression(
  text: string,
  referenceDate: Date = new Date()
): { date: Date | null; raw: string } {
  const zonedRef = toZonedTime(referenceDate, ORG_TIMEZONE);
  const lower = text.toLowerCase().trim();

  // Custom regex house rules
  // 1. "today" or "tonight"
  if (lower === "today") {
    const d = setMilliseconds(setSeconds(setMinutes(setHours(zonedRef, 18), 0), 0), 0);
    return { date: fromZonedTime(d, ORG_TIMEZONE), raw: text };
  }
  if (lower === "tonight") {
    const d = setMilliseconds(setSeconds(setMinutes(setHours(zonedRef, 20), 0), 0), 0);
    return { date: fromZonedTime(d, ORG_TIMEZONE), raw: text };
  }

  // 2. "tomorrow"
  if (lower === "tomorrow") {
    const d = addDays(zonedRef, 1);
    const withTime = setMilliseconds(setSeconds(setMinutes(setHours(d, 18), 0), 0), 0);
    return { date: fromZonedTime(withTime, ORG_TIMEZONE), raw: text };
  }

  // 3. "next week" -> next Monday 18:00
  if (lower === "next week") {
    const d = nextMonday(zonedRef);
    const withTime = setMilliseconds(setSeconds(setMinutes(setHours(d, 18), 0), 0), 0);
    return { date: fromZonedTime(withTime, ORG_TIMEZONE), raw: text };
  }

  // 4. "end of week" -> this Saturday 18:00 (working week Mon-Sat)
  if (lower === "end of week" || lower === "end of the week") {
    const d = nextSaturday(zonedRef);
    const withTime = setMilliseconds(setSeconds(setMinutes(setHours(d, 18), 0), 0), 0);
    return { date: fromZonedTime(withTime, ORG_TIMEZONE), raw: text };
  }

  // 5. "end of month" -> last working day 18:00
  if (lower === "end of month" || lower === "end of the month") {
    const d = lastDayOfMonth(zonedRef);
    const withTime = setMilliseconds(setSeconds(setMinutes(setHours(d, 18), 0), 0), 0);
    return { date: fromZonedTime(withTime, ORG_TIMEZONE), raw: text };
  }

  // 6. "in N days"
  const inNDaysMatch = lower.match(/^in\s+(\d+)\s+days?$/);
  if (inNDaysMatch && inNDaysMatch[1]) {
    const days = parseInt(inNDaysMatch[1], 10);
    const d = addDays(zonedRef, days);
    const withTime = setMilliseconds(setSeconds(setMinutes(setHours(d, 18), 0), 0), 0);
    return { date: fromZonedTime(withTime, ORG_TIMEZONE), raw: text };
  }

  // 7. Indian date formats: DD/MM or DD/MM/YYYY e.g. 26/9 or 26/09/2026
  const ddmmMatch = lower.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (ddmmMatch && ddmmMatch[1] && ddmmMatch[2]) {
    const day = parseInt(ddmmMatch[1], 10);
    const month = parseInt(ddmmMatch[2], 10) - 1;
    const year = ddmmMatch[3] ? parseInt(ddmmMatch[3], 10) : zonedRef.getFullYear();
    const d = new Date(year, month, day, 18, 0, 0, 0);
    return { date: fromZonedTime(d, ORG_TIMEZONE), raw: text };
  }

  // 8. Chrono-node general fallback (en-GB handles DD/MM ordering)
  const parsed = chrono.en.GB.parse(text, {
    instant: zonedRef,
    timezone: "IST",
  });

  if (parsed.length > 0 && parsed[0]) {
    const first = parsed[0];
    const dateComp = first.start;
    let hour = dateComp.get("hour");
    let minute = dateComp.get("minute");

    // Default to 18:00 if no specific time was mentioned
    if (hour === null) {
      hour = 18;
      minute = 0;
    } else if (minute === null) {
      minute = 0;
    }

    const year = dateComp.get("year") ?? zonedRef.getFullYear();
    const month = (dateComp.get("month") ?? 1) - 1;
    const day = dateComp.get("day") ?? zonedRef.getDate();

    const d = new Date(year, month, day, hour, minute, 0, 0);
    return {
      date: fromZonedTime(d, ORG_TIMEZONE),
      raw: first.text,
    };
  }

  return { date: null, raw: text };
}
