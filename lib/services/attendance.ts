import { z } from "zod";
import { db } from "@/lib/db";
import { can, UserContext } from "@/lib/auth/can";
import { logAudit } from "@/lib/services/audit";
import { AttendanceStatus, WorkMode, ApprovalState, Prisma } from "@prisma/client";
import { isWithinGeofence } from "@/lib/geo/haversine";
import { isIpInRanges } from "@/lib/geo/ip";
import { startOfDay, endOfDay, format, getDay, isBefore } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TIMEZONE = "Asia/Kolkata";

export const CheckInSchema = z.object({
  mode: z.nativeEnum(WorkMode).default(WorkMode.OFFICE),
  campusId: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  ip: z.string().optional(),
});

export const CheckOutSchema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
  ip: z.string().optional(),
});

export const RegularizationSchema = z.object({
  date: z.date(),
  reqInAt: z.date().optional(),
  reqOutAt: z.date().optional(),
  reqMode: z.nativeEnum(WorkMode).default(WorkMode.OFFICE),
  reason: z.string().min(3).max(500),
});

/**
 * Calculates status per SPEC §10.5 rules
 */
export function calculateAttendanceStatus(params: {
  isHoliday: boolean;
  isWeekOff: boolean;
  hasFullDayLeave: boolean;
  hasHalfDayLeave: boolean;
  firstInAt: Date | null;
  lastOutAt: Date | null;
  workedMinutes: number;
  officeStartHour?: number;
  graceMinutes?: number;
  halfDayMinutes?: number;
}): { status: AttendanceStatus; lateMinutes: number; extraDay: boolean } {
  const {
    isHoliday,
    isWeekOff,
    hasFullDayLeave,
    hasHalfDayLeave,
    firstInAt,
    workedMinutes,
    officeStartHour = 9,
    graceMinutes = 15,
    halfDayMinutes = 240,
  } = params;

  if (isHoliday) {
    return { status: AttendanceStatus.HOLIDAY, lateMinutes: 0, extraDay: false };
  }
  if (isWeekOff) {
    if (firstInAt) {
      return { status: AttendanceStatus.PRESENT, lateMinutes: 0, extraDay: true };
    }
    return { status: AttendanceStatus.WEEK_OFF, lateMinutes: 0, extraDay: false };
  }
  if (hasFullDayLeave) {
    return { status: AttendanceStatus.ON_LEAVE, lateMinutes: 0, extraDay: false };
  }
  if (!firstInAt) {
    return { status: AttendanceStatus.ABSENT, lateMinutes: 0, extraDay: false };
  }

  // Check late arrival
  const inZoned = toZonedTime(firstInAt, TIMEZONE);
  const cutoffMinutes = officeStartHour * 60 + graceMinutes;
  const inMinutes = inZoned.getHours() * 60 + inZoned.getMinutes();
  const lateMinutes = Math.max(0, inMinutes - cutoffMinutes);

  let status: AttendanceStatus = lateMinutes > 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

  // Half day checks
  if (hasHalfDayLeave) {
    status = AttendanceStatus.HALF_DAY;
  } else if (workedMinutes > 0 && workedMinutes < halfDayMinutes) {
    status = AttendanceStatus.HALF_DAY;
  }

  return { status, lateMinutes, extraDay: false };
}

/**
 * F-ATT-12: Attendance % formula
 * (Present + Late + 0.5 * Half_day) / (working days in period - holidays - approved leave) * 100
 */
export function calculateAttendancePercent(counts: {
  present: number;
  late: number;
  halfDay: number;
  workingDaysInPeriod: number;
  holidays: number;
  approvedLeaveDays: number;
}): number {
  const denominator = counts.workingDaysInPeriod - counts.holidays - counts.approvedLeaveDays;
  if (denominator <= 0) return 100.0;

  const numerator = counts.present + counts.late + 0.5 * counts.halfDay;
  const pct = (numerator / denominator) * 100;
  return Number(Math.min(100, Math.max(0, pct)).toFixed(1));
}

/**
 * F-ATT-01 & 02: Check-in with verification
 */
export async function checkIn(actor: UserContext, input: z.input<typeof CheckInSchema>) {
  if (!can(actor, "check_in_out")) {
    throw new Error("Unauthorized to check in");
  }

  const data = CheckInSchema.parse(input);
  const now = new Date();
  const today = startOfDay(now);

  const user = await db.user.findUnique({
    where: { id: actor.id },
    include: { campus: true },
  });
  if (!user) throw new Error("User not found");

  // Determine Campus
  const campus = data.campusId
    ? await db.campus.findUnique({ where: { id: data.campusId } })
    : user.campus;

  // Verification checks
  let verified = true;
  let verifyNote: string | null = null;

  if (data.mode === WorkMode.REMOTE) {
    if (!user.remoteAllowed) {
      verified = false;
      verifyNote = "Remote attendance not authorized";
    }
  } else if (data.mode === WorkMode.OFFICE || data.mode === WorkMode.CAMPUS) {
    let locOk = true;
    let ipOk = true;

    if (campus?.lat != null && campus?.lng != null && data.lat != null && data.lng != null) {
      const geo = isWithinGeofence(data.lat, data.lng, campus.lat, campus.lng, campus.radiusM || 200);
      if (!geo.within) {
        locOk = false;
        verifyNote = `Outside ${campus.radiusM || 200}m geofence (${geo.distanceMetres}m)`;
      }
    }

    if (campus?.officeIps && campus.officeIps.length > 0 && data.ip) {
      ipOk = isIpInRanges(data.ip, campus.officeIps);
      if (!ipOk) {
        verifyNote = verifyNote ? `${verifyNote}; IP not in office range` : "IP not in office range";
      }
    }

    verified = locOk && ipOk;
  }

  const existingRecord = await db.attendanceRecord.findUnique({
    where: { userId_date: { userId: actor.id, date: today } },
  });

  const sessionEntry = {
    in: now.toISOString(),
    inLat: data.lat || null,
    inLng: data.lng || null,
    inIp: data.ip || null,
  };

  const sessions = existingRecord ? [...((existingRecord.sessions as any[]) || []), sessionEntry] : [sessionEntry];
  const firstInAt = existingRecord?.firstInAt || now;

  const zoned = toZonedTime(now, TIMEZONE);
  const isSunday = getDay(zoned) === 0;

  const { status, lateMinutes, extraDay } = calculateAttendanceStatus({
    isHoliday: false,
    isWeekOff: isSunday,
    hasFullDayLeave: false,
    hasHalfDayLeave: false,
    firstInAt,
    lastOutAt: null,
    workedMinutes: existingRecord?.workedMinutes || 0,
  });

  return await db.attendanceRecord.upsert({
    where: { userId_date: { userId: actor.id, date: today } },
    update: {
      sessions,
      lastOutAt: null,
      status,
      lateMinutes,
      extraDay,
      mode: data.mode,
      campusId: campus?.id || null,
      verified,
      verifyNote,
    },
    create: {
      userId: actor.id,
      date: today,
      firstInAt,
      sessions,
      status,
      lateMinutes,
      extraDay,
      mode: data.mode,
      campusId: campus?.id || null,
      verified,
      verifyNote,
    },
  });
}

/**
 * F-ATT-01: Check-out
 */
export async function checkOut(actor: UserContext, input: z.input<typeof CheckOutSchema>) {
  if (!can(actor, "check_in_out")) {
    throw new Error("Unauthorized to check out");
  }

  const now = new Date();
  const today = startOfDay(now);

  const record = await db.attendanceRecord.findUnique({
    where: { userId_date: { userId: actor.id, date: today } },
  });
  if (!record || !record.firstInAt) throw new Error("No check-in record found for today");

  const sessions = [...((record.sessions as any[]) || [])];
  if (sessions.length > 0) {
    const lastSession = sessions[sessions.length - 1];
    if (!lastSession.out) {
      lastSession.out = now.toISOString();
      lastSession.outLat = input.lat || null;
      lastSession.outLng = input.lng || null;
      lastSession.outIp = input.ip || null;
    }
  }

  // Sum total worked minutes across all closed sessions
  let totalWorked = 0;
  for (const s of sessions) {
    if (s.in && s.out) {
      const diff = Math.max(0, Math.round((new Date(s.out).getTime() - new Date(s.in).getTime()) / 60000));
      totalWorked += diff;
    }
  }

  const zoned = toZonedTime(now, TIMEZONE);
  const isSunday = getDay(zoned) === 0;

  const { status, lateMinutes, extraDay } = calculateAttendanceStatus({
    isHoliday: false,
    isWeekOff: isSunday,
    hasFullDayLeave: false,
    hasHalfDayLeave: false,
    firstInAt: record.firstInAt,
    lastOutAt: now,
    workedMinutes: totalWorked,
  });

  return await db.attendanceRecord.update({
    where: { id: record.id },
    data: {
      lastOutAt: now,
      sessions,
      workedMinutes: totalWorked,
      status,
      lateMinutes,
      extraDay,
    },
  });
}

/**
 * F-ATT-08: Today's board for Admin / Leads
 */
export async function getTodayAttendanceBoard(actor: UserContext, teamId?: string) {
  const today = startOfDay(new Date());

  const users = await db.user.findMany({
    where: {
      active: true,
      trackAttendance: true,
      role: { not: "GUEST" },
      ...(teamId ? { memberships: { some: { teamId } } } : {}),
    },
    include: {
      campus: true,
      memberships: { include: { team: true } },
    },
    orderBy: { name: "asc" },
  });

  const records = await db.attendanceRecord.findMany({
    where: { date: today },
  });

  const recordMap = new Map(records.map((r) => [r.userId, r]));

  const inList: any[] = [];
  const lateList: any[] = [];
  const remoteList: any[] = [];
  const notYetList: any[] = [];

  for (const user of users) {
    const rec = recordMap.get(user.id);
    const item = { user, record: rec || null };

    if (!rec || !rec.firstInAt) {
      notYetList.push(item);
    } else if (rec.mode === WorkMode.REMOTE) {
      remoteList.push(item);
    } else if (rec.status === AttendanceStatus.LATE) {
      lateList.push(item);
    } else {
      inList.push(item);
    }
  }

  return {
    inCount: inList.length,
    lateCount: lateList.length,
    remoteCount: remoteList.length,
    notYetCount: notYetList.length,
    inList,
    lateList,
    remoteList,
    notYetList,
  };
}

/**
 * F-ATT-05: Request Regularization
 */
export async function requestRegularization(actor: UserContext, input: z.input<typeof RegularizationSchema>) {
  const data = RegularizationSchema.parse(input);

  return await db.attendanceRegularization.create({
    data: {
      userId: actor.id,
      date: data.date,
      reqInAt: data.reqInAt,
      reqOutAt: data.reqOutAt,
      reqMode: data.reqMode,
      reason: data.reason,
      state: ApprovalState.PENDING,
    },
  });
}

/**
 * F-ATT-05: Decide Regularization
 */
export async function decideRegularization(
  actor: UserContext,
  regId: string,
  state: ApprovalState,
  reviewNote?: string
) {
  if (!can(actor, "approve_attendance")) {
    throw new Error("Unauthorized to approve regularisation");
  }

  const reg = await db.attendanceRegularization.findUnique({ where: { id: regId } });
  if (!reg) throw new Error("Regularization not found");

  return await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const updated = await tx.attendanceRegularization.update({
      where: { id: regId },
      data: {
        state,
        reviewerId: actor.id,
        reviewNote,
        reviewedAt: new Date(),
      },
    });

    if (state === ApprovalState.APPROVED) {
      const workedMins = reg.reqInAt && reg.reqOutAt
        ? Math.max(0, Math.round((reg.reqOutAt.getTime() - reg.reqInAt.getTime()) / 60000))
        : 480;

      await tx.attendanceRecord.upsert({
        where: { userId_date: { userId: reg.userId, date: reg.date } },
        update: {
          firstInAt: reg.reqInAt,
          lastOutAt: reg.reqOutAt,
          workedMinutes: workedMins,
          status: AttendanceStatus.PRESENT,
          source: "REGULARISED",
          verified: true,
          mode: reg.reqMode,
        },
        create: {
          userId: reg.userId,
          date: reg.date,
          firstInAt: reg.reqInAt,
          lastOutAt: reg.reqOutAt,
          workedMinutes: workedMins,
          status: AttendanceStatus.PRESENT,
          source: "REGULARISED",
          verified: true,
          mode: reg.reqMode,
        },
      });
    }

    return updated;
  });
}

/**
 * F-ATT-09: Monthly Attendance Register computation
 */
export async function getMonthlyRegister(year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59));

  const users = await db.user.findMany({
    where: { active: true, trackAttendance: true, role: { not: "GUEST" } },
    include: { memberships: { include: { team: true } } },
    orderBy: { name: "asc" },
  });

  const records = await db.attendanceRecord.findMany({
    where: {
      date: { gte: monthStart, lte: monthEnd },
    },
  });

  const holidays = await db.holiday.findMany({
    where: {
      date: { gte: monthStart, lte: monthEnd },
    },
  });
  const holidayDateSet = new Set(holidays.map((h) => format(h.date, "yyyy-MM-dd")));

  const leaves = await db.leave.findMany({
    where: {
      state: ApprovalState.APPROVED,
      OR: [
        { from: { lte: monthEnd }, to: { gte: monthStart } },
      ],
    },
  });

  const recordMap = new Map(
    records.map((r) => [`${r.userId}_${format(r.date, "yyyy-MM-dd")}`, r])
  );

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const people = users.map((user) => {
    let p = 0;
    let l = 0;
    let h = 0;
    let a = 0;
    let lv = 0;
    let workingDaysCount = 0;
    let holidaysCount = 0;
    let approvedLeaveDays = 0;

    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(Date.UTC(year, month - 1, day));
      const dateStr = format(dayDate, "yyyy-MM-dd");
      const isSunday = dayDate.getUTCDay() === 0;
      const isHoliday = holidayDateSet.has(dateStr);
      const isFuture = dateStr > todayStr;

      const hasLeave = leaves.some(
        (lev) =>
          lev.userId === user.id &&
          format(lev.from, "yyyy-MM-dd") <= dateStr &&
          format(lev.to, "yyyy-MM-dd") >= dateStr
      );

      const rec = recordMap.get(`${user.id}_${dateStr}`);

      let code = "—";
      let statusKind = "NONE";

      if (isSunday) {
        code = "WO";
        statusKind = "WO";
      } else if (isHoliday) {
        code = "H";
        statusKind = "HOLIDAY";
        holidaysCount++;
      } else if (hasLeave) {
        code = "LV";
        statusKind = "LEAVE";
        lv++;
        approvedLeaveDays++;
        workingDaysCount++;
      } else if (rec) {
        workingDaysCount++;
        if (rec.status === AttendanceStatus.PRESENT) {
          code = "P";
          statusKind = "PRESENT";
          p++;
        } else if (rec.status === AttendanceStatus.LATE) {
          code = "L";
          statusKind = "LATE";
          l++;
        } else if (rec.status === AttendanceStatus.HALF_DAY) {
          code = "H";
          statusKind = "HALF_DAY";
          h++;
        } else if (rec.status === AttendanceStatus.ON_LEAVE) {
          code = "LV";
          statusKind = "LEAVE";
          lv++;
          approvedLeaveDays++;
        } else if (rec.status === AttendanceStatus.WEEK_OFF) {
          code = "WO";
          statusKind = "WO";
        } else {
          code = "A";
          statusKind = "ABSENT";
          a++;
        }
      } else if (!isFuture) {
        workingDaysCount++;
        code = "A";
        statusKind = "ABSENT";
        a++;
      }

      days.push({ day, code, statusKind, date: dateStr });
    }

    const attPct = calculateAttendancePercent({
      present: p,
      late: l,
      halfDay: h,
      workingDaysInPeriod: Math.max(1, workingDaysCount),
      holidays: holidaysCount,
      approvedLeaveDays,
    });

    const teamName = user.memberships[0]?.team?.name || "General";

    return {
      id: user.id,
      name: user.name,
      role: user.role,
      team: teamName,
      days,
      p,
      l,
      h,
      a,
      lv,
      att: `${attPct}%`,
    };
  });

  return { daysInMonth, people };
}
