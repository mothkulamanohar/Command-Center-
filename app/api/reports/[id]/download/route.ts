import { NextResponse } from "next/server";
import { formatReportFileName } from "@/lib/services/kpi";
import { buildLeadershipReportData } from "@/lib/services/report";
import { renderExecutiveReportHtml } from "@/lib/export/pdf";
import { generateExcelWorkbookXml } from "@/lib/export/xlsx";
import { generateDocxDocumentXml } from "@/lib/export/docx";

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

    const reportData = buildLeadershipReportData({
      type,
      audience,
      scope,
      periodTag,
      format,
    });

    let content: string;
    let contentType: string;

    if (format === "xlsx") {
      content = generateExcelWorkbookXml(reportData);
      contentType = "application/vnd.ms-excel; charset=utf-8";
    } else if (format === "docx") {
      content = generateDocxDocumentXml(reportData);
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document; charset=utf-8";
    } else {
      content = renderExecutiveReportHtml(reportData);
      contentType = "text/html; charset=utf-8";
    }

    const headers = new Headers();
    headers.set("Content-Type", contentType);
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
