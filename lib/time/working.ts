import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { addDays, format, getDay, isBefore } from "date-fns";

const TIMEZONE = "Asia/Kolkata";
const WORK_START_HOUR = 9;
const WORK_START_MINUTE = 0;
const WORK_END_HOUR = 18;
const WORK_END_MINUTE = 0;

export interface WorkingTimeOptions {
  holidays?: (string | Date)[]; // 'YYYY-MM-DD' strings or Dates
  leaveDates?: (string | Date)[];
  startHour?: number;
  endHour?: number;
}

function formatDateKey(date: Date): string {
  return format(toZonedTime(date, TIMEZONE), "yyyy-MM-dd");
}

/**
 * Checks if a specific day is a working day (Mon-Sat, not holiday, not leave)
 */
export function isWorkingDay(date: Date, options?: WorkingTimeOptions): boolean {
  const zoned = toZonedTime(date, TIMEZONE);
  const day = getDay(zoned);
  // Sunday = 0, week off
  if (day === 0) return false;

  const key = formatDateKey(date);

  if (options?.holidays) {
    const holidayKeys = options.holidays.map((h) =>
      typeof h === "string" ? h.slice(0, 10) : formatDateKey(h)
    );
    if (holidayKeys.includes(key)) return false;
  }

  if (options?.leaveDates) {
    const leaveKeys = options.leaveDates.map((l) =>
      typeof l === "string" ? l.slice(0, 10) : formatDateKey(l)
    );
    if (leaveKeys.includes(key)) return false;
  }

  return true;
}

/**
 * Calculates actual working hours and working days between two dates.
 * Working window: 09:00 - 18:00 IST (9h window), Monday - Saturday.
 */
export function calculateWorkingTime(
  startDate: Date,
  endDate: Date,
  options?: WorkingTimeOptions
): {
  workingMinutes: number;
  workingHours: number;
  workingDays: number;
} {
  if (isBefore(endDate, startDate)) {
    return { workingMinutes: 0, workingHours: 0, workingDays: 0 };
  }

  const startHour = options?.startHour ?? WORK_START_HOUR;
  const endHour = options?.endHour ?? WORK_END_HOUR;
  const dailyWorkMinutes = (endHour - startHour) * 60;

  let totalMinutes = 0;
  let currentDate = new Date(startDate.getTime());
  const finalDate = new Date(endDate.getTime());

  // Loop day by day in IST
  while (isBefore(currentDate, finalDate) || formatDateKey(currentDate) === formatDateKey(finalDate)) {
    if (isWorkingDay(currentDate, options)) {
      const zonedCurrent = toZonedTime(currentDate, TIMEZONE);
      const isStartDay = formatDateKey(currentDate) === formatDateKey(startDate);
      const isEndDay = formatDateKey(currentDate) === formatDateKey(finalDate);

      // Start boundary for today in IST
      let dayStartMinutes = startHour * 60;
      if (isStartDay) {
        const curMins = zonedCurrent.getHours() * 60 + zonedCurrent.getMinutes();
        dayStartMinutes = Math.max(dayStartMinutes, curMins);
      }

      // End boundary for today in IST
      let dayEndMinutes = endHour * 60;
      if (isEndDay) {
        const zonedEnd = toZonedTime(finalDate, TIMEZONE);
        const endMins = zonedEnd.getHours() * 60 + zonedEnd.getMinutes();
        dayEndMinutes = Math.min(dayEndMinutes, endMins);
      }

      if (dayEndMinutes > dayStartMinutes) {
        totalMinutes += (dayEndMinutes - dayStartMinutes);
      }
    }

    if (formatDateKey(currentDate) === formatDateKey(finalDate)) {
      break;
    }

    // Advance to next day at 00:00 IST
    const nextZoned = addDays(toZonedTime(currentDate, TIMEZONE), 1);
    nextZoned.setHours(0, 0, 0, 0);
    currentDate = fromZonedTime(nextZoned, TIMEZONE);
  }

  const workingHours = Number((totalMinutes / 60).toFixed(1));
  const workingDays = Number((totalMinutes / dailyWorkMinutes).toFixed(1));

  return {
    workingMinutes: totalMinutes,
    workingHours,
    workingDays,
  };
}
