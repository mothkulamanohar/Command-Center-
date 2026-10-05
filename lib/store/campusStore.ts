"use client";

import { broadcastStoreUpdate } from "./sync";
import { auditStore } from "./auditStore";

export interface CampusItem {
  id: string;
  name: string;
  code: string;
  mode: "ONSITE" | "REMOTE";
  leadName: string;
  teamsCount: number;
}

const STORAGE_KEY = "icc_campuses_v1";

const INITIAL_CAMPUSES: CampusItem[] = [
  { id: "c-1", name: "SMRU Main Campus", code: "SMRU", mode: "ONSITE", leadName: "Hari", teamsCount: 3 },
  { id: "c-2", name: "Hyderabad Group", code: "HYD", mode: "REMOTE", leadName: "Sri", teamsCount: 1 },
  { id: "c-3", name: "Chebrol Campus", code: "CHB", mode: "ONSITE", leadName: "Hari", teamsCount: 1 },
  { id: "c-4", name: "Guntur Campus", code: "GNT", mode: "REMOTE", leadName: "Hari", teamsCount: 1 },
  { id: "c-5", name: "St. Mary's Women's Campus", code: "SMW", mode: "ONSITE", leadName: "Hari", teamsCount: 1 },
];

class CampusStore {
  private campuses: CampusItem[] = INITIAL_CAMPUSES;
  private isLoaded = false;

  private load(): CampusItem[] {
    if (typeof window === "undefined") return INITIAL_CAMPUSES;
    if (this.isLoaded) return this.campuses;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.campuses = JSON.parse(stored);
      } else {
        this.campuses = INITIAL_CAMPUSES;
        this.save();
      }
    } catch {
      this.campuses = INITIAL_CAMPUSES;
    }
    this.isLoaded = true;
    return this.campuses;
  }

  private save(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.campuses));
    } catch {}
    broadcastStoreUpdate("icc-campuses-updated", this.campuses);
  }

  public getCampuses(): CampusItem[] {
    return [...this.load()];
  }

  public toggleMode(id: string): CampusItem[] {
    const current = this.load();
    this.campuses = current.map((c) =>
      c.id === id ? { ...c, mode: c.mode === "ONSITE" ? "REMOTE" : "ONSITE" } : c
    );
    this.save();

    const updated = this.campuses.find((c) => c.id === id);
    if (updated) {
      auditStore.logEvent({
        action: "UPDATE",
        entity: `Campus ${updated.name}`,
        details: `Switched support mode to ${updated.mode}`,
      });
    }

    return this.campuses;
  }

  public addCampus(campus: Omit<CampusItem, "id" | "teamsCount">): CampusItem {
    const current = this.load();
    const newCampus: CampusItem = {
      ...campus,
      id: `c-${Date.now()}`,
      teamsCount: 0,
    };
    this.campuses = [...current, newCampus];
    this.save();

    auditStore.logEvent({
      action: "CREATE",
      entity: `Campus ${newCampus.name}`,
      details: `Registered new campus with code ${newCampus.code}`,
    });

    return newCampus;
  }
}

export const campusStore = new CampusStore();
