"use client";

import { broadcastStoreUpdate } from "./sync";
import { auditStore } from "./auditStore";

export interface TrashItem {
  id: string;
  type: "TASK" | "DOC" | "REQUEST";
  title: string;
  deletedAt: string;
  daysRemaining: number;
  originalData?: unknown;
}

const STORAGE_KEY = "icc_trash_v1";

function getInitialTrashItems(): TrashItem[] {
  const d = new Date(Date.now() - 4 * 86400000);
  const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return [
    {
      id: "tr-seed-1",
      type: "TASK",
      title: "T-1033: Obsolete printer mapping and spooler setup",
      deletedAt: dateStr,
      daysRemaining: 26,
    },
    {
      id: "tr-seed-2",
      type: "DOC",
      title: "Draft SOP: Legacy Cisco Catalyst 2960 baseline (v0.1)",
      deletedAt: dateStr,
      daysRemaining: 26,
    },
  ];
}

class TrashStore {
  private items: TrashItem[] = [];
  private isLoaded = false;

  private load(): TrashItem[] {
    if (typeof window === "undefined") return getInitialTrashItems();
    if (this.isLoaded) return this.items;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.items = JSON.parse(stored);
      } else {
        this.items = getInitialTrashItems();
        this.save();
      }
    } catch {
      this.items = getInitialTrashItems();
    }
    this.isLoaded = true;
    return this.items;
  }

  private save(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    } catch {}
    broadcastStoreUpdate("icc-trash-updated", this.items);
  }

  public getItems(): TrashItem[] {
    return [...this.load()];
  }

  public addToTrash(item: {
    id: string;
    type: "TASK" | "DOC" | "REQUEST";
    title: string;
    originalData?: unknown;
  }): void {
    const current = this.load();
    const d = new Date();
    const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    const newTrash: TrashItem = {
      id: item.id,
      type: item.type,
      title: item.title,
      deletedAt: dateStr,
      daysRemaining: 30,
      originalData: item.originalData,
    };

    // Filter out if duplicate
    this.items = [newTrash, ...current.filter((i) => i.id !== item.id)];
    this.save();

    auditStore.logEvent({
      action: "DELETE",
      entity: `${item.type} ${item.title}`,
      details: `Moved ${item.type.toLowerCase()} "${item.title}" to Trash`,
    });
  }

  public restoreItem(id: string): TrashItem | null {
    const current = this.load();
    const target = current.find((i) => i.id === id);
    if (!target) return null;

    this.items = current.filter((i) => i.id !== id);
    this.save();

    auditStore.logEvent({
      action: "UPDATE",
      entity: `${target.type} ${target.title}`,
      details: `Restored ${target.type.toLowerCase()} "${target.title}" from Trash`,
    });

    return target;
  }

  public deletePermanently(id: string): void {
    const current = this.load();
    const target = current.find((i) => i.id === id);
    this.items = current.filter((i) => i.id !== id);
    this.save();

    if (target) {
      auditStore.logEvent({
        action: "DELETE",
        entity: `${target.type} ${target.title}`,
        details: `Permanently purged ${target.type.toLowerCase()} "${target.title}"`,
      });
    }
  }

  public emptyTrash(): void {
    this.items = [];
    this.save();

    auditStore.logEvent({
      action: "DELETE",
      entity: "Trash Bin",
      details: "Emptied all items in trash recycle bin",
    });
  }
}

export const trashStore = new TrashStore();
