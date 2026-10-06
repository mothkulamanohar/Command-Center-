"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  CheckSquare,
  Clock,
  Award,
  X,
  Menu,
} from "lucide-react";
import { RoleKey } from "@prisma/client";
import { AppRole } from "@/lib/auth/roles";
import { useState, useEffect } from "react";

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: number;
  roles: (AppRole | RoleKey)[];
}

const allNavItems: NavItem[] = [
  {
    name: "Console",
    href: "/console",
    icon: LayoutDashboard,
    roles: ["PLATFORM_ADMIN", "IT_MANAGER", RoleKey.ADMIN, RoleKey.LEAD, RoleKey.DEVELOPER, RoleKey.MEMBER, RoleKey.INTERN, RoleKey.GUEST],
  },
  {
    name: "Today",
    href: "/my",
    icon: UserCheck,
    roles: ["PLATFORM_ADMIN", "IT_MANAGER", RoleKey.ADMIN, RoleKey.LEAD, RoleKey.DEVELOPER, RoleKey.MEMBER, RoleKey.INTERN],
  },
  {
    name: "To-Do",
    href: "/todo",
    icon: CheckSquare,
    roles: ["PLATFORM_ADMIN", "IT_MANAGER", RoleKey.ADMIN, RoleKey.LEAD, RoleKey.DEVELOPER, RoleKey.MEMBER, RoleKey.INTERN],
  },
  {
    name: "Inbox",
    href: "/inbox",
    icon: Inbox,
    roles: ["PLATFORM_ADMIN", "IT_MANAGER", RoleKey.ADMIN, RoleKey.LEAD, RoleKey.DEVELOPER, RoleKey.MEMBER, RoleKey.INTERN],
  },
  {
    name: "Calendar",
    href: "/calendar",
    icon: Calendar,
    roles: ["PLATFORM_ADMIN", "IT_MANAGER", RoleKey.ADMIN, RoleKey.LEAD, RoleKey.DEVELOPER, RoleKey.MEMBER, RoleKey.INTERN],
  },
  {
    name: "Reception",
    href: "/attendance",
    icon: Clock,
    roles: ["PLATFORM_ADMIN", "IT_MANAGER", RoleKey.ADMIN, RoleKey.LEAD, RoleKey.DEVELOPER, RoleKey.MEMBER, RoleKey.INTERN],
  },
  {
    name: "Teams",
    href: "/teams",
    icon: Users,
    roles: ["PLATFORM_ADMIN", "IT_MANAGER", RoleKey.ADMIN, RoleKey.LEAD, RoleKey.DEVELOPER, RoleKey.MEMBER, RoleKey.INTERN],
  },
  {
    name: "Chat",
    href: "/chat",
    icon: MessageSquare,
    roles: ["PLATFORM_ADMIN", "IT_MANAGER", RoleKey.ADMIN, RoleKey.LEAD, RoleKey.DEVELOPER, RoleKey.MEMBER, RoleKey.INTERN, RoleKey.GUEST],
  },
  {
    name: "Timesheet",
    href: "/timesheet",
    icon: Clock,
    roles: ["PLATFORM_ADMIN", "IT_MANAGER", RoleKey.ADMIN, RoleKey.LEAD, RoleKey.DEVELOPER, RoleKey.MEMBER, RoleKey.INTERN],
  },
  {
    name: "Dev Hub",
    href: "/dev",
    icon: Code2,
    roles: ["PLATFORM_ADMIN", "IT_MANAGER", RoleKey.ADMIN, RoleKey.LEAD, RoleKey.DEVELOPER, RoleKey.MEMBER, RoleKey.INTERN],
  },
  {
    name: "Docs",
    href: "/docs",
    icon: FileText,
    roles: ["PLATFORM_ADMIN", "IT_MANAGER", RoleKey.ADMIN, RoleKey.LEAD, RoleKey.DEVELOPER, RoleKey.MEMBER, RoleKey.INTERN, RoleKey.GUEST],
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["PLATFORM_ADMIN", "IT_MANAGER", RoleKey.ADMIN, RoleKey.LEAD, RoleKey.DEVELOPER, RoleKey.MEMBER, RoleKey.INTERN, RoleKey.GUEST],
  },
  {
    name: "Certificates",
    href: "/certificates",
    icon: Award,
    roles: ["PLATFORM_ADMIN", "IT_MANAGER", RoleKey.ADMIN, RoleKey.LEAD, RoleKey.DEVELOPER, RoleKey.MEMBER, RoleKey.INTERN],
  },
  {
    name: "Feedback",
    href: "/feedback",
    icon: Award,
    roles: ["PLATFORM_ADMIN", "IT_MANAGER", RoleKey.ADMIN, RoleKey.LEAD, RoleKey.DEVELOPER, RoleKey.MEMBER, RoleKey.INTERN],
  },
  {
    name: "Setup",
    href: "/setup",
    icon: Sliders,
    roles: ["PLATFORM_ADMIN"], // Platform Owner only
  },
  {
    name: "Audit Log",
    href: "/audit",
    icon: ShieldAlert,
    roles: ["PLATFORM_ADMIN", "IT_MANAGER", RoleKey.ADMIN, RoleKey.LEAD],
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["PLATFORM_ADMIN", "IT_MANAGER", RoleKey.ADMIN, RoleKey.LEAD],
  },
  {
    name: "Trash",
    href: "/trash",
    icon: Trash2,
    roles: ["PLATFORM_ADMIN"], // Platform Owner only
  },
];

export function Sidebar({
  userRole: initialRole = "IT_MANAGER" as AppRole,
  badgeCounts,
}: {
  userRole?: AppRole | RoleKey;
  badgeCounts?: {
    inbox: number;
    trash: number;
    feedback: number;
    todo: number;
  };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState<AppRole | RoleKey>(initialRole);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  useEffect(() => {
    setPendingPath(null);
  }, [pathname]);

  // Safeguard: auto-clear pending state after 1.2s to prevent stuck button UI
  useEffect(() => {
    if (!pendingPath) return;
    const timer = setTimeout(() => setPendingPath(null), 1200);
    return () => clearTimeout(timer);
  }, [pendingPath]);

  // In production, pre-warm routes when idle; in development, avoid webpack manifest race conditions
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    const routesToPreload = [
      "/console",
      "/my",
      "/todo",
      "/inbox",
      "/certificates",
      "/attendance",
      "/chat",
      "/teams",
      "/calendar",
      "/reports",
      "/settings",
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index >= routesToPreload.length) {
        clearInterval(interval);
        return;
      }
      try {
        router.prefetch(routesToPreload[index]);
      } catch {}
      index++;
    }, 2500);

    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    const handleOpen = () => setIsMobileOpen(true);
    const handleClose = () => setIsMobileOpen(false);
    window.addEventListener("open-mobile-sidebar", handleOpen);
    window.addEventListener("close-mobile-sidebar", handleClose);
    return () => {
      window.removeEventListener("open-mobile-sidebar", handleOpen);
      window.removeEventListener("close-mobile-sidebar", handleClose);
    };
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const visibleItems = allNavItems.filter((item) => item.roles.includes(currentRole));

  const renderNavContent = (onLinkClick?: () => void) => (
    <>
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-[#22426E] gap-3 shrink-0 sticky top-0 z-10 bg-[#1B365D]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-control bg-primary flex items-center justify-center text-white font-mono font-semibold shadow-sm">
            ICC
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold tracking-tight text-white truncate flex items-center gap-1.5">
              <span>Command Center</span>
              <span className="text-[9px] bg-[#284E82] text-[#93C5FD] border border-[#3E6AA7] px-1 py-0.2 rounded font-mono font-bold tracking-wider">
                OAMS
              </span>
            </div>
            <div className="text-xs text-[#9BB1D0] flex items-center gap-1.5 font-mono">
              <span className={`h-1.5 w-1.5 rounded-full ${
                currentRole === "PLATFORM_ADMIN" ? "bg-purple-400" : "bg-[#60A5FA]"
              }`} />
              <span className="truncate">
                {currentRole === "PLATFORM_ADMIN"
                  ? "OWNER (PLATFORM ADMIN)"
                  : currentRole === "IT_MANAGER"
                  ? "IT MANAGER"
                  : currentRole}
              </span>
            </div>
          </div>
        </div>

        {onLinkClick && (
          <button
            type="button"
            onClick={onLinkClick}
            className="p-1.5 rounded-control text-[#9BB1D0] hover:text-white hover:bg-[#203F6B] transition-colors md:hidden cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Role Preview Switcher */}
      <div className="px-4 py-2 border-b border-[#22426E] bg-[#162D50] shrink-0 sticky top-16 z-10">
        <label className="text-[10px] font-mono uppercase tracking-wider text-[#9BB1D0] block mb-1">
          Preview Role:
        </label>
        <select
          value={currentRole}
          onChange={(e) => setCurrentRole(e.target.value as AppRole)}
          aria-label="Switch Preview Role"
          className="w-full bg-[#1B365D] text-[#93C5FD] border border-[#2E5285] rounded-control px-2 py-1 text-xs font-mono focus:outline-none cursor-pointer"
        >
          <option value="PLATFORM_ADMIN">Platform Admin (Owner)</option>
          <option value="IT_MANAGER">IT Manager (Sri)</option>
          <option value={RoleKey.LEAD}>Team Lead (Hari)</option>
          <option value={RoleKey.DEVELOPER}>Developer (Dev Web)</option>
          <option value={RoleKey.MEMBER}>Member (Janardhan)</option>
          <option value={RoleKey.INTERN}>Intern (Intern A)</option>
          <option value={RoleKey.GUEST}>Guest (VC Office)</option>
        </select>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-[#829DC2]">
          Navigation
        </div>
        {visibleItems.map((item) => {
          const isCurrentRoute =
            pathname === item.href ||
            (item.href !== "/console" && pathname.startsWith(item.href));
          const isPending = pendingPath === item.href && !isCurrentRoute;
          const isActive = isCurrentRoute;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onMouseEnter={() => router.prefetch(item.href)}
              onTouchStart={() => router.prefetch(item.href)}
              onClick={() => {
                if (onLinkClick) {
                  onLinkClick();
                }
              }}
              className={`flex items-center justify-between h-8 shrink-0 px-3 rounded-control text-xs font-medium transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20 ${
                isActive
                  ? "bg-[#284E82] text-white shadow-xs font-semibold ring-1 ring-white/10"
                  : "text-[#C2D2E8] hover:bg-[#203F6B] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 transition-colors ${
                    isActive ? "text-white" : "text-[#9BB1D0]"
                  }`}
                />
                <span>{item.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {isPending && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#93C5FD] animate-ping" />
                )}
                {(() => {
                  let badge = item.badge;
                  if (item.href === "/inbox") badge = badgeCounts?.inbox || undefined;
                  if (item.href === "/trash") badge = badgeCounts?.trash || undefined;
                  if (item.href === "/feedback") badge = badgeCounts?.feedback || undefined;
                  if (item.href === "/todo") badge = badgeCounts?.todo || undefined;
                  return badge ? (
                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-primary text-white">
                      {badge}
                    </span>
                  ) : null;
                })()}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-[#22426E] text-xs text-[#9BB1D0] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#60A5FA]" />
          <span className="font-mono text-[11px]">v1.1</span>
        </div>
        <span className="text-[11px] font-mono text-[#829DC2]">Self-hosted</span>
      </div>
    </>
  );

  return (
    <>
      {/* 1. Desktop Fixed Sidebar */}
      <aside
        className="sidebar hidden md:flex flex-col w-64 bg-[#1B365D] text-white h-full overflow-y-auto overscroll-contain border-r border-[#152B4D] shrink-0"
        aria-label="Main Navigation"
      >
        {renderNavContent()}
      </aside>

      {/* 2. Mobile Responsive Drawer */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-ink/70 backdrop-blur-xs flex animate-in fade-in duration-200"
          onClick={() => setIsMobileOpen(false)}
        >
          <div
            className="w-72 max-w-[85vw] bg-[#1B365D] text-white h-full flex flex-col shadow-2xl overflow-y-auto overscroll-contain animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {renderNavContent(() => setIsMobileOpen(false))}
          </div>
        </div>
      )}
    </>
  );
}
