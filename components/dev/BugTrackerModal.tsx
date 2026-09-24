"use client";

import { useState } from "react";
import { Bug, X, AlertCircle } from "lucide-react";

interface BugTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    steps: string;
    expected: string;
    actual: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    project: string;
  }) => void;
}

export function BugTrackerModal({ isOpen, onClose, onSubmit }: BugTrackerModalProps) {
  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [project, setProject] = useState("Command Center");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !steps.trim()) return;

    onSubmit({ title, steps, expected, actual, severity, project });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface rounded-panel border border-line w-full max-w-lg shadow-panel animate-in fade-in zoom-in-95">
        <div className="p-4 border-b border-line flex items-center justify-between bg-surface-alt/50">
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-danger" />
            <h2 className="text-sm font-bold text-ink">Report Bug / Defect</h2>
            <span className="text-[10px] font-mono bg-danger/10 text-danger border border-danger/20 px-1.5 py-0.5 rounded font-bold">
              F-DEV-04
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-control text-mutedText hover:text-ink hover:bg-ground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider font-mono mb-1">
              Bug Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Admission portal OTP timeout error"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs p-2 bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider font-mono mb-1">
                Project
              </label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full text-xs p-2 bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary"
              >
                <option value="Command Center">Command Center</option>
                <option value="SMRU Website">SMRU Website (smru.edu.in)</option>
                <option value="UOS System">UOS Rollout</option>
                <option value="Admissions Portal">Admissions Portal</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider font-mono mb-1">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) =>
                  setSeverity(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")
                }
                className="w-full text-xs p-2 bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical (Blocker)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider font-mono mb-1">
              Steps to Reproduce *
            </label>
            <textarea
              required
              rows={3}
              placeholder="1. Open /admissions&#10;2. Click Generate OTP&#10;3. Timeout exception after 5 seconds"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              className="w-full text-xs p-2 bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider font-mono mb-1">
                Expected
              </label>
              <input
                type="text"
                placeholder="OTP sent in < 2s"
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
                className="w-full text-xs p-2 bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider font-mono mb-1">
                Actual
              </label>
              <input
                type="text"
                placeholder="504 Gateway Timeout"
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                className="w-full text-xs p-2 bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-mutedText hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-danger text-white text-xs font-semibold rounded-control hover:bg-danger/90 transition-colors shadow-2xs"
            >
              Log Bug & Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
