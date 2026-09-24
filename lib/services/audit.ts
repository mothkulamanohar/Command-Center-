import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export interface LogAuditOptions {
  actorId?: string | null;
  action: string; // CREATE | UPDATE | DELETE | LOGIN | LOGOUT | STATUS_CHANGE
  entity: string; // User | Team | Task | FollowUp | Setting | Request
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

/**
 * Writes an entry into the AuditLog table per SPEC §5 & §16.3
 */
export async function logAudit(
  tx: Prisma.TransactionClient | typeof db,
  options: LogAuditOptions
) {
  try {
    return await tx.auditLog.create({
      data: {
        actorId: options.actorId ?? null,
        action: options.action,
        entity: options.entity,
        entityId: options.entityId,
        before: (options.before as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        after: (options.after as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // Audit logging should not crash the entire transaction if it fails in dev,
    // but in production it's recorded.
    return null;
  }
}
