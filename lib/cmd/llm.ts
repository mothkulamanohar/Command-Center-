import { parseCommand } from "@/lib/cmd/parse";
import { queryOllama } from "@/lib/ai/ollama";
import { ParseResult, IntentType, CommandSlots } from "@/lib/cmd/intents";

/**
 * Parses user input using the 2-stage pipeline:
 * 1. Fast deterministic rule-based parser (0ms, 95% of standard intents)
 * 2. Local Ollama fallback (if rule parser confidence < 0.6)
 */
export async function parseWithFallback(input: string, userId?: string): Promise<ParseResult> {
  // Stage 1: Fast rule-based parser
  const ruleResult = parseCommand(input);
  if (ruleResult.confidence >= 0.6 && ruleResult.intent !== "HELP") {
    return ruleResult;
  }

  // Stage 2: Local Ollama fallback
  const prompt = `You are an internal IT Command Center intent classifier.
Classify the user command into JSON matching this schema:
{"intent": "ADD_TASK" | "FOLLOW_UP" | "MARK_DONE" | "UPDATE_STATUS", "slots": {"title"?: string, "owner"?: string, "due"?: string}}
Command: "${input}"
Only reply with JSON.`;

  const { output, ok } = await queryOllama(prompt, "PARSE", userId);

  if (ok && output) {
    try {
      const parsed = JSON.parse(output) as { intent?: IntentType; slots?: CommandSlots };
      if (parsed.intent) {
        return {
          intent: parsed.intent,
          confidence: 0.8,
          slots: parsed.slots || {},
          preview: `AI detected: ${parsed.intent}`,
        };
      }
    } catch {
      // JSON parse error on model output
    }
  }

  // If both stages failed, return original rule result
  return ruleResult;
}
