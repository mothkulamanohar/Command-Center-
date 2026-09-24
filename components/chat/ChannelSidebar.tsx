"use client";

import { useState } from "react";
import { Hash, Lock, Volume2, User as UserIcon, Link2, Search, Plus } from "lucide-react";

export interface ChannelItem {
  id: string;
  name: string;
  slug: string;
  kind: "TEAM" | "GROUP" | "DM" | "ANNOUNCE";
  isPrivate?: boolean;
  unreadCount?: number;
}

export interface DirectMessageUser {
  id: string;
  name: string;
  role: string;
  isOnline?: boolean;
  unreadCount?: number;
}

interface ChannelSidebarProps {
  channels: ChannelItem[];
  directMessages: DirectMessageUser[];
  activeId: string;
  activeType: "channel" | "dm" | "links";
  onSelectChannel: (channel: ChannelItem) => void;
  onSelectDm: (user: DirectMessageUser) => void;
  onOpenLinks: () => void;
}

export function ChannelSidebar({
  channels,
  directMessages,
  activeId,
  activeType,
  onSelectChannel,
  onSelectDm,
  onOpenLinks,
}: ChannelSidebarProps) {
  const [filter, setFilter] = useState("");

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(filter.toLowerCase())
  );

  const filteredDms = directMessages.filter((u) =>
    u.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="w-64 border-r border-line bg-surface-alt flex flex-col h-full select-none">
      {/* Search Header */}
      <div className="p-3 border-b border-line space-y-2">
        <div className="relative">
          <Search className="h-3.5 w-3.5 text-mutedText absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Jump to or search..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-xs bg-surface border border-line rounded-control text-ink focus:outline-none focus:border-primary placeholder:text-mutedText/70"
          />
        </div>

        {/* Global Links Board Shortcut (F-CHAT-09) */}
        <button
          type="button"
          onClick={onOpenLinks}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-control text-xs font-medium transition-colors ${
            activeType === "links"
              ? "bg-primary text-white"
              : "text-ink hover:bg-surface border border-transparent hover:border-line"
          }`}
        >
          <div className="flex items-center gap-2">
            <Link2 className="h-3.5 w-3.5" />
            <span>Team Links Board</span>
          </div>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
              activeType === "links" ? "bg-white/20 text-white" : "bg-ground text-mutedText"
            }`}
          >
            Auto
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Channels Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-mutedText font-semibold">
              Channels
            </span>
            <button
              type="button"
              className="p-0.5 hover:bg-surface rounded text-mutedText hover:text-ink transition-colors"
              title="New Channel"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-0.5">
            {filteredChannels.map((c) => {
              const isActive = activeType === "channel" && activeId === c.id;
              const Icon =
                c.kind === "ANNOUNCE" ? Volume2 : c.isPrivate ? Lock : Hash;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectChannel(c)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-control text-xs font-medium transition-colors text-left ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20 font-semibold"
                      : "text-mutedText hover:text-ink hover:bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-primary" : "text-mutedText"}`} />
                    <span className="truncate">{c.name}</span>
                  </div>
                  {c.unreadCount && c.unreadCount > 0 ? (
                    <span className="ml-1.5 bg-danger text-white text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                      {c.unreadCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Direct Messages Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-mutedText font-semibold">
              Direct Messages
            </span>
            <button
              type="button"
              className="p-0.5 hover:bg-surface rounded text-mutedText hover:text-ink transition-colors"
              title="New Direct Message"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-0.5">
            {filteredDms.map((u) => {
              const isActive = activeType === "dm" && activeId === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => onSelectDm(u)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-control text-xs font-medium transition-colors text-left ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20 font-semibold"
                      : "text-mutedText hover:text-ink hover:bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="relative shrink-0">
                      <div className="h-4 w-4 rounded-full bg-ground border border-line flex items-center justify-center text-[8px] font-bold">
                        {u.name.slice(0, 1).toUpperCase()}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full border border-surface ${
                          u.isOnline ? "bg-primary" : "bg-mutedText/40"
                        }`}
                      />
                    </div>
                    <span className="truncate">{u.name}</span>
                  </div>
                  {u.unreadCount && u.unreadCount > 0 ? (
                    <span className="ml-1.5 bg-danger text-white text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                      {u.unreadCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
