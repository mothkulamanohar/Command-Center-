/**
 * PDF Export Engine per SPEC §13.5 & §16.1
 * Produces structured A4 executive report layouts for PDF rendering.
 */
export interface ReportLayoutData {
  title: string;
  period: string;
  audience: string;
  preparedBy: string;
  generatedAt: string;
  executiveSummary: string[];
  kpis: Array<{ name: string; value: string | number; target: string; status: string }>;
  teamProgress: Array<{ team: string; lead: string; progress: string; highlights: string; risks: string }>;
  prioritiesNextWeek: string[];
}

export function renderExecutiveReportHtml(data: ReportLayoutData): string {
  const kpiRows = data.kpis
    .map(
      (k) => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; font-weight: 500;">${k.name}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; font-family: monospace; font-weight: bold; color: #0E6E66;">${k.value}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-family: monospace;">${k.target}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; color: #0E6E66; font-weight: 600;">${k.status}</td>
    </tr>`
    )
    .join("");

  const jprRows = data.teamProgress
    .map(
      (t) => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; font-weight: bold;">${t.team}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; color: #4B5563;">${t.lead}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; font-family: monospace;">${t.progress}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; color: #374151;">${t.highlights}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; color: #9A4A08;">${t.risks}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${data.title}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111827; margin: 0; padding: 20px; font-size: 13px; line-height: 1.5; }
    .header { border-bottom: 2px solid #0E6E66; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .header h1 { margin: 0; font-size: 20px; color: #0E6E66; }
    .header .meta { font-size: 11px; color: #6B7280; font-family: monospace; }
    h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #1F2937; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; text-align: left; }
    th { background: #F9FAFB; padding: 8px 12px; border-bottom: 2px solid #E5E7EB; font-size: 11px; text-transform: uppercase; color: #4B5563; font-weight: 600; }
    ul { margin: 6px 0 12px 18px; padding: 0; }
    li { margin-bottom: 4px; }
    .footer { margin-top: 30px; border-top: 1px solid #E5E7EB; padding-top: 8px; font-size: 10px; color: #9CA3AF; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${data.title}</h1>
      <div class="meta">Audience: ${data.audience} | Period: ${data.period}</div>
    </div>
    <div class="meta" style="text-align: right;">
      <div>Generated: ${data.generatedAt}</div>
      <div>Prepared by: ${data.preparedBy}</div>
    </div>
  </div>

  <h2>Executive Summary</h2>
  <ul>
    ${data.executiveSummary.map((s) => `<li>${s}</li>`).join("")}
  </ul>

  <h2>Key Performance Indicators (KPI)</h2>
  <table>
    <thead>
      <tr>
        <th>Metric</th>
        <th>Value</th>
        <th>Target</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${kpiRows}
    </tbody>
  </table>

  <h2>Job Progress Report (JPR) — Team Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Team</th>
        <th>Lead</th>
        <th>Progress</th>
        <th>Key Highlights</th>
        <th>Risks & Blockers</th>
      </tr>
    </thead>
    <tbody>
      ${jprRows}
    </tbody>
  </table>

  <h2>Top Priorities for Next Week</h2>
  <ul>
    ${data.prioritiesNextWeek.map((p) => `<li>${p}</li>`).join("")}
  </ul>

  <div class="footer">
    <span>IT Command Center (v1.0) — Private University Infrastructure</span>
    <span>Page 1 of 1</span>
  </div>
</body>
</html>`;
}
