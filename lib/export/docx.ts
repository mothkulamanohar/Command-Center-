import { ReportLayoutData } from "./pdf";

/**
 * Word Document XML Generator per SPEC §13.5 & §16.1
 * Produces structured WordprocessingML documents for Microsoft Word
 */
export function generateDocxDocumentXml(data: ReportLayoutData): string {
  const summaryBullets = data.executiveSummary
    .map((s) => `<w:p><w:pPr><w:pStyle w:val="ListBullet"/></w:pPr><w:r><w:t>${s}</w:t></w:r></w:p>`)
    .join("");

  const kpiTableRows = data.kpis
    .map(
      (k) => `
    <w:tr>
      <w:tc><w:p><w:r><w:t>${k.name}</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${k.value}</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:r><w:t>${k.target}</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:r><w:t>${k.status}</w:t></w:r></w:p></w:tc>
    </w:tr>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="0E6E66"/><w:sz w:val="36"/></w:rPr><w:t>${data.title}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:i/><w:color w:val="6B7280"/></w:rPr><w:t>Audience: ${data.audience} | Period: ${data.period} | Generated: ${data.generatedAt}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="Heading2"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>Executive Summary</w:t></w:r>
    </w:p>
    ${summaryBullets}
    <w:p>
      <w:pPr><w:pStyle w:val="Heading2"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>Key Performance Indicators</w:t></w:r>
    </w:p>
    <w:tbl>
      <w:tblPr>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:space="0" w:color="E5E7EB"/>
          <w:bottom w:val="single" w:sz="4" w:space="0" w:color="E5E7EB"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E5E7EB"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Metric</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Value</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Target</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Status</w:t></w:r></w:p></w:tc>
      </w:tr>
      ${kpiTableRows}
    </w:tbl>
  </w:body>
</w:document>`;
}
