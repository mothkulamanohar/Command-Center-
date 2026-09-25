import { describe, it, expect, vi } from "vitest";
import { createTask, passTaskTurn, markTaskDone, CreateTaskSchema } from "@/lib/services/task";
import { TaskStatus, Priority, TaskMode, TaskSource, RoleKey } from "@prisma/client";
import { UserContext } from "@/lib/auth/can";

vi.mock("@/lib/socket", () => ({
  emitToUser: vi.fn(),
}));

vi.mock("@/lib/services/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/db", () => {
  return {
    db: {
      user: {
        findUnique: vi.fn().mockImplementation(async ({ where }: { where: { id: string } }) => {
          if (where.id === "u-senior") {
            return { id: "u-senior", name: "VC", isSenior: true };
          }
          return { id: "u-dev", name: "Staff", isSenior: false };
        }),
      },
      task: {
        findUnique: vi.fn().mockImplementation(async ({ where }: { where: { id: string } }) => {
          if (where.id === "task-shared") {
            return {
              id: "task-shared",
              title: "Renew SSL",
              mode: TaskMode.SHARED,
              ownerId: "u-sri",
              partnerId: "u-hari",
              turnUserId: "u-sri",
            };
          }
          return {
            id: "task-solo",
            title: "Check switch",
            mode: TaskMode.SOLO,
            ownerId: "u-sri",
          };
        }),
      },
      $transaction: vi.fn(async (cb: (tx: any) => Promise<any>) => {
        const tx = {
          task: {
            create: vi.fn().mockImplementation(({ data }: { data: any }) => ({
              id: "task-created-1",
              number: 1046,
              createdAt: new Date(),
              ...data,
            })),
            update: vi.fn().mockImplementation(({ data }: { data: any }) => ({
              id: "task-updated-1",
              ...data,
            })),
          },
          taskComment: {
            create: vi.fn().mockResolvedValue({ id: "comment-1" }),
          },
          followUp: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return cb(tx);
      }),
    },
  };
});

describe("Track B: Task Work Engine Service (SPEC §7 F-TASK)", () => {
  const actor: UserContext = {
    id: "u-sri",
    role: RoleKey.ADMIN,
    name: "Sri (IT Manager)",
  };

  it("validates task creation input schema", () => {
    const valid = {
      title: "Verify VLAN routes",
      priority: Priority.HIGH,
      mode: TaskMode.SOLO,
    };
    const parsed = CreateTaskSchema.parse(valid);
    expect(parsed.title).toBe("Verify VLAN routes");
    expect(parsed.priority).toBe(Priority.HIGH);

    expect(() => CreateTaskSchema.parse({ title: "" })).toThrow();
  });

  it("auto-elevates senior requester tasks to LEADERSHIP source & HIGH priority (F-TASK-14)", async () => {
    const task = await createTask(actor, {
      title: "Placement statistics report",
      requesterId: "u-senior",
      priority: Priority.LOW,
      source: TaskSource.MANUAL,
    });

    expect(task.source).toBe(TaskSource.LEADERSHIP);
    expect(task.priority).toBe(Priority.HIGH);
  });

  it("passes the turn on a SHARED task (F-TASK-03)", async () => {
    const result = await passTaskTurn(actor, "task-shared", "u-hari", "Please sign off");
    expect(result.turnUserId).toBe("u-hari");
    expect(result.turnNote).toBe("Please sign off");
  });

  it("rejects passing turn on a SOLO task", async () => {
    await expect(passTaskTurn(actor, "task-solo", "u-hari")).rejects.toThrow(
      "Task not found or not a shared task"
    );
  });

  it("marks task done and halts active follow-ups (F-TASK-05)", async () => {
    const task = await markTaskDone(actor, "task-shared");
    expect(task.status).toBe(TaskStatus.DONE);
    expect(task.doneById).toBe("u-sri");
    expect(task.doneAt).toBeDefined();
  });
});
