"use client";

import { useState, use } from "react";
import { toast } from "sonner";
import { Download, Copy, ExternalLink, ArrowLeft, ShieldAlert, CheckCircle2, Printer, Globe } from "lucide-react";
import Link from "next/link";
import { AchievementCertificate } from "@/components/certificates/AchievementCertificate";

interface CertificateDetailProps {
  params: Promise<{ id: string }>;
}

export default function CertificateDetailPage({ params }: CertificateDetailProps) {
  const resolvedParams = use(params);
  const certId = resolvedParams.id;

  const [state, setState] = useState<"ISSUED" | "REVOKED">("ISSUED");
  const [revokeReason, setRevokeReason] = useState("");
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const certData = {
    number: "ICC-ACH-2026-0001",
    code: "K7Q2M9XA4D",
    recipientName: "Sri Ram",
    title: "Certificate of Achievement",
    trainingName: "Attendance / Office Management Training",
    attendancePercent: "96.5%",
    presentDays: 20,
    lateArrivals: 2,
    halfDays: 1,
    avgInTime: "09:08",
    totalHours: "172.5h",
    awardedDate: "29 September 2026",
    signatoryTitle: "System Administrator",
    signatorySubtitle: "Command Center",
    tagline: "Better Monitoring for a Smoother Tomorrow",
    collegeName: "St. Mary's Group of Institutions",
    collegeUrl: "https://smru.edu.in",
    verifyUrl: "/verify/K7Q2M9XA4D",
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  };

  const handleCopyLink = () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/verify/${certData.code}` : `/verify/${certData.code}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(
        () => toast.success("Verification URL copied to clipboard"),
        () => {
          fallbackCopyText(url);
          toast.success("Verification URL copied to clipboard");
        }
      );
    } else {
      fallbackCopyText(url);
      toast.success("Verification URL copied to clipboard");
    }
  };

  const handleRevoke = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeReason.trim()) return;
    setState("REVOKED");
    setIsRevokeModalOpen(false);
    toast.success(`Certificate ${certData.number} has been revoked`);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-8">
      

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/certificates"
            prefetch={true}
            className="p-1.5 rounded-control border border-line bg-surface hover:bg-ground text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-ink tracking-tight">Certificate Details</h1>
            <p className="text-xs text-mutedText font-mono">
              {certData.number} • Security Code: {certData.code}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Direct College Web Application Link */}
          <a
            href={certData.collegeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-control text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Open College Web Application"
          >
            <Globe className="h-3.5 w-3.5 text-blue-600" />
            <span>College Portal</span>
            <ExternalLink className="h-3 w-3 text-blue-600" />
          </a>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-alt border border-line text-ink rounded-control text-xs font-medium transition-colors cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5 text-mutedText" />
            <span>Copy Verify Link</span>
          </button>
          <a
            href={`/api/certificates/${certData.code}/download`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-semibold shadow-2xs cursor-pointer transition-colors"
            title="Download or Print PDF Certificate"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </a>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.print();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-alt border border-line text-ink rounded-control text-xs font-medium cursor-pointer transition-colors"
          >
            <Printer className="h-3.5 w-3.5 text-mutedText" />
            <span>Print</span>
          </button>
          {state === "ISSUED" && (
            <button
              type="button"
              onClick={() => setIsRevokeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20 rounded-control text-xs font-semibold cursor-pointer"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Revoke</span>
            </button>
          )}
        </div>
      </div>

      {state === "REVOKED" && (
        <div className="p-3 bg-danger/10 border border-danger/30 rounded-panel text-xs text-danger font-semibold flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" />
          <span>This certificate has been revoked. Public verify page will reflect REVOKED status.</span>
        </div>
      )}

      {/* Modern Compact Achievement Certificate Canvas */}
      <div className="relative">
        <AchievementCertificate
          recipientName={certData.recipientName}
          trainingName={certData.trainingName}
          attendancePercent={certData.attendancePercent}
          presentDays={certData.presentDays}
          lateArrivals={certData.lateArrivals}
          halfDays={certData.halfDays}
          avgInTime={certData.avgInTime}
          totalHours={certData.totalHours}
          awardedDate={certData.awardedDate}
          certNumber={certData.number}
          certCode={certData.code}
          signatoryTitle={certData.signatoryTitle}
          signatorySubtitle={certData.signatorySubtitle}
          tagline={certData.tagline}
          collegeName={certData.collegeName}
          collegeUrl={certData.collegeUrl}
          verifyUrl={certData.verifyUrl}
        />
      </div>

      {/* Quick Verification & College Access Info Banner */}
      <div className="bg-surface rounded-panel border border-line p-3.5 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-mutedText shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span>
              Public Verification:{" "}
              <a
                href={`/verify/${certData.code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-mono font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>/verify/{certData.code}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </span>
          </div>

          <span className="text-slate-300 hidden sm:inline">•</span>

          <div className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-blue-600" />
            <span>College Portal: </span>
            <a
              href={certData.collegeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 font-mono font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>{certData.collegeUrl}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span>Status:</span>
          <strong className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
            state === "ISSUED" ? "bg-primary/10 text-primary border-primary/20" : "bg-danger/10 text-danger border-danger/20"
          }`}>
            {state}
          </strong>
        </div>
      </div>

      {/* Revocation Modal */}
      {isRevokeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-panel border border-line w-full max-w-md shadow-panel p-5 space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-danger">Revoke Certificate</h3>
            <p className="text-xs text-mutedText">
              Revoking will immediately mark this certificate as invalid on the public verification page.
            </p>
            <form onSubmit={handleRevoke} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">Reason for Revocation *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Spelling error or re-issuance"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full p-2 bg-ground border border-line rounded-control text-ink text-xs focus:outline-none focus:border-danger"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsRevokeModalOpen(false)}
                  className="px-3 py-1.5 text-mutedText hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-danger text-white font-semibold rounded-control"
                >
                  Confirm Revoke
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
