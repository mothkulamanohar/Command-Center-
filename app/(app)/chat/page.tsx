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

  // Fetch channels (Team, Group, Announce)
  const allChannels = await prisma.channel.findMany({
    where: { kind: { in: [ChannelKind.TEAM, ChannelKind.GROUP, ChannelKind.ANNOUNCE] } },
    include: {
      team: { include: { members: true } },
      members: true,
    }
  });

  const channels = allChannels.map((c: any) => ({
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
      members: true
    }
  });

  const memberIds = dms.flatMap((dm: any) => dm.members.map((m: any) => m.userId)).filter((id: any) => id !== user.id);
  const dmUsers = await prisma.user.findMany({ where: { id: { in: memberIds } } });

  const directMessages = dms.map((dm: any) => {
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

  const allUsers = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true, role: true, email: true }
  });

  // Fetch initial messages from DB
  const rawMessages = await prisma.message.findMany({
    where: { deletedAt: null },
    include: { reactions: true },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  const userMap = new Map(allUsers.map((u: any) => [u.id, u]));

  const initialMessagesByChannel: Record<string, any[]> = {};
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
  const initialLinks = rawLinks.map((l: any) => ({
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
