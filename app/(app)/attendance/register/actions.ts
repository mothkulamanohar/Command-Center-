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

    const data = await getMonthlyRegister(year, month);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load monthly register" };
  }
}
