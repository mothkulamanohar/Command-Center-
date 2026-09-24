import { db } from "@/lib/db";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";

export interface OllamaResponse {
  response?: string;
  done?: boolean;
}

/**
 * Checks if local Ollama instance is accessible
 */
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Query local Ollama model for fallback parsing or summary
 */
export async function queryOllama(
  prompt: string,
  kind: "PARSE" | "BRIEF" | "SUMMARY" = "PARSE",
  userId?: string
): Promise<{ output: string | null; ok: boolean; ms: number }> {
  const start = Date.now();

  try {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
      }),
      signal: AbortSignal.timeout(5000), // 5 second timeout to keep UI snappy
    });

    const elapsed = Date.now() - start;

    if (!res.ok) {
      await db.aiLog.create({
        data: {
          userId,
          kind,
          input: prompt.slice(0, 500),
          output: `HTTP ${res.status}`,
          ms: elapsed,
          ok: false,
        },
      });
      return { output: null, ok: false, ms: elapsed };
    }

    const data = (await res.json()) as OllamaResponse;
    const output = data.response?.trim() || null;

    await db.aiLog.create({
      data: {
        userId,
        kind,
        input: prompt.slice(0, 500),
        output: output ? output.slice(0, 1000) : null,
        ms: elapsed,
        ok: true,
      },
    });

    return { output, ok: true, ms: elapsed };
  } catch (err: unknown) {
    const elapsed = Date.now() - start;
    const errorMsg = err instanceof Error ? err.message : "Connection failed";

    await db.aiLog.create({
      data: {
        userId,
        kind,
        input: prompt.slice(0, 500),
        output: errorMsg,
        ms: elapsed,
        ok: false,
      },
    });

    return { output: null, ok: false, ms: elapsed };
  }
}
