import { ParseResult } from "./intents";
import { parseDateExpression } from "./dates";

export function matchTaskActions(text: string): ParseResult | null {
  // SHARED_TASK
  const shareMatch =
    text.match(/^share with\s+([a-zA-Z\s]+?):\s*(.+?),\s*(my|their)\s+turn/i) ||
    text.match(/^([a-zA-Z\s]+?)\s+and\s+me:\s*(.+?),\s*(my|their)\s+turn/i);
  if (shareMatch && shareMatch[1] && shareMatch[2] && shareMatch[3]) {
    const partner = shareMatch[1].trim();
    const title = shareMatch[2].trim();
    const whoseTurn = shareMatch[3].toLowerCase() === "my" ? "ME" : "PARTNER";
    return {
      intent: "SHARED_TASK",
      confidence: 0.93,
      slots: { title, targetUser: partner, status: whoseTurn },
      preview: `Create shared task '${title}' with ${partner} (${whoseTurn === "ME" ? "my turn first" : "their turn first"})`,
    };
  }

  // PASS_TURN
  const passMatch =
    text.match(/^pass\s+(?:turn on\s+)?(.+?)\s+to\s+(.+)$/i) ||
    text.match(/^my turn on\s+(.+)$/i);
  if (passMatch) {
    const title = passMatch[1]?.trim();
    const targetUser = passMatch[2]?.trim() || "me";
    return {
      intent: "PASS_TURN",
      confidence: 0.92,
      slots: { title, targetUser },
      preview: `Pass turn on '${title}' to ${targetUser}`,
    };
  }

  // MOVE_DUE
  const moveDueMatch = text.match(/^(?:move|push|reschedule)\s+(.+?)\s+to\s+(.+)$/i);
  if (moveDueMatch && moveDueMatch[1] && moveDueMatch[2]) {
    const parsedDate = parseDateExpression(moveDueMatch[2].trim());
    return {
      intent: "MOVE_DUE",
      confidence: 0.92,
      slots: {
        taskRef: moveDueMatch[1].trim().startsWith("T-") ? moveDueMatch[1].trim() : undefined,
        title: !moveDueMatch[1].trim().startsWith("T-") ? moveDueMatch[1].trim() : undefined,
        due: parsedDate.date,
      },
      preview: `Reschedule '${moveDueMatch[1].trim()}' to ${moveDueMatch[2].trim()}`,
    };
  }

  // CHANGE_OWNER
  const ownerMatch = text.match(/^(?:give|reassign)\s+(.+?)\s+to\s+(.+)$/i);
  if (ownerMatch && ownerMatch[1] && ownerMatch[2]) {
    return {
      intent: "CHANGE_OWNER",
      confidence: 0.92,
      slots: {
        taskRef: ownerMatch[1].trim().startsWith("T-") ? ownerMatch[1].trim() : undefined,
        title: !ownerMatch[1].trim().startsWith("T-") ? ownerMatch[1].trim() : undefined,
        owner: ownerMatch[2].trim(),
      },
      preview: `Reassign '${ownerMatch[1].trim()}' to ${ownerMatch[2].trim()}`,
    };
  }

  // SET_PRIORITY
  const prioMatch =
    text.match(/^(.+?)\s+is\s+(urgent|high\s+priority|low\s+priority|medium\s+priority)$/i) ||
    text.match(/^(?:make|set)\s+(.+?)\s+(?:to\s+)?(urgent|high|medium|low)(?:\s+priority)?$/i);
  if (prioMatch && prioMatch[1] && prioMatch[2]) {
    const rawP = prioMatch[2].toLowerCase().replace(/\s+priority/, "");
    const priority = rawP === "urgent" ? "URGENT" : rawP === "high" ? "HIGH" : rawP === "low" ? "LOW" : "MEDIUM";
    return {
      intent: "SET_PRIORITY",
      confidence: 0.93,
      slots: {
        taskRef: prioMatch[1].trim().startsWith("T-") ? prioMatch[1].trim() : undefined,
        title: !prioMatch[1].trim().startsWith("T-") ? prioMatch[1].trim() : undefined,
        priority,
      },
      preview: `Set priority of '${prioMatch[1].trim()}' to ${priority}`,
    };
  }

  // DELETE
  const delMatch = text.match(/^(?:delete|remove)\s+(?:the\s+)?(.+)$/i);
  if (delMatch && delMatch[1]) {
    return {
      intent: "DELETE",
      confidence: 0.92,
      slots: {
        taskRef: delMatch[1].trim().startsWith("T-") ? delMatch[1].trim() : undefined,
        title: !delMatch[1].trim().startsWith("T-") ? delMatch[1].trim() : undefined,
      },
      preview: `Delete '${delMatch[1].trim()}' (requires confirmation)`,
    };
  }

  // COMMENT
  const noteMatch = text.match(/^(?:note|comment)\s+on\s+(.+?):\s*(.+)$/i);
  if (noteMatch && noteMatch[1] && noteMatch[2]) {
    return {
      intent: "COMMENT",
      confidence: 0.92,
      slots: {
        taskRef: noteMatch[1].trim().startsWith("T-") ? noteMatch[1].trim() : undefined,
        title: !noteMatch[1].trim().startsWith("T-") ? noteMatch[1].trim() : undefined,
        text: noteMatch[2].trim(),
      },
      preview: `Add note to '${noteMatch[1].trim()}': "${noteMatch[2].trim()}"`,
    };
  }

  // UPDATE_STATUS
  const statusMatch =
    text.match(/^(.+?)\s+is\s+(blocked(?:\s+waiting\s+for\s+.+)?|in\s+review|in\s+progress)$/i) ||
    text.match(/^task\s+(T-\d+)\s+(in\s+review|in\s+progress|blocked)$/i);
  if (statusMatch && statusMatch[1] && statusMatch[2]) {
    return {
      intent: "UPDATE_STATUS",
      confidence: 0.91,
      slots: {
        taskRef: statusMatch[1].trim().startsWith("T-") ? statusMatch[1].trim() : undefined,
        title: !statusMatch[1].trim().startsWith("T-") ? statusMatch[1].trim() : undefined,
        status: statusMatch[2].trim().toUpperCase().replace(/\s+/g, "_"),
      },
      preview: `Update status of '${statusMatch[1].trim()}' to ${statusMatch[2].trim().toUpperCase()}`,
    };
  }

  // MARK_DONE
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

  return null;
}
