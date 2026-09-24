"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserCheck,
  Inbox,
  Users,
  MessageSquare,
  Calendar,
  Code2,
  FileText,
  BarChart3,
  Sliders,
  Settings,
  ShieldCheck,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { name: "Console", href: "/console", icon: LayoutDashboard },
  { name: "My Space", href: "/my", icon: UserCheck },
  { name: "Inbox", href: "/inbox", icon: Inbox, badge: 3 },
  { name: "Teams", href: "/teams", icon: Users },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Dev Hub", href: "/dev", icon: Code2 },
  { name: "Docs", href: "/docs", icon: FileText },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

const secondaryNavItems: NavItem[] = [
  { name: "Setup", href: "/setup", icon: Sliders },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex flex-col w-64 bg-ink text-white min-h-screen border-r border-[#262A33] shrink-0"
      aria-label="Main Navigation"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#262A33] gap-3">
        <div className="h-9 w-9 rounded-control bg-primary flex items-center justify-center text-white font-mono font-semibold shadow-sm">
          ICC
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight text-white">
            Command Center
          </div>
          <div className="text-xs text-[#8A8F9B] flex items-center gap-1.5 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3FB8AC]"></span>
            Sri (Admin)
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-[#6F7482]">
          Operations
        </div>
        {mainNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/console" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-control text-xs font-medium transition-colors min-h-touch ${
                isActive
                  ? "bg-[#252830] text-[#3FB8AC]"
                  : "text-[#B3B7C2] hover:bg-[#1E2127] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 ${
                    isActive ? "text-[#3FB8AC]" : "text-[#8A8F9B]"
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {item.badge ? (
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-primary text-white">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}

        <div className="px-3 pt-5 pb-2 text-[10px] font-mono uppercase tracking-wider text-[#6F7482]">
          Administration
        </div>
        {secondaryNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-control text-xs font-medium transition-colors min-h-touch ${
                isActive
                  ? "bg-[#252830] text-[#3FB8AC]"
                  : "text-[#B3B7C2] hover:bg-[#1E2127] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 ${
                    isActive ? "text-[#3FB8AC]" : "text-[#8A8F9B]"
                  }`}
                />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-[#262A33] text-xs text-[#8A8F9B] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#3FB8AC]" />
          <span className="font-mono text-[11px]">v1.0 (Phase 0)</span>
        </div>
        <span className="text-[11px] font-mono text-[#6F7482]">Self-hosted</span>
      </div>
    </aside>
  );
}
