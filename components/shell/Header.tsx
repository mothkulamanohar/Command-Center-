"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  Bell,
  Command,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Send,
  User,
  Settings,
  ShieldAlert,
  LogOut,
  X,
  ExternalLink,
  Clock,
  Square,
  CheckSquare,
  LogIn,
  Menu,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatNotificationTime } from "@/lib/time";
import {
  stopRunningTimerAction,
  getHeaderNotificationsAction,
  markAllHeaderNotificationsReadAction,
  markSingleNotificationReadAction,
} from "./actions";
import { io } from "socket.io-client";
import { toast } from "sonner";

interface NotificationItem {
  id: string;
  title: string;
  time: string;
  timestamp?: number;
  read: boolean;
  type?: "task" | "followup" | "system" | "attendance" | "feedback" | string;
  link: string;
}

export function Header({
  attendanceRecord,
  runningTimerInitial,
  currentUser,
}: {
  attendanceRecord?: any;
  runningTimerInitial?: { id: string; taskRef: string; startedAt: string } | null;
  currentUser?: any;
}) {
  const router = useRouter();
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const isCheckedIn = attendanceRecord?.lastOutAt === null && attendanceRecord?.firstInAt != null;
  const checkInTime = attendanceRecord?.firstInAt ? new Date(attendanceRecord.firstInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";
  const checkOutTime = attendanceRecord?.lastOutAt ? new Date(attendanceRecord.lastOutAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";

  // Dynamic attendance nudge if not checked in past 09:15 AM
  const now = new Date();
  const isPastCheckInGrace = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() >= 15);
  const showAttendanceNudge = !isCheckedIn && isPastCheckInGrace;

  useEffect(() => {
    getHeaderNotificationsAction().then((res) => {
      if (res.success && res.data) {
        setNotifications(res.data as NotificationItem[]);
      }
    });

    const handleNotifsUpdate = () => {
      getHeaderNotificationsAction().then((res) => {
        if (res.success && res.data) {
          setNotifications(res.data as NotificationItem[]);
        }
      });
    };
    window.addEventListener("icc-notifications-updated", handleNotifsUpdate);

    // Socket.IO real-time notification listener
    let socket: any = null;
    try {
      socket = io({
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      if (currentUser?.id) {
        socket.emit("join", `user:${currentUser.id}`);
      }

      socket.on("notification:new", (newNotif: any) => {
        if (!newNotif) return;
        setNotifications((prev) => [
          {
            id: newNotif.id,
            title: newNotif.title,
            time: "Just now",
            timestamp: Date.now(),
            read: false,
            type: newNotif.type || "system",
            link: newNotif.url || "/notifications",
          },
          ...prev,
        ]);
        toast.info(newNotif.title);
      });
    } catch (e) {
      console.warn("Socket notification listener deferred:", e);
    }

    // 12-second heartbeat polling fallback for notifications
    const pollInterval = setInterval(() => {
      getHeaderNotificationsAction().then((res) => {
        if (res.success && res.data) {
          setNotifications(res.data as NotificationItem[]);
        }
      });
    }, 12000);

    return () => {
      clearInterval(pollInterval);
      if (socket) socket.disconnect();
      window.removeEventListener("icc-notifications-updated", handleNotifsUpdate);
    };
  }, [currentUser?.id]);

  // Real running timer from database TimeLog
  const [runningTimer, setRunningTimer] = useState<{
    id: string;
    taskRef: string;
    seconds: number;
  } | null>(() => {
    if (!runningTimerInitial) return null;
    const elapsed = Math.max(
      0,
      Math.floor((Date.now() - new Date(runningTimerInitial.startedAt).getTime()) / 1000)
    );
    return {
      id: runningTimerInitial.id,
      taskRef: runningTimerInitial.taskRef,
      seconds: elapsed,
    };
  });

  const addMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Timer ticker
  useEffect(() => {
    if (!runningTimer) return;
    const interval = setInterval(() => {
      setRunningTimer((prev) => (prev ? { ...prev, seconds: prev.seconds + 1 } : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [runningTimer]);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setIsAddMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const openCommandBar = (initialQuery?: string) => {
    window.dispatchEvent(
      new CustomEvent("open-command-bar", { detail: { query: initialQuery } })
    );
    setIsAddMenuOpen(false);
  };

  const markAllNotifsRead = async () => {
    await markAllHeaderNotificationsReadAction();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const stopTimer = async () => {
    if (runningTimer) {
      await stopRunningTimerAction(runningTimer.id);
      setRunningTimer(null);
    }
  };

  const formatTimerSeconds = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h > 0 ? `${h}:` : ""}${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const userName = currentUser?.name || "Sri";
  const userInitials = (currentUser?.name || "SR").slice(0, 2).toUpperCase();
  const userRole = currentUser?.title || currentUser?.role || "IT Manager";

  return (
    <header className="top-header h-16 bg-surface border-b border-line px-3 sm:px-4 md:px-8 flex items-center justify-between z-20 shrink-0 gap-2 sm:gap-4">
      {/* Mobile Drawer Hamburger Trigger */}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent("open-mobile-sidebar"))}
        className="p-1.5 -ml-1 text-ink hover:bg-ground rounded-control md:hidden transition-colors cursor-pointer shrink-0"
        aria-label="Open mobile navigation menu"
      >
        <Menu className="h-5 w-5 text-ink" />
      </button>

      {/* Command Bar Search Trigger (F-CMD) */}
      <div className="flex-1 max-w-lg min-w-0">
        <button
          type="button"
          onClick={() => openCommandBar()}
          className="w-full flex items-center justify-between px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-ground border border-line rounded-control text-xs text-mutedText hover:border-primary/50 hover:bg-surface transition-all shadow-xs cursor-pointer min-w-0"
          aria-label="Open command bar"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
            <Search className="h-4 w-4 text-mutedText shrink-0" />
            <span className="truncate hidden sm:inline">Type a command or ask anything...</span>
            <span className="truncate sm:hidden">Search or command...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono bg-surface border border-line rounded text-mutedText shrink-0">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
        {/* v1.1 Running Timer Pill (F-DUR-03) */}
        {runningTimer && (
          <div className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-control text-xs font-mono text-primary shadow-2xs animate-in fade-in">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="font-bold">{runningTimer.taskRef}</span>
            <span className="font-mono">{formatTimerSeconds(runningTimer.seconds)}</span>
            <button
              type="button"
              onClick={stopTimer}
              className="p-1 hover:bg-primary/20 rounded cursor-pointer"
              title="Stop task timer"
            >
              <Square className="h-3 w-3 fill-primary text-primary" />
            </button>
          </div>
        )}

        {/* v1.1 Attendance Chip & Dynamic Nudge (F-ATT-01) */}
        <Link
          href="/attendance"
          className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-control text-xs font-mono transition-colors shadow-2xs ${
            showAttendanceNudge
              ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
              : "bg-ground border-line text-ink hover:border-primary/50"
          }`}
          title="Open Attendance Portal"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isCheckedIn
                ? "bg-primary animate-pulse"
                : showAttendanceNudge
                ? "bg-amber-500 animate-ping"
                : "bg-mutedText"
            }`}
          />
          <span>
            {isCheckedIn
              ? `In since ${checkInTime}`
              : showAttendanceNudge
              ? "Check-In Due"
              : `Checked out (${checkOutTime || "Out"})`}
          </span>
        </Link>

        {/* Quick Add Menu */}
        <div className="relative" ref={addMenuRef}>
          <button
            type="button"
            onClick={() => setIsAddMenuOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-medium transition-colors shadow-xs cursor-pointer"
            aria-label="Quick add task, request or update"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span>
          </button>

          {isAddMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-surface rounded-panel border border-line shadow-panel p-1.5 z-50 text-xs animate-in fade-in">
              <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase text-mutedText font-semibold">
                Quick Actions
              </div>
              <button
                type="button"
                onClick={() => openCommandBar("Add: ")}
                className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-ground rounded-control text-ink text-left transition-colors"
              >
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>New Task for Me</span>
              </button>
              <button
                type="button"
                onClick={() => openCommandBar("todo ")}
                className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-ground rounded-control text-ink text-left transition-colors"
              >
                <CheckSquare className="h-4 w-4 text-primary" />
                <span>New To-do (v1.1)</span>
              </button>
              <button
                type="button"
                onClick={() => openCommandBar("Ask Hari to ")}
                className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-ground rounded-control text-ink text-left transition-colors"
              >
                <Send className="h-4 w-4 text-chasing" />
                <span>Assign Task / Chase</span>
              </button>
              <button
                type="button"
                onMouseEnter={() => router.prefetch("/inbox")}
                onTouchStart={() => router.prefetch("/inbox")}
                onClick={() => {
                  setIsAddMenuOpen(false);
                  router.push("/inbox");
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-ground rounded-control text-ink text-left transition-colors"
              >
                <MessageSquare className="h-4 w-4 text-accent" />
                <span>Raise a Request</span>
              </button>
              <button
                type="button"
                onMouseEnter={() => router.prefetch("/calendar")}
                onTouchStart={() => router.prefetch("/calendar")}
                onClick={() => {
                  setIsAddMenuOpen(false);
                  router.push("/calendar");
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-ground rounded-control text-ink text-left transition-colors"
              >
                <Calendar className="h-4 w-4 text-mutedText" />
                <span>Schedule Meeting / Event</span>
              </button>
              <button
                type="button"
                onMouseEnter={() => router.prefetch("/attendance")}
                onTouchStart={() => router.prefetch("/attendance")}
                onClick={() => {
                  setIsAddMenuOpen(false);
                  router.push("/attendance");
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-ground rounded-control text-ink text-left transition-colors"
              >
                <LogIn className="h-4 w-4 text-primary" />
                <span>Check In / Out (v1.1)</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="relative p-2 text-ink hover:bg-surface-alt border border-line rounded-control transition-colors cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4 text-ink" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger animate-pulse" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-surface rounded-panel border border-line shadow-panel p-3 z-50 text-xs animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-line mb-2">
                <span className="font-semibold text-ink">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotifsRead}
                    className="text-[11px] text-primary hover:underline font-mono"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-mutedText">
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => {
                    const displayTime =
                      n.time === "Just now" || !n.time
                        ? formatNotificationTime(n.timestamp || Date.now())
                        : n.time;
                    return (
                      <div
                        key={n.id}
                        onClick={async () => {
                          setIsNotifOpen(false);
                          if (!n.read) {
                            setNotifications((prev) =>
                              prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
                            );
                            await markSingleNotificationReadAction(n.id);
                          }
                          router.push(n.link);
                        }}
                        className={`p-2 rounded-control border border-line/60 hover:bg-surface-alt cursor-pointer transition-colors ${
                          !n.read ? "bg-ground font-medium" : "text-mutedText"
                        }`}
                      >
                        <div className="text-xs text-ink leading-snug">{n.title}</div>
                        <div
                          className="text-[10px] text-mutedText font-mono mt-1"
                          title={n.timestamp ? new Date(n.timestamp).toLocaleString() : undefined}
                        >
                          {displayTime}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Chip & Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 pl-2 border-l border-line hover:opacity-80 transition-opacity cursor-pointer text-left"
          >
            <div className="h-8 w-8 rounded-control bg-primary text-white font-mono font-semibold flex items-center justify-center text-xs">
              {userInitials}
            </div>
            <div className="hidden lg:block">
              <div className="text-xs font-semibold leading-tight text-ink">{userName}</div>
              <div className="text-[10px] text-mutedText leading-tight font-mono">
                {userRole}
              </div>
            </div>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-surface rounded-panel border border-line shadow-panel p-1.5 z-50 text-xs animate-in fade-in">
              <div className="px-2.5 py-1.5 border-b border-line mb-1">
                <div className="font-semibold text-ink">{userName}</div>
                <div className="text-[10px] text-primary font-mono font-bold">Role: {userRole}</div>
              </div>
              <Link
                href="/settings"
                prefetch={true}
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-purple-950/20 text-purple-700 dark:text-purple-300 rounded-control transition-colors"
              >
                <Crown className="h-4 w-4 text-purple-600" />
                <span className="font-semibold">Role Matrix & Privileges</span>
              </Link>
              <Link
                href="/settings"
                prefetch={true}
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-ground rounded-control text-ink transition-colors"
              >
                <Settings className="h-4 w-4 text-mutedText" />
                <span>System Settings</span>
              </Link>
              <Link
                href="/audit"
                prefetch={true}
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-ground rounded-control text-ink transition-colors"
              >
                <ShieldAlert className="h-4 w-4 text-mutedText" />
                <span>Audit Log</span>
              </Link>
              <div className="border-t border-line my-1" />
              <Link
                href="/login"
                prefetch={true}
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-danger/10 text-danger rounded-control transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
