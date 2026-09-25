"use client";

import { useState } from "react";
import { Trash2, RotateCcw, AlertTriangle, CheckCircle2, ShieldAlert, X } from "lucide-react";

interface TrashItem {
  id: string;
  type: "TASK" | "DOC" | "REQUEST";
  title: string;
  deletedAt: string;
  daysRemaining: number;
}

const INITIAL_TRASH: TrashItem[] = [
  {
    id: "tr-1",
    type: "TASK",
    title: "T-1033: Obsolete printer mapping and spooler setup",
    deletedAt: "20 Sep 2026",
    daysRemaining: 26,
  },
  {
    id: "tr-2",
    type: "DOC",
    title: "Draft SOP: Legacy Cisco Catalyst 2960 baseline (v0.1)",
    deletedAt: "18 Sep 2026",
    daysRemaining: 24,
  },
  {
    id: "tr-3",
    type: "REQUEST",
    title: "Quote for 100m Cat6 patch cable roll (Duplicate)",
    deletedAt: "22 Sep 2026",
    daysRemaining: 28,
  },
];

export default function TrashPage() {
  const [items, setItems] = useState<TrashItem[]>(INITIAL_TRASH);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleRestore = (id: string, title: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    showToast(`Restored: "${title}"`);
  };

  const handleDeletePermanent = (id: string, title: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    showToast(`Permanently deleted: "${title}"`);
  };

  const handleEmptyTrash = () => {
    setItems([]);
    setConfirmEmpty(false);
    showToast("Trash emptied permanently");
  };

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
          <h1 className="text-xl font-bold text-ink tracking-tight">Trash & Recycle Bin</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Soft-deleted items are retained for 30 days before automated purge (SPEC §17)
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmEmpty(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-danger/10 hover:bg-danger text-danger hover:text-white rounded-control text-xs font-medium transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Empty Trash ({items.length})</span>
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-surface rounded-panel border border-line p-12 text-center shadow-xs space-y-2">
          <Trash2 className="h-8 w-8 text-mutedText mx-auto stroke-1" />
          <h3 className="text-sm font-semibold text-ink">Trash is Empty</h3>
          <p className="text-xs text-mutedText">
            No deleted tasks, documents, or requests in retention.
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-panel border border-line shadow-xs divide-y divide-line">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-surface-alt transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-ground rounded text-mutedText font-semibold">
                    {item.type}
                  </span>
                  <span className="text-xs font-medium text-ink">{item.title}</span>
                </div>
                <div className="text-[11px] text-mutedText font-mono">
                  Deleted on {item.deletedAt} • {item.daysRemaining} days remaining before purge
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleRestore(item.id, item.title)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-ground hover:bg-surface border border-line rounded text-xs font-medium text-ink transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-primary" />
                  <span>Restore</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePermanent(item.id, item.title)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-danger hover:bg-danger/10 rounded text-xs font-medium transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Empty Trash Modal */}
      {confirmEmpty && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-panel border border-line w-full max-w-sm shadow-panel p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2 text-danger">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-bold text-ink">Empty Trash?</h3>
            </div>
            <p className="text-xs text-mutedText leading-relaxed">
              This action cannot be undone. All {items.length} items currently in the trash will be permanently purged immediately.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => setConfirmEmpty(false)}
                className="px-3 py-1.5 text-xs text-mutedText hover:text-ink cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEmptyTrash}
                className="px-4 py-1.5 bg-danger hover:bg-danger-hover text-white rounded-control text-xs font-medium shadow-xs cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
