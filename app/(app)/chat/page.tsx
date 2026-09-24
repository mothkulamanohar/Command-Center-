"use client";

import { useState } from "react";
import { ChannelSidebar, ChannelItem, DirectMessageUser } from "@/components/chat/ChannelSidebar";
import { MessageItem, ChatMessage } from "@/components/chat/MessageItem";
import { MessageInput } from "@/components/chat/MessageInput";
import { LinksBoard, LinkItem } from "@/components/chat/LinksBoard";
import { AnnouncementBanner } from "@/components/chat/AnnouncementBanner";
import { Hash, Users, Pin, ShieldCheck } from "lucide-react";
import { parseKudosCommand, extractTaskRefs } from "@/lib/services/chat";
import { extractUrls } from "@/lib/services/links";

const INITIAL_CHANNELS: ChannelItem[] = [
  { id: "c-1", name: "smru-campus-it", slug: "smru-campus-it", kind: "TEAM", unreadCount: 0 },
  { id: "c-2", name: "dev-team", slug: "dev-team", kind: "TEAM", unreadCount: 2 },
  { id: "c-3", name: "uos-rollout", slug: "uos-rollout", kind: "ANNOUNCE", unreadCount: 0 },
];

const INITIAL_DMS: DirectMessageUser[] = [
  { id: "u-1", name: "Sri (IT Manager)", role: "LEAD", isOnline: true },
  { id: "u-2", name: "Hari (Campus Lead)", role: "LEAD", isOnline: true },
  { id: "u-3", name: "Janardhan (Support)", role: "MEMBER", isOnline: false },
  { id: "u-4", name: "Dev Web", role: "DEVELOPER", isOnline: true },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  "c-1": [
    {
      id: "m-1",
      authorName: "Sri",
      authorRole: "IT Manager",
      body: "Good morning team! Please check T-1042 for today's lab switch deployment at SMRU.",
      kind: "TEXT",
      createdAt: "09:30 AM",
      reactions: [{ emoji: "👍", count: 3, userReacted: true }],
    },
    {
      id: "m-2",
      authorName: "Hari",
      authorRole: "Campus Lead",
      body: "All replacement switches arrived. Docs are updated at https://wiki.smru.in/switch-upgrade.",
      kind: "TEXT",
      createdAt: "09:45 AM",
      reactions: [{ emoji: "✔", count: 2, userReacted: false }],
    },
    {
      id: "m-3",
      authorName: "Janardhan",
      authorRole: "Support Tech",
      body: "/kudos @Hari for coordinating the physical rack re-cabling over the weekend!",
      kind: "KUDOS",
      meta: {
        kudosTarget: "Hari",
        kudosReason: "coordinating the physical rack re-cabling over the weekend!",
      },
      createdAt: "10:12 AM",
    },
  ],
  "c-2": [
    {
      id: "m-4",
      authorName: "Dev Web",
      authorRole: "Developer",
      body: "Next.js 15 PWA build is running smoothly. Testing T-1043 on local environment.",
      kind: "TEXT",
      createdAt: "10:30 AM",
      reactions: [{ emoji: "🚀", count: 4, userReacted: true }],
    },
  ],
  "c-3": [
    {
      id: "m-5",
      authorName: "Sri",
      authorRole: "IT Manager",
      body: "UOS Rollout Phase 1 begins tomorrow across Main Campus Block A and B.",
      kind: "ANNOUNCE",
      createdAt: "Yesterday",
    },
  ],
};

const INITIAL_LINKS: LinkItem[] = [
  {
    id: "l-1",
    url: "https://wiki.smru.in/switch-upgrade",
    title: "Switch Upgrade Documentation",
    channelName: "smru-campus-it",
    authorName: "Hari",
    createdAt: "Today 09:45 AM",
  },
  {
    id: "l-2",
    url: "https://grafana.internal.smru.in/d/core-network",
    title: "Core Network Real-time Telemetry",
    channelName: "smru-campus-it",
    authorName: "Sri",
    createdAt: "Yesterday",
  },
];

export default function ChatPage() {
  const [activeType, setActiveType] = useState<"channel" | "dm" | "links">("channel");
  const [activeChannel, setActiveChannel] = useState<ChannelItem>(INITIAL_CHANNELS[0]!);
  const [activeDm, setActiveDm] = useState<DirectMessageUser | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);
  const [links, setLinks] = useState<LinkItem[]>(INITIAL_LINKS);
  const [notification, setNotification] = useState<string | null>(null);

  const currentChannelId = activeType === "dm" ? activeDm?.id ?? "u-1" : activeChannel.id;
  const currentMessages = messages[currentChannelId] || [];

  const showToast = (text: string) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSendMessage = (text: string, kind = "TEXT", meta?: Record<string, unknown>) => {
    const kudos = parseKudosCommand(text);
    const taskRefs = extractTaskRefs(text);
    const extractedUrls = extractUrls(text);

    let messageKind = kind;
    const finalMeta = { ...meta };

    if (kudos) {
      messageKind = "KUDOS";
      finalMeta.kudosTarget = kudos.targetName;
      finalMeta.kudosReason = kudos.reason;
      showToast(`Kudos recognized for @${kudos.targetName}!`);
    } else if (taskRefs.length > 0) {
      finalMeta.taskRefs = taskRefs;
    }

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      authorName: "Sri",
      authorRole: "IT Manager",
      body: text,
      kind: messageKind,
      meta: finalMeta,
      createdAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => ({
      ...prev,
      [currentChannelId]: [...(prev[currentChannelId] || []), newMsg],
    }));

    if (extractedUrls.length > 0) {
      const newLinks: LinkItem[] = extractedUrls.map((url, i) => ({
        id: `link-${Date.now()}-${i}`,
        url,
        channelName: activeChannel.name,
        authorName: "Sri",
        createdAt: "Just now",
      }));
      setLinks((prev) => [...newLinks, ...prev]);
    }
  };

  const handleReact = (messageId: string, emoji: string) => {
    setMessages((prev) => {
      const list = prev[currentChannelId] || [];
      return {
        ...prev,
        [currentChannelId]: list.map((m) => {
          if (m.id !== messageId) return m;
          const reactions = [...(m.reactions || [])];
          const existing = reactions.find((r) => r.emoji === emoji);
          if (existing) {
            if (existing.userReacted) {
              existing.count -= 1;
              existing.userReacted = false;
            } else {
              existing.count += 1;
              existing.userReacted = true;
            }
          } else {
            reactions.push({ emoji, count: 1, userReacted: true });
          }
          return { ...m, reactions: reactions.filter((r) => r.count > 0) };
        }),
      };
    });
  };

  const handleMakeTask = (text: string) => {
    showToast(`Task draft created: "${text.slice(0, 30)}..."`);
  };

  const handleMakeRequest = (text: string) => {
    showToast(`Leadership ask routed to Inbox: "${text.slice(0, 30)}..."`);
  };

  return (
    <div className="space-y-4">
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-surface px-4 py-2.5 rounded-control text-xs font-medium shadow-panel border border-line flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Chat Panel Container */}
      <div className="bg-surface rounded-panel border border-line h-[calc(100vh-140px)] min-h-[580px] flex overflow-hidden shadow-xs">
        {/* Sidebar */}
        <ChannelSidebar
          channels={INITIAL_CHANNELS}
          directMessages={INITIAL_DMS}
          activeId={activeType === "dm" ? activeDm?.id || "" : activeChannel.id}
          activeType={activeType}
          onSelectChannel={(ch) => {
            setActiveChannel(ch);
            setActiveType("channel");
          }}
          onSelectDm={(user) => {
            setActiveDm(user);
            setActiveType("dm");
          }}
          onOpenLinks={() => setActiveType("links")}
        />

        {/* Content Area */}
        {activeType === "links" ? (
          <LinksBoard links={links} onClose={() => setActiveType("channel")} />
        ) : (
          <div className="flex-1 flex flex-col bg-surface overflow-hidden">
            {/* Channel Top Header */}
            <div className="p-3 border-b border-line flex items-center justify-between bg-surface-alt/40">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-ink">
                  {activeType === "dm" ? activeDm?.name : activeChannel.name}
                </span>
                <span className="text-xs text-mutedText border-l border-line pl-2 ml-1 hidden sm:inline">
                  {activeType === "dm" ? activeDm?.role : activeChannel.slug}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-mutedText">
                <div className="flex items-center gap-1 font-mono">
                  <Users className="h-3.5 w-3.5" />
                  <span>5 members</span>
                </div>
              </div>
            </div>

            {/* Announcement Banner if applicable (F-CHAT-10) */}
            {activeChannel.kind === "ANNOUNCE" && (
              <AnnouncementBanner
                id="ann-1"
                title="Critical Maintenance"
                content="Core network maintenance scheduled tonight at 23:00 IST. Campus Wi-Fi will reboot."
                acknowledgedCount={12}
                onAcknowledge={() => showToast("Announcement acknowledged!")}
              />
            )}

            {/* Messages Scroll Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {currentMessages.length === 0 ? (
                <div className="text-center py-16 text-mutedText text-xs">
                  No messages yet. Send a message to start the conversation!
                </div>
              ) : (
                currentMessages.map((msg) => (
                  <MessageItem
                    key={msg.id}
                    message={msg}
                    onReact={handleReact}
                    onMakeTask={handleMakeTask}
                    onMakeRequest={handleMakeRequest}
                  />
                ))
              )}
            </div>

            {/* Message Input Bar */}
            <MessageInput
              channelName={activeType === "dm" ? activeDm?.name || "dm" : activeChannel.name}
              isAnnouncementOnly={activeChannel.kind === "ANNOUNCE"}
              onSendMessage={handleSendMessage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
