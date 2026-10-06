"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, X, Check, Loader2 } from "lucide-react";
import { formatReportFileName } from "@/lib/services/kpi";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (fileName: string) => void;
}

function getWeekTag(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `W${weekNo}-${d.getFullYear()}`;
}

function getMonthTag(d: Date = new Date()): string {
  const month = d.toLocaleString("en-US", { month: "short" });
  return `${month}-${d.getFullYear()}`;
}

export function DownloadModal({ isOpen, onClose, onDownload }: DownloadModalProps) {
  const [type, setType] = useState("Weekly");
  const [audience, setAudience] = useState("VC");
  const [scope, setScope] = useState("All");
  const defaultWeekTag = getWeekTag();
  const defaultMonthTag = getMonthTag();
  const [periodTag, setPeriodTag] = useState(defaultWeekTag);
  const [format, setFormat] = useState<"pdf" | "csv">("pdf");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const currentFileName = formatReportFileName({
    type,
    audience,
    scope,
    periodTag,
    extension: format,
  });

  const handleDownload = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setTimeout(() => {
      onDownload(currentFileName);
      setIsProcessing(false);
      onClose();
    }, 450);
  };

  const handlePreset = (presetName: string, ext: "pdf" | "csv") => {
    if (isProcessing) return;
    setIsProcessing(true);
    let fn = "";
    if (presetName === "VC") fn = `IT_Weekly_VC_All_${defaultWeekTag}.pdf`;
    else if (presetName === "CEO") fn = `IT_Monthly_CEO_All_${defaultMonthTag}.pdf`;
    else if (presetName === "COO") fn = `IT_Weekly_COO_All_${defaultWeekTag}.pdf`;
    else if (presetName === "EXCEL") fn = `IT_KPI_JPR_All_${defaultWeekTag}.csv`;

    setTimeout(() => {
      onDownload(fn);
      setIsProcessing(false);
      onClose();
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface rounded-panel border border-line w-full max-w-lg shadow-panel p-5 space-y-4 animate-in fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-ink">Download Leadership Report</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-mutedText hover:text-ink cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-mutedText font-semibold block mb-2">
            One-Click Presets (SPEC §13.5)
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handlePreset("VC", "pdf")}
              className="p-2.5 rounded-control bg-surface-alt hover:bg-ground border border-line text-left flex items-center gap-2 cursor-pointer transition-colors"
            >
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <div>
                <div className="font-semibold text-ink">Weekly · VC</div>
                <div className="text-[10px] text-mutedText font-mono">PDF · A4 Executive</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handlePreset("CEO", "pdf")}
              className="p-2.5 rounded-control bg-surface-alt hover:bg-ground border border-line text-left flex items-center gap-2 cursor-pointer transition-colors"
            >
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <div>
                <div className="font-semibold text-ink">Monthly · CEO</div>
                <div className="text-[10px] text-mutedText font-mono">PDF · Comprehensive</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handlePreset("COO", "pdf")}
              className="p-2.5 rounded-control bg-surface-alt hover:bg-ground border border-line text-left flex items-center gap-2 cursor-pointer transition-colors"
            >
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <div>
                <div className="font-semibold text-ink">Weekly Pack · COO</div>
                <div className="text-[10px] text-mutedText font-mono">PDF · Operations</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handlePreset("EXCEL", "csv")}
              className="p-2.5 rounded-control bg-surface-alt hover:bg-ground border border-line text-left flex items-center gap-2 cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 text-shared shrink-0" />
              <div>
                <div className="font-semibold text-ink">Team KPI + JPR</div>
                <div className="text-[10px] text-mutedText font-mono">CSV · Data Export</div>
              </div>
            </button>
          </div>
        </div>

        {/* Custom Configuration */}
        <div className="pt-3 border-t border-line space-y-3 text-xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-mutedText font-semibold block">
            Custom Build Options
          </span>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-ink font-semibold mb-1">Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full p-2 bg-ground border border-line rounded-control text-ink font-mono text-xs focus:outline-none focus:border-primary"
              >
                <option value="VC">Vice Chancellor (VC)</option>
                <option value="CEO">Chief Executive (CEO)</option>
                <option value="COO">Chief Operating (COO)</option>
                <option value="Internal">Internal Team</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-ink font-semibold mb-1">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as "pdf" | "csv")}
                className="w-full p-2 bg-ground border border-line rounded-control text-ink font-mono text-xs focus:outline-none focus:border-primary"
              >
                <option value="pdf">PDF Document (Print View)</option>
                <option value="csv">CSV Spreadsheet (.csv)</option>
              </select>
            </div>
          </div>

          <div className="p-2.5 rounded-control bg-ground border border-line">
            <span className="text-[10px] text-mutedText font-mono uppercase block">
              Generated File Name:
            </span>
            <span className="font-mono text-xs text-primary font-bold break-all">
              {currentFileName}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-line">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-mutedText hover:text-ink cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-control hover:bg-primary/90 shadow-2xs cursor-pointer disabled:opacity-60 transition-opacity"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Generate & Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
