import { db } from "@/lib/db";
import { UserContext } from "@/lib/auth/can";

export { URL_REGEX, extractUrls } from "@/lib/utils/stringParsing";
import { extractUrls } from "@/lib/utils/stringParsing";

/**
 * F-CHAT-09: Save URLs shared in channel to team Links board
 */
export async function saveExtractedLinks(
  actor: UserContext,
  channelId: string,
  messageId: string,
  text: string
): Promise<void> {
  const urls = extractUrls(text);
  if (urls.length === 0) return;

  const channel = await db.channel.findUnique({
    where: { id: channelId },
    select: { teamId: true },
  });

  for (const url of urls) {
    try {
      await db.link.create({
        data: {
          url,
          channelId,
          messageId,
          teamId: channel?.teamId,
          sharedById: actor.id,
        },
      });
    } catch (err) {
      console.error("Failed to save link to board:", err);
    }
  }
}

/**
 * Get all links shared in a team or channel
 */
export async function getTeamLinks(teamId: string) {
  return await db.link.findMany({
    where: { teamId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
