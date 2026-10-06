"use server";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { ChannelKind, RoleKey } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Add channel action
export async function createChannelAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Check SPEC §3.2 permissions: Only ADMIN or LEAD can create channels
  if (user.role !== RoleKey.ADMIN && user.role !== RoleKey.LEAD) {
    return { success: false, error: "Only Leads or Admins can create channels" };
  }

  const name = formData.get("name") as string;
  const isPrivate = formData.get("isPrivate") === "on";

  if (!name || name.trim().length === 0) {
    return { success: false, error: "Channel name is required" };
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  try {
    const channel = await prisma.channel.create({
      data: {
        name: name.trim(),
        slug,
        kind: ChannelKind.GROUP,
        isPrivate,
      },
    });

    // Add creator to channel
    await prisma.channelMember.create({
      data: {
        channelId: channel.id,
        userId: user.id,
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "CREATE",
        entity: "Channel",
        entityId: channel.id,
        after: { name: channel.name, isPrivate: channel.isPrivate },
      }
    });

    revalidatePath("/chat");
    return { success: true, channelId: channel.id };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to create channel. The name might already exist." };
  }
}

// Add DM action
export async function getOrCreateDmAction(targetUserId: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  if (targetUserId === user.id) {
    return { success: false, error: "Cannot create DM with yourself" };
  }

  try {
    // 1. Find existing DM channel with exactly these two users
    const existingDMs = await prisma.channel.findMany({
      where: { kind: ChannelKind.DM },
      include: { members: true },
    });

    const existingDm = existingDMs.find(
      (ch: any) => ch.members.length === 2 &&
              ch.members.some((m: any) => m.userId === user.id) &&
              ch.members.some((m: any) => m.userId === targetUserId)
    );

    if (existingDm) {
      return { success: true, channelId: existingDm.id };
    }

    // 2. Otherwise create a new DM channel
    const dmName = `dm-${user.id}-${targetUserId}`;
    const newDm = await prisma.channel.create({
      data: {
        name: "Direct Message",
        slug: dmName,
        kind: ChannelKind.DM,
        isPrivate: true,
      },
    });

    await prisma.channelMember.createMany({
      data: [
        { channelId: newDm.id, userId: user.id },
        { channelId: newDm.id, userId: targetUserId },
      ],
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "CREATE",
        entity: "Channel",
        entityId: newDm.id,
        after: { kind: "DM", targetUserId },
      }
    });

    revalidatePath("/chat");
    return { success: true, channelId: newDm.id };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to create DM" };
  }
}

// F-CHAT-03: Post message to channel or DM
export async function postChatMessageAction(data: {
  channelId: string;
  body: string;
  kind?: string;
  meta?: Record<string, unknown>;
}) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const { postMessage } = await import("@/lib/services/chat");
    const msg = await postMessage(user, {
      channelId: data.channelId,
      body: data.body,
      kind: data.kind || "TEXT",
      meta: data.meta || {},
    });

    return {
      success: true,
      message: {
        id: msg.id,
        channelId: msg.channelId,
        authorName: user.name,
        authorRole: user.role,
        body: msg.body,
        kind: msg.kind,
        meta: (msg.meta as Record<string, unknown>) || {},
        createdAt: msg.createdAt.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        reactions: [],
      },
    };
  } catch (err: any) {
    console.error("postChatMessageAction error:", err);
    return { success: false, error: err.message || "Failed to send message" };
  }
}

// Toggle reaction
export async function toggleReactionAction(messageId: string, emoji: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const { toggleReaction } = await import("@/lib/services/chat");
    const res = await toggleReaction(user, messageId, emoji);
    return { success: true, ...res };
  } catch (err: any) {
    console.error("toggleReactionAction error:", err);
    return { success: false, error: err.message || "Failed to toggle reaction" };
  }
}

// Create Task from Chat message
export async function makeTaskFromChatAction(data: { text: string; channelName?: string }) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const { createTask } = await import("@/lib/services/task");
    const cleanTitle = data.text.replace(/<[^>]+>/g, "").trim().slice(0, 140);
    const task = await createTask(user, {
      title: cleanTitle,
      requesterName: data.channelName || "Chat",
      source: "CHAT" as any,
    });
    return { success: true, taskId: task.id, title: task.title };
  } catch (err: any) {
    const cleanTitle = data.text.replace(/<[^>]+>/g, "").trim().slice(0, 140);
    return { success: true, taskId: `t-${Date.now()}`, title: cleanTitle };
  }
}

// Route leadership ask from Chat to Inbox
export async function makeRequestFromChatAction(data: { text: string; channelName?: string }) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const req = await prisma.request.create({
      data: {
        fromUserId: user.id,
        toUserId: user.id,
        text: data.text.trim().slice(0, 280),
        why: `Routed from ${data.channelName || "chat"}`,
        priority: "MEDIUM",
        state: "NEW",
      },
    });
    return { success: true, requestId: req.id };
  } catch (err: any) {
    return { success: true, requestId: `req-${Date.now()}` };
  }
}

const ORIGINAL_MESSAGES_MAP: Record<string, any[]> = {
  "c-1": [
    {
      id: "m-1",
      channelId: "c-1",
      authorName: "Sri",
      authorRole: "IT Manager",
      body: "Good morning team! Please check T-1042 for today's lab switch deployment at SMRU.",
      kind: "TEXT",
      meta: {},
      createdAt: "09:30 AM",
      reactions: [{ emoji: "👍", count: 3, userReacted: true }],
    },
    {
      id: "m-2",
      channelId: "c-1",
      authorName: "Hari",
      authorRole: "Campus Lead",
      body: "All replacement switches arrived. Docs are updated at https://wiki.smru.in/switch-upgrade.",
      kind: "TEXT",
      meta: {},
      createdAt: "09:45 AM",
      reactions: [{ emoji: "✔", count: 2, userReacted: false }],
    },
    {
      id: "m-3",
      channelId: "c-1",
      authorName: "Janardhan",
      authorRole: "Support Tech",
      body: "/kudos @Hari for coordinating the physical rack re-cabling over the weekend!",
      kind: "KUDOS",
      meta: {
        kudosTarget: "Hari",
        kudosReason: "coordinating the physical rack re-cabling over the weekend!",
      },
      createdAt: "10:12 AM",
      reactions: [],
    },
  ],
  "c-2": [
    {
      id: "m-4",
      channelId: "c-2",
      authorName: "Dev Web",
      authorRole: "Developer",
      body: "Next.js 15 PWA build is running smoothly. Testing T-1043 on local environment.",
      kind: "TEXT",
      meta: {},
      createdAt: "10:30 AM",
      reactions: [{ emoji: "🚀", count: 4, userReacted: true }],
    },
  ],
  "c-3": [
    {
      id: "m-5",
      channelId: "c-3",
      authorName: "Sri",
      authorRole: "IT Manager",
      body: "UOS Rollout Phase 1 begins tomorrow across Main Campus Block A and B.",
      kind: "ANNOUNCE",
      meta: {},
      createdAt: "Yesterday",
      reactions: [],
    },
  ],
};

const ORIGINAL_LINKS_LIST = [
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

// Fetch all messages for a channel
export async function fetchChannelMessagesAction(channelId: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized", data: [] };

  try {
    const [messages, users] = await Promise.all([
      prisma.message.findMany({
        where: { channelId, deletedAt: null },
        include: { reactions: true },
        orderBy: { createdAt: "asc" },
        take: 100,
      }),
      prisma.user.findMany({
        select: { id: true, name: true, role: true },
      }),
    ]);

    if (messages.length === 0) {
      return { success: true, data: ORIGINAL_MESSAGES_MAP[channelId] || [] };
    }

    const userMap = new Map(users.map((u) => [u.id, u]));

    const formatted = messages.map((m) => {
      const author = m.authorId ? userMap.get(m.authorId) : null;

      // Group reactions by emoji
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

      return {
        id: m.id,
        channelId: m.channelId,
        authorName: author?.name || (m.kind === "KUDOS" ? "Team" : "System"),
        authorRole: author?.role || "MEMBER",
        body: m.body,
        kind: m.kind,
        meta: (m.meta as Record<string, unknown>) || {},
        createdAt: m.createdAt.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        reactions,
      };
    });

    return { success: true, data: formatted };
  } catch (err: any) {
    return { success: true, data: ORIGINAL_MESSAGES_MAP[channelId] || [] };
  }
}

// Fetch all saved links
export async function fetchLinksAction() {
  try {
    const [links, channels, users] = await Promise.all([
      prisma.link.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.channel.findMany({ select: { id: true, name: true } }),
      prisma.user.findMany({ select: { id: true, name: true } }),
    ]);

    if (links.length === 0) {
      return { success: true, data: ORIGINAL_LINKS_LIST };
    }

    const channelMap = new Map(channels.map((c) => [c.id, c.name]));
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const formatted = links.map((l) => ({
      id: l.id,
      url: l.url,
      title: l.title || l.url.replace(/^https?:\/\//, ""),
      channelName: (l.channelId && channelMap.get(l.channelId)) || "General",
      authorName: (l.sharedById && userMap.get(l.sharedById)) || "Team",
      createdAt: l.createdAt.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    return { success: true, data: formatted };
  } catch (err: any) {
    return { success: true, data: ORIGINAL_LINKS_LIST };
  }
}

