import { describe, it, expect } from "vitest";
import { extractTaskRefs, parseKudosCommand } from "@/lib/services/chat";
import { extractUrls } from "@/lib/services/links";

describe("Chat Message Parsing (SPEC §11)", () => {
  it("extracts task numbers from text (F-CHAT-08)", () => {
    const text = "Please take a look at T-1042 and also check T-99 before deployment";
    const refs = extractTaskRefs(text);
    expect(refs).toEqual([1042, 99]);
  });

  it("handles messages without task references gracefully", () => {
    const text = "Good morning everyone standup moved to 10:30";
    expect(extractTaskRefs(text)).toEqual([]);
  });

  it("parses /kudos command syntax correctly (F-CHAT-14)", () => {
    const text = "/kudos @Hari for fixing the admission form on smru.in";
    const parsed = parseKudosCommand(text);
    expect(parsed).not.toBeNull();
    expect(parsed?.targetName).toBe("Hari");
    expect(parsed?.reason).toBe("fixing the admission form on smru.in");
  });

  it("extracts URLs from messages for the Links board (F-CHAT-09)", () => {
    const text = "Check out the new design at https://smru.edu.in/admissions and staging https://dev.smru.in";
    const urls = extractUrls(text);
    expect(urls).toEqual([
      "https://smru.edu.in/admissions",
      "https://dev.smru.in",
    ]);
  });
});
