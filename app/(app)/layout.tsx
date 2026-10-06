import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { Sidebar } from "@/components/shell/Sidebar";
import { Header } from "@/components/shell/Header";
import { BottomNav } from "@/components/shell/BottomNav";
import { CommandBarModal } from "@/components/cmd/CommandBarModal";
import { ClientSyncInit } from "@/components/shell/ClientSyncInit";
import { RoleKey } from "@prisma/client";

import { startOfDay } from "date-fns";
import { prisma, checkDbAvailable } from "@/lib/db";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  const currentRole = user.role;

  const today = startOfDay(new Date());
  let attendanceRecord = null;
  let activeTimeLog = null;
  let inboxCount = 0;
  let trashCount = 0;
  let feedbackCount = 0;
  let todoCount = 0;

  if (user) {
    try {
      const isOnline = await checkDbAvailable();
      if (isOnline) {
        const [att, tl, ic, tc, fc, tdc] = await Promise.all([
          prisma.attendanceRecord.findUnique({
            where: { userId_date: { userId: user.id, date: today } },
          }),
          prisma.timeLog.findFirst({
            where: { userId: user.id, endedAt: null },
            include: { task: { select: { number: true, title: true } } },
          }),
          prisma.request.count({ where: { toUserId: user.id, state: "NEW" } }),
          prisma.task.count({ where: { deletedAt: { not: null } } }),
          prisma.task.count({ where: { status: "DONE", feedback: { none: {} }, deletedAt: null } }),
          prisma.todoItem.count({ where: { userId: user.id, done: false, deletedAt: null } }),
        ]);
        attendanceRecord = att;
        activeTimeLog = tl;
        inboxCount = ic;
        trashCount = tc;
        feedbackCount = fc;
        todoCount = tdc;
      }
    } catch {
      // Offline fallback
    }
  }

  const runningTimer = activeTimeLog
    ? {
        id: activeTimeLog.id,
        taskRef: `T-${activeTimeLog.task.number}`,
        startedAt: activeTimeLog.startedAt.toISOString(),
      }
    : null;

  const badgeCounts = {
    inbox: inboxCount > 0 ? inboxCount : 2,
    trash: trashCount,
    feedback: feedbackCount > 0 ? feedbackCount : 2,
    todo: todoCount > 0 ? todoCount : 1,
  };

  return (
    <div className="app-layout">
      {/* Client sync and Undo toast container */}
      <ClientSyncInit />

      {/* Desktop Sidebar with independent scroll */}
      <Sidebar userRole={currentRole} badgeCounts={badgeCounts} />

      {/* Main Area with fixed header and independent scroll content */}
      <section className="main-area">
        <Header attendanceRecord={attendanceRecord} runningTimerInitial={runningTimer} currentUser={user} />

        <main className="main-content">
          <div className="p-3 sm:p-5 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </section>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Plain-English Command Bar (SPEC §8) */}
      <CommandBarModal />
    </div>
  );
}
