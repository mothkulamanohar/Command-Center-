"use client";

import { broadcastStoreUpdate } from "./sync";

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE" | "LOGIN" | "CERT_ISSUE" | "SETTINGS" | "FEEDBACK";
  entity: string;
  details: string;
  ip: string;
}

const STORAGE_KEY = "icc_audit_v1";

function getInitialAuditEntries(): AuditEntry[] {
  const now = Date.now();
  const formatTime = (ms: number) => {
    const d = new Date(ms);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  };

  return [
    {
      id: "aud-1",
      timestamp: formatTime(now - 14 * 60 * 1000),
      actor: "Sri (IT Manager)",
      action: "STATUS_CHANGE",
      entity: "Task T-1042",
      details: "Updated status of 'Fix fee calculation on admission portal' to IN_PROGRESS",
      ip: "127.0.0.1",
    },
    {
      id: "aud-2",
      timestamp: formatTime(now - 45 * 60 * 1000),
      actor: "Sri (IT Manager)",
      action: "LOGIN",
      entity: "Session",
      details: "Logged in via Campus Wi-Fi geofence verified portal",
      ip: "127.0.0.1",
    },
    {
      id: "aud-3",
      timestamp: formatTime(now - 3 * 3600 * 1000),
      actor: "Sri (IT Manager)",
      action: "CERT_ISSUE",
      entity: "Certificate ICC-ACH-2026-0001",
      details: "Issued Achievement Certificate (Code: K7Q2M9XA4D) to Sri Ram",
      ip: "127.0.0.1",
    },
    {
      id: "aud-4",
      timestamp: formatTime(now - 5 * 3600 * 1000),
      actor: "Sri (IT Manager)",
      action: "UPDATE",
      entity: "Team Campus IT",
      details: "Synchronized roster and attendance verified records",
      ip: "127.0.0.1",
    },
  ];
}

class AuditStore {
  private events: AuditEntry[] = [];
  private isLoaded = false;

  private load(): AuditEntry[] {
    if (typeof window === "undefined") return getInitialAuditEntries();
    if (this.isLoaded) return this.events;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.events = JSON.parse(stored);
      } else {
        this.events = getInitialAuditEntries();
        this.save();
      }
    } catch {
      this.events = getInitialAuditEntries();
    }
    this.isLoaded = true;
    return this.events;
  }

  private save(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events));
    } catch {}
    broadcastStoreUpdate("icc-audit-updated", this.events);
  }

  public getEvents(): AuditEntry[] {
    return [...this.load()];
  }

  public logEvent(entry: {
    actor?: string;
    action: AuditEntry["action"];
    entity: string;
    details: string;
    ip?: string;
  }): AuditEntry {
    const current = this.load();
    const d = new Date();
    const timestamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;

    const newEntry: AuditEntry = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      actor: entry.actor || "Sri (IT Manager)",
      action: entry.action,
      entity: entry.entity,
      details: entry.details,
      ip: entry.ip || "127.0.0.1",
    };

    this.events = [newEntry, ...current];
    this.save();
    return newEntry;
  }
}

export const auditStore = new AuditStore();
