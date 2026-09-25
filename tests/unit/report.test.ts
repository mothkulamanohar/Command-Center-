import { describe, it, expect } from "vitest";
import { buildLeadershipReportData } from "@/lib/services/report";
import { renderExecutiveReportHtml } from "@/lib/export/pdf";
import { generateExcelWorkbookXml } from "@/lib/export/xlsx";
import { generateDocxDocumentXml } from "@/lib/export/docx";

describe("Leadership Report Exporters (SPEC §13.5 & §16.1)", () => {
  const sampleData = buildLeadershipReportData({
    type: "Weekly",
    audience: "VC",
    scope: "All",
    periodTag: "W39-2026",
    format: "pdf",
  });

  it("builds leadership report payload with required sections", () => {
    expect(sampleData.meta.title).toContain("Weekly Report for VC");
    expect(sampleData.executiveSummary.length).toBeGreaterThan(0);
    expect(sampleData.kpis.length).toBeGreaterThan(0);
    expect(sampleData.teamProgress.length).toBeGreaterThan(0);
  });

  it("renders styled executive HTML for PDF printing", () => {
    const html = renderExecutiveReportHtml(sampleData);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Weekly Report for VC");
    expect(html).toContain("Executive Summary");
    expect(html).toContain("Key Performance Indicators");
    expect(html).toContain("#0E6E66"); // Primary brand teal
  });

  it("generates valid Excel SpreadsheetML XML with multiple worksheets", () => {
    const xml = generateExcelWorkbookXml(sampleData);
    expect(xml).toContain("<?xml version=\"1.0\"?>");
    expect(xml).toContain("<Worksheet ss:Name=\"KPI Overview\">");
    expect(xml).toContain("<Worksheet ss:Name=\"JPR Team Progress\">");
    expect(xml).toContain("Tasks Completed");
  });

  it("generates valid Word Document XML", () => {
    const docxXml = generateDocxDocumentXml(sampleData);
    expect(docxXml).toContain("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>");
    expect(docxXml).toContain("<w:document");
    expect(docxXml).toContain("Weekly Report for VC");
    expect(docxXml).toContain("<w:tbl>");
  });
});
