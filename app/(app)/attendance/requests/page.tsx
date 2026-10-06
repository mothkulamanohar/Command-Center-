"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Check, X, Clock, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  decideRegularizationAction,
  decideLeaveAction,
  fetchPendingRequestsAction,
} from "../actions";

export default function AttendanceRequestsPage() {
  const [activeTab, setActiveTab] = useState<"regularizations" | "leave">("regularizations");
  const [regs, setRegs] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRequests = async () => {
    const res = await fetchPendingRequestsAction();
    if (res.success && res.data) {
      const d = res.data as any;
      setRegs(d.regs || []);
      setLeaves(d.leaves || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleRegAction = async (id: string, action: "APPROVED" | "REJECTED") => {
    const target = regs.find((r) => r.id === id);
    setRegs((prev) => prev.map((r) => (r.id === id ? { ...r, status: action } : r)));
    toast.success(
      action === "APPROVED"
        ? `✓ Regularisation approved for ${target?.userName || "user"}`
        : `Regularisation rejected for ${target?.userName || "user"}`
    );
    try {
      const res = await decideRegularizationAction(id, action as any);
      if (res.success) loadRequests();
    } catch {}
  };

  const handleLeaveAction = async (id: string, action: "APPROVED" | "REJECTED") => {
    const target = leaves.find((l) => l.id === id);
    setLeaves((prev) => prev.map((l) => (l.id === id ? { ...l, status: action } : l)));
    toast.success(
      action === "APPROVED"
        ? `✓ Leave request approved for ${target?.userName || "user"}`
        : `Leave request rejected for ${target?.userName || "user"}`
    );
    try {
      const res = await decideLeaveAction(id, action as any);
      if (res.success) loadRequests();
    } catch {}
  };

  return (
    <div className="space-y-6">
      

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/attendance"
          prefetch={true}
          className="p-1.5 border border-line rounded-control text-mutedText hover:text-ink hover:bg-surface"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-ink">Attendance & Leave Approvals</h1>
          <p className="text-xs text-mutedText mt-0.5">
            Review regularisation corrections and team leave applications (F-ATT-05, F-UPD-05)
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-px">
        <button
          onClick={() => setActiveTab("regularizations")}
          className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === "regularizations"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-mutedText hover:text-ink"
          }`}
        >
          Regularisations ({regs.filter((r) => r.status === "PENDING").length})
        </button>
        <button
          onClick={() => setActiveTab("leave")}
          className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === "leave"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-mutedText hover:text-ink"
          }`}
        >
          Leave Applications ({leaves.filter((l) => l.status === "PENDING").length})
        </button>
      </div>

      {/* Regularisations Tab */}
      {activeTab === "regularizations" && (
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs space-y-4">
          <div className="space-y-3">
            {regs.map((reg) => (
              <div
                key={reg.id}
                className="p-4 border border-line rounded-control flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-ground/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink text-xs">{reg.userName}</span>
                    <span className="text-[11px] font-mono text-mutedText">· {reg.date}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-ground font-mono border border-line">
                      {reg.reqMode}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-ink mt-1">
                    Requested In: {reg.reqInAt} | Out: {reg.reqOutAt}
                  </div>
                  <p className="text-xs text-mutedText mt-1 italic">&ldquo;{reg.reason}&rdquo;</p>
                </div>

                <div className="flex items-center gap-2">
                  {reg.status === "PENDING" ? (
                    <>
                      <button
                        onClick={() => handleRegAction(reg.id, "APPROVED")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-control text-xs font-medium hover:bg-primary-hover cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleRegAction(reg.id, "REJECTED")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-line text-mutedText hover:text-danger rounded-control text-xs font-medium cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </>
                  ) : (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        reg.status === "APPROVED" ? "bg-primary/10 text-primary" : "bg-danger/10 text-danger"
                      }`}
                    >
                      {reg.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave Tab */}
      {activeTab === "leave" && (
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs space-y-4">
          <div className="space-y-3">
            {leaves.map((leave) => (
              <div
                key={leave.id}
                className="p-4 border border-line rounded-control flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-ground/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink text-xs">{leave.userName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-shared/10 text-shared font-mono font-semibold">
                      {leave.type} LEAVE
                    </span>
                  </div>
                  <div className="text-xs font-mono text-ink mt-1">
                    Dates: {leave.from} {leave.from !== leave.to ? `to ${leave.to}` : ""}
                  </div>
                  <p className="text-xs text-mutedText mt-1 italic">&ldquo;{leave.reason}&rdquo;</p>
                </div>

                <div className="flex items-center gap-2">
                  {leave.status === "PENDING" ? (
                    <>
                      <button
                        onClick={() => handleLeaveAction(leave.id, "APPROVED")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-control text-xs font-medium hover:bg-primary-hover cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleLeaveAction(leave.id, "REJECTED")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-line text-mutedText hover:text-danger rounded-control text-xs font-medium cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </>
                  ) : (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        leave.status === "APPROVED" ? "bg-primary/10 text-primary" : "bg-danger/10 text-danger"
                      }`}
                    >
                      {leave.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
