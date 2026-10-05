"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Award, CheckCircle2, Download, Search, ExternalLink, Plus, Filter, AlertCircle, QrCode } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatNotificationTime } from "@/lib/time";

import { getCertificatesAction, quickIssueCertificateAction } from "./actions";

interface CertificateItem {
  id: string;
  number: string;
  code: string;
  recipientName: string;
  kind: "INTERNSHIP_COMPLETION" | "APPRECIATION" | "PARTICIPATION";
  title: string;
  issuedAt: string;
  state: "ISSUED" | "REVOKED";
  verifyUrl: string;
}

export default function CertificatesPage() {
  const router = useRouter();
  const [certs, setCerts] = useState<CertificateItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedKind, setSelectedKind] = useState("ALL");
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueRecipient, setIssueRecipient] = useState("Intern Web B");
  const [issueKind, setIssueKind] = useState<CertificateItem["kind"]>("INTERNSHIP_COMPLETION");
  const [issueTitle, setIssueTitle] = useState("Internship Completion Certificate");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getCertificatesAction().then((res) => {
      if (res.success && res.data) {
        setCerts(res.data as CertificateItem[]);
      }
    });
  }, []);

  const filtered = certs.filter((c) => {
    const matchesSearch =
      c.recipientName.toLowerCase().includes(search.toLowerCase()) ||
      c.number.toLowerCase().includes(search.toLowerCase());
    const matchesKind = selectedKind === "ALL" || c.kind === selectedKind;
    return matchesSearch && matchesKind;
  });

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await quickIssueCertificateAction({
        recipientName: issueRecipient,
        kind: issueKind as any,
        title: issueTitle,
      });

      if (res.success && res.cert) {
        setCerts([res.cert as CertificateItem, ...certs]);
        setIsIssueModalOpen(false);
        toast.success(`Certificate issued: ${res.cert.number}`);
      } else {
        toast.error(res.error || "Failed to issue certificate");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to issue certificate");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    const csv = [
      "Number,Code,Recipient,Kind,Issued Date,Status,Verify URL",
      ...certs.map(
        (c) =>
          `"${c.number}","${c.code}","${c.recipientName}","${c.kind}","${c.issuedAt}","${c.state}","${window.location.origin}${c.verifyUrl}"`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Certificates_Register_2026.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Certificate register exported to CSV");
  };

  return (
    <div className="space-y-6">
      

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Dynamic Certificates</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Track H (F-CERT-01..11): Verifiable Credentials Linked to SMRU College Website
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-alt border border-line text-ink rounded-control text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-mutedText" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setIsIssueModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-semibold shadow-2xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Issue Certificate</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3 rounded-panel border border-line shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-mutedText" />
          <input
            type="text"
            placeholder="Search by recipient name or certificate number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-ground border border-line rounded-control text-xs text-ink focus:outline-none focus:border-primary font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          {["ALL", "INTERNSHIP_COMPLETION", "APPRECIATION"].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setSelectedKind(k)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                selectedKind === k
                  ? "bg-primary text-white"
                  : "bg-ground border border-line text-mutedText hover:text-ink"
              }`}
            >
              {k === "ALL" ? "All Kinds" : k.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Register Table */}
      <div className="bg-surface rounded-panel border border-line shadow-xs overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-line bg-ground text-mutedText font-mono uppercase text-[10px]">
              <th className="p-3 font-semibold">Certificate Number</th>
              <th className="p-3 font-semibold">Recipient</th>
              <th className="p-3 font-semibold">Title / Kind</th>
              <th className="p-3 font-semibold">Issue Date</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((cert) => (
              <tr key={cert.id} className="hover:bg-ground/50 transition-colors">
                <td className="p-3 font-mono font-bold text-primary">
                  <Link
                    href={`/certificates/${cert.id}`}
                    prefetch={true}
                    onMouseEnter={() => router.prefetch(`/certificates/${cert.id}`)}
                    onTouchStart={() => router.prefetch(`/certificates/${cert.id}`)}
                    className="hover:underline flex items-center gap-1.5"
                  >
                    <Award className="h-3.5 w-3.5 text-primary" />
                    <span>{cert.number}</span>
                  </Link>
                </td>
                <td className="p-3 font-bold text-ink">{cert.recipientName}</td>
                <td className="p-3 text-mutedText">
                  <div className="text-ink font-medium">{cert.title}</div>
                  <div className="text-[10px] font-mono text-mutedText uppercase">{cert.kind}</div>
                </td>
                <td className="p-3 font-mono text-mutedText">{cert.issuedAt}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      cert.state === "ISSUED"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-danger/10 text-danger border-danger/20"
                    }`}
                  >
                    {cert.state}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <a
                      href={cert.verifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-ground border border-line text-xs font-mono text-ink hover:text-primary transition-colors cursor-pointer"
                      title="Open Public Verification Link"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Verify</span>
                    </a>
                    <Link
                      href={`/certificates/${cert.id}`}
                      prefetch={true}
                      onMouseEnter={() => router.prefetch(`/certificates/${cert.id}`)}
                      onTouchStart={() => router.prefetch(`/certificates/${cert.id}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-primary/10 border border-primary/20 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Issue Certificate Modal */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-panel border border-line w-full max-w-md shadow-panel p-5 space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-ink">Issue New Dynamic Certificate</h3>
            <form onSubmit={handleIssueSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">Recipient User</label>
                <select
                  value={issueRecipient}
                  onChange={(e) => setIssueRecipient(e.target.value)}
                  className="w-full p-2 bg-ground border border-line rounded-control text-ink text-xs"
                >
                  <option value="Intern Web A">Intern Web A (Attendance: 92%, Final JPA: 4.5)</option>
                  <option value="Intern Web B">Intern Web B (Attendance: 88%, Final JPA: 4.2)</option>
                  <option value="Dev Web">Dev Web (Staff Developer)</option>
                  <option value="Hari (IT Coordinator)">Hari (IT Coordinator)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Template / Kind</label>
                <select
                  value={issueKind}
                  onChange={(e) => {
                    const k = e.target.value as CertificateItem["kind"];
                    setIssueKind(k);
                    setIssueTitle(
                      k === "APPRECIATION"
                        ? "Certificate of Appreciation"
                        : "Internship Completion Certificate"
                    );
                  }}
                  className="w-full p-2 bg-ground border border-line rounded-control text-ink text-xs font-mono"
                >
                  <option value="INTERNSHIP_COMPLETION">Internship Completion</option>
                  <option value="APPRECIATION">Certificate of Appreciation</option>
                  <option value="PARTICIPATION">Certificate of Participation</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Certificate Title</label>
                <input
                  type="text"
                  required
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  className="w-full p-2 bg-ground border border-line rounded-control text-ink text-xs"
                />
              </div>

              <div className="p-3 bg-ground rounded-control border border-line text-[11px] text-mutedText space-y-1">
                <div className="font-semibold text-ink flex items-center gap-1.5">
                  <QrCode className="h-3.5 w-3.5 text-primary" />
                  <span>Public QR & College Link Embedded</span>
                </div>
                <div>A unique 10-char security code and QR pointing to /verify will be generated.</div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-3 py-1.5 text-mutedText hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-white font-semibold rounded-control"
                >
                  Confirm & Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
