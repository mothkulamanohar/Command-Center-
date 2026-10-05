"use client";

import { Request, Priority, RequestState } from "@prisma/client";
import { formatOrgDate } from "@/lib/time";
import { Check, UserPlus, Clock, X, AlertCircle } from "lucide-react";
import { useState } from "react";

interface InboxListProps {
  requests: Request[];
  activeUsers?: { id: string; name: string }[];
  onAccept?: (requestId: string) => void;
  onDelegate?: (requestId: string, delegateToUserId: string) => void;
  onDecline?: (requestId: string, reason: string) => void;
}

export function InboxList({ requests, activeUsers = [], onAccept, onDelegate, onDecline }: InboxListProps) {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [actionType, setActionType] = useState<"DELEGATE" | "DECLINE" | null>(null);
  const [reason, setReason] = useState("");
  const [delegateTo, setDelegateTo] = useState("");

  const priorityColors: Record<Priority, string> = {
    LOW: "text-mutedText bg-ground",
    MEDIUM: "text-ink bg-surface-alt",
    HIGH: "text-chasing bg-chasing-tint font-semibold",
    URGENT: "text-danger bg-danger-tint font-bold",
  };

  const handleConfirmAction = () => {
    if (!selectedRequest) return;
    if (actionType === "DECLINE" && reason.trim()) {
      onDecline?.(selectedRequest.id, reason);
    } else if (actionType === "DELEGATE" && delegateTo.trim()) {
      onDelegate?.(selectedRequest.id, delegateTo);
    }
    setSelectedRequest(null);
    setActionType(null);
    setReason("");
    setDelegateTo("");
  };

  if (requests.length === 0) {
    return (
      <div className="bg-surface rounded-panel border border-line p-12 text-center shadow-xs">
        <h3 className="text-sm font-semibold text-ink">Inbox Zero</h3>
        <p className="text-xs text-mutedText mt-1">No requests currently awaiting your action.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <div
          key={req.id}
          className="p-4 bg-surface rounded-panel border border-line shadow-xs space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="text-sm font-medium text-ink">{req.text}</div>
              {req.why && <div className="text-xs text-mutedText italic">{req.why}</div>}
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${priorityColors[req.priority]}`}>
              {req.priority}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-line text-xs">
            <span className="text-[11px] font-mono text-mutedText">
              Due: {req.dueAt ? formatOrgDate(req.dueAt) : "No deadline"}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onAccept?.(req.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-white rounded-control text-xs font-medium hover:bg-primary-hover transition-colors cursor-pointer shadow-xs"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Accept</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(req);
                  setActionType("DELEGATE");
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface border border-line text-ink rounded-control text-xs font-medium hover:bg-surface-alt transition-colors cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Delegate</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(req);
                  setActionType("DECLINE");
                }}
                className="inline-flex items-center gap-1 px-2 py-1 text-danger hover:bg-danger-tint rounded-control text-xs transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                <span>Decline</span>
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Modal Dialog for Delegate / Decline */}
      {selectedRequest && actionType && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-md rounded-panel border border-line p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-semibold text-ink">
              {actionType === "DECLINE" ? "Decline Request" : "Delegate Request to Team Member"}
            </h3>

            {actionType === "DECLINE" ? (
              <div>
                <label className="block text-xs font-mono text-mutedText mb-1">
                  Reason for declining (required):
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Not IT scope / Duplicate / Need more details..."
                  className="w-full p-2.5 bg-ground border border-line rounded-control text-xs font-mono text-ink focus:outline-none focus:border-primary"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-mono text-mutedText mb-1">
                  Assignee team member:
                </label>
                {activeUsers && activeUsers.length > 0 ? (
                  <select
                    value={delegateTo}
                    onChange={(e) => setDelegateTo(e.target.value)}
                    className="w-full p-2 bg-ground border border-line rounded-control text-xs font-mono text-ink focus:outline-none focus:border-primary"
                  >
                    <option value="">Select a team member...</option>
                    {activeUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={delegateTo}
                    onChange={(e) => setDelegateTo(e.target.value)}
                    placeholder="e.g. Hari"
                    className="w-full p-2 bg-ground border border-line rounded-control text-xs font-mono text-ink focus:outline-none focus:border-primary"
                  />
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(null);
                  setActionType(null);
                }}
                className="px-3 py-1.5 text-xs text-mutedText hover:text-ink cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className="px-4 py-1.5 bg-primary text-white text-xs font-medium rounded-control hover:bg-primary-hover shadow-xs cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
