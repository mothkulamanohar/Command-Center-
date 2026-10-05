import { ParseResult } from "./intents";
import { parseDateExpression } from "./dates";
import { parseDuration } from "@/lib/time/duration";

export function matchV11Intents(text: string, lower: string): ParseResult | null {
  // 1. CHECK_IN & CHECK_OUT
  if (
    /^check\s*in\b/i.test(lower) ||
    lower.startsWith("in from campus") ||
    lower.startsWith("working remote") ||
    lower.includes("office ki vachanu")
  ) {
    let mode = "OFFICE";
    if (lower.includes("remote")) mode = "REMOTE";
    if (lower.includes("campus") || lower.includes("chebrol")) mode = "CAMPUS";
    if (lower.includes("field")) mode = "FIELD";

    return {
      intent: "CHECK_IN",
      confidence: 0.95,
      slots: { mode },
    };
  }

  if (/^(?:check\s*out|leaving)\b/i.test(lower)) {
    return {
      intent: "CHECK_OUT",
      confidence: 0.95,
      slots: {},
    };
  }

  // 2. QUERY_ATTENDANCE
  if (
    lower.includes("who is in today") ||
    lower.includes("my attendance") ||
    lower.includes("attendance this month") ||
    /attendance\s+(?:for\s+)?(september|october|this month)/i.test(lower)
  ) {
    return {
      intent: "QUERY_ATTENDANCE",
      confidence: 0.94,
      slots: { text },
    };
  }

  // 3. APPLY_LEAVE
  if (/^(?:leave tomorrow|on leave|apply leave)/i.test(lower)) {
    return {
      intent: "APPLY_LEAVE",
      confidence: 0.93,
      slots: { text },
    };
  }

  // 4. TIMER: START_TIMER / STOP_TIMER
  if (/^(?:stop\s*timer|pause\s*timer|pause)\b/i.test(lower)) {
    return {
      intent: "STOP_TIMER",
      confidence: 0.96,
      slots: {},
    };
  }

  const startTimerMatch = text.match(/^start\s+timer(?:\s+on\s+(.+))?$/i) || text.match(/^start\s+(T-\d+)/i);
  if (startTimerMatch) {
    const target = startTimerMatch[1]?.trim();
    return {
      intent: "START_TIMER",
      confidence: 0.95,
      slots: {
        taskRef: target && target.startsWith("T-") ? target : undefined,
        title: target && !target.startsWith("T-") ? target : undefined,
      },
    };
  }

  // 5. LOG_TIME
  const logMatch = text.match(/^(?:log|spent)\s+([0-9.]+\s*[a-zA-Z]+)\s+(?:on|for)\s+(.+)$/i);
  if (logMatch && logMatch[1] && logMatch[2]) {
    const dur = parseDuration(logMatch[1]);
    const target = logMatch[2].trim();
    return {
      intent: "LOG_TIME",
      confidence: 0.94,
      slots: {
        durationMinutes: dur ? dur.totalMinutes : null,
        taskRef: target.startsWith("T-") ? target : undefined,
        title: !target.startsWith("T-") ? target : undefined,
      },
    };
  }

  // 6. SET_ESTIMATE
  const estMatch =
    text.match(/^estimate\s+(.+?)\s+([0-9.]+\s*[a-zA-Z]+.*)$/i) ||
    text.match(/^(.+?)\s+(?:will take|takes|ki)\s+([0-9.]+\s*(?:m|min|h|hr|d|days?|hours?|gantalu).*)(?:\s*padutundi)?$/i);
  if (estMatch && estMatch[1] && estMatch[2]) {
    const target = estMatch[1].trim();
    const dur = parseDuration(estMatch[2].replace(/gantalu/i, "hours"));
    return {
      intent: "SET_ESTIMATE",
      confidence: 0.93,
      slots: {
        taskRef: target.startsWith("T-") ? target : undefined,
        title: !target.startsWith("T-") ? target : undefined,
        durationMinutes: dur ? dur.totalMinutes : null,
      },
    };
  }

  // 7. GIVE_FEEDBACK
  const fbMatch =
    text.match(/^feedback\s+(.+?)\s+([1-5])\s*(?:stars?|★)?(?:\s+(.+))?$/i) ||
    text.match(/^rate\s+(.+?)\s+([1-5])$/i) ||
    text.match(/^(.+?)\s+ki\s+([1-5])\s+stars\s+ivvu$/i);

  if (fbMatch && fbMatch[1] && fbMatch[2]) {
    const target = fbMatch[1].trim();
    const rating = parseInt(fbMatch[2], 10);
    const comment = fbMatch[3]?.trim();
    return {
      intent: "GIVE_FEEDBACK",
      confidence: 0.95,
      slots: {
        taskRef: target.startsWith("T-") ? target : undefined,
        title: !target.startsWith("T-") ? target : undefined,
        rating,
        text: comment,
      },
    };
  }

  if (lower.includes("needs rework")) {
    const reworkMatch = text.match(/^(.+?)\s+needs\s+rework:\s*(.+)$/i);
    if (reworkMatch) {
      return {
        intent: "GIVE_FEEDBACK",
        confidence: 0.95,
        slots: {
          taskRef: reworkMatch[1].trim().startsWith("T-") ? reworkMatch[1].trim() : undefined,
          title: !reworkMatch[1].trim().startsWith("T-") ? reworkMatch[1].trim() : undefined,
          rating: 2,
          text: reworkMatch[2].trim(),
          status: "REWORK",
        },
      };
    }
  }

  // 8. ISSUE_CERTIFICATE
  const certMatch =
    text.match(/^issue\s+(?:completion\s+)?certificate\s+to\s+(.+)$/i) ||
    text.match(/^certificates?\s+for\s+(.+)$/i);
  if (certMatch && certMatch[1]) {
    return {
      intent: "ISSUE_CERTIFICATE",
      confidence: 0.94,
      slots: { targetUser: certMatch[1].trim() },
    };
  }

  // 9. TO-DO: ADD_TODO / SCHEDULE_TODO / DONE_TODO
  if (
    lower.startsWith("todo") ||
    lower.startsWith("to-do") ||
    lower.startsWith("plan ") ||
    lower.includes("cheyyali todo") ||
    lower.includes("vendor ki call cheyyali todo")
  ) {
    const clean = text
      .replace(/^(?:todo|to-do)\s*:?\s*/i, "")
      .replace(/^plan\s+/i, "")
      .replace(/\s+cheyyali\s+todo/i, "")
      .trim();

    return {
      intent: "ADD_TODO",
      confidence: 0.95,
      slots: { title: clean },
    };
  }

  if (lower.startsWith("tick ") || (lower.startsWith("done ") && lower.includes("cable"))) {
    const title = text.replace(/^(?:tick|done)\s+/i, "").trim();
    return {
      intent: "DONE_TODO",
      confidence: 0.92,
      slots: { title },
    };
  }

  return null;
}
