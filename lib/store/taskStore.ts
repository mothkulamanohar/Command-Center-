import { Task, User, TaskMode, Priority, TaskStatus, TaskSource, FeedbackState } from "@prisma/client";
import { formatNotificationTime } from "@/lib/time";

export type TaskWithRelations = Task & { owner?: User | null };
import { broadcastStoreUpdate } from "./sync";
import { trashStore } from "./trashStore";
import { auditStore } from "./auditStore";
import { feedbackStore } from "./feedbackStore";
import { triggerUndoToast } from "@/components/ui/UndoToast";

export interface AppNotification {
  id: string;
  title: string;
  time: string;
  timestamp?: number;
  read: boolean;
  type: "task" | "followup" | "system" | "attendance" | "feedback";
  link: string;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n-1",
    title: "Hari accepted request: 'Fix admission form fee calculation'",
    time: formatNotificationTime(Date.now() - 10 * 60 * 1000),
    timestamp: Date.now() - 10 * 60 * 1000,
    read: false,
    type: "task",
    link: "/inbox",
  },
  {
    id: "n-2",
    title: "Follow-up reply from CTPL on banners: 'Draft proof ready'",
    time: formatNotificationTime(Date.now() - 42 * 60 * 1000),
    timestamp: Date.now() - 42 * 60 * 1000,
    read: false,
    type: "followup",
    link: "/console",
  },
  {
    id: "n-3",
    title: "Uptime alert resolved: 'admissions.smru.edu.in' is healthy",
    time: formatNotificationTime(Date.now() - 2 * 60 * 60 * 1000),
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    read: false,
    type: "system",
    link: "/dev",
  },
  {
    id: "n-4",
    title: "Sri gave feedback on T-1042: ★★★★★ 'Great work'",
    time: formatNotificationTime(Date.now() - 2.5 * 60 * 60 * 1000),
    timestamp: Date.now() - 2.5 * 60 * 60 * 1000,
    read: false,
    type: "feedback",
    link: "/feedback",
  },
];

const TASKS_STORAGE_KEY = "icc_tasks_store_v1";
const NOTIFS_STORAGE_KEY = "icc_notifications_store_v1";

interface TaskStoreState {
  iOwe: TaskWithRelations[];
  imChasing: TaskWithRelations[];
  shared: TaskWithRelations[];
}

import { getInitialConsoleTasks } from "@/lib/mock/consoleData";

let inMemoryState: TaskStoreState | null = null;
let inMemoryNotifs: AppNotification[] | null = null;

function loadInitialState(): TaskStoreState {
  const fallback = getInitialConsoleTasks("u_sri");
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(TASKS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.iOwe && parsed.imChasing && parsed.shared) {
          return {
            iOwe: Array.isArray(parsed.iOwe) && parsed.iOwe.length > 0 ? parsed.iOwe : fallback.iOwe,
            imChasing: Array.isArray(parsed.imChasing) && parsed.imChasing.length > 0 ? parsed.imChasing : fallback.imChasing,
            shared: Array.isArray(parsed.shared) && parsed.shared.length > 0 ? parsed.shared : fallback.shared,
          };
        }
      }
    } catch {}
  }
  return fallback;
}

function loadInitialNotifs(): AppNotification[] {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(NOTIFS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized: AppNotification[] = parsed.map((n: AppNotification) => {
            const match = n.id && n.id.match(/^n-(\d{10,})/);
            let ts = n.timestamp;
            if (!ts || isNaN(ts)) {
              if (match) {
                ts = parseInt(match[1], 10);
              } else if (n.id === "n-1") {
                ts = Date.now() - 10 * 60 * 1000;
              } else if (n.id === "n-2") {
                ts = Date.now() - 42 * 60 * 1000;
              } else if (n.id === "n-3") {
                ts = Date.now() - 2 * 60 * 60 * 1000;
              } else if (n.id === "n-4") {
                ts = Date.now() - 2.5 * 60 * 60 * 1000;
              } else {
                ts = Date.now();
              }
            }
            return {
              ...n,
              timestamp: ts,
              time: formatNotificationTime(ts),
            };
          });

          // Ensure original restored notifications (n-1..n-4) are preserved
          const existingIds = new Set(sanitized.map((n) => n.id));
          const existingTitles = new Set(sanitized.map((n) => n.title));
          for (const initNotif of INITIAL_NOTIFICATIONS) {
            if (!existingIds.has(initNotif.id) && !existingTitles.has(initNotif.title)) {
              sanitized.push({
                ...initNotif,
                time: formatNotificationTime(initNotif.timestamp),
              });
            }
          }

          // Deduplicate consecutive/repeated identical entries
          const seen = new Set<string>();
          const deduped: AppNotification[] = [];
          for (const n of sanitized) {
            const key = `${n.title}|${n.link}`;
            if (!seen.has(key)) {
              seen.add(key);
              deduped.push(n);
            }
          }

          // Sort chronologically descending (newest first)
          deduped.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

          try {
            localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(deduped));
          } catch {}

          return deduped;
        }
      }
    } catch {}
  }
  return INITIAL_NOTIFICATIONS.map((n) => ({
    ...n,
    time: formatNotificationTime(n.timestamp),
  }));
}

function saveState(state: TaskStoreState) {
  inMemoryState = state;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(state));
    } catch {}
    broadcastStoreUpdate("icc-tasks-updated", state);
  }
}

function saveNotifs(notifs: AppNotification[]) {
  inMemoryNotifs = notifs;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(notifs));
    } catch {}
    broadcastStoreUpdate("icc-notifications-updated", notifs);
  }
}

export const taskStore = {
  getTasks(): TaskStoreState {
    if (!inMemoryState) {
      inMemoryState = loadInitialState();
    }
    return inMemoryState;
  },

  getNotifications(): AppNotification[] {
    if (!inMemoryNotifs) {
      inMemoryNotifs = loadInitialNotifs();
    }
    return inMemoryNotifs.map((n) => {
      const match = n.id && n.id.match(/^n-(\d{10,})/);
      const ts = n.timestamp || (match ? parseInt(match[1], 10) : undefined);
      return {
        ...n,
        time: ts ? formatNotificationTime(ts) : n.time,
      };
    });
  },

  /**
   * Assign a task to a user (with automated chase), placed into 'I'm Chasing' column
   */
  assignTask({
    title,
    ownerName = "Hari",
    cadence = "Daily at 09:30 AM",
    dueDate = new Date(Date.now() + 48 * 3600 * 1000),
  }: {
    title: string;
    ownerName?: string;
    cadence?: string;
    dueDate?: Date;
  }): TaskWithRelations {
    const current = this.getTasks();
    const cleanTitle = title.trim();

    const newTask: TaskWithRelations = {
      id: `t_${Date.now()}`,
      number: 1045 + current.imChasing.length + current.iOwe.length,
      title: cleanTitle,
      description: null,
      ownerId: "u_hari",
      owner: {
        id: "u_hari",
        email: "hari@smru.edu.in",
        name: ownerName,
        displayName: ownerName,
        role: "LEAD",
        phone: "+91 98765 43210",
      } as any,
      requesterId: "u_sri",
      requesterName: "Sri",
      createdById: "u_sri",
      mode: TaskMode.SOLO,
      partnerId: null,
      turnUserId: null,
      turnNote: null,
      status: TaskStatus.IN_PROGRESS, // Assigned / Active
      priority: Priority.HIGH,
      startAt: null,
      dueAt: dueDate,
      doneAt: null,
      doneById: null,
      blockedReason: null,
      teamId: null,
      projectId: null,
      campusId: null,
      tags: ["chase", "assigned", "daily-09:30"],
      source: TaskSource.COMMAND,
      recurrence: null,
      parentId: null,
      checklist: [],
      estimateHours: 3,
      workStartedAt: null,
      actualMinutes: 0,
      feedbackState: "NONE",
      lastActivityAt: new Date(),
      reopenCount: 0,
      requestId: null,
      messageId: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const nextState: TaskStoreState = {
      ...current,
      imChasing: [newTask, ...current.imChasing],
    };
    saveState(nextState);

    auditStore.logEvent({
      action: "CREATE",
      entity: `Task T-${newTask.number}`,
      details: `Assigned task "${cleanTitle}" to ${ownerName} with automated chase`,
    });

    // Create notification for the assignment
    this.addNotification({
      title: `Task assigned to ${ownerName}: '${cleanTitle}'`,
      type: "task",
      link: "/console",
    });

    return newTask;
  },

  /**
   * Add a personal/leadership task into 'I Owe' column
   */
  addTask({
    title,
    requesterName = "VC Office",
    priority = Priority.HIGH,
    dueDate = new Date(Date.now() + 48 * 3600 * 1000),
  }: {
    title: string;
    requesterName?: string;
    priority?: Priority;
    dueDate?: Date;
  }): TaskWithRelations {
    const current = this.getTasks();
    const cleanTitle = title.trim();

    const newTask: TaskWithRelations = {
      id: `t_${Date.now()}`,
      number: 1046 + current.iOwe.length + current.imChasing.length,
      title: cleanTitle,
      description: null,
      ownerId: "u_sri",
      requesterId: "u_vc",
      requesterName,
      createdById: "u_vc",
      mode: TaskMode.SOLO,
      partnerId: null,
      turnUserId: null,
      turnNote: null,
      status: TaskStatus.TODO,
      priority,
      startAt: null,
      dueAt: dueDate,
      doneAt: null,
      doneById: null,
      blockedReason: null,
      teamId: null,
      projectId: null,
      campusId: null,
      tags: ["command", "leadership"],
      source: TaskSource.LEADERSHIP,
      recurrence: null,
      parentId: null,
      checklist: [],
      estimateHours: 2,
      workStartedAt: null,
      actualMinutes: 0,
      feedbackState: "NONE",
      lastActivityAt: new Date(),
      reopenCount: 0,
      requestId: null,
      messageId: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const nextState: TaskStoreState = {
      ...current,
      iOwe: [newTask, ...current.iOwe],
    };
    saveState(nextState);

    auditStore.logEvent({
      action: "CREATE",
      entity: `Task T-${newTask.number}`,
      details: `Created leadership task "${cleanTitle}"`,
    });

    this.addNotification({
      title: `New task added: '${cleanTitle}'`,
      type: "task",
      link: "/console",
    });

    return newTask;
  },

  /**
   * Pass turn on a shared task in 'Shared' column
   */
  passTurn({
    taskId,
    taskTitle = "UOS Rollout Phase 1",
    partnerName = "Hari",
  }: {
    taskId?: string;
    taskTitle?: string;
    partnerName?: string;
  }): TaskWithRelations {
    const current = this.getTasks();
    const cleanTitle = taskTitle.trim();

    // Check if task exists in shared by id or title
    let updatedTask: TaskWithRelations;
    const existingIndex = current.shared.findIndex((t) => {
      if (taskId && t.id === taskId) return true;
      return (
        t.title.toLowerCase().includes(cleanTitle.toLowerCase()) ||
        cleanTitle.toLowerCase().includes(t.title.toLowerCase())
      );
    });

    let nextShared: TaskWithRelations[];
    if (existingIndex >= 0) {
      const existing = current.shared[existingIndex];
      const isMyTurn = existing.turnUserId === "u_sri";
      updatedTask = {
        ...existing,
        turnUserId: isMyTurn ? "u_hari" : "u_sri",
        turnNote: isMyTurn ? `Turn passed to ${partnerName}` : "Your turn to act",
        updatedAt: new Date(),
      };
      nextShared = [...current.shared];
      nextShared[existingIndex] = updatedTask;
    } else {
      updatedTask = {
        id: taskId || `t_${Date.now()}`,
        number: 1047 + current.shared.length,
        title: cleanTitle,
        description: null,
        ownerId: "u_sri",
        requesterId: "u_sri",
        requesterName: "Sri",
        createdById: "u_sri",
        mode: TaskMode.SHARED,
        partnerId: "u_hari",
        turnUserId: "u_hari",
        turnNote: `Turn passed to ${partnerName}`,
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        startAt: null,
        dueAt: new Date(Date.now() + 48 * 3600 * 1000),
        doneAt: null,
        doneById: null,
        blockedReason: null,
        teamId: null,
        projectId: null,
        campusId: null,
        tags: ["shared", "uos"],
        source: TaskSource.COMMAND,
        recurrence: null,
        parentId: null,
        checklist: [],
        estimateHours: 4,
        workStartedAt: null,
        actualMinutes: 0,
        feedbackState: "NONE",
        lastActivityAt: new Date(),
        reopenCount: 0,
        requestId: null,
        messageId: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      nextShared = [updatedTask, ...current.shared];
    }

    const nextState: TaskStoreState = {
      ...current,
      shared: nextShared,
    };
    saveState(nextState);

    auditStore.logEvent({
      action: "UPDATE",
      entity: `Task T-${updatedTask.number}`,
      details: `Passed turn to ${partnerName} on "${updatedTask.title}"`,
    });

    this.addNotification({
      title: `Turn passed to ${partnerName} on '${updatedTask.title}'`,
      type: "task",
      link: "/console",
    });

    return updatedTask;
  },

  updateTaskStatus(taskId: string, newStatus: TaskStatus) {
    const current = this.getTasks();
    const all = [...current.iOwe, ...current.imChasing, ...current.shared];
    const target = all.find((t) => t.id === taskId);
    const oldStatus = target?.status;
    const isDone = newStatus === TaskStatus.DONE;

    const updateTask = (t: TaskWithRelations): TaskWithRelations => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        status: newStatus,
        doneAt: isDone ? new Date() : null,
        doneById: isDone ? "u_sri" : null,
        updatedAt: new Date(),
      };
    };

    const nextState: TaskStoreState = {
      iOwe: current.iOwe.map(updateTask),
      imChasing: current.imChasing.map(updateTask),
      shared: current.shared.map(updateTask),
    };
    saveState(nextState);

    if (target) {
      auditStore.logEvent({
        action: "STATUS_CHANGE",
        entity: `Task T-${target.number}`,
        details: `Updated status of "${target.title}" to ${newStatus}`,
      });

      if (isDone && oldStatus !== TaskStatus.DONE) {
        triggerUndoToast({
          message: `Task T-${target.number} marked as Done`,
          onUndo: () => {
            this.updateTaskStatus(taskId, oldStatus || TaskStatus.IN_PROGRESS);
          },
        });

        // Solo task feedback loop per SPEC §19
        feedbackStore.addPendingTask({
          id: target.id,
          ref: `T-${target.number}`,
          title: target.title,
          ownerName: target.owner?.name || "Hari",
          completedAt: "Just now",
          actualDuration: `${target.actualMinutes || 45}m`,
          estimate: `${target.estimateHours || 1}h`,
        });
      }
    }
  },

  deleteTask(taskId: string): TaskWithRelations | null {
    const current = this.getTasks();
    const task =
      current.iOwe.find((t) => t.id === taskId) ||
      current.imChasing.find((t) => t.id === taskId) ||
      current.shared.find((t) => t.id === taskId);
    if (!task) return null;

    const nextState: TaskStoreState = {
      iOwe: current.iOwe.filter((t) => t.id !== taskId),
      imChasing: current.imChasing.filter((t) => t.id !== taskId),
      shared: current.shared.filter((t) => t.id !== taskId),
    };
    saveState(nextState);

    trashStore.addToTrash({
      id: task.id,
      type: "TASK",
      title: `T-${task.number}: ${task.title}`,
      originalData: task,
    });

    triggerUndoToast({
      message: `Task T-${task.number} moved to Trash`,
      onUndo: () => {
        trashStore.restoreItem(task.id);
        this.restoreTask(task);
      },
    });

    return task;
  },

  restoreTask(task: TaskWithRelations) {
    trashStore.restoreItem(task.id);
    const current = this.getTasks();
    let nextState: TaskStoreState;
    if (task.mode === TaskMode.SHARED || task.partnerId) {
      nextState = { ...current, shared: [task, ...current.shared] };
    } else if (task.ownerId && task.ownerId !== "u_sri") {
      nextState = { ...current, imChasing: [task, ...current.imChasing] };
    } else {
      nextState = { ...current, iOwe: [task, ...current.iOwe] };
    }
    saveState(nextState);
  },

  addNotification({
    title,
    type = "task",
    link = "/console",
    time,
    timestamp,
  }: {
    title: string;
    type?: AppNotification["type"];
    link?: string;
    time?: string;
    timestamp?: number;
  }) {
    const notifs = this.getNotifications();
    const nowTs = timestamp || Date.now();
    const formattedTime = time || formatNotificationTime(nowTs);
    const newNotif: AppNotification = {
      id: `n-${nowTs}-${Math.floor(Math.random() * 1000)}`,
      title,
      time: formattedTime,
      timestamp: nowTs,
      read: false,
      type,
      link,
    };
    // Avoid duplicate entries from rapid double-clicks within 10 seconds
    const filtered = notifs.filter(
      (n) => !(n.title === title && Math.abs((n.timestamp || 0) - nowTs) < 10000)
    );
    const nextNotifs = [newNotif, ...filtered].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    saveNotifs(nextNotifs);
  },

  markAllNotificationsRead() {
    const notifs = this.getNotifications();
    const updated = notifs.map((n) => ({ ...n, read: true }));
    saveNotifs(updated);
  },

  reset() {
    saveState(loadInitialState());
    saveNotifs(INITIAL_NOTIFICATIONS);
  },
};


