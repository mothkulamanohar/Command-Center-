import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export interface LogAuditOptions {
  actorId?: string | null;
  action: string; // CREATE | UPDATE | DELETE | LOGIN | LOGOUT | STATUS_CHANGE
  entity: string; // User | Team | Task | FollowUp | Setting | Request | Doc | Event | Review | ReportRun
  entityId: string;
  diff?: Record<string, unknown> | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

/**
 * Writes an entry into the AuditLog table per SPEC §5 & §16.3
 * Supports both logAudit(tx, options) and logAudit(options)
 */
export async function logAudit(
  txOrOptions: Prisma.TransactionClient | typeof db | LogAuditOptions,
  maybeOptions?: LogAuditOptions
) {
  let client: Prisma.TransactionClient | typeof db = db;
  let options: LogAuditOptions;

  if (maybeOptions) {
    client = txOrOptions as Prisma.TransactionClient | typeof db;
    options = maybeOptions;
  } else {
    options = txOrOptions as LogAuditOptions;
  }

  try {
    const afterData = options.after || options.diff || null;
    return await client.auditLog.create({
      data: {
        actorId: options.actorId ?? null,
        action: options.action,
        entity: options.entity,
        entityId: options.entityId,
        before: (options.before as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        after: (afterData as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    return null;
  }
}
