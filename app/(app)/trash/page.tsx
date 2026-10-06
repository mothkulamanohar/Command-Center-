"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2, RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  getTrashItemsAction,
  restoreItemAction,
  deletePermanentAction,
  emptyTrashAction,
} from "./actions";

export interface TrashItem {
  id: string;
  type: "TASK" | "DOC" | "REQUEST";
  title: string;
  deletedAt: string;
  daysRemaining: number;
}

import { trashStore } from "@/lib/store/trashStore";

export default function TrashPage() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TrashItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurging, setIsPurging] = useState(false);

  const loadItems = async () => {
    try {
      const res = await getTrashItemsAction();
      if (res.success && res.data && (res.data as any[]).length > 0) {
        setItems(res.data as any);
        setIsLoading(false);
        return;
      }
    } catch {}
    setItems(trashStore.getItems() as any);
    setIsLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleRestore = async (id: string, title: string) => {
    try {
      await restoreItemAction(id);
    } catch {}
    trashStore.restoreItem(id);
    toast.success(`Restored: "${title}"`);
    loadItems();
  };

  const handleDeletePermanent = async () => {
    if (!itemToDelete || isPurging) return;
    setIsPurging(true);
    const { id, title } = itemToDelete;
    try {
      await deletePermanentAction(id);
    } catch {}
    trashStore.deletePermanently(id);
    setItemToDelete(null);
    setIsPurging(false);
    toast.success(`Permanently deleted: "${title}"`);
    loadItems();
  };

  const handleEmptyTrash = async () => {
    if (isPurging) return;
    setIsPurging(true);
    try {
      await emptyTrashAction();
    } catch {}
    trashStore.emptyTrash();
    setConfirmEmpty(false);
    setIsPurging(false);
    toast.success("Trash emptied completely");
    loadItems();
  };

  return (
    <div className="space-y-6">
      

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
                  onClick={() => setItemToDelete(item)}
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

      {/* Confirm Single Item Permanent Delete Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-panel border border-line w-full max-w-sm shadow-panel p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2 text-danger">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-bold text-ink">Permanently Delete Item?</h3>
            </div>
            <p className="text-xs text-mutedText leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-ink">&quot;{itemToDelete.title}&quot;</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <button
                type="button"
                disabled={isPurging}
                onClick={() => setItemToDelete(null)}
                className="px-3 py-1.5 text-xs text-mutedText hover:text-ink cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPurging}
                onClick={handleDeletePermanent}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-danger hover:bg-danger-hover text-white rounded-control text-xs font-medium shadow-xs cursor-pointer disabled:opacity-60"
              >
                {isPurging ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Permanently Delete</span>
                )}
              </button>
            </div>
          </div>
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
                disabled={isPurging}
                onClick={() => setConfirmEmpty(false)}
                className="px-3 py-1.5 text-xs text-mutedText hover:text-ink cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPurging}
                onClick={handleEmptyTrash}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-danger hover:bg-danger-hover text-white rounded-control text-xs font-medium shadow-xs cursor-pointer disabled:opacity-60"
              >
                {isPurging ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Purging...</span>
                  </>
                ) : (
                  <span>Permanently Purge All</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
