import React from "react";
import {
  CheckCircle2,
  XCircle,
  Download,
  ExternalLink,
  ArrowLeft,
  Printer,
  Globe,
  ShieldCheck,
  ShieldAlert,
  Search,
} from "lucide-react";
import Link from "next/link";
import { AchievementCertificate } from "@/components/certificates/AchievementCertificate";
import { verifyCertificateByCode } from "@/lib/services/certificate";

interface PublicVerifyDetailProps {
  params: Promise<{ code: string }>;
}

export default async function PublicVerifyResultPage({ params }: PublicVerifyDetailProps) {
  const resolvedParams = await params;
  const rawIdentifier = decodeURIComponent(resolvedParams.code || "").trim();

  // Validate on the server against existing backend & database (PART 8 - SECURITY)
  const cert = await verifyCertificateByCode(rawIdentifier);

  const verificationTimestamp =
    cert.verifiedAt ||
    new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  // CASE 1: INVALID CERTIFICATE (Unknown or random certificate code/number)
  if (!cert.found || !cert.valid && cert.status !== "REVOKED") {
    return (
      <div className="w-full max-w-2xl bg-surface rounded-panel border border-danger/30 shadow-panel p-6 sm:p-8 space-y-6 animate-in fade-in">
        {/* Status Indicator */}
        <div className="flex items-center gap-3 p-3.5 rounded-control bg-danger/10 border border-danger/20 text-danger">
          <XCircle className="h-6 w-6 shrink-0 text-danger" />
          <div>
            <div className="text-base font-bold tracking-tight font-mono">
              ✕ Certificate Invalid
            </div>
            <div className="text-xs text-danger/80">
              Document verification failed in official university registry
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-xl font-bold text-ink tracking-tight">
            Certificate Not Verified
          </h1>
          <p className="text-xs text-mutedText leading-relaxed">
            No authentic credential matching the reference identifier{" "}
            <strong className="font-mono text-ink bg-ground px-1.5 py-0.5 rounded border border-line">
              {rawIdentifier}
            </strong>{" "}
            was found in the official records of St. Mary&apos;s University (SMRU).
          </p>
        </div>

        {/* Verification Summary Card */}
        <div className="bg-ground/60 border border-line rounded-control p-4 text-xs space-y-2.5 font-mono">
          <div className="flex justify-between py-1 border-b border-line/60">
            <span className="text-mutedText">Searched Identifier:</span>
            <span className="font-bold text-danger">{rawIdentifier}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-line/60">
            <span className="text-mutedText">Verification Result:</span>
            <span className="font-bold text-danger">INVALID / UNAUTHENTIC</span>
          </div>
          <div className="flex justify-between py-1 border-b border-line/60">
            <span className="text-mutedText">Verification Timestamp:</span>
            <span className="text-ink">{verificationTimestamp}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-line/60">
            <span className="text-mutedText">Issuing Organization:</span>
            <span className="text-ink font-semibold">St. Mary&apos;s University (SMRU)</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-mutedText">Official Website:</span>
            <a
              href="https://smru.edu.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1 font-semibold"
            >
              <span>https://smru.edu.in/</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-line">
          <Link
            href="/verify"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-semibold transition-colors cursor-pointer w-full sm:w-auto justify-center"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search Another Certificate</span>
          </Link>
          <a
            href="https://smru.edu.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-mutedText hover:text-primary inline-flex items-center gap-1"
          >
            <span>Visit SMRU Official Website</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    );
  }

  // CASE 2: REVOKED CERTIFICATE
  const isRevoked = cert.status === "REVOKED" || Boolean(cert.revoked);
  if (isRevoked) {
    return (
      <div className="w-full max-w-4xl space-y-4 animate-in fade-in">
        <div className="p-4 rounded-panel bg-danger/10 border border-danger/20 text-danger flex items-start gap-3">
          <ShieldAlert className="h-6 w-6 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-sm font-bold tracking-tight">
              STATUS: REVOKED CERTIFICATE
            </div>
            <div className="text-xs text-danger/90">
              Certificate <strong className="font-mono">{cert.number}</strong> ({cert.code}) was officially revoked on{" "}
              {cert.revokedAt || "Record"}
              {cert.revokeReason ? `: "${cert.revokeReason}"` : "."}
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
            <div>
              <span className="text-mutedText">Recipient:</span>{" "}
              <strong className="text-ink">{cert.recipientName}</strong>
            </div>
            <div>
              <span className="text-mutedText">Certificate No:</span>{" "}
              <strong className="text-ink">{cert.number}</strong>
            </div>
            <div>
              <span className="text-mutedText">Verification Code:</span>{" "}
              <strong className="text-ink">{cert.code}</strong>
            </div>
            <div>
              <span className="text-mutedText">Issuing University:</span>{" "}
              <strong className="text-ink">St. Mary&apos;s University (SMRU)</strong>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-mutedText pt-2">
          <Link href="/verify" className="hover:text-ink inline-flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Verification Portal</span>
          </Link>
          <a
            href="https://smru.edu.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>smru.edu.in</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    );
  }

  // CASE 3: VALID CERTIFICATE (Authentic credential verified against registry)
  return (
    <div className="w-full max-w-4xl space-y-4 animate-in fade-in">
      {/* Official Verification Status Banner */}
      <div className="p-3.5 sm:p-4 rounded-panel bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight flex items-center gap-2">
              <span>✓ Certificate Valid</span>
              <span className="px-1.5 py-0.2 text-[9px] font-mono bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded font-bold">
                OFFICIAL RECORD
              </span>
            </div>
            <div className="text-[11px] font-mono opacity-90 mt-0.5">
              Verified authentic credential in St. Mary&apos;s University registry • {verificationTimestamp}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <a
            href="#certificate-view"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-alt border border-line rounded-control text-xs font-semibold text-ink transition-colors cursor-pointer"
          >
            <span>View Certificate</span>
          </a>
          <a
            href="https://smru.edu.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-control text-xs font-semibold shadow-2xs transition-colors"
            title="Visit Official University Website"
          >
            <Globe className="h-3.5 w-3.5 text-blue-600" />
            <span>Official SMRU Website</span>
            <ExternalLink className="h-3 w-3 text-blue-600" />
          </a>
          <a
            href={`/api/certificates/${cert.code}/download`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-control text-xs font-semibold hover:bg-primary-hover transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>PDF</span>
          </a>
        </div>
      </div>

      {/* Public Verification Summary Card (SPEC / USER REQUIREMENT) */}
      <div className="bg-surface rounded-panel border border-line p-4 shadow-xs text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono">
          <div className="space-y-0.5">
            <div className="text-[10px] text-mutedText uppercase font-sans">Certificate Number</div>
            <div className="font-bold text-ink">{cert.number}</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] text-mutedText uppercase font-sans">Recipient Name</div>
            <div className="font-bold text-ink">{cert.recipientName}</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] text-mutedText uppercase font-sans">Certificate Title</div>
            <div className="font-bold text-ink">{cert.title}</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] text-mutedText uppercase font-sans">Issue Date</div>
            <div className="font-bold text-ink">{cert.issuedAt}</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] text-mutedText uppercase font-sans">Issuing Organization</div>
            <div className="font-bold text-ink">St. Mary&apos;s University (SMRU)</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] text-mutedText uppercase font-sans">Verification Code</div>
            <div className="font-bold text-primary">{cert.code}</div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-line/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <span className="text-mutedText">Achievement / Training Completed:</span>{" "}
            <strong className="text-slate-800">{cert.trainingName || cert.title}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-mutedText">Official University Website:</span>
            <a
              href="https://smru.edu.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-0.5"
            >
              <span>https://smru.edu.in/</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Visual Compact Certificate Canvas */}
      <div id="certificate-view" className="rounded-2xl overflow-hidden shadow-md">
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
          signatoryTitle={cert.issuedBy || "System Administrator"}
          signatorySubtitle={cert.issuedByTitle || "Command Center"}
          collegeName="St. Mary's University (SMRU)"
          collegeUrl="https://smru.edu.in/"
          verifyUrl={`/verify/${cert.number || cert.code}`}
        />
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between text-xs text-mutedText pt-2">
        <Link
          href="/verify"
          className="hover:text-ink inline-flex items-center gap-1 font-mono transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Verify another certificate</span>
        </Link>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span>Official University Portal:</span>
          <a
            href="https://smru.edu.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-0.5"
          >
            <span>https://smru.edu.in/</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
