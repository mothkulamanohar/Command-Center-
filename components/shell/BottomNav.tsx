"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Inbox, MessageSquare, Menu } from "lucide-react";
import { useState } from "react";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);

  const moreItems = [
    { name: "My Space", href: "/my" },
    { name: "To-do", href: "/todo" },
    { name: "Teams", href: "/teams" },
    { name: "Calendar", href: "/calendar" },
    { name: "Attendance", href: "/attendance" },
    { name: "Timesheet", href: "/timesheet" },
    { name: "Dev Hub", href: "/dev" },
    { name: "Docs", href: "/docs" },
    { name: "Reports", href: "/reports" },
    { name: "Certificates", href: "/certificates" },
    { name: "Feedback", href: "/feedback" },
    { name: "Setup", href: "/setup" },
    { name: "Audit Log", href: "/audit" },
    { name: "Settings", href: "/settings" },
    { name: "Trash", href: "/trash" },
  ];

  return (
    <>
      {showMore && (
        <div
          className="fixed inset-0 bg-ink/70 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-20 left-3 right-3 max-h-[calc(80dvh-2rem)] overflow-y-auto bg-surface rounded-panel border border-line p-4 shadow-xl space-y-2 z-50 animate-in fade-in slide-in-from-bottom-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs font-mono uppercase tracking-wider text-mutedText px-2 pb-1 border-b border-line flex items-center justify-between">
              <span>More Navigation</span>
              <span className="text-[10px] text-mutedText/80">Tap to jump</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onMouseEnter={() => router.prefetch(item.href)}
                  onTouchStart={() => router.prefetch(item.href)}
                  onClick={() => setShowMore(false)}
                  className={`px-3 py-2.5 rounded-control text-xs font-medium border transition-colors active:opacity-80 ${
                    pathname.startsWith(item.href)
                      ? "bg-primary text-white border-primary font-semibold"
                      : "bg-surface-alt text-ink border-line hover:border-mutedText"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1B365D] text-white border-t border-[#22426E] flex items-center justify-around z-30 px-2 mobile-bottom-nav"
        aria-label="Mobile Navigation"
      >
        <Link
          href="/console"
          prefetch={true}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-control active:opacity-80 transition-all ${
            pathname === "/console" ? "text-white font-semibold" : "text-[#9BB1D0]"
          }`}
          aria-label="Home"
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] mt-1 font-medium">Home</span>
        </Link>

        <Link
          href="/inbox"
          prefetch={true}
          className={`relative flex flex-col items-center justify-center w-16 h-12 rounded-control active:opacity-80 transition-all ${
            pathname === "/inbox" ? "text-white font-semibold" : "text-[#9BB1D0]"
          }`}
          aria-label="Inbox"
        >
          <Inbox className="h-5 w-5" />
          <span className="text-[10px] mt-1 font-medium">Inbox</span>
          <span className="absolute top-1 right-3 h-2 w-2 rounded-full bg-primary" />
        </Link>

        <Link
          href="/chat"
          prefetch={true}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-control active:opacity-80 transition-all ${
            pathname === "/chat" ? "text-white font-semibold" : "text-[#9BB1D0]"
          }`}
          aria-label="Chat"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-[10px] mt-1 font-medium">Chat</span>
        </Link>

        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-control active:opacity-80 transition-all ${
            showMore ? "text-white" : "text-[#9BB1D0]"
          }`}
          aria-label="More navigation items"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] mt-1 font-medium">More</span>
        </button>
      </nav>
    </>
  );
}
