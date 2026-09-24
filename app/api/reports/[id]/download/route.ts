import { NextResponse } from "next/server";
import { formatReportFileName } from "@/lib/services/kpi";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const audience = url.searchParams.get("audience") || "VC";
    const type = url.searchParams.get("type") || "Weekly";
    const scope = url.searchParams.get("scope") || "All";
    const periodTag = url.searchParams.get("periodTag") || "W39-2026";
    const format = (url.searchParams.get("format") as "pdf" | "xlsx" | "docx") || "pdf";

    const fileName = formatReportFileName({
      type,
      audience,
      scope,
      periodTag,
      extension: format,
    });

    // Content payload
    const content = `IT Command Center — Leadership Report
Report: ${type} Report for ${audience}
Scope: ${scope}
Period: ${periodTag}
Generated on: ${new Date().toISOString()}

========================================
EXECUTIVE SUMMARY
========================================
- Tasks Completed This Period: 38 (Target: 35)
- On-Time Delivery Rate: 88% (Target: >= 85%)
- Daily Update Compliance: 94% (Target: >= 90%)
- Follow-ups Answered: 85% (Target: >= 80%)
- Leadership Asks Closed: 100%
- Core Sites Uptime: 99.94%

Prepared by Sri, IT Manager.
`;

    const headers = new Headers();
    headers.set("Content-Type", format === "pdf" ? "application/pdf" : "text/plain; charset=utf-8");
    headers.set("Content-Disposition", `attachment; filename="${fileName}"`);

    return new NextResponse(content, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Report download error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Report generation failed" },
      { status: 500 }
    );
  }
}
