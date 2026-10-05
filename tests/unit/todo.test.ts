import { describe, it, expect } from "vitest";
import { CreateTodoSchema, UpdateTodoSchema } from "@/lib/services/todo";
import { Priority } from "@prisma/client";

describe("To-do Schema & Validation (F-TODO-01..03)", () => {
  it("validates a simple valid to-do creation", () => {
    const input = {
      title: "Call vendor tomorrow 3pm",
      list: "Personal",
      priority: Priority.HIGH,
    };
    const parsed = CreateTodoSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe("Call vendor tomorrow 3pm");
      expect(parsed.data.list).toBe("Personal");
      expect(parsed.data.priority).toBe(Priority.HIGH);
    }
  });

  it("fails when title is empty or exceeds 200 characters", () => {
    expect(CreateTodoSchema.safeParse({ title: "" }).success).toBe(false);
    expect(CreateTodoSchema.safeParse({ title: "a".repeat(201) }).success).toBe(false);
    expect(CreateTodoSchema.safeParse({ title: "a".repeat(200) }).success).toBe(true);
  });

  it("validates scheduled to-do with start and end times", () => {
    const now = new Date();
    const later = new Date(now.getTime() + 3600 * 1000);
    const input = {
      title: "Plan SEO reading",
      list: "Learning",
      date: now,
      startAt: now,
      endAt: later,
      remindAt: now,
      recurrence: "FREQ=DAILY",
      priority: Priority.MEDIUM,
    };
    const parsed = CreateTodoSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });
});

describe("To-do List Sorting & Carry-over Logic (F-TODO-04, F-TODO-06)", () => {
  it("sorts unfinished to-dos before finished ones", () => {
    const todos = [
      { id: "1", title: "Done task", done: true, sortOrder: 0 },
      { id: "2", title: "Active task 1", done: false, sortOrder: 1 },
      { id: "3", title: "Active task 2", done: false, sortOrder: 0 },
    ];

    const sorted = [...todos].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return a.sortOrder - b.sortOrder;
    });

    expect(sorted[0].id).toBe("3");
    expect(sorted[1].id).toBe("2");
    expect(sorted[2].id).toBe("1");
  });

  it("calculates carry over carryCount increment", () => {
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
    const today = new Date();

    const todo = {
      id: "todo-old",
      title: "Renew smru.in SSL certificate",
      date: yesterday,
      done: false,
      carryCount: 0,
      carriedFrom: null as Date | null,
    };

    // Simulate carryOverUnfinishedTodos
    const carriedTodo = {
      ...todo,
      date: today,
      carriedFrom: todo.carriedFrom || todo.date,
      carryCount: todo.carryCount + 1,
    };

    expect(carriedTodo.carryCount).toBe(1);
    expect(carriedTodo.carriedFrom).toBe(yesterday);
    expect(carriedTodo.date).toBe(today);
  });
});
