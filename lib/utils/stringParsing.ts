export const TASK_REF_REGEX = /T-(\d+)/g;
export const URL_REGEX = /(https?:\/\/[^\s]+)/g;

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
 * Extracts all URLs from a text string
 */
export function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX);
  if (!matches) return [];
  const cleaned = matches.map((u) => u.replace(/[.,;:!?\)\]>]+$/, ""));
  return Array.from(new Set(cleaned));
}
