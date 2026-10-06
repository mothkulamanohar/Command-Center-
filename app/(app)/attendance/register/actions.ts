"use server";

import { getSessionUser } from "@/lib/auth/session";
import { getMonthlyRegister } from "@/lib/services/attendance";

export async function fetchMonthlyRegisterAction(monthParam: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    let year = new Date().getFullYear();
    let month = new Date().getMonth() + 1;

    if (monthParam && monthParam.includes("-")) {
      const parts = monthParam.split("-");
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
        year = y;
        month = m;
      }
    }

    try {
      const data = await getMonthlyRegister(year, month);
      return { success: true, data };
    } catch {
      const daysInMonth = new Date(year, month, 0).getDate();
      const defaultMembers = [
        { id: "u-1", name: "Sri", role: "IT Manager", team: "Developers", p: 20, l: 1, h: 0, a: 0, lv: 1, att: "96.5%" },
        { id: "u-2", name: "Hari", role: "Lead", team: "SMRU Campus IT", p: 21, l: 0, h: 0, a: 0, lv: 0, att: "100.0%" },
        { id: "u-3", name: "Dev Web", role: "Developer", team: "Developers", p: 19, l: 2, h: 0, a: 0, lv: 1, att: "94.2%" },
        { id: "u-4", name: "Dev Backend", role: "Developer", team: "Developers", p: 20, l: 1, h: 0, a: 0, lv: 0, att: "98.1%" },
        { id: "u-5", name: "Intern Web A", role: "Intern", team: "Interns", p: 18, l: 2, h: 1, a: 0, lv: 0, att: "91.8%" },
        { id: "u-6", name: "Intern Web B", role: "Intern", team: "Interns", p: 17, l: 1, h: 0, a: 1, lv: 1, att: "88.5%" },
      ];
      const people = defaultMembers.map((m) => ({
        ...m,
        days: Array.from({ length: daysInMonth }, (_, idx) => {
          const dayNum = idx + 1;
          const dayOfWeek = new Date(year, month - 1, dayNum).getDay();
          const isSunday = dayOfWeek === 0;
          return {
            day: dayNum,
            code: isSunday ? "WO" : dayNum > 22 ? "—" : "P",
            statusKind: isSunday ? "WEEKLY_OFF" : dayNum > 22 ? "FUTURE" : "PRESENT",
            date: `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`,
          };
        }),
      }));
      return { success: true, data: { daysInMonth, people } };
    }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load monthly register" };
  }
}
