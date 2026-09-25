import { describe, it, expect } from "vitest";
import { parseCommand } from "@/lib/cmd/parse";
import corpus from "../cmd/corpus.json";

describe("Plain-English Rule Parser Corpus Benchmark (SPEC §8.6 & §23.2)", () => {
  it("has at least 150 benchmark sentences in corpus", () => {
    expect(corpus.length).toBeGreaterThanOrEqual(150);
  });

  it("achieves >= 90% parse accuracy across the full corpus", () => {
    let passed = 0;
    const failures: { input: string; expected: string; actual: string }[] = [];

    for (const item of corpus) {
      const result = parseCommand(item.input);
      if (result.intent === item.expectedIntent) {
        passed++;
      } else {
        failures.push({
          input: item.input,
          expected: item.expectedIntent,
          actual: result.intent,
        });
      }
    }

    const accuracy = (passed / corpus.length) * 100;
    if (failures.length > 0) {
      console.log(`Corpus test failures (${failures.length}/${corpus.length}):`, failures.slice(0, 5));
    }
    console.log(`Corpus Accuracy: ${accuracy.toFixed(2)}% (${passed}/${corpus.length} passed)`);

    expect(accuracy).toBeGreaterThanOrEqual(90.0);
  });
});
