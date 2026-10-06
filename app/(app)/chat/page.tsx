import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import ChatClient from "./ChatClient";
import { ChannelKind } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  let channels: any[] = [];
  let directMessages: any[] = [];
  let allUsers: any[] = [];
  let initialMessagesByChannel: Record<string, any[]> = {};
  let initialLinks: any[] = [];

  try {
    // Fetch channels (Team, Group, Announce)
    const allChannels = await prisma.channel.findMany({
      where: { kind: { in: [ChannelKind.TEAM, ChannelKind.GROUP, ChannelKind.ANNOUNCE] } },
      include: {
        team: { include: { members: true } },
        members: true,
      },
    });

    channels = allChannels.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      kind: c.kind,
      isPrivate: c.isPrivate,
      unreadCount: 0,
      presentCount: c.team ? c.team.members.length : c.members.length,
      totalMembers: c.team ? c.team.members.length : c.members.length,
    }));

    // Fetch DMs
    const dms = await prisma.channel.findMany({
      where: { kind: ChannelKind.DM, members: { some: { userId: user.id } } },
      include: {
        members: true,
      },
    });

    const memberIds = dms.flatMap((dm: any) => dm.members.map((m: any) => m.userId)).filter((id: any) => id !== user.id);
    const dmUsers = await prisma.user.findMany({ where: { id: { in: memberIds } } });

    directMessages = dms.map((dm: any) => {
      const otherUserId = dm.members.find((m: any) => m.userId !== user.id)?.userId;
      const otherMember = dmUsers.find((u: any) => u.id === otherUserId);
      return {
        id: otherMember?.id || dm.id,
        name: otherMember?.name || "Unknown",
        role: otherMember?.role || "MEMBER",
        isOnline: true,
        attendanceStatus: "PRESENT" as const,
      };
    });

    allUsers = await prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, role: true, email: true },
    });

    // Fetch initial messages from DB
    const rawMessages = await prisma.message.findMany({
      where: { deletedAt: null },
      include: { reactions: true },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    const userMap = new Map(allUsers.map((u: any) => [u.id, u]));

    for (const m of rawMessages) {
      if (!initialMessagesByChannel[m.channelId]) {
        initialMessagesByChannel[m.channelId] = [];
      }
      const author = m.authorId ? userMap.get(m.authorId) : null;
      const reactionCounts = new Map<string, { count: number; userReacted: boolean }>();
      for (const r of m.reactions) {
        const cur = reactionCounts.get(r.emoji) || { count: 0, userReacted: false };
        cur.count += 1;
        if (r.userId === user.id) cur.userReacted = true;
        reactionCounts.set(r.emoji, cur);
      }
      const reactions = Array.from(reactionCounts.entries()).map(([emoji, val]) => ({
        emoji,
        count: val.count,
        userReacted: val.userReacted,
      }));

      initialMessagesByChannel[m.channelId].push({
        id: m.id,
        channelId: m.channelId,
        authorName: author?.name || (m.kind === "KUDOS" ? "Team" : "System"),
        authorRole: author?.role || "MEMBER",
        body: m.body,
        kind: m.kind,
        meta: (m.meta as Record<string, unknown>) || {},
        createdAt: m.createdAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        reactions,
      });
    }

    // Fetch initial links from DB
    const rawLinks = await prisma.link.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const channelMap = new Map(channels.map((c: any) => [c.id, c.name]));
    initialLinks = rawLinks.map((l: any) => ({
      id: l.id,
      url: l.url,
      title: l.title || l.url.replace(/^https?:\/\//, ""),
      channelName: (l.channelId && channelMap.get(l.channelId)) || "General",
      authorName: (l.sharedById && userMap.get(l.sharedById)?.name) || "Team",
      createdAt: l.createdAt.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));
  } catch (err) {
    console.warn("Database connection issue in ChatPage:", (err as Error)?.message || err);
  }

  const ORIGINAL_CHANNELS = [
    { id: "c-1", name: "smru-campus-it", slug: "smru-campus-it", kind: "TEAM", unreadCount: 0, presentCount: 5, totalMembers: 5 },
    { id: "c-2", name: "dev-team", slug: "dev-team", kind: "TEAM", unreadCount: 2, presentCount: 3, totalMembers: 3 },
    { id: "c-3", name: "uos-rollout", slug: "uos-rollout", kind: "ANNOUNCE", unreadCount: 0, presentCount: 4, totalMembers: 4 },
  ];

  const ORIGINAL_DMS = [
    { id: "u-1", name: "Sri (IT Manager)", role: "LEAD", isOnline: true, attendanceStatus: "PRESENT" as const },
    { id: "u-2", name: "Hari (Campus Lead)", role: "LEAD", isOnline: true, attendanceStatus: "PRESENT" as const },
    { id: "u-3", name: "Janardhan (Support)", role: "MEMBER", isOnline: false, attendanceStatus: "ON_LEAVE" as const },
    { id: "u-4", name: "Dev Web", role: "DEVELOPER", isOnline: true, attendanceStatus: "LATE" as const },
  ];

  const ORIGINAL_MESSAGES: Record<string, any[]> = {
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

  const ORIGINAL_LINKS = [
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

  const ORIGINAL_USERS = [
    { id: "u-1", name: "Sri", role: "ADMIN", email: "sri@smru.in" },
    { id: "u-2", name: "Hari", role: "LEAD", email: "hari@smru.in" },
    { id: "u-3", name: "Janardhan", role: "MEMBER", email: "janardhan@smru.in" },
    { id: "u-4", name: "Dev Web", role: "DEVELOPER", email: "dev.web@smru.in" },
    { id: "u-5", name: "Dev Backend", role: "DEVELOPER", email: "dev.api@smru.in" },
    { id: "u-6", name: "Intern Web A", role: "INTERN", email: "intern.a@smru.in" },
  ];

  if (channels.length === 0) channels = ORIGINAL_CHANNELS;
  if (directMessages.length === 0) directMessages = ORIGINAL_DMS;
  if (Object.keys(initialMessagesByChannel).length === 0) initialMessagesByChannel = ORIGINAL_MESSAGES;
  if (initialLinks.length === 0) initialLinks = ORIGINAL_LINKS;
  if (allUsers.length === 0) allUsers = ORIGINAL_USERS;

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-mutedText">Loading Chat...</div>}>
      <ChatClient
        initialChannels={channels}
        initialDMs={directMessages}
        allUsers={allUsers}
        currentUser={user}
        initialMessages={initialMessagesByChannel}
        initialLinks={initialLinks}
      />
    </Suspense>
  );
}
