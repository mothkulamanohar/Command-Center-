import { Request, Priority, RequestState } from "@prisma/client";
import { taskStore } from "./taskStore";

const INBOX_STORAGE_KEY = "icc_inbox_store_v1";

function getInitialRequests(): Request[] {
  return [
    {
      id: "req_1",
      fromUserId: "u_vc",
      toUserId: "u_sri",
      text: "Placement report summary for academic year 2025-26",
      why: "Required for governing body meeting on Monday",
      dueAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      priority: Priority.HIGH,
      state: RequestState.NEW,
      declineReason: null,
      scheduledFor: null,
      delegatedToId: null,
      firstActionAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "req_2",
      fromUserId: "u_coo",
      toUserId: "u_sri",
      text: "Renew annual SSL certificates for all 5 campus domains",
      why: "Certificate monitoring alert",
      dueAt: new Date(Date.now() + 96 * 60 * 60 * 1000),
      priority: Priority.URGENT,
      state: RequestState.NEW,
      declineReason: null,
      scheduledFor: null,
      delegatedToId: null,
      firstActionAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

let inMemoryRequests: Request[] | null = null;

function loadInitialRequests(): Request[] {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(INBOX_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((r: any) => ({
            ...r,
            dueAt: r.dueAt ? new Date(r.dueAt) : null,
            createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
            updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
          }));
        }
      }
    } catch {}
  }
  return getInitialRequests();
}

function saveRequests(requests: Request[]) {
  inMemoryRequests = requests;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify(requests));
      window.dispatchEvent(new CustomEvent("icc-inbox-updated", { detail: requests }));
    } catch {}
  }
}

export const inboxStore = {
  getRequests(): Request[] {
    if (!inMemoryRequests) {
      inMemoryRequests = loadInitialRequests();
    }
    return inMemoryRequests;
  },

  getPendingRequests(): Request[] {
    return this.getRequests().filter((r) => r.state === RequestState.NEW);
  },

  addRequest({
    text,
    why = null,
    priority = Priority.MEDIUM,
    toUserId = "u_hari",
    fromUserId = "u_sri",
  }: {
    text: string;
    why?: string | null;
    priority?: Priority;
    toUserId?: string;
    fromUserId?: string;
  }): Request {
    const current = this.getRequests();
    const newReq: Request = {
      id: `req_${Date.now()}`,
      fromUserId,
      toUserId,
      text: text.trim(),
      why: why ? why.trim() : null,
      dueAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      priority,
      state: RequestState.NEW,
      declineReason: null,
      scheduledFor: null,
      delegatedToId: null,
      firstActionAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    saveRequests([newReq, ...current]);
    return newReq;
  },

  acceptRequest(requestId: string): { request: Request; task: any } | null {
    const current = this.getRequests();
    const req = current.find((r) => r.id === requestId);
    if (!req) return null;

    // 1. Create task in taskStore under Sri's 'I Owe'
    const requesterName =
      req.fromUserId === "u_vc"
        ? "VC Office"
        : req.fromUserId === "u_coo"
        ? "COO Office"
        : "Colleague";

    const createdTask = taskStore.addTask({
      title: req.text,
      requesterName,
      priority: req.priority,
      dueDate: req.dueAt ? new Date(req.dueAt) : new Date(Date.now() + 48 * 3600 * 1000),
    });

    // 2. Mark request as ACCEPTED
    const updatedRequest: Request = {
      ...req,
      state: RequestState.ACCEPTED,
      firstActionAt: req.firstActionAt || new Date(),
      updatedAt: new Date(),
    };

    saveRequests(current.map((r) => (r.id === requestId ? updatedRequest : r)));
    return { request: updatedRequest, task: createdTask };
  },

  delegateRequest(
    requestId: string,
    delegateTo: string = "Hari"
  ): { request: Request; task: any } | null {
    const current = this.getRequests();
    const req = current.find((r) => r.id === requestId);
    if (!req) return null;

    // 1. Create task in taskStore under Sri's 'I'm Chasing'
    const createdTask = taskStore.assignTask({
      title: req.text,
      ownerName: delegateTo,
      dueDate: req.dueAt ? new Date(req.dueAt) : new Date(Date.now() + 48 * 3600 * 1000),
    });

    // 2. Mark request as DELEGATED
    const updatedRequest: Request = {
      ...req,
      state: RequestState.DELEGATED,
      delegatedToId: delegateTo,
      firstActionAt: req.firstActionAt || new Date(),
      updatedAt: new Date(),
    };

    saveRequests(current.map((r) => (r.id === requestId ? updatedRequest : r)));
    return { request: updatedRequest, task: createdTask };
  },

  declineRequest(requestId: string, reason: string = "Declined by recipient"): Request | null {
    const current = this.getRequests();
    const req = current.find((r) => r.id === requestId);
    if (!req) return null;

    const updatedRequest: Request = {
      ...req,
      state: RequestState.DECLINED,
      declineReason: reason,
      firstActionAt: req.firstActionAt || new Date(),
      updatedAt: new Date(),
    };

    saveRequests(current.map((r) => (r.id === requestId ? updatedRequest : r)));
    return updatedRequest;
  },

  reset() {
    saveRequests(getInitialRequests());
  },
};
