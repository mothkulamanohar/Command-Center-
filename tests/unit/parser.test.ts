import { describe, it, expect } from "vitest";
import { parseCommand } from "@/lib/cmd/parse";
import { parseDateExpression } from "@/lib/cmd/dates";

describe("Plain-English Rule Parser (F-CMD)", () => {
  it("parses ASSIGN_TASK with owner and due date", () => {
    const res = parseCommand("Ask Hari to fix the admission form by Thursday");
    expect(res.intent).toBe("ASSIGN_TASK");
    expect(res.slots.owner).toBe("Hari");
    expect(res.slots.title).toBe("fix the admission form");
    expect(res.slots.due).not.toBeNull();
  });

  it("parses ASSIGN_WITH_CHASE with cadence and approval", () => {
    const res = parseCommand("Ask Hari to fix fee page by tomorrow, chase daily, ask me first");
    expect(res.intent).toBe("ASSIGN_WITH_CHASE");
    expect(res.slots.owner).toBe("Hari");
    expect(res.slots.cadence).toBe("DAILY");
    expect(res.slots.needsApproval).toBe(true);
  });

  it("parses MARK_DONE for T-xxxx and free text", () => {
    const res1 = parseCommand("mark T-1042 done");
    expect(res1.intent).toBe("MARK_DONE");
    expect(res1.slots.taskRef).toBe("T-1042");

    const res2 = parseCommand("done fee page");
    expect(res2.intent).toBe("MARK_DONE");
  });

  it("parses queries for the day and chases", () => {
    expect(parseCommand("what's my day?").intent).toBe("QUERY_DAY");
    expect(parseCommand("today").intent).toBe("QUERY_DAY");
    expect(parseCommand("what am I chasing?").intent).toBe("QUERY_CHASING");
  });

  it("parses FOLLOW_UP intent", () => {
    const res = parseCommand("Remind Janardhan sir about lab network");
    expect(res.intent).toBe("FOLLOW_UP");
    expect(res.slots.targetUser).toBe("Janardhan sir");
  });

  it("parses PASS_TURN intent", () => {
    const res = parseCommand("Pass UOS rollout to Hari");
    expect(res.intent).toBe("PASS_TURN");
    expect(res.slots.targetUser).toBe("Hari");
  });

  it("parses CREATE_TEAM intent", () => {
    const res = parseCommand("Create team Exam cell support under SMRU lead Hari");
    expect(res.intent).toBe("CREATE_TEAM");
    expect(res.slots.team).toBe("Exam cell support");
    expect(res.slots.campus).toBe("SMRU");
    expect(res.slots.owner).toBe("Hari");
  });

  it("parses ADD_TASK with requester from 'X wants Y' pattern", () => {
    const res = parseCommand("Add: VC wants placement report by Monday");
    expect(res.intent).toBe("ADD_TASK");
    expect(res.slots.requesterName).toBe("VC");
    expect(res.slots.title).toBe("placement report");
    expect(res.slots.due).not.toBeNull();
  });
});

describe("Date Parsing House Rules (SPEC §8.4)", () => {
  it("resolves today to 18:00 IST", () => {
    const parsed = parseDateExpression("today");
    expect(parsed.date).not.toBeNull();
  });

  it("resolves tomorrow to 18:00 IST", () => {
    const parsed = parseDateExpression("tomorrow");
    expect(parsed.date).not.toBeNull();
  });

  it("resolves next week to next Monday 18:00 IST", () => {
    const parsed = parseDateExpression("next week");
    expect(parsed.date).not.toBeNull();
  });

  it("resolves Indian format DD/MM e.g. 26/9", () => {
    const parsed = parseDateExpression("26/9");
    expect(parsed.date).not.toBeNull();
  });
});
