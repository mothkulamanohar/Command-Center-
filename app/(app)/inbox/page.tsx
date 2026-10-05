"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { InboxList } from "@/components/inbox/InboxList";
import { Plus, Filter, CheckCircle2, X, Send } from "lucide-react";
import { Request, Priority, RequestState } from "@prisma/client";
import {
  getInboxRequestsAction,
  createRequestAction,
  acceptRequestAction,
  delegateRequestAction,
  declineRequestAction,
} from "./actions";

export default function InboxPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [activeUsers, setActiveUsers] = useState<{ id: string; name: string; role?: string; email?: string }[]>([]);
  const [activeFilter, setActiveFilter] = useState<"ALL" | Priority>("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newText, setNewText] = useState("");
  const [newWhy, setNewWhy] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>(Priority.MEDIUM);
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRequests = async () => {
    const res = await getInboxRequestsAction();
    if (res.success && res.data) {
      const d = res.data as any;
      setRequests(d.requests || []);
      setActiveUsers(d.activeUsers || []);
      if (d.activeUsers && d.activeUsers.length > 0 && !selectedRecipientId) {
        setSelectedRecipientId(d.activeUsers[0].id);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAccept = async (requestId: string) => {
    const req = requests.find((r) => r.id === requestId);
    const res = await acceptRequestAction(requestId);
    if (res.success) {
      toast.success(`Accepted request: "${req?.text || requestId}" → task created in 'I Owe'`);
      loadRequests();
    } else {
      toast.error(res.error || "Failed to accept request");
    }
  };

  const handleDelegate = async (requestId: string, delegateTo: string) => {
    const req = requests.find((r) => r.id === requestId);
    const res = await delegateRequestAction(requestId, delegateTo);
    if (res.success) {
      const recipientName = activeUsers.find((u) => u.id === delegateTo)?.name || delegateTo;
      toast.success(`Delegated "${req?.text || requestId}" to ${recipientName} → tracking in "I'm Chasing"`);
      loadRequests();
    } else {
      toast.error(res.error || "Failed to delegate request");
    }
  };

  const handleDecline = async (requestId: string, reason: string) => {
    const req = requests.find((r) => r.id === requestId);
    const res = await declineRequestAction(requestId, reason);
    if (res.success) {
      toast.success(`Declined request: "${req?.text || requestId}"`);
      loadRequests();
    } else {
      toast.error(res.error || "Failed to decline request");
    }
  };

  const handleCreateRequest = async () => {
    if (!newText.trim() || !selectedRecipientId || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await createRequestAction({
        text: newText.trim(),
        why: newWhy.trim() || undefined,
        priority: newPriority,
        toUserId: selectedRecipientId,
      });

      if (res.success) {
        setIsNewModalOpen(false);
        setNewText("");
        setNewWhy("");
        const targetUser = activeUsers.find((u) => u.id === selectedRecipientId)?.name || "Recipient";
        toast.success(`Request submitted to ${targetUser}`);
        loadRequests();
      } else {
        toast.error(res.error || "Failed to submit request");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activePendingRequests = requests.filter((r) => r.state === RequestState.NEW);

  const filteredRequests = activePendingRequests.filter((r) => {
    if (activeFilter === "ALL") return true;
    return r.priority === activeFilter;
  });

  return (
    <div className="space-y-6">
      

      {/* Header */}
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
            onClick={() => setShowFilters((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 border border-line rounded-control text-xs transition-colors cursor-pointer ${
              showFilters ? "bg-primary text-white border-primary" : "bg-surface text-ink hover:bg-surface-alt"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
          </button>
          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Request</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      {showFilters && (
        <div className="flex items-center gap-2 p-3 bg-surface rounded-panel border border-line text-xs animate-in fade-in">
          <span className="text-mutedText font-mono text-[11px] mr-1">Priority:</span>
          {(["ALL", "URGENT", "HIGH", "MEDIUM", "LOW"] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setActiveFilter(lvl)}
              className={`px-2.5 py-1 rounded-control text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                activeFilter === lvl
                  ? "bg-primary text-white"
                  : "bg-ground hover:bg-surface-alt text-mutedText border border-line"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      )}

      {/* Requests List */}
      <InboxList
        requests={filteredRequests}
        activeUsers={activeUsers}
        onAccept={handleAccept}
        onDelegate={handleDelegate}
        onDecline={handleDecline}
      />

      {/* New Request Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-panel border border-line w-full max-w-md shadow-panel p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-ink">Raise a Request</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded text-mutedText hover:text-ink cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-ink font-medium mb-1">What is needed? *</label>
                <input
                  type="text"
                  required
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="e.g. Verify DNS propagation for admissions portal"
                  className="w-full px-3 py-2 bg-ground border border-line rounded-control text-ink placeholder:text-mutedText focus:outline-none focus:border-primary font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-ink font-medium mb-1">Why / Context (optional)</label>
                <textarea
                  rows={2}
                  value={newWhy}
                  onChange={(e) => setNewWhy(e.target.value)}
                  placeholder="e.g. Cutover scheduled for 18:00 today"
                  className="w-full px-3 py-2 bg-ground border border-line rounded-control text-ink placeholder:text-mutedText focus:outline-none focus:border-primary font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink font-medium mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 bg-ground border border-line rounded-control text-ink font-mono text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-ink font-medium mb-1">Send to</label>
                  <select
                    value={selectedRecipientId}
                    onChange={(e) => setSelectedRecipientId(e.target.value)}
                    className="w-full px-3 py-2 bg-ground border border-line rounded-control text-ink font-mono text-xs focus:outline-none focus:border-primary"
                  >
                    {activeUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.role ? `(${u.role})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="px-3 py-1.5 text-xs text-mutedText hover:text-ink cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCreateRequest}
                className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-medium shadow-xs cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Request</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
