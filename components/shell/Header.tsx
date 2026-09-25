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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface NotificationItem {
  id: string;
  title: string;
  time: string;
  read: boolean;
  type: "task" | "followup" | "system";
  link: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n-1",
    title: "Hari accepted request: 'Fix admission form fee calculation'",
    time: "10m ago",
    read: false,
    type: "task",
    link: "/inbox",
  },
  {
    id: "n-2",
    title: "Follow-up reply from CTPL on banners: 'Draft proof ready'",
    time: "42m ago",
    read: false,
    type: "followup",
    link: "/console",
  },
  {
    id: "n-3",
    title: "Uptime alert resolved: 'admissions.smru.edu.in' is healthy",
    time: "2h ago",
    read: false,
    type: "system",
    link: "/dev",
  },
];

export function Header() {
  const router = useRouter();
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const addMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  const markAllNotifsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-16 bg-surface border-b border-line px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Command Bar Search Trigger (F-CMD) */}
      <div className="flex-1 max-w-xl">
        <button
          type="button"
          onClick={() => openCommandBar()}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-ground border border-line rounded-control text-xs text-mutedText hover:border-primary/50 hover:bg-surface transition-all shadow-xs cursor-pointer"
          aria-label="Open command bar"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-mutedText" />
            <span>Type a command or ask anything...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono bg-surface border border-line rounded text-mutedText">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-2 md:gap-3 ml-4">
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
                onClick={() => openCommandBar("Ask Hari to ")}
                className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-ground rounded-control text-ink text-left transition-colors"
              >
                <Send className="h-4 w-4 text-chasing" />
                <span>Assign Task / Chase</span>
              </button>
              <button
                type="button"
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
                onClick={() => {
                  setIsAddMenuOpen(false);
                  router.push("/calendar");
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-ground rounded-control text-ink text-left transition-colors"
              >
                <Calendar className="h-4 w-4 text-mutedText" />
                <span>Schedule Meeting / Event</span>
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
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setIsNotifOpen(false);
                      router.push(n.link);
                    }}
                    className={`p-2 rounded-control border border-line/60 hover:bg-surface-alt cursor-pointer transition-colors ${
                      !n.read ? "bg-ground font-medium" : "text-mutedText"
                    }`}
                  >
                    <div className="text-xs text-ink leading-snug">{n.title}</div>
                    <div className="text-[10px] text-mutedText font-mono mt-1">{n.time}</div>
                  </div>
                ))}
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
              SR
            </div>
            <div className="hidden lg:block">
              <div className="text-xs font-semibold leading-tight text-ink">Sri</div>
              <div className="text-[10px] text-mutedText leading-tight font-mono">
                IT Manager
              </div>
            </div>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-surface rounded-panel border border-line shadow-panel p-1.5 z-50 text-xs animate-in fade-in">
              <div className="px-2.5 py-1.5 border-b border-line mb-1">
                <div className="font-semibold text-ink">Sri (IT Manager)</div>
                <div className="text-[10px] text-mutedText font-mono">Role: ADMIN</div>
              </div>
              <Link
                href="/settings"
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-ground rounded-control text-ink transition-colors"
              >
                <Settings className="h-4 w-4 text-mutedText" />
                <span>Settings</span>
              </Link>
              <Link
                href="/audit"
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-ground rounded-control text-ink transition-colors"
              >
                <ShieldAlert className="h-4 w-4 text-mutedText" />
                <span>Audit Log</span>
              </Link>
              <div className="border-t border-line my-1" />
              <Link
                href="/login"
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
