"use server";

import { getSessionUser } from "@/lib/auth/session";
import {
  issueCertificate,
  revokeCertificate,
  verifyCertificateByCode,
} from "@/lib/services/certificate";
import { CertKind } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface CertActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

/**
 * Issue or propose certificate (F-CERT-03)
 */
export async function issueCertificateAction(params: {
  templateId: string;
  userId: string;
  kind: CertKind;
  title: string;
  periodStartIso?: string;
  periodEndIso?: string;
  customData?: Record<string, unknown>;
  eligibilityOverride?: string;
}): Promise<CertActionResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { success: false, error: "Unauthorized: Please log in." };
  }

  try {
    const cert = await issueCertificate(actor, {
      templateId: params.templateId,
      userId: params.userId,
      kind: params.kind,
      title: params.title,
      periodStart: params.periodStartIso ? new Date(params.periodStartIso) : undefined,
      periodEnd: params.periodEndIso ? new Date(params.periodEndIso) : undefined,
      customData: params.customData,
      eligibilityOverride: params.eligibilityOverride,
    });

    revalidatePath("/certificates");
    return { success: true, data: cert };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to issue certificate";
    return { success: false, error: message };
  }
}

/**
 * Revoke certificate (F-CERT-09)
 */
export async function revokeCertificateAction(
  certId: string,
  reason: string
): Promise<CertActionResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const updated = await revokeCertificate(actor, certId, reason);
    revalidatePath("/certificates");
    return { success: true, data: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to revoke certificate";
    return { success: false, error: message };
  }
}

/**
 * Public certificate verification (F-CERT-06)
 * Callable without login sessions.
 */
export async function verifyCertificateAction(code: string): Promise<CertActionResult> {
  try {
    const result = await verifyCertificateByCode(code);
    return { success: true, data: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Verification failed";
    return { success: false, error: message };
  }
}

/**
 * Get all certificates from PostgreSQL
 */
export async function getCertificatesAction() {
  const actor = await getSessionUser();
  if (!actor) return { success: false, data: [] };

  try {
    const { db } = await import("@/lib/db");
    const [certs, users] = await Promise.all([
      db.certificate.findMany({
        include: {
          template: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.user.findMany({ select: { id: true, name: true, email: true, role: true } }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const formatted = certs.map((c) => ({
      id: c.id,
      number: c.number,
      code: c.code,
      recipientName: userMap.get(c.userId) || "Recipient",
      kind: c.kind as "INTERNSHIP_COMPLETION" | "APPRECIATION" | "PARTICIPATION",
      title: c.title,
      issuedAt: (c.issuedAt || c.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      state: c.state as "ISSUED" | "REVOKED",
      verifyUrl: `/verify/${c.code}`,
    }));

    return { success: true, data: formatted };
  } catch (err: any) {
    console.error("getCertificatesAction error:", err);
    return { success: false, error: err.message || "Failed to load certificates", data: [] };
  }
}

/**
 * Quick issue certificate with automatic template resolution
 */
export async function quickIssueCertificateAction(params: {
  recipientName: string;
  kind: CertKind;
  title: string;
}) {
  const actor = await getSessionUser();
  if (!actor) return { success: false, error: "Unauthorized" };

  try {
    const { db } = await import("@/lib/db");
    // 1. Resolve recipient user or first non-admin/intern user
    let user = await db.user.findFirst({
      where: {
        OR: [
          { name: { contains: params.recipientName, mode: "insensitive" } },
          { email: { contains: params.recipientName, mode: "insensitive" } },
        ],
      },
    });

    if (!user) {
      user = await db.user.findFirst({ where: { role: "INTERN" } });
    }
    if (!user) {
      user = await db.user.findFirst();
    }
    if (!user) return { success: false, error: "No target user found" };

    // 2. Ensure template exists
    let template = await db.certificateTemplate.findFirst();
    if (!template) {
      template = await db.certificateTemplate.create({
        data: {
          name: "Standard Academic / Internship Template",
          kind: params.kind,
          orientation: "LANDSCAPE",
          createdById: actor.id,
        },
      });
    }

    const cert = await issueCertificate(actor, {
      templateId: template.id,
      userId: user.id,
      kind: params.kind,
      title: params.title,
    });

    revalidatePath("/certificates");
    return {
      success: true,
      cert: {
        id: cert.id,
        number: cert.number,
        code: cert.code,
        recipientName: user.name,
        kind: cert.kind,
        title: cert.title,
        issuedAt: (cert.issuedAt || cert.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        state: cert.state,
        verifyUrl: `/verify/${cert.code}`,
      },
    };
  } catch (err: any) {
    console.error("quickIssueCertificateAction error:", err);
    return { success: false, error: err.message || "Failed to issue certificate" };
  }
}

