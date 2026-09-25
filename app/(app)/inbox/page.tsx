"use client";

import { useState } from "react";
import { InboxList } from "@/components/inbox/InboxList";
import { Plus, Filter, CheckCircle2, X, Send } from "lucide-react";
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

  const [activeFilter, setActiveFilter] = useState<"ALL" | Priority>("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newText, setNewText] = useState("");
  const [newWhy, setNewWhy] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>(Priority.MEDIUM);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAccept = (requestId: string) => {
    const req = requests.find((r) => r.id === requestId);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    showToast(`Accepted request: "${req?.text || requestId}" → task created`);
  };

  const handleDelegate = (requestId: string, delegateTo: string) => {
    const req = requests.find((r) => r.id === requestId);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    showToast(`Delegated "${req?.text || requestId}" to ${delegateTo}`);
  };

  const handleDecline = (requestId: string, reason: string) => {
    const req = requests.find((r) => r.id === requestId);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    showToast(`Declined request: "${req?.text || requestId}"`);
  };

  const handleCreateRequest = () => {
    if (!newText.trim()) return;

    const newReq: Request = {
      id: `req_${Date.now()}`,
      fromUserId: "u_sri",
      toUserId: "u_hari",
      text: newText.trim(),
      why: newWhy.trim() || null,
      dueAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      priority: newPriority,
      state: RequestState.NEW,
      declineReason: null,
      scheduledFor: null,
      delegatedToId: null,
      firstActionAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setRequests([newReq, ...requests]);
    setIsNewModalOpen(false);
    setNewText("");
    setNewWhy("");
    showToast(`Request submitted to Hari`);
  };

  const filteredRequests = requests.filter((r) => {
    if (activeFilter === "ALL") return true;
    return r.priority === activeFilter;
  });

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-surface px-4 py-2.5 rounded-control text-xs font-medium shadow-panel border border-line flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span>{toast}</span>
        </div>
      )}

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
                  <select className="w-full px-3 py-2 bg-ground border border-line rounded-control text-ink font-mono text-xs focus:outline-none focus:border-primary">
                    <option value="u_hari">Hari (Coordinator)</option>
                    <option value="u_sri">Sri (IT Manager)</option>
                    <option value="u_dev_web">Dev · Web</option>
                    <option value="u_dev_backend">Dev · Backend</option>
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
                onClick={handleCreateRequest}
                className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-medium shadow-xs cursor-pointer"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
