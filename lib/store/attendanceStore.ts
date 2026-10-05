"use client";

import { broadcastStoreUpdate } from "./sync";
import { auditStore } from "./auditStore";
import { taskStore } from "./taskStore";

export interface AttendanceUser {
  id: string;
  name: string;
  role: string;
  inTime: string | null;
  mode: "OFFICE" | "REMOTE" | "CAMPUS" | "FIELD" | null;
  status: "PRESENT" | "LATE" | "ON_LEAVE" | "NOT_YET";
  verified: boolean;
}

export interface AttendanceState {
  isCheckedIn: boolean;
  checkInTime: string;
  checkOutTime: string | null;
  workMode: "OFFICE" | "REMOTE" | "CAMPUS" | "FIELD";
  workedMinutes: number;
  todayUsers: AttendanceUser[];
}

const STORAGE_KEY = "icc_attendance_v1";

function getInitialAttendanceState(): AttendanceState {
  return {
    isCheckedIn: true,
    checkInTime: "09:04",
    checkOutTime: null,
    workMode: "OFFICE",
    workedMinutes: 266, // ~4h 26m
    todayUsers: [
      { id: "u-1", name: "Sri", role: "Admin", inTime: "08:55", mode: "OFFICE", status: "PRESENT", verified: true },
      { id: "u-2", name: "Hari", role: "Lead", inTime: "09:02", mode: "OFFICE", status: "PRESENT", verified: true },
      { id: "u-3", name: "Dev Web", role: "Developer", inTime: "09:12", mode: "CAMPUS", status: "PRESENT", verified: true },
      { id: "u-4", name: "Dev Backend", role: "Developer", inTime: "09:00", mode: "REMOTE", status: "PRESENT", verified: true },
      { id: "u-5", name: "Intern Web A", role: "Intern", inTime: "09:35", mode: "OFFICE", status: "LATE", verified: true },
      { id: "u-6", name: "Intern Web B", role: "Intern", inTime: null, mode: null, status: "NOT_YET", verified: false },
    ],
  };
}

class AttendanceStore {
  private state: AttendanceState = getInitialAttendanceState();
  private isLoaded = false;

  private load(): AttendanceState {
    if (typeof window === "undefined") return getInitialAttendanceState();
    if (this.isLoaded) return this.state;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.state = JSON.parse(stored);
      } else {
        this.state = getInitialAttendanceState();
        this.save();
      }
    } catch {
      this.state = getInitialAttendanceState();
    }
    this.isLoaded = true;
    return this.state;
  }

  private save(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {}
    broadcastStoreUpdate("icc-attendance-updated", this.state);
  }

  public getState(): AttendanceState {
    return { ...this.load() };
  }

  public checkIn(mode: "OFFICE" | "REMOTE" | "CAMPUS" | "FIELD" = "OFFICE"): AttendanceState {
    const current = this.load();
    const d = new Date();
    const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

    this.state = {
      ...current,
      isCheckedIn: true,
      checkInTime: timeStr,
      checkOutTime: null,
      workMode: mode,
    };

    // Update Sri in today's roster
    this.state.todayUsers = this.state.todayUsers.map((u) =>
      u.id === "u-1" ? { ...u, inTime: timeStr, mode, status: "PRESENT", verified: true } : u
    );

    this.save();

    auditStore.logEvent({
      action: "STATUS_CHANGE",
      entity: "Attendance",
      details: `Checked in at ${timeStr} (${mode} verified)`,
    });

    return this.state;
  }

  public checkOut(): AttendanceState {
    const current = this.load();
    const d = new Date();
    const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

    this.state = {
      ...current,
      isCheckedIn: false,
      checkOutTime: timeStr,
    };

    this.save();

    auditStore.logEvent({
      action: "STATUS_CHANGE",
      entity: "Attendance",
      details: `Checked out at ${timeStr}`,
    });

    return this.state;
  }

  public setMode(mode: "OFFICE" | "REMOTE" | "CAMPUS" | "FIELD"): void {
    const current = this.load();
    this.state = { ...current, workMode: mode };
    this.save();
  }

  public remindUser(userId: string, name: string): void {
    taskStore.addNotification({
      title: `Attendance Reminder: Please punch in today (${name})`,
      type: "attendance",
      link: "/attendance",
    });

    auditStore.logEvent({
      action: "UPDATE",
      entity: "Attendance Nudge",
      details: `Dispatched check-in reminder to ${name}`,
    });
  }

  public remindAll(): number {
    const current = this.load();
    const notIn = current.todayUsers.filter((u) => u.status === "NOT_YET");
    notIn.forEach((u) => {
      taskStore.addNotification({
        title: `Attendance Reminder: Please record your check-in today (${u.name})`,
        type: "attendance",
        link: "/attendance",
      });
    });

    auditStore.logEvent({
      action: "UPDATE",
      entity: "Attendance Nudge",
      details: `Dispatched attendance reminder to ${notIn.length} pending users`,
    });

    return notIn.length;
  }
}

export const attendanceStore = new AttendanceStore();
