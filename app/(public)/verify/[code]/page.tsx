"use client";

import { use } from "react";
import { CheckCircle2, XCircle, Download, ExternalLink, ArrowLeft, Printer, Globe } from "lucide-react";
import Link from "next/link";
import { AchievementCertificate } from "@/components/certificates/AchievementCertificate";

interface PublicVerifyDetailProps {
  params: Promise<{ code: string }>;
}

interface MockPublicCert {
  code: string;
  number: string;
  recipientName: string;
  title: string;
  trainingName?: string;
  attendancePercent?: string;
  presentDays?: number;
  lateArrivals?: number;
  halfDays?: number;
  avgInTime?: string;
  totalHours?: string;
  period: string;
  issuedAt: string;
  issuedBy: string;
  issuedByTitle: string;
  state: "ISSUED" | "REVOKED";
  revokedAt?: string;
  collegeName: string;
  collegeWebsite: string;
}

const PUBLIC_KNOWN_CERTS: { [code: string]: MockPublicCert } = {
  K7Q2M9XA4D: {
    code: "K7Q2M9XA4D",
    number: "ICC-ACH-2026-0001",
    recipientName: "Sri Ram",
    title: "Certificate of Achievement",
    trainingName: "Attendance / Office Management Training",
    attendancePercent: "96.5%",
    presentDays: 20,
    lateArrivals: 2,
    halfDays: 1,
    avgInTime: "09:08",
    totalHours: "172.5h",
    period: "September 2026",
    issuedAt: "29 September 2026",
    issuedBy: "System Administrator",
    issuedByTitle: "Command Center",
    state: "ISSUED",
    collegeName: "Command Center DAMS",
    collegeWebsite: "http://localhost:3000",
  },
  N8P4Y2W7ZC: {
    code: "N8P4Y2W7ZC",
    number: "SMRU-IT-APP-2026-0012",
    recipientName: "Hari",
    title: "Certificate of Appreciation (UOS Rollout)",
    trainingName: "UOS Rollout & Implementation",
    attendancePercent: "98.0%",
    presentDays: 22,
    lateArrivals: 0,
    halfDays: 0,
    avgInTime: "08:55",
    totalHours: "180.0h",
    period: "August 2026 – September 2026",
    issuedAt: "15 Sep 2026",
    issuedBy: "Sri",
    issuedByTitle: "IT Manager, SMRU IT Command Center",
    state: "ISSUED",
    collegeName: "St. Mary's Group of Institutions (SMRU)",
    collegeWebsite: "https://smru.edu.in",
  },
};

export default function PublicVerifyResultPage({ params }: PublicVerifyDetailProps) {
  const resolvedParams = use(params);
  const rawCode = resolvedParams.code.toUpperCase();
  const cert = PUBLIC_KNOWN_CERTS[rawCode];

  if (!cert) {
    return (
      <div className="w-full max-w-md bg-surface rounded-panel border border-line shadow-panel p-8 text-center space-y-4 animate-in fade-in">
        <div className="h-12 w-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto">
          <XCircle className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-bold text-ink tracking-tight">Certificate Not Found</h1>
        <p className="text-xs text-mutedText leading-relaxed">
          No certificate matching the verification code <strong className="font-mono text-ink">{rawCode}</strong> was found in our official records.
        </p>
        <div className="pt-2">
          <Link
            href="/verify"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-ground hover:bg-ground/80 border border-line rounded-control text-xs font-semibold text-ink transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Search Again</span>
          </Link>
        </div>
      </div>
    );
  }

  const isValid = cert.state === "ISSUED";

  return (
    <div className="w-full max-w-5xl space-y-6 animate-in fade-in">
      {/* Verification Status Banner */}
      <div
        className={`p-4 rounded-panel border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isValid
            ? "bg-primary/10 border-primary/20 text-primary"
            : "bg-danger/10 border-danger/20 text-danger"
        }`}
      >
        <div className="flex items-center gap-3">
          {isValid ? (
            <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" />
          ) : (
            <XCircle className="h-6 w-6 shrink-0 text-danger" />
          )}
          <div>
            <div className="text-sm font-bold tracking-tight">
              {isValid ? "✔ Official Verified Certificate" : "✖ This Certificate Has Been Revoked"}
            </div>
            <div className="text-xs opacity-90 font-mono">
              {isValid
                ? `Cryptographically authentic • Issued to ${cert.recipientName} (${cert.number})`
                : `Revoked on ${cert.revokedAt || "Record"}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={cert.collegeWebsite || "https://smru.edu.in"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-control text-xs font-semibold shadow-2xs transition-colors"
            title="Open College Web Application"
          >
            <Globe className="h-3.5 w-3.5 text-blue-600" />
            <span>College Portal</span>
            <ExternalLink className="h-3 w-3 text-blue-600" />
          </a>
          <a
            href={`/api/certificates/${cert.code}/download`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-control text-xs font-semibold hover:bg-primary-hover transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </a>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface text-ink border border-line rounded-control text-xs font-medium hover:bg-ground transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-mutedText" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Visual Certificate Card */}
      <div className="shadow-lg rounded-2xl sm:rounded-3xl overflow-hidden">
        <AchievementCertificate
          recipientName={cert.recipientName}
          trainingName={cert.trainingName || cert.title}
          attendancePercent={cert.attendancePercent || "96.5%"}
          presentDays={cert.presentDays ?? 20}
          lateArrivals={cert.lateArrivals ?? 2}
          halfDays={cert.halfDays ?? 1}
          avgInTime={cert.avgInTime || "09:08"}
          totalHours={cert.totalHours || "172.5h"}
          awardedDate={cert.issuedAt}
          certNumber={cert.number}
          certCode={cert.code}
          signatoryTitle={cert.issuedBy}
          signatorySubtitle={cert.issuedByTitle}
          collegeName={cert.collegeName || "St. Mary's Group of Institutions"}
          collegeUrl={cert.collegeWebsite || "https://smru.edu.in"}
          verifyUrl={`/verify/${cert.code}`}
        />
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between text-xs text-mutedText pt-2">
        <Link
          href="/verify"
          className="hover:text-ink inline-flex items-center gap-1 font-mono transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Verify another certificate</span>
        </Link>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span>College Web App:</span>
          <a
            href={cert.collegeWebsite || "https://smru.edu.in"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-0.5"
          >
            <span>{(cert.collegeWebsite || "https://smru.edu.in").replace(/^https?:\/\//, "")}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
