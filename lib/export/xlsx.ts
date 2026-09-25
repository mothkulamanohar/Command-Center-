import { ReportLayoutData } from "./pdf";

/**
 * Excel XML Spreadsheet (SpreadsheetML) Generator per SPEC §13.5 & §16.1
 * Produces structured multi-worksheet Excel workbooks (KPIs + JPR + Tasks)
 */
export function generateExcelWorkbookXml(data: ReportLayoutData): string {
  const kpiRowsXml = data.kpis
    .map(
      (k) => `
      <Row>
        <Cell><Data ss:Type="String">${k.name}</Data></Cell>
        <Cell><Data ss:Type="String">${k.value}</Data></Cell>
        <Cell><Data ss:Type="String">${k.target}</Data></Cell>
        <Cell><Data ss:Type="String">${k.status}</Data></Cell>
      </Row>`
    )
    .join("");

  const jprRowsXml = data.teamProgress
    .map(
      (t) => `
      <Row>
        <Cell><Data ss:Type="String">${t.team}</Data></Cell>
        <Cell><Data ss:Type="String">${t.lead}</Data></Cell>
        <Cell><Data ss:Type="String">${t.progress}</Data></Cell>
        <Cell><Data ss:Type="String">${t.highlights}</Data></Cell>
        <Cell><Data ss:Type="String">${t.risks}</Data></Cell>
      </Row>`
    )
    .join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0E6E66" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:Size="14" ss:Bold="1" ss:Color="#0E6E66"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="KPI Overview">
  <Table>
   <Column ss:Width="180"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Row>
    <Cell ss:StyleID="Title"><Data ss:Type="String">${data.title} - KPIs</Data></Cell>
   </Row>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Metric</Data></Cell>
    <Cell><Data ss:Type="String">Current Value</Data></Cell>
    <Cell><Data ss:Type="String">Target</Data></Cell>
    <Cell><Data ss:Type="String">Status</Data></Cell>
   </Row>
   ${kpiRowsXml}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="JPR Team Progress">
  <Table>
   <Column ss:Width="140"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>
   <Column ss:Width="250"/>
   <Column ss:Width="200"/>
   <Row>
    <Cell ss:StyleID="Title"><Data ss:Type="String">${data.title} - Team JPR</Data></Cell>
   </Row>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Team</Data></Cell>
    <Cell><Data ss:Type="String">Lead</Data></Cell>
    <Cell><Data ss:Type="String">Progress</Data></Cell>
    <Cell><Data ss:Type="String">Highlights</Data></Cell>
    <Cell><Data ss:Type="String">Risks</Data></Cell>
   </Row>
   ${jprRowsXml}
  </Table>
 </Worksheet>
</Workbook>`;
}
