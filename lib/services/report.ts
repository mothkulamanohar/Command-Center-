import { prisma } from "@/lib/db";
import { AuthUser } from "@/lib/auth/can";
import { logAudit } from "./audit";
import { formatReportFileName } from "./kpi";
import { ReportFormat } from "@prisma/client";

export interface GenerateReportParams {
  type: string;        // Weekly | Monthly | Quarterly
  audience: string;    // VC | CEO | COO | Leads
  scope: string;       // All | Campus | Team
  periodTag: string;   // e.g. W39-2026
  format: "pdf" | "xlsx" | "docx";
}

export async function listReportPresets() {
  return await prisma.reportPreset.findMany({
    orderBy: { builtIn: "desc" },
  });
}

export async function listReportRuns(byId?: string) {
  const where: any = {};
  if (byId) where.byId = byId;

  return await prisma.reportRun.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function createReportRun(
  actor: AuthUser,
  params: GenerateReportParams,
  filePath: string
) {
  const fileName = formatReportFileName({
    type: params.type,
    audience: params.audience,
    scope: params.scope,
    periodTag: params.periodTag,
    extension: params.format,
  });

  const formatEnum =
    params.format === "xlsx"
      ? ReportFormat.XLSX
      : params.format === "docx"
      ? ReportFormat.DOCX
      : ReportFormat.PDF;

  const run = await prisma.reportRun.create({
    data: {
      config: params as any,
      format: formatEnum,
      fileName,
      path: filePath,
      byId: actor.id,
      sharedWith: ["ADMIN", "LEAD"],
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "CREATE",
    entity: "ReportRun",
    entityId: run.id,
    diff: { fileName, format: params.format },
  });

  return run;
}

export function buildLeadershipReportData(params: GenerateReportParams) {
  const title = `IT Command Center — ${params.type} Report for ${params.audience}`;
  const period = params.periodTag;
  const audience = params.audience;
  const scope = params.scope;
  const generatedAt = new Date().toISOString();
  const preparedBy = "Sri, IT Manager";

  return {
    title,
    period,
    audience,
    scope,
    generatedAt,
    preparedBy,
    meta: {
      title,
      period,
      scope,
      audience,
      generatedAt,
      preparedBy,
    },
    executiveSummary: [
      "Core campus switch migration completed ahead of schedule in Lab B.",
      "UOS Phase 1 cutover on track for 26 Sep.",
      "Overall IT delivery compliance reached 88% (target >= 85%).",
      "Zero high-severity network outages across all 5 campuses this week.",
    ],
    kpis: [
      { name: "Tasks Completed", value: "38", target: "↑ 35", status: "GOOD" },
      { name: "On-Time Delivery", value: "88%", target: "≥ 85%", status: "GOOD" },
      { name: "Overdue Open", value: "2", target: "0", status: "GOOD" },
      { name: "Requests Closed", value: "92%", target: "≥ 90%", status: "GOOD" },
      { name: "Daily Update Compliance", value: "94%", target: "≥ 90%", status: "GOOD" },
      { name: "Follow-ups Answered", value: "85%", target: "≥ 80%", status: "GOOD" },
      { name: "Core Sites Uptime", value: "99.94%", target: "≥ 99.5%", status: "GOOD" },
    ],
    teamProgress: [
      {
        team: "SMRU Campus IT",
        lead: "Hari (Coordinator)",
        progress: "16 / 18 (89%)",
        highlights: "Completed 48-port core switch migration in Lab B",
        risks: "Fiber optic patch cable shipment delayed 2 days",
      },
      {
        team: "Developers",
        lead: "Sri (IT Manager)",
        progress: "12 / 12 (100%)",
        highlights: "Command Center Track B, C, D deployed",
        risks: "None",
      },
      {
        team: "UOS Rollout",
        lead: "Hari",
        progress: "6 / 8 (75%)",
        highlights: "Admin staff training module 1 completed",
        risks: "Lab 3 projector replacement pending",
      },
    ],
    prioritiesNextWeek: [
      "UOS Phase 1 go-live in Campus A & B.",
      "smru.in SSL certificate renewal cutover.",
      "Quarterly JPA appraisal review completion.",
    ],
  };
}
