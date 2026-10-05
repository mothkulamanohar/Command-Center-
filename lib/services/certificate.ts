import { z } from "zod";
import { db } from "@/lib/db";
import { can, UserContext } from "@/lib/auth/can";
import { logAudit } from "@/lib/services/audit";
import { CertKind, CertState, Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import QRCode from "qrcode";

const UNAMBIGUOUS_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * F-CERT-04: Crypto-secure 10-char code from unambiguous alphabet
 */
export function generateCertificateCode(): string {
  const bytes = randomBytes(10);
  let code = "";
  for (let i = 0; i < 10; i++) {
    code += UNAMBIGUOUS_CHARS[bytes[i] % UNAMBIGUOUS_CHARS.length];
  }
  return code;
}

/**
 * F-CERT-04: Generates sequential certificate number
 */
export async function getNextCertificateNumber(kind: CertKind, prefix = "SMRU-IT"): Promise<string> {
  const year = new Date().getFullYear();
  const typeMap: Record<CertKind, string> = {
    INTERNSHIP_COMPLETION: "INT",
    APPRECIATION: "APP",
    PARTICIPATION: "PAR",
    EXPERIENCE: "EXP",
    CUSTOM: "CUS",
  };
  const typeCode = typeMap[kind] || "GEN";
  const counterId = `${typeCode}-${year}`;

  const counter = await db.certificateCounter.upsert({
    where: { id: counterId },
    update: { value: { increment: 1 } },
    create: { id: counterId, value: 1 },
  });

  const seq = String(counter.value).padStart(4, "0");
  return `${prefix}-${typeCode}-${year}-${seq}`;
}

export const IssueCertificateSchema = z.object({
  templateId: z.string(),
  userId: z.string(),
  kind: z.nativeEnum(CertKind),
  title: z.string().min(1).max(100),
  periodStart: z.date().optional(),
  periodEnd: z.date().optional(),
  customData: z.record(z.unknown()).default({}),
  eligibilityOverride: z.string().optional(),
});

/**
 * F-CERT-03: Issue or propose certificate
 */
export async function issueCertificate(actor: UserContext, input: z.input<typeof IssueCertificateSchema>) {
  if (!can(actor, "issue_certificates")) {
    throw new Error("Unauthorized to issue certificates");
  }

  const data = IssueCertificateSchema.parse(input);
  const user = await db.user.findUnique({
    where: { id: data.userId },
    include: { campus: true },
  });
  if (!user) throw new Error("Recipient user not found");

  const template = await db.certificateTemplate.findUnique({
    where: { id: data.templateId },
  });
  if (!template) throw new Error("Template not found");

  const isLead = actor.role === "LEAD";
  const state = isLead ? CertState.PROPOSED : CertState.ISSUED;

  const code = generateCertificateCode();
  const certNumber = await getNextCertificateNumber(data.kind);

  // Settings base URL or fallback
  const verifyBase = process.env.VERIFY_BASE_URL || "http://localhost:3000/verify";
  const verifyUrl = `${verifyBase}/${code}`;

  // Freeze placeholder data per SPEC §13.6
  const frozenData: Record<string, unknown> = {
    name: user.displayName || user.name,
    title: user.title || "Intern",
    campus: user.campus?.name || "Main Campus",
    certNumber,
    code,
    verifyUrl,
    issueDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    ...data.customData,
  };

  const cert = await db.certificate.create({
    data: {
      number: certNumber,
      code,
      templateId: data.templateId,
      userId: data.userId,
      kind: data.kind,
      title: data.title,
      data: frozenData as Prisma.InputJsonValue,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      state,
      proposedById: isLead ? actor.id : null,
      issuedById: isLead ? null : actor.id,
      issuedAt: isLead ? null : new Date(),
      eligibilityOverride: data.eligibilityOverride,
      verifyUrl,
    },
  });

  await logAudit(db, {
    actorId: actor.id,
    action: isLead ? "PROPOSE_CERTIFICATE" : "ISSUE_CERTIFICATE",
    entity: "Certificate",
    entityId: cert.id,
    after: { number: certNumber, userId: data.userId, state },
  });

  return cert;
}

/**
 * F-CERT-06: Public verification by code (NO LOGIN, rate limited, limited fields)
 */
export async function verifyCertificateByCode(code: string) {
  if (!code || typeof code !== "string" || code.trim().length !== 10) {
    return { found: false };
  }

  const cleanCode = code.trim().toUpperCase();
  const cert = await db.certificate.findUnique({
    where: { code: cleanCode },
    include: {
      template: true,
    },
  });

  if (!cert) {
    return { found: false };
  }

  // Increment view counter
  await db.certificate.update({
    where: { id: cert.id },
    data: { viewCount: { increment: 1 } },
  });

  const certData = (cert.data as Record<string, any>) || {};

  return {
    found: true,
    valid: cert.state === CertState.ISSUED,
    revoked: cert.state === CertState.REVOKED,
    revokedAt: cert.revokedAt,
    revokeReason: cert.revokeReason,
    number: cert.number,
    title: cert.title,
    kind: cert.kind,
    recipientName: certData.name || "Student",
    periodStart: cert.periodStart,
    periodEnd: cert.periodEnd,
    issuedAt: cert.issuedAt,
    verifyUrl: cert.verifyUrl,
    collegeName: "St. Mary's Group of Institutions",
    collegeWebsiteUrl: process.env.COLLEGE_WEBSITE_URL || "https://smru.edu.in",
  };
}

/**
 * F-CERT-09: Revoke certificate
 */
export async function revokeCertificate(actor: UserContext, certId: string, reason: string) {
  if (!can(actor, "issue_certificates") || actor.role !== "ADMIN") {
    throw new Error("Only Admin can revoke certificates");
  }

  const cert = await db.certificate.findUnique({ where: { id: certId } });
  if (!cert) throw new Error("Certificate not found");

  const updated = await db.certificate.update({
    where: { id: certId },
    data: {
      state: CertState.REVOKED,
      revokedAt: new Date(),
      revokeReason: reason,
    },
  });

  await logAudit(db, {
    actorId: actor.id,
    action: "REVOKE_CERTIFICATE",
    entity: "Certificate",
    entityId: certId,
    after: { reason },
  });

  return updated;
}

/**
 * Generates QR code as SVG string or data URL
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  return await QRCode.toDataURL(text, {
    margin: 1,
    width: 160,
    color: { dark: "#17191E", light: "#FFFFFF" },
  });
}
