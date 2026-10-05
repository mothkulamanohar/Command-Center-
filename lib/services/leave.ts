import { z } from "zod";
import { db } from "@/lib/db";
import { can, UserContext } from "@/lib/auth/can";
import { ApprovalState, LeaveType } from "@prisma/client";
import { emitToUser } from "@/lib/socket";

export const ApplyLeaveSchema = z.object({
  from: z.date(),
  to: z.date(),
  type: z.nativeEnum(LeaveType).default(LeaveType.CASUAL),
  halfDay: z.boolean().default(false),
  reason: z.string().optional(),
});

export async function applyLeave(actor: UserContext, input: z.input<typeof ApplyLeaveSchema>) {
  const data = ApplyLeaveSchema.parse(input);

  // Check setting: leave.approvalRequired
  const setting = await db.setting.findUnique({ where: { key: "leave.approvalRequired" } });
  const approvalRequired = setting ? (setting.value as boolean) : true;

  const leave = await db.leave.create({
    data: {
      userId: actor.id,
      from: data.from,
      to: data.to,
      type: data.type,
      halfDay: data.halfDay,
      reason: data.reason,
      state: approvalRequired ? ApprovalState.PENDING : ApprovalState.APPROVED,
    },
  });

  return leave;
}

export async function decideLeave(
  actor: UserContext,
  leaveId: string,
  state: ApprovalState,
  decisionNote?: string
) {
  if (!can(actor, "approve_attendance")) {
    throw new Error("Unauthorized to approve/reject leave requests");
  }

  const leave = await db.leave.findUnique({ where: { id: leaveId } });
  if (!leave) throw new Error("Leave request not found");

  const updated = await db.leave.update({
    where: { id: leaveId },
    data: {
      state,
      approverId: actor.id,
      decidedAt: new Date(),
      decisionNote,
    },
  });

  emitToUser(leave.userId, "leave:decided", {
    leaveId,
    state,
    decisionNote,
  });

  return updated;
}

export async function getUserLeaves(userId: string) {
  return await db.leave.findMany({
    where: { userId },
    orderBy: { from: "desc" },
  });
}

export async function getPendingLeaveRequests(actor: UserContext) {
  if (!can(actor, "approve_attendance")) return [];
  return await db.leave.findMany({
    where: { state: ApprovalState.PENDING },
    orderBy: { createdAt: "desc" },
  });
}
