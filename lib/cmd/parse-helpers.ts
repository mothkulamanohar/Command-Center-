import { ParseResult, CommandSlots } from "./intents";
import { parseDateExpression } from "./dates";

export function matchQueryAndNav(text: string, lower: string): ParseResult | null {
  // HELP
  if (/^(help|\?|what can i type\??)$/i.test(lower)) {
    return {
      intent: "HELP",
      confidence: 1.0,
      slots: {},
      preview: "Show Command Center plain-English cheatsheet",
    };
  }

  // UNDO
  if (/^undo$/i.test(lower)) {
    return {
      intent: "UNDO",
      confidence: 1.0,
      slots: {},
      preview: "Undo last command (within 10 minutes)",
    };
  }

  // QUERY_DAY
  if (/^(what'?s my day\??|today|what'?s due today|what'?s due tomorrow)$/i.test(lower)) {
    return {
      intent: "QUERY_DAY",
      confidence: 0.95,
      slots: { query: text },
      preview: "Show today's schedule, items you owe, and follow-ups going out",
    };
  }

  // QUERY_CHASING
  if (/^what (?:am i chasing|does .+ owe me)\??$/i.test(lower)) {
    return {
      intent: "QUERY_CHASING",
      confidence: 0.95,
      slots: { query: text },
      preview: "List open tasks you are chasing from others",
    };
  }

  // QUERY_STATUS
  const statusQMatch = text.match(/^(?:status of|how is)\s+(.+?)(?:\s+doing)?\??$/i);
  if (statusQMatch && statusQMatch[1]) {
    return {
      intent: "QUERY_STATUS",
      confidence: 0.95,
      slots: { query: statusQMatch[1].trim() },
      preview: `Show status summary for '${statusQMatch[1].trim()}'`,
    };
  }

  // QUERY_FIND
  if (lower.startsWith("find ") || lower.startsWith("? ") || lower.startsWith("search ")) {
    const q = text.replace(/^(find|\?|search)\s+/i, "");
    return {
      intent: "QUERY_FIND",
      confidence: 0.95,
      slots: { query: q },
      preview: `Search for '${q}' across tasks, docs, and messages`,
    };
  }

  // OPEN
  const openMatch = text.match(/^(?:open|go to)\s+(.+)$/i);
  if (openMatch && openMatch[1]) {
    return {
      intent: "OPEN",
      confidence: 0.95,
      slots: { query: openMatch[1].trim() },
      preview: `Navigate to '${openMatch[1].trim()}'`,
    };
  }

  return null;
}

export function matchOrgAndComms(text: string, lower: string): ParseResult | null {
  // CREATE_TEAM
  const createTeamMatch = text.match(/^create\s+team\s+(.+?)\s+under\s+(.+?)\s+lead\s+(.+)$/i);
  if (createTeamMatch && createTeamMatch[1] && createTeamMatch[2] && createTeamMatch[3]) {
    return {
      intent: "CREATE_TEAM",
      confidence: 0.94,
      slots: {
        team: createTeamMatch[1].trim(),
        campus: createTeamMatch[2].trim(),
        owner: createTeamMatch[3].trim(),
      },
      preview: `Create team '${createTeamMatch[1].trim()}' in campus '${createTeamMatch[2].trim()}' lead by ${createTeamMatch[3].trim()}`,
    };
  }

  // CREATE_GROUP
  const groupMatch = text.match(/^create\s+(?:group|channel)\s+(.+?)(?:\s+with\s+(.+))?$/i);
  if (groupMatch && groupMatch[1]) {
    return {
      intent: "CREATE_GROUP",
      confidence: 0.92,
      slots: { channel: groupMatch[1].trim(), text: groupMatch[2]?.trim() },
      preview: `Create chat channel '${groupMatch[1].trim()}'${groupMatch[2] ? ` with ${groupMatch[2]}` : ""}`,
    };
  }

  // CREATE_CAMPUS
  const campusMatch = text.match(/^(?:add|create)\s+campus\s+(.+)$/i);
  if (campusMatch && campusMatch[1]) {
    return {
      intent: "CREATE_CAMPUS",
      confidence: 0.94,
      slots: { campus: campusMatch[1].trim() },
      preview: `Create new campus: '${campusMatch[1].trim()}'`,
    };
  }

  // ADD_MEMBER
  const memberMatch = text.match(/^add\s+([a-zA-Z0-9\s]+?)\s+to\s+(?:team\s+)?(.+)$/i);
  if (memberMatch && memberMatch[1] && memberMatch[2]) {
    return {
      intent: "ADD_MEMBER",
      confidence: 0.92,
      slots: { targetUser: memberMatch[1].trim(), team: memberMatch[2].trim() },
      preview: `Add '${memberMatch[1].trim()}' to team '${memberMatch[2].trim()}'`,
    };
  }

  // CREATE_EVENT
  const eventMatch =
    text.match(/^(?:meeting with|schedule meeting with)\s+(.+)$/i) ||
    text.match(/^block\s+(.+?)\s+for\s+(.+)$/i);
  if (eventMatch) {
    return {
      intent: "CREATE_EVENT",
      confidence: 0.9,
      slots: { text },
      preview: `Schedule event: ${text}`,
    };
  }

  // MESSAGE
  const msgMatch =
    text.match(/^tell\s+(#.+?)\s+(.+)$/i) ||
    text.match(/^message\s+([a-zA-Z0-9\s]+?):\s*(.+)$/i);
  if (msgMatch && msgMatch[1] && msgMatch[2]) {
    const isChannel = msgMatch[1].startsWith("#");
    return {
      intent: "MESSAGE",
      confidence: 0.92,
      slots: {
        channel: isChannel ? msgMatch[1] : undefined,
        targetUser: isChannel ? undefined : msgMatch[1],
        text: msgMatch[2].trim(),
      },
      preview: `Send message to ${msgMatch[1]}: "${msgMatch[2].trim()}"`,
    };
  }

  return null;
}
