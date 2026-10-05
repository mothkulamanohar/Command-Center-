"use server";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/can";

export interface GetAuditLogsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  action?: string;
}

export async function getAuditLogsAction(params: GetAuditLogsParams = {}) {
  const actor = await getSessionUser();
  if (!actor) return { success: false, error: "Unauthorized", logs: [], total: 0, totalPages: 1 };

  if (!can(actor, "audit_log_view")) {
    return { success: false, error: "Forbidden: Insufficient permissions to view audit log", logs: [], total: 0, totalPages: 1 };
  }

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize || 20));
  const search = params.search?.trim() || "";
  const action = params.action || "ALL";

  try {
    const where: any = {};

    if (action !== "ALL") {
      where.action = action;
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { entity: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, rawLogs, users] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.findMany({
        select: { id: true, name: true, email: true },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const logs = rawLogs.map((l) => {
      let details = "";
      if (l.after) {
        try {
          const a = typeof l.after === "string" ? JSON.parse(l.after) : l.after;
          details = JSON.stringify(a);
        } catch {
          details = String(l.after);
        }
      }

      return {
        id: l.id,
        timestamp: l.at.toISOString().replace("T", " ").slice(0, 19),
        actor: (l.actorId && userMap.get(l.actorId)) || "System",
        action: l.action,
        entity: `${l.entity}:${l.entityId}`,
        details: details || "Action executed",
        ip: "127.0.0.1",
      };
    });

    return {
      success: true,
      logs,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
      page,
    };
  } catch (err: any) {
    console.error("getAuditLogsAction error:", err);
    return { success: false, error: err.message || "Failed to load audit logs", logs: [], total: 0, totalPages: 1 };
  }
}

export async function exportAuditLogsCsvAction(params: { search?: string; action?: string } = {}) {
  const actor = await getSessionUser();
  if (!actor || !can(actor, "audit_log_view")) {
    return { success: false, error: "Unauthorized" };
  }

  const search = params.search?.trim() || "";
  const action = params.action || "ALL";

  try {
    const where: any = {};
    if (action !== "ALL") where.action = action;
    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { entity: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
      ];
    }

    const [rawLogs, users] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { at: "desc" },
        take: 2000,
      }),
      prisma.user.findMany({
        select: { id: true, name: true },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u.name]));

    let csv = "ID,Timestamp,Actor,Action,Entity,Details,IP\n";
    for (const l of rawLogs) {
      const actorName = (l.actorId && userMap.get(l.actorId)) || "System";
      const details = l.after ? JSON.stringify(l.after).replace(/"/g, '""') : "";
      csv += `"${l.id}","${l.at.toISOString()}","${actorName}","${l.action}","${l.entity}:${l.entityId}","${details}","127.0.0.1"\n`;
    }

    return { success: true, csv };
  } catch (err: any) {
    console.error("exportAuditLogsCsvAction error:", err);
    return { success: false, error: err.message || "Export failed" };
  }
}
