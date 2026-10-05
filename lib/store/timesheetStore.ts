"use client";

import { broadcastStoreUpdate } from "./sync";
import { auditStore } from "./auditStore";

export interface TimesheetTaskRow {
  taskId: string;
  taskTitle: string;
  taskRef: string;
  hours: number[]; // index 0..5 (Mon..Sat)
}

const STORAGE_KEY = "icc_timesheet_v1";

function getInitialTimesheetRows(): TimesheetTaskRow[] {
  return [
    {
      taskId: "t-1",
      taskRef: "T-1042",
      taskTitle: "Fix fee calculation on admission portal",
      hours: [2.5, 3.0, 1.5, 0, 0, 0],
    },
    {
      taskId: "t-2",
      taskRef: "T-1043",
      taskTitle: "UOS Phase 1 testing and bug triage",
      hours: [1.0, 1.5, 2.0, 3.0, 0, 0],
    },
    {
      taskId: "t-3",
      taskRef: "T-1044",
      taskTitle: "Review SSL certificate renewals",
      hours: [0.5, 0, 0, 1.0, 0.5, 0],
    },
  ];
}

class TimesheetStore {
  private data: Record<string, TimesheetTaskRow[]> = {};
  private isLoaded = false;

  private load(): Record<string, TimesheetTaskRow[]> {
    if (typeof window === "undefined") return { default: getInitialTimesheetRows() };
    if (this.isLoaded) return this.data;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.data = JSON.parse(stored);
      } else {
        this.data = { default: getInitialTimesheetRows() };
        this.save();
      }
    } catch {
      this.data = { default: getInitialTimesheetRows() };
    }
    this.isLoaded = true;
    return this.data;
  }

  private save(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {}
    broadcastStoreUpdate("icc-timesheet-updated", this.data);
  }

  public getRowsForWeek(weekKey: string): TimesheetTaskRow[] {
    const all = this.load();
    return all[weekKey] || (weekKey === "0" ? getInitialTimesheetRows() : getInitialTimesheetRows().map((r) => ({ ...r, hours: [0, 0, 0, 0, 0, 0] })));
  }

  public logHours(weekKey: string, taskRef: string, dayIndex: number, hours: number): void {
    const rows = this.getRowsForWeek(weekKey);
    let updated = false;

    const newRows = rows.map((r) => {
      if (r.taskRef === taskRef) {
        updated = true;
        const newHours = [...r.hours];
        newHours[dayIndex] = (newHours[dayIndex] || 0) + hours;
        return { ...r, hours: newHours };
      }
      return r;
    });

    if (!updated) {
      newRows.push({
        taskId: `t-${Date.now()}`,
        taskRef,
        taskTitle: "Logged Work",
        hours: [0, 0, 0, 0, 0, 0].map((h, idx) => (idx === dayIndex ? hours : h)),
      });
    }

    this.data[weekKey] = newRows;
    this.save();

    auditStore.logEvent({
      action: "UPDATE",
      entity: `Timesheet ${taskRef}`,
      details: `Logged ${hours}h for day index ${dayIndex}`,
    });
  }
}

export const timesheetStore = new TimesheetStore();
