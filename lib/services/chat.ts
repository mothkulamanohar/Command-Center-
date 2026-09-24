import { z } from "zod";
import { db } from "@/lib/db";
import { can, UserContext } from "@/lib/auth/can";
import { emitToChannel } from "@/lib/socket";
import { saveExtractedLinks } from "@/lib/services/links";
import { Prisma } from "@prisma/client";

export const TASK_REF_REGEX = /T-(\d+)/g;

export const PostMessageSchema = z.object({
  channelId: z.string(),
  body: z.string().min(1),
  parentId: z.string().optional(),
  kind: z.string().default("TEXT"),
  meta: z.record(z.unknown()).default({}),
});

/**
 * Extracts task references e.g. T-1042 from message text
 */
export function extractTaskRefs(text: string): number[] {
  const matches = [...text.matchAll(TASK_REF_REGEX)];
  return matches.map((m) => parseInt(m[1]!, 10));
}

/**
 * Parse /kudos @person reason command per SPEC F-CHAT-14
 */
export function parseKudosCommand(text: string): { targetName: string; reason: string } | null {
  const match = text.match(/^\/kudos\s+@?([a-zA-Z0-9_\.\-]+)\s+(?:for\s+)?(.+)$/i);
  if (!match || !match[1] || !match[2]) return null;
  return {
    targetName: match[1].trim(),
    reason: match[2].trim(),
  };
}

/**
 * F-CHAT-03: Post message to channel or DM
 */
export async function postMessage(actor: UserContext, input: z.infer<typeof PostMessageSchema>) {
  if (!can(actor, "chat_post")) {
    throw new Error("Unauthorized to post messages");
  }

  const data = PostMessageSchema.parse(input);
  const taskNumbers = extractTaskRefs(data.body);
  const kudos = parseKudosCommand(data.body);

  let kind = data.kind;
  let meta = data.meta;

  if (kudos) {
    kind = "KUDOS";
    meta = { ...meta, kudosTarget: kudos.targetName, kudosReason: kudos.reason };
  } else if (taskNumbers.length > 0) {
    meta = { ...meta, taskRefs: taskNumbers };
  }

  return await db.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: {
        channelId: data.channelId,
        authorId: actor.id,
        body: data.body,
        kind,
        meta: (meta as Prisma.InputJsonValue) ?? {},
        parentId: data.parentId,
      },
    });

    // If Kudos, write Kudos record
    if (kudos) {
      const targetUser = await tx.user.findFirst({
        where: {
          OR: [
            { name: { contains: kudos.targetName, mode: "insensitive" } },
            { displayName: { contains: kudos.targetName, mode: "insensitive" } },
            { email: { contains: kudos.targetName, mode: "insensitive" } },
          ],
        },
      });

      if (targetUser) {
        await tx.kudos.create({
          data: {
            fromId: actor.id,
            toId: targetUser.id,
            reason: kudos.reason,
            messageId: msg.id,
          },
        });
      }
    }

    // Auto-save URLs to team Links board per F-CHAT-09
    await saveExtractedLinks(actor, data.channelId, msg.id, data.body);

    // Emit real-time message event via Socket.IO
    emitToChannel(data.channelId, "message:new", {
      id: msg.id,
      channelId: msg.channelId,
      authorId: msg.authorId,
      body: msg.body,
      kind: msg.kind,
      meta: msg.meta,
      createdAt: msg.createdAt,
    });

    return msg;
  });
}

/**
 * F-CHAT-03: Toggle emoji reaction on message
 */
export async function toggleReaction(actor: UserContext, messageId: string, emoji: string) {
  const existing = await db.reaction.findUnique({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId: actor.id,
        emoji,
      },
    },
  });

  if (existing) {
    await db.reaction.delete({ where: { id: existing.id } });
    return { added: false, emoji };
  } else {
    await db.reaction.create({
      data: { messageId, userId: actor.id, emoji },
    });
    return { added: true, emoji };
  }
}

/**
 * F-CHAT-12: Acknowledge announcement ("Got it")
 */
export async function acknowledgeAnnouncement(actor: UserContext, messageId: string) {
  return await db.acknowledgement.upsert({
    where: {
      messageId_userId: { messageId, userId: actor.id },
    },
    update: { at: new Date() },
    create: { messageId, userId: actor.id },
  });
}
