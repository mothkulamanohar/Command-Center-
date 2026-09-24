import { IntentType, ParseResult, CommandSlots } from "./intents";
import { parseDateExpression } from "./dates";

/**
 * Rule-based Plain-English Command Parser per SPEC §8.2 & §8.3
 */
export function parseCommand(rawText: string): ParseResult {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. HELP
  if (/^(help|\?|what can i type\??)$/i.test(lower)) {
    return {
      intent: "HELP",
      confidence: 1.0,
      slots: {},
      preview: "Show Command Center plain-English cheatsheet",
    };
  }

  // 2. UNDO
  if (/^undo$/i.test(lower)) {
    return {
      intent: "UNDO",
      confidence: 1.0,
      slots: {},
      preview: "Undo last command (within 10 minutes)",
    };
  }

  // 3. QUERY_DAY
  if (/^(what'?s my day\??|today|what'?s due today|what'?s due tomorrow)$/i.test(lower)) {
    return {
      intent: "QUERY_DAY",
      confidence: 0.95,
      slots: { query: text },
      preview: "Show today's schedule, items you owe, and follow-ups going out",
    };
  }

  // 4. QUERY_CHASING
  if (/^what (am i chasing|does .+ owe me)\??$/i.test(lower)) {
    return {
      intent: "QUERY_CHASING",
      confidence: 0.95,
      slots: { query: text },
      preview: "List open tasks you are chasing from others",
    };
  }

  // 5. QUERY_FIND
  if (lower.startsWith("find ") || lower.startsWith("? ")) {
    const q = text.replace(/^(find|\?)\s+/i, "");
    return {
      intent: "QUERY_FIND",
      confidence: 0.95,
      slots: { query: q },
      preview: `Search for '${q}' across tasks, docs, and messages`,
    };
  }

  // 6. MARK_DONE
  const doneMatch =
    text.match(/^(?:mark\s+)?(T-\d+)\s+done$/i) ||
    text.match(/^done\s+(.+)$/i) ||
    text.match(/^(.+?)\s+finished\s+(.+)$/i);
  if (doneMatch) {
    const ref = doneMatch[1]?.startsWith("T-") ? doneMatch[1] : undefined;
    const title = ref ? undefined : doneMatch[1];
    return {
      intent: "MARK_DONE",
      confidence: 0.95,
      slots: { taskRef: ref, title },
      preview: `Mark ${ref || title} as DONE`,
    };
  }

  // 7. REPORT
  const reportMatch = text.match(/(?:download|export|generate)\s+(.+?)(?:\s+as\s+(pdf|excel|docx))?$/i);
  if (reportMatch || /jpa for/i.test(lower)) {
    return {
      intent: "REPORT",
      confidence: 0.9,
      slots: { text },
      preview: `Generate report: ${text}`,
    };
  }

  // 8. POST_UPDATE
  if (lower.startsWith("update:") || lower.startsWith("daily update:")) {
    return {
      intent: "POST_UPDATE",
      confidence: 0.95,
      slots: { text: text.replace(/^(?:daily\s+)?update:\s*/i, "") },
      preview: "Post your daily update with Done, Next, and Blockers",
    };
  }

  // 9. ASSIGN_TASK & ASSIGN_WITH_CHASE
  const assignMatch = text.match(/^(?:ask|tell|assign)\s+([a-zA-Z\s]+?)\s+to\s+(.+)$/i);
  if (assignMatch && assignMatch[1] && assignMatch[2]) {
    const owner = assignMatch[1].trim();
    let remainder = assignMatch[2].trim();

    // Check cadence
    let cadence: CommandSlots["cadence"] = undefined;
    if (/chase daily/i.test(remainder)) {
      cadence = "DAILY";
      remainder = remainder.replace(/\s*,?\s*chase daily/i, "");
    } else if (/remind (?:him|her|them) weekly/i.test(remainder)) {
      cadence = "WEEKLY";
      remainder = remainder.replace(/\s*,?\s*remind (?:him|her|them) weekly/i, "");
    }

    // Check approval
    const needsApproval = /ask me first/i.test(remainder);
    remainder = remainder.replace(/\s*,?\s*ask me first/i, "");

    // Check due date
    let due: Date | null = null;
    const dueMatch = remainder.match(/\s+(?:by|due|before)\s+([^,]+)$/i);
    if (dueMatch && dueMatch[1]) {
      const parsedDate = parseDateExpression(dueMatch[1]);
      if (parsedDate.date) {
        due = parsedDate.date;
        remainder = remainder.substring(0, remainder.lastIndexOf(dueMatch[0])).trim();
      }
    }

    return {
      intent: cadence ? "ASSIGN_WITH_CHASE" : "ASSIGN_TASK",
      confidence: 0.9,
      slots: {
        title: remainder,
        owner,
        due,
        cadence,
        needsApproval,
      },
      preview: `Assign '${remainder}' to ${owner}${due ? ` due ${due.toISOString()}` : ""}${cadence ? ` (chase ${cadence.toLowerCase()})` : ""}`,
    };
  }

  // 10. FOLLOW_UP
  const chaseMatch = text.match(/^(?:remind|follow up with|chase)\s+([a-zA-Z\s]+?)\s+(?:on|about)\s+(.+)$/i);
  if (chaseMatch && chaseMatch[1] && chaseMatch[2]) {
    return {
      intent: "FOLLOW_UP",
      confidence: 0.88,
      slots: {
        targetUser: chaseMatch[1].trim(),
        title: chaseMatch[2].trim(),
      },
      preview: `Schedule follow-up to ${chaseMatch[1].trim()} on '${chaseMatch[2].trim()}'`,
    };
  }

  // 11. PASS_TURN
  const passMatch = text.match(/^pass\s+(.+?)\s+to\s+(.+)$/i);
  if (passMatch && passMatch[1] && passMatch[2]) {
    return {
      intent: "PASS_TURN",
      confidence: 0.9,
      slots: { title: passMatch[1].trim(), targetUser: passMatch[2].trim() },
      preview: `Pass turn on '${passMatch[1].trim()}' to ${passMatch[2].trim()}`,
    };
  }

  // 12. CREATE_TEAM
  const createTeamMatch = text.match(/^create\s+team\s+(.+?)\s+under\s+(.+?)\s+lead\s+(.+)$/i);
  if (createTeamMatch && createTeamMatch[1] && createTeamMatch[2] && createTeamMatch[3]) {
    return {
      intent: "CREATE_TEAM",
      confidence: 0.92,
      slots: {
        team: createTeamMatch[1].trim(),
        campus: createTeamMatch[2].trim(),
        owner: createTeamMatch[3].trim(),
      },
      preview: `Create team '${createTeamMatch[1].trim()}' in campus '${createTeamMatch[2].trim()}' lead by ${createTeamMatch[3].trim()}`,
    };
  }

  // 13. ADD_TASK fallback ("Add: ...", "todo ...", or general sentence)
  let taskTitle = text;
  let requesterName: string | undefined;

  const addPrefixMatch = text.match(/^(?:add:?|todo:?|remind me to)\s+(.+)$/i);
  if (addPrefixMatch && addPrefixMatch[1]) {
    taskTitle = addPrefixMatch[1].trim();
  }

  // Check "X wants Y" pattern per SPEC §8.3
  const wantsMatch = taskTitle.match(/^([a-zA-Z\s]+?)\s+wants\s+(.+)$/i);
  if (wantsMatch && wantsMatch[1] && wantsMatch[2]) {
    requesterName = wantsMatch[1].trim();
    taskTitle = wantsMatch[2].trim();
  }

  // Parse due date if present
  let due: Date | null = null;
  const dueMatch = taskTitle.match(/\s+(?:by|before|due)\s+([^,]+)$/i);
  if (dueMatch && dueMatch[1]) {
    const parsedDate = parseDateExpression(dueMatch[1]);
    if (parsedDate.date) {
      due = parsedDate.date;
      taskTitle = taskTitle.substring(0, taskTitle.lastIndexOf(dueMatch[0])).trim();
    }
  }

  return {
    intent: "ADD_TASK",
    confidence: 0.75,
    slots: {
      title: taskTitle,
      requesterName,
      due,
    },
    preview: `Create task '${taskTitle}' for me${requesterName ? ` requested by ${requesterName}` : ""}`,
  };
}
