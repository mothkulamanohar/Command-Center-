"use client";

import { broadcastStoreUpdate } from "./sync";
import { auditStore } from "./auditStore";

export interface SystemSettings {
  orgName: string;
  timezone: string;
  workingDays: string;
  workingHours: string;
  deadline: string;
  seniorPeople: string[];
  aiEnabled: boolean;
  aiModel: string;
  attendance: {
    officeStart: string;
    officeEnd: string;
    graceMinutes: number;
    halfDayHours: number;
    fullDayHours: number;
    absentCutoff: string;
    verifyMethod: "IP" | "LOCATION" | "BOTH" | "NONE";
    maxRegularisationsPerMonth: number;
    leaveApprovalRequired: boolean;
  };
  time: {
    hoursPerDay: number;
    timerAutoStop: string;
  };
  feedback: {
    leadsCanGive: boolean;
    dueWorkingDays: number;
  };
  cert: {
    collegeName: string;
    collegeWebsite: string;
    verifyBaseUrl: string;
    prefix: string;
    minAttendancePercent: number;
  };
}

const STORAGE_KEY = "icc_settings_v1";

function getDefaultSettings(): SystemSettings {
  return {
    orgName: "SMRU Campus IT Group",
    timezone: "Asia/Kolkata",
    workingDays: "Monday – Saturday",
    workingHours: "09:00 – 18:00 IST",
    deadline: "18:00 IST",
    seniorPeople: ["CEO Office", "COO Office", "VC Office", "Janardhan sir"],
    aiEnabled: false,
    aiModel: "qwen2.5:7b-instruct",
    attendance: {
      officeStart: "09:00",
      officeEnd: "18:00",
      graceMinutes: 15,
      halfDayHours: 4,
      fullDayHours: 8,
      absentCutoff: "11:00",
      verifyMethod: "BOTH",
      maxRegularisationsPerMonth: 3,
      leaveApprovalRequired: true,
    },
    time: {
      hoursPerDay: 8,
      timerAutoStop: "18:30",
    },
    feedback: {
      leadsCanGive: true,
      dueWorkingDays: 3,
    },
    cert: {
      collegeName: "St. Mary's Group of Institutions",
      collegeWebsite: "https://smru.edu.in",
      verifyBaseUrl: "/verify",
      prefix: "SMRU-IT",
      minAttendancePercent: 80,
    },
  };
}

class SettingsStore {
  private settings: SystemSettings = getDefaultSettings();
  private isLoaded = false;

  private load(): SystemSettings {
    if (typeof window === "undefined") return getDefaultSettings();
    if (this.isLoaded) return this.settings;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.settings = { ...getDefaultSettings(), ...JSON.parse(stored) };
      } else {
        this.settings = getDefaultSettings();
        this.save();
      }
    } catch {
      this.settings = getDefaultSettings();
    }
    this.isLoaded = true;
    return this.settings;
  }

  private save(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {}
    broadcastStoreUpdate("icc-settings-updated", this.settings);
  }

  public getSettings(): SystemSettings {
    return { ...this.load() };
  }

  public updateSettings(partial: Partial<SystemSettings>): SystemSettings {
    const current = this.load();
    this.settings = {
      ...current,
      ...partial,
      attendance: { ...current.attendance, ...(partial.attendance || {}) },
      time: { ...current.time, ...(partial.time || {}) },
      feedback: { ...current.feedback, ...(partial.feedback || {}) },
      cert: { ...current.cert, ...(partial.cert || {}) },
    };
    this.save();

    auditStore.logEvent({
      action: "SETTINGS",
      entity: "System Configuration",
      details: "Updated organization policies and module parameters",
    });

    return this.settings;
  }
}

export const settingsStore = new SettingsStore();
