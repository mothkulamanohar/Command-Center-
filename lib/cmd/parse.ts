import { ParseResult, CommandSlots } from "./intents";
import { parseDateExpression } from "./dates";
import { matchQueryAndNav, matchOrgAndComms } from "./parse-helpers";
import { matchTaskActions } from "./parse-actions";
import { matchV11Intents } from "./parse-v11";

/**
 * Rule-based Plain-English Command Parser per SPEC §8.2 & §8.3
 * Recognizes all canonical intents and Tenglish variants.
 */
export function parseCommand(rawText: string): ParseResult {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 0. v1.1 intents (To-do, Attendance, Feedback, TimeLog, Certificates)
  const v11Result = matchV11Intents(text, lower);
  if (v11Result) return v11Result;

  // 1. Queries and navigation
  const queryResult = matchQueryAndNav(text, lower);
  if (queryResult) return queryResult;

  // 2. Org, Comms, and Events
  const orgResult = matchOrgAndComms(text, lower);
  if (orgResult) return orgResult;

  // 3. Daily Update (must precede task actions so 'update: finished ...' is POST_UPDATE)
  if (lower.startsWith("update:") || lower.startsWith("daily update:")) {
    return {
      intent: "POST_UPDATE",
      confidence: 0.95,
      slots: { text: text.replace(/^(?:daily\s+)?update:\s*/i, "") },
      preview: "Post your daily update with Done, Next, and Blockers",
    };
  }

  // 4. Task mutations, status, priority, comments, and marks
  const actionResult = matchTaskActions(text);
  if (actionResult) return actionResult;

  // 5. Reports
  const reportMatch = text.match(/(?:download|export|generate)\s+(.+?)(?:\s+as\s+(pdf|excel|xlsx|docx))?$/i);
  if (reportMatch || /jpa for/i.test(lower)) {
    return {
      intent: "REPORT",
      confidence: 0.92,
      slots: { text },
      preview: `Generate report: ${text}`,
    };
  }

  // 6. Assign syntax: "assign <task> to <person> [due <date>]"
  const assignToMatch = text.match(/^assign\s+(.+?)\s+to\s+([a-zA-Z\s]+?)(?:\s+(?:due|by)\s+([^,]+))?$/i);
  if (assignToMatch && assignToMatch[1] && assignToMatch[2]) {
    const title = assignToMatch[1].trim();
    const owner = assignToMatch[2].trim();
    let due: Date | null = null;
    if (assignToMatch[3]) {
      const parsedDate = parseDateExpression(assignToMatch[3].trim());
      due = parsedDate.date;
    }
    return {
      intent: "ASSIGN_TASK",
      confidence: 0.91,
      slots: { title, owner, due },
      preview: `Assign '${title}' to ${owner}${due ? ` due ${due.toISOString()}` : ""}`,
    };
  }

  // 7. Assign syntax: "ask/tell <person> to <task>" or Tenglish "<person> ki cheppu <task>"
  const assignMatch =
    text.match(/^(?:ask|tell)\s+([a-zA-Z\s]+?)\s+to\s+(.+)$/i) ||
    text.match(/^([a-zA-Z\s]+?)\s+ki\s+cheppu\s+(.+)$/i);

  if (assignMatch && assignMatch[1] && assignMatch[2]) {
    const owner = assignMatch[1].trim();
    let remainder = assignMatch[2].trim();

    let cadence: CommandSlots["cadence"] = undefined;
    let everyNDays: number | undefined = undefined;

    if (/chase daily/i.test(remainder)) {
      cadence = "DAILY";
      remainder = remainder.replace(/\s*,?\s*chase daily/i, "");
    } else if (/remind (?:him|her|them) weekly/i.test(remainder)) {
      cadence = "WEEKLY";
      remainder = remainder.replace(/\s*,?\s*remind (?:him|her|them) weekly/i, "");
    } else if (/(?:chase|remind)\s+every\s+(\d+)\s+days/i.test(remainder)) {
      const matchDays = remainder.match(/(?:chase|remind)\s+every\s+(\d+)\s+days/i);
      cadence = "EVERY_N_DAYS";
      everyNDays = matchDays && matchDays[1] ? parseInt(matchDays[1], 10) : 2;
      remainder = remainder.replace(/\s*,?\s*(?:chase|remind)\s+every\s+\d+\s+days/i, "");
    }

    const needsApproval = /ask me first/i.test(remainder);
    remainder = remainder.replace(/\s*,?\s*ask me first/i, "");

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
        everyNDays,
        needsApproval,
      },
      preview: `Assign '${remainder}' to ${owner}${due ? ` due ${due.toISOString()}` : ""}${cadence ? ` (chase ${cadence.toLowerCase()})` : ""}`,
    };
  }

  // 8. Standalone Follow-up
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

  // 9. ADD_TASK fallback
  let taskTitle = text;
  let requesterName: string | undefined;

  const addPrefixMatch = text.match(/^(?:add:?|todo:?|remind me to)\s+(.+)$/i);
  if (addPrefixMatch && addPrefixMatch[1]) {
    taskTitle = addPrefixMatch[1].trim();
  }

  const wantsMatch = taskTitle.match(/^([a-zA-Z\s]+?)\s+wants\s+(.+)$/i);
  if (wantsMatch && wantsMatch[1] && wantsMatch[2]) {
    requesterName = wantsMatch[1].trim();
    taskTitle = wantsMatch[2].trim();
  }

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
