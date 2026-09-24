"use client";

import { useState } from "react";
import { ShieldAlert, Send, Edit2, X, Check } from "lucide-react";

export interface PendingApprovalItem {
  id: string;
  targetName: string;
  targetRole: string;
  isSenior?: boolean;
  taskTitle: string;
  draftText: string;
  cadence: string;
  createdAt: string;
}

interface ApprovalQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PendingApprovalItem[];
  onApprove: (id: string, text: string) => void;
  onSkip: (id: string) => void;
}

export function ApprovalQueueModal({
  isOpen,
  onClose,
  items,
  onApprove,
  onSkip,
}: ApprovalQueueModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  if (!isOpen) return null;

  const handleStartEdit = (item: PendingApprovalItem) => {
    setEditingId(item.id);
    setEditText(item.draftText);
  };

  const handleSaveApprove = (id: string) => {
    onApprove(id, editText);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface rounded-panel border border-line w-full max-w-2xl max-h-[85vh] flex flex-col shadow-panel animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-line flex items-center justify-between bg-surface-alt/50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-chasing" />
            <h2 className="text-sm font-bold text-ink">Follow-ups Awaiting Approval</h2>
            <span className="text-[10px] font-mono bg-chasing/10 text-chasing border border-chasing/20 px-1.5 py-0.5 rounded font-bold">
              {items.length} Pending
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

        {/* List of drafts */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12 text-mutedText text-xs">
              All follow-ups approved! No items pending review.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-card border border-line bg-surface hover:border-mutedText/40 transition-colors space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-ink">{item.targetName}</span>
                      <span className="text-[10px] font-mono text-mutedText bg-ground px-1.5 py-0.5 rounded">
                        {item.targetRole}
                      </span>
                      {item.isSenior && (
                        <span className="text-[10px] font-mono bg-chasing/10 text-chasing px-1.5 py-0.2 rounded font-semibold">
                          Senior Officer
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-mutedText mt-0.5 font-medium">
                      Re: {item.taskTitle} · <span className="font-mono">{item.cadence}</span>
                    </div>
                  </div>

                  <span className="text-[10px] text-mutedText font-mono">{item.createdAt}</span>
                </div>

                {editingId === item.id ? (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full text-xs p-2.5 bg-ground border border-primary rounded-control text-ink focus:outline-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 text-xs text-mutedText hover:text-ink"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveApprove(item.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-control"
                      >
                        <Check className="h-3 w-3" />
                        <span>Save & Approve</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-control bg-ground text-xs text-ink/90 font-mono italic border border-line">
                    &ldquo;{item.draftText}&rdquo;
                  </div>
                )}

                {editingId !== item.id && (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onSkip(item.id)}
                      className="px-2.5 py-1 rounded-control text-xs text-mutedText hover:text-ink hover:bg-ground border border-transparent hover:border-line"
                    >
                      Skip
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-control text-xs text-ink bg-surface border border-line hover:bg-ground"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onApprove(item.id, item.draftText)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-control bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-2xs"
                    >
                      <Send className="h-3 w-3" />
                      <span>Approve & Send</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
