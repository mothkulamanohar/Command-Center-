import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateQrDataUrl } from "@/lib/services/certificate";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const cert = await db.certificate.findFirst({
      where: {
        OR: [{ id }, { code: id }, { number: id }],
      },
      include: {
        template: true,
      },
    });

    if (!cert) {
      return new NextResponse("Certificate not found", { status: 404 });
    }

    const user = await db.user.findUnique({
      where: { id: cert.userId },
    });

    const data = ((cert.data as Record<string, unknown>) || {});
    const recipientName = (data.recipientName as string) || (data.name as string) || user?.name || "Recipient";
    const trainingName = (data.trainingName as string) || cert.title || "Certificate of Achievement";
    const attendancePercent = (data.attendancePercent as string) || (data.attendance ? `${data.attendance}%` : "—");
    const presentDays = data.presentDays ?? 0;
    const lateArrivals = data.lateArrivals ?? 0;
    const halfDays = data.halfDays ?? 0;
    const avgInTime = (data.avgInTime as string) || "—";
    const totalHours = (data.totalHours as string) || "—";
    const awardedDate =
      (data.awardedDate as string) ||
      (data.issueDate as string) ||
      (cert.issuedAt
        ? new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long", year: "numeric" }).format(new Date(cert.issuedAt))
        : new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long", year: "numeric" }).format(new Date(cert.createdAt)));
    const certNumber = cert.number;
    const certCode = cert.code;

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const verifyUrl = cert.verifyUrl || `${appUrl}/verify/${certCode}`;
    const collegeWebsiteUrl = (data.collegeWebsite as string) || process.env.COLLEGE_WEBSITE_URL || "https://smru.edu.in";
    
    let qrDataUrl = "";
    try {
      qrDataUrl = await generateQrDataUrl(verifyUrl);
    } catch {
      // Fallback empty if qr generation fails
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Certificate of Achievement - ${recipientName} (${certNumber})</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 landscape;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      margin: 0;
      padding: 24px;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background: #F1F5F9;
      color: #0F172A;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .cert-container {
      width: 1100px;
      height: 740px;
      background: #FFFFFF;
      border-radius: 28px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.15), 0 0 0 1px #E2E8F0;
      padding: 44px 56px 36px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    /* Abstract corner gradients */
    .bg-wave-tr {
      position: absolute;
      top: -60px;
      right: -60px;
      width: 380px;
      height: 380px;
      background: radial-gradient(circle, rgba(147, 197, 253, 0.28) 0%, rgba(239, 246, 255, 0.05) 70%, transparent 100%);
      pointer-events: none;
      z-index: 1;
    }
    .bg-wave-bl {
      position: absolute;
      bottom: -80px;
      left: -80px;
      width: 380px;
      height: 380px;
      background: radial-gradient(circle, rgba(147, 197, 253, 0.25) 0%, rgba(239, 246, 255, 0.05) 70%, transparent 100%);
      pointer-events: none;
      z-index: 1;
    }
    /* Hanging left ribbon */
    .left-ribbon {
      position: absolute;
      top: 0;
      left: 36px;
      z-index: 20;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
    }
    /* Header */
    .cert-header {
      position: relative;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-box {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-left: 64px;
    }
    .logo-badge {
      width: 48px;
      height: 48px;
      background: #1D4ED8;
      border-radius: 12px;
      color: #FFFFFF;
      font-family: 'Outfit', sans-serif;
      font-weight: 900;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: 1px;
      box-shadow: 0 4px 10px rgba(29, 78, 216, 0.25);
    }
    .brand-title-wrap {
      display: flex;
      flex-direction: column;
    }
    .brand-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-title {
      font-family: 'Outfit', sans-serif;
      font-size: 18px;
      font-weight: 800;
      color: #0F172A;
      letter-spacing: -0.2px;
    }
    .brand-tag {
      background: #DBEAFE;
      color: #1E40AF;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 6px;
      letter-spacing: 0.5px;
    }
    .brand-sub {
      font-size: 12px;
      color: #64748B;
      font-weight: 500;
      margin-top: 1px;
    }
    .header-right {
      display: flex;
      align-items: flex-start;
      gap: 20px;
    }
    .motto-top {
      font-size: 11px;
      font-weight: 600;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      padding-top: 6px;
    }
    /* Rosette Seal */
    .rosette-seal {
      margin-top: -6px;
      margin-right: -10px;
    }
    /* Main Titles */
    .cert-body-center {
      position: relative;
      z-index: 10;
      text-align: center;
      margin-top: -4px;
    }
    .main-title {
      font-family: 'Outfit', sans-serif;
      font-size: 46px;
      font-weight: 900;
      color: #0B1E4A;
      letter-spacing: -0.8px;
      margin: 0;
      line-height: 1.05;
    }
    .sub-title {
      font-family: 'Outfit', sans-serif;
      font-size: 24px;
      font-weight: 700;
      color: #1E3A8A;
      margin: 2px 0 0;
    }
    .divider-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin: 10px 0 8px;
    }
    .divider-line {
      height: 1.5px;
      width: 90px;
      background: #BFDBFE;
    }
    .divider-star-box {
      width: 22px;
      height: 22px;
      border: 1px solid #60A5FA;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #FFFFFF;
    }
    .cert-intro {
      font-size: 13px;
      color: #64748B;
      font-weight: 500;
      margin: 0;
    }
    .recipient-name {
      font-family: 'Outfit', sans-serif;
      font-size: 34px;
      font-weight: 900;
      color: #0B1E4A;
      letter-spacing: -0.4px;
      margin: 4px 0 6px;
    }
    .training-desc {
      font-size: 13.5px;
      color: #475569;
      line-height: 1.45;
      max-width: 620px;
      margin: 0 auto;
    }
    .training-desc strong {
      color: #1E293B;
      font-weight: 700;
    }
    /* Stats Strip */
    .metrics-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 18px;
      padding: 12px 16px;
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      margin: 16px auto 10px;
      max-width: 940px;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);
    }
    .metric-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4px 8px;
      position: relative;
    }
    .metric-col:not(:last-child)::after {
      content: '';
      position: absolute;
      right: 0;
      top: 15%;
      height: 70%;
      width: 1px;
      background: #E2E8F0;
    }
    .metric-icon-circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #DBEAFE;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
    }
    .metric-label {
      font-size: 11px;
      font-weight: 600;
      color: #64748B;
      margin-bottom: 2px;
    }
    .metric-val {
      font-family: 'Outfit', sans-serif;
      font-size: 20px;
      font-weight: 800;
      color: #0F172A;
      line-height: 1;
    }
    .metric-val.blue {
      color: #1D4ED8;
    }
    .metric-val.amber {
      color: #D97706;
    }
    .award-date {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      text-align: center;
      margin-top: 4px;
    }
    .award-date strong {
      color: #0F172A;
    }
    /* Footer */
    .cert-footer {
      position: relative;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 14px;
      border-top: 1px solid #F1F5F9;
    }
    .signature-col {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    .sig-img {
      height: 36px;
      margin-bottom: 2px;
    }
    .sig-line {
      width: 140px;
      height: 1px;
      background: #CBD5E1;
      margin-bottom: 4px;
    }
    .sig-name {
      font-size: 12.5px;
      font-weight: 800;
      color: #0F172A;
    }
    .sig-dept {
      font-size: 11px;
      color: #64748B;
      font-weight: 500;
    }
    .footer-center {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .footer-center-line {
      height: 1px;
      width: 44px;
      background: #CBD5E1;
    }
    .footer-center-text {
      font-size: 9.5px;
      font-weight: 700;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .footer-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .qr-stamp {
      width: 42px;
      height: 42px;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 2px;
      background: white;
    }
    .qr-stamp img {
      width: 100%;
      height: 100%;
      display: block;
    }
    .footer-right-logo {
      display: flex;
      align-items: center;
      gap: 9px;
    }
    .footer-icc-badge {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #1D4ED8;
      color: #FFFFFF;
      font-family: 'Outfit', sans-serif;
      font-weight: 900;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: 0.5px;
    }
    .footer-icc-text {
      display: flex;
      flex-direction: column;
    }
    .footer-icc-title {
      font-size: 12px;
      font-weight: 800;
      color: #0F172A;
      line-height: 1.1;
    }
    .footer-icc-sub {
      font-size: 9.5px;
      font-weight: 700;
      color: #64748B;
      letter-spacing: 0.8px;
    }
    @media print {
      body {
        padding: 0;
        background: white;
      }
      .cert-container {
        box-shadow: none;
        border: none;
        border-radius: 0;
        width: 100vw;
        height: 100vh;
      }
    }
  </style>
</head>
<body>
  <div class="cert-container">
    <!-- Corner Waves -->
    <div class="bg-wave-tr"></div>
    <div class="bg-wave-bl"></div>

    <!-- Hanging Left Ribbon -->
    <div class="left-ribbon">
      <svg width="44" height="100" viewBox="0 0 48 110" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 0 H48 V96 L24 82 L0 96 V0 Z" fill="#1D4ED8" />
        <path d="M0 0 H3.5 V94.5 L0 96 V0 Z" fill="#1E40AF" opacity="0.4" />
        <g transform="translate(24, 42)">
          <path d="M-11 -13 H11 V-2 C11 7 0 14 0 14 C0 14 -11 7 -11 -2 Z" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>
          <path d="M0 -9 L2.1 -3.8 L7.4 -3.8 L3.2 -0.8 L4.8 4.3 L0 1.4 L-4.8 4.3 L-3.2 -0.8 L-7.4 -3.8 L-2.1 -3.8 Z" fill="#FFFFFF"/>
        </g>
      </svg>
    </div>

    <!-- Header -->
    <div class="cert-header">
      <div class="brand-box">
        <div class="logo-badge">ICC</div>
        <div class="brand-title-wrap">
          <div class="brand-title-row">
            <span class="brand-title">Command Center</span>
            <span class="brand-tag">DAMS</span>
          </div>
          <span class="brand-sub">IT Command Center</span>
        </div>
      </div>

      <div class="header-right">
        <a href="${collegeWebsiteUrl}" target="_blank" style="text-decoration:none; display:inline-flex; align-items:center; gap:5px; padding:4px 10px; background:#EFF6FF; border:1px solid #BFDBFE; border-radius:999px; font-size:10px; font-weight:700; color:#1D4ED8; margin-right:12px;">College: ${collegeWebsiteUrl.replace(/^https?:\/\//, '')} ↗</a>
        <div class="motto-top">Monitor &nbsp;•&nbsp; Manage &nbsp;•&nbsp; Resolve</div>
        <!-- Rosette Seal Badge -->
        <div class="rosette-seal">
          <svg width="105" height="125" viewBox="0 0 110 135" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="32,70 18,128 35,116 48,128 42,70" fill="#1D4ED8" />
            <polygon points="68,70 62,128 75,116 92,128 78,70" fill="#1E40AF" />
            <g transform="translate(55,50)">
              <circle r="46" fill="#2563EB" />
              <circle r="43" fill="#1D4ED8" />
              <circle r="36" fill="#0B1E4A" stroke="#FFFFFF" stroke-width="1.8" />
              <circle r="33" fill="none" stroke="#60A5FA" stroke-width="0.8" stroke-dasharray="2 2" />
              <path d="M 0 -22 L 2 -17 L 7 -17 L 3 -14 L 5 -9 L 0 -12 L -5 -9 L -3 -14 L -7 -17 L -2 -17 Z" fill="#FFFFFF"/>
              <text x="0" y="-3" font-family="'Plus Jakarta Sans', sans-serif" font-size="7.5" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.8">CERTIFIED</text>
              <text x="0" y="7" font-family="'Plus Jakarta Sans', sans-serif" font-size="7.5" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.8">USER</text>
              <text x="0" y="17" font-family="'Plus Jakarta Sans', sans-serif" font-size="7" fill="#93C5FD" text-anchor="middle" letter-spacing="2">★★★</text>
            </g>
          </svg>
        </div>
      </div>
    </div>

    <!-- Center Content -->
    <div class="cert-body-center">
      <h1 class="main-title">Certificate</h1>
      <h2 class="sub-title">of Achievement</h2>

      <div class="divider-row">
        <div class="divider-line"></div>
        <div class="divider-star-box">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#2563EB" stroke="#2563EB" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </div>
        <div class="divider-line"></div>
      </div>

      <p class="cert-intro">This is to certify that</p>
      <div class="recipient-name">${recipientName}</div>
      <p class="training-desc">
        has successfully completed the <strong>${trainingName}</strong><br/>
        and demonstrated excellent performance in the Command Center system.
      </p>

      <!-- 6 Metrics Box -->
      <div class="metrics-card">
        <div class="metric-col">
          <div class="metric-icon-circle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <span class="metric-label">Attendance</span>
          <span class="metric-val blue">${attendancePercent}</span>
        </div>

        <div class="metric-col">
          <div class="metric-icon-circle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <span class="metric-label">Present Days</span>
          <span class="metric-val">${presentDays}</span>
        </div>

        <div class="metric-col">
          <div class="metric-icon-circle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <span class="metric-label">Late Arrivals</span>
          <span class="metric-val amber">${lateArrivals}</span>
        </div>

        <div class="metric-col">
          <div class="metric-icon-circle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <span class="metric-label">Half Days</span>
          <span class="metric-val">${halfDays}</span>
        </div>

        <div class="metric-col">
          <div class="metric-icon-circle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <span class="metric-label">Avg. In-Time</span>
          <span class="metric-val">${avgInTime}</span>
        </div>

        <div class="metric-col">
          <div class="metric-icon-circle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 22h14"></path>
              <path d="M5 2h14"></path>
              <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"></path>
              <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path>
            </svg>
          </div>
          <span class="metric-label">Total Hours</span>
          <span class="metric-val blue">${totalHours}</span>
        </div>
      </div>

      <div class="award-date">
        Awarded on <strong>${awardedDate}</strong>
      </div>
    </div>

    <!-- Footer -->
    <div class="cert-footer">
      <div class="signature-col">
        <svg class="sig-img" width="130" height="38" viewBox="0 0 140 45" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 32C25 15 35 12 40 28C43 36 30 38 25 35C20 32 28 10 50 15C72 20 60 40 80 25C95 15 110 22 130 20" stroke="#0F172A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <div class="sig-line"></div>
        <span class="sig-name">System Administrator</span>
        <span class="sig-dept">Command Center</span>
      </div>

      <div class="footer-center">
        <div class="footer-center-line"></div>
        <span class="footer-center-text">Better Monitoring For A Smoother Tomorrow</span>
        <div class="footer-center-line"></div>
      </div>

      <div class="footer-right">
        ${qrDataUrl ? `
        <div class="qr-stamp" title="Scan to verify: ${certCode}">
          <img src="${qrDataUrl}" alt="QR Code" />
        </div>` : ""}
        <a href="${collegeWebsiteUrl}" target="_blank" class="footer-right-logo" style="text-decoration:none; color:inherit; cursor:pointer;" title="Visit College Web Application">
          <div class="footer-icc-badge">ICC</div>
          <div class="footer-icc-text">
            <span class="footer-icc-title">Command Center</span>
            <span class="footer-icc-sub">${collegeWebsiteUrl.replace(/^https?:\/\//, '')}</span>
          </div>
        </a>
      </div>
    </div>
  </div>
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => { window.print(); }, 400);
    });
  </script>
</body>
</html>`;

    const headers = new Headers();
    headers.set("Content-Type", "text/html; charset=utf-8");
    headers.set("Content-Disposition", `inline; filename="${certNumber}.html"`);

    return new NextResponse(html, {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    console.error("Certificate download error:", err);
    return NextResponse.json({ error: "Failed to download certificate" }, { status: 500 });
  }
}
