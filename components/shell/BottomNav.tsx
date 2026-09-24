"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Inbox, MessageSquare, Menu } from "lucide-react";
import { useState } from "react";

export function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const moreItems = [
    { name: "My Space", href: "/my" },
    { name: "Teams", href: "/teams" },
    { name: "Calendar", href: "/calendar" },
    { name: "Dev Hub", href: "/dev" },
    { name: "Docs", href: "/docs" },
    { name: "Reports", href: "/reports" },
    { name: "Setup", href: "/setup" },
    { name: "Settings", href: "/settings" },
  ];

  return (
    <>
      {showMore && (
        <div
          className="fixed inset-0 bg-ink/70 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-16 left-3 right-3 bg-surface rounded-panel border border-line p-4 shadow-xl space-y-2 z-50 animate-in fade-in slide-in-from-bottom-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs font-mono uppercase tracking-wider text-mutedText px-2 pb-1 border-b border-line">
              More Navigation
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className={`px-3 py-2.5 rounded-control text-xs font-medium border ${
                    pathname.startsWith(item.href)
                      ? "bg-primary text-white border-primary"
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
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-ink text-white border-t border-[#262A33] flex items-center justify-around z-30 px-2"
        aria-label="Mobile Navigation"
      >
        <Link
          href="/console"
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-control ${
            pathname === "/console" ? "text-[#3FB8AC]" : "text-[#8A8F9B]"
          }`}
          aria-label="Home"
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] mt-1 font-medium">Home</span>
        </Link>

        <Link
          href="/inbox"
          className={`relative flex flex-col items-center justify-center w-16 h-12 rounded-control ${
            pathname === "/inbox" ? "text-[#3FB8AC]" : "text-[#8A8F9B]"
          }`}
          aria-label="Inbox"
        >
          <Inbox className="h-5 w-5" />
          <span className="text-[10px] mt-1 font-medium">Inbox</span>
          <span className="absolute top-1 right-3 h-2 w-2 rounded-full bg-primary" />
        </Link>

        <Link
          href="/chat"
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-control ${
            pathname === "/chat" ? "text-[#3FB8AC]" : "text-[#8A8F9B]"
          }`}
          aria-label="Chat"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-[10px] mt-1 font-medium">Chat</span>
        </Link>

        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-control ${
            showMore ? "text-[#3FB8AC]" : "text-[#8A8F9B]"
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
