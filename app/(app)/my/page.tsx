import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import MySpaceClient from "./MySpaceClient";
import { startOfDay } from "date-fns";
import { redirect } from "next/navigation";

export default async function MySpacePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const today = startOfDay(new Date());

  let record = null;
  try {
    record = await prisma.attendanceRecord.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
    });
  } catch (err) {
    console.warn("Database offline in MySpacePage:", (err as Error)?.message || err);
  }

  return (
    <Suspense fallback={<div>Loading My Space...</div>}>
      <MySpaceClient record={record} currentUser={user} />
    </Suspense>
  );
}
