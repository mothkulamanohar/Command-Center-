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
  ShieldAlert,
  SendHorizontal,
  Trash2,
} from "lucide-react";
import { RoleKey } from "@prisma/client";
import { useState } from "react";

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: number;
  roles: RoleKey[];
}

const allNavItems: NavItem[] = [
  { name: "Console", href: "/console", icon: LayoutDashboard, roles: [RoleKey.ADMIN] },
  {
    name: "My Space",
    href: "/my",
    icon: UserCheck,
    roles: [RoleKey.ADMIN, RoleKey.LEAD, RoleKey.DEVELOPER, RoleKey.MEMBER, RoleKey.INTERN],
  },
  {
    name: "Inbox",
    href: "/inbox",
    icon: Inbox,
    badge: 3,
    roles: [RoleKey.ADMIN, RoleKey.LEAD, RoleKey.DEVELOPER, RoleKey.MEMBER, RoleKey.INTERN],
  },
  {
    name: "Teams",
    href: "/teams",
    icon: Users,
    roles: [RoleKey.ADMIN, RoleKey.LEAD, RoleKey.DEVELOPER, RoleKey.MEMBER, RoleKey.INTERN],
  },
  {
    name: "Chat",
    href: "/chat",
    icon: MessageSquare,
    roles: [RoleKey.ADMIN, RoleKey.LEAD, RoleKey.DEVELOPER, RoleKey.MEMBER, RoleKey.INTERN, RoleKey.GUEST],
  },
  {
    name: "Calendar",
    href: "/calendar",
    icon: Calendar,
    roles: [RoleKey.ADMIN, RoleKey.LEAD, RoleKey.DEVELOPER, RoleKey.MEMBER, RoleKey.INTERN],
  },
  {
    name: "Dev Hub",
    href: "/dev",
    icon: Code2,
    roles: [RoleKey.ADMIN, RoleKey.LEAD, RoleKey.DEVELOPER, RoleKey.MEMBER, RoleKey.INTERN],
  },
  {
    name: "Docs",
    href: "/docs",
    icon: FileText,
    roles: [RoleKey.ADMIN, RoleKey.LEAD, RoleKey.DEVELOPER, RoleKey.MEMBER, RoleKey.INTERN, RoleKey.GUEST],
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: [RoleKey.ADMIN, RoleKey.LEAD, RoleKey.DEVELOPER, RoleKey.MEMBER, RoleKey.INTERN, RoleKey.GUEST],
  },
  {
    name: "Setup",
    href: "/setup",
    icon: Sliders,
    roles: [RoleKey.ADMIN, RoleKey.LEAD],
  },
  {
    name: "Audit Log",
    href: "/audit",
    icon: ShieldAlert,
    roles: [RoleKey.ADMIN],
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    roles: [RoleKey.ADMIN],
  },
  {
    name: "Trash",
    href: "/trash",
    icon: Trash2,
    roles: [RoleKey.ADMIN, RoleKey.LEAD],
  },
];

export function Sidebar({ userRole: initialRole = RoleKey.ADMIN }: { userRole?: RoleKey }) {
  const pathname = usePathname();
  const [currentRole, setCurrentRole] = useState<RoleKey>(initialRole);

  const visibleItems = allNavItems.filter((item) => item.roles.includes(currentRole));

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
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold tracking-tight text-white truncate">
            Command Center
          </div>
          <div className="text-xs text-[#8A8F9B] flex items-center gap-1.5 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3FB8AC]"></span>
            <span>{currentRole}</span>
          </div>
        </div>
      </div>

      {/* Role Preview Switcher (Quickly verify each role per Phase 1 exit criteria) */}
      <div className="px-4 py-2 border-b border-[#262A33] bg-[#1E2127]">
        <label className="text-[10px] font-mono uppercase tracking-wider text-[#8A8F9B] block mb-1">
          Preview Role:
        </label>
        <select
          value={currentRole}
          onChange={(e) => setCurrentRole(e.target.value as RoleKey)}
          aria-label="Switch Preview Role"
          className="w-full bg-ink text-[#3FB8AC] border border-[#262A33] rounded-control px-2 py-1 text-xs font-mono focus:outline-none"
        >
          <option value={RoleKey.ADMIN}>Admin (Sri)</option>
          <option value={RoleKey.LEAD}>Lead (Hari)</option>
          <option value={RoleKey.DEVELOPER}>Developer (Dev Web)</option>
          <option value={RoleKey.MEMBER}>Member (Janardhan)</option>
          <option value={RoleKey.INTERN}>Intern (Intern A)</option>
          <option value={RoleKey.GUEST}>Guest (VC Office)</option>
        </select>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-[#6F7482]">
          Navigation
        </div>
        {visibleItems.map((item) => {
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
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-[#262A33] text-xs text-[#8A8F9B] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#3FB8AC]" />
          <span className="font-mono text-[11px]">v1.0 (Phase 1)</span>
        </div>
        <span className="text-[11px] font-mono text-[#6F7482]">Self-hosted</span>
      </div>
    </aside>
  );
}
