import { describe, it, expect } from "vitest";
import { calculateAttendanceStatus, calculateAttendancePercent } from "@/lib/services/attendance";
import { AttendanceStatus } from "@prisma/client";

describe("Attendance Status Engine & Percent Formula (F-ATT-03 & F-ATT-12)", () => {
  it("rule 1: marks HOLIDAY when date is holiday", () => {
    const res = calculateAttendanceStatus({
      isHoliday: true,
      isWeekOff: false,
      hasFullDayLeave: false,
      hasHalfDayLeave: false,
      firstInAt: null,
      lastOutAt: null,
      workedMinutes: 0,
    });
    expect(res.status).toBe(AttendanceStatus.HOLIDAY);
  });

  it("rule 2: marks WEEK_OFF when not working day, or PRESENT if extra day check-in", () => {
    const off = calculateAttendanceStatus({
      isHoliday: false,
      isWeekOff: true,
      hasFullDayLeave: false,
      hasHalfDayLeave: false,
      firstInAt: null,
      lastOutAt: null,
      workedMinutes: 0,
    });
    expect(off.status).toBe(AttendanceStatus.WEEK_OFF);

    const extra = calculateAttendanceStatus({
      isHoliday: false,
      isWeekOff: true,
      hasFullDayLeave: false,
      hasHalfDayLeave: false,
      firstInAt: new Date(),
      lastOutAt: null,
      workedMinutes: 120,
    });
    expect(extra.status).toBe(AttendanceStatus.PRESENT);
    expect(extra.extraDay).toBe(true);
  });

  it("rule 3: marks ON_LEAVE when full-day leave approved", () => {
    const res = calculateAttendanceStatus({
      isHoliday: false,
      isWeekOff: false,
      hasFullDayLeave: true,
      hasHalfDayLeave: false,
      firstInAt: null,
      lastOutAt: null,
      workedMinutes: 0,
    });
    expect(res.status).toBe(AttendanceStatus.ON_LEAVE);
  });

  it("rule 4: marks ABSENT when no check-in exists", () => {
    const res = calculateAttendanceStatus({
      isHoliday: false,
      isWeekOff: false,
      hasFullDayLeave: false,
      hasHalfDayLeave: false,
      firstInAt: null,
      lastOutAt: null,
      workedMinutes: 0,
    });
    expect(res.status).toBe(AttendanceStatus.ABSENT);
  });

  it("rule 5: marks PRESENT on on-time check-in and LATE past grace minutes", () => {
    // 09:10 IST on-time
    const onTime = new Date("2026-09-30T03:40:00.000Z"); // 09:10 IST
    const resOnTime = calculateAttendanceStatus({
      isHoliday: false,
      isWeekOff: false,
      hasFullDayLeave: false,
      hasHalfDayLeave: false,
      firstInAt: onTime,
      lastOutAt: null,
      workedMinutes: 480,
    });
    expect(resOnTime.status).toBe(AttendanceStatus.PRESENT);
    expect(resOnTime.lateMinutes).toBe(0);

    // 09:40 IST late (25 mins past 09:15)
    const lateTime = new Date("2026-09-30T04:10:00.000Z"); // 09:40 IST
    const resLate = calculateAttendanceStatus({
      isHoliday: false,
      isWeekOff: false,
      hasFullDayLeave: false,
      hasHalfDayLeave: false,
      firstInAt: lateTime,
      lastOutAt: null,
      workedMinutes: 480,
    });
    expect(resLate.status).toBe(AttendanceStatus.LATE);
    expect(resLate.lateMinutes).toBe(25);
  });

  it("rule 6: marks HALF_DAY if worked minutes < 4h (240m)", () => {
    const inTime = new Date("2026-09-30T03:40:00.000Z");
    const res = calculateAttendanceStatus({
      isHoliday: false,
      isWeekOff: false,
      hasFullDayLeave: false,
      hasHalfDayLeave: false,
      firstInAt: inTime,
      lastOutAt: new Date(),
      workedMinutes: 180, // 3 hours
    });
    expect(res.status).toBe(AttendanceStatus.HALF_DAY);
  });

  it("calculates accurate attendance percentage per F-ATT-12", () => {
    // 25 working days, 2 holidays, 1 leave -> denominator = 22
    // 19 present, 2 late, 1 half day (0.5) -> numerator = 21.5
    // 21.5 / 22 * 100 = 97.7%
    const pct = calculateAttendancePercent({
      present: 19,
      late: 2,
      halfDay: 1,
      workingDaysInPeriod: 25,
      holidays: 2,
      approvedLeaveDays: 1,
    });
    expect(pct).toBe(97.7);
  });
});
