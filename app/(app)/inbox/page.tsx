"use client";

import { useState } from "react";
import { InboxList } from "@/components/inbox/InboxList";
import { Plus, Filter } from "lucide-react";
import { Request, Priority, RequestState } from "@prisma/client";

export default function InboxPage() {
  const [requests, setRequests] = useState<Request[]>([
    {
      id: "req_1",
      fromUserId: "u_vc",
      toUserId: "u_sri",
      text: "Placement report summary for academic year 2025-26",
      why: "Required for governing body meeting on Monday",
      dueAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      priority: Priority.HIGH,
      state: RequestState.NEW,
      declineReason: null,
      scheduledFor: null,
      delegatedToId: null,
      firstActionAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "req_2",
      fromUserId: "u_coo",
      toUserId: "u_sri",
      text: "Renew annual SSL certificates for all 5 campus domains",
      why: "Certificate monitoring alert",
      dueAt: new Date(Date.now() + 96 * 60 * 60 * 1000),
      priority: Priority.URGENT,
      state: RequestState.NEW,
      declineReason: null,
      scheduledFor: null,
      delegatedToId: null,
      firstActionAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const handleAccept = (requestId: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleDelegate = (requestId: string, delegateTo: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleDecline = (requestId: string, reason: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Inbox</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Work Requests from Leadership and Colleagues • Accept, Delegate, or Decline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-line rounded-control text-xs text-ink hover:bg-surface-alt transition-colors"
          >
            <Filter className="h-3.5 w-3.5 text-mutedText" />
            <span>Filter</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Request</span>
          </button>
        </div>
      </div>

      <InboxList
        requests={requests}
        onAccept={handleAccept}
        onDelegate={handleDelegate}
        onDecline={handleDecline}
      />
    </div>
  );
}
