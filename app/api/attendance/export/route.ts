import { NextResponse } from "next/server";
import { getMonthlyRegister } from "@/lib/services/attendance";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const monthParam = url.searchParams.get("month") || ""; // Format: "YYYY-MM"
    
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

    const { daysInMonth, people } = await getMonthlyRegister(year, month);

    const monthStr = `${year}-${String(month).padStart(2, "0")}`;
    const fileName = `IT_Attendance_All_${monthStr}.csv`;

    // Build day columns
    const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => `Day_${i + 1}`).join(",");
    let csv = `Name,Role,Team,Present,Late,HalfDay,Absent,Leave,AttendancePct,${dayHeaders}\n`;

    for (const p of people) {
      const escapedName = `"${p.name.replace(/"/g, '""')}"`;
      const escapedRole = `"${p.role.replace(/"/g, '""')}"`;
      const escapedTeam = `"${p.team.replace(/"/g, '""')}"`;
      const dayCodes = p.days.map((d) => `"${d.code}"`).join(",");
      csv += `${escapedName},${escapedRole},${escapedTeam},${p.p},${p.l},${p.h},${p.a},${p.lv},"${p.att}",${dayCodes}\n`;
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate attendance CSV" },
      { status: 500 }
    );
  }
}
