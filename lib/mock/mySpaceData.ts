export interface MyTask {
  id: string;
  ref: string;
  title: string;
  dueText: string;
  partner?: string;
  whoseTurn?: "ME" | "PARTNER";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "DONE";
}

export interface MyFollowUp {
  id: string;
  fromName: string;
  taskTitle: string;
  cadence: string;
  lastNudge: string;
  answered?: boolean;
}

export const INITIAL_TASKS: MyTask[] = [
  {
    id: "t-1",
    ref: "T-1042",
    title: "Verify VLAN routing on Campus Core Switch",
    dueText: "Today 18:00",
    priority: "HIGH",
    status: "OPEN",
  },
  {
    id: "t-2",
    ref: "T-1045",
    title: "Sign off on UOS staging database credentials",
    dueText: "Tomorrow 18:00",
    partner: "Hari",
    whoseTurn: "ME",
    priority: "URGENT",
    status: "OPEN",
  },
  {
    id: "t-3",
    ref: "T-1050",
    title: "Review placement report formatting for VC office",
    dueText: "26 Sep 18:00",
    priority: "MEDIUM",
    status: "OPEN",
  },
];

export const INITIAL_FOLLOWUPS: MyFollowUp[] = [
  {
    id: "fu-1",
    fromName: "Hari (Coordinator)",
    taskTitle: "Has CTPL submitted the final banner proofs?",
    cadence: "Daily chase",
    lastNudge: "Today 09:30",
  },
  {
    id: "fu-2",
    fromName: "Sri (IT Manager)",
    taskTitle: "Submit quarterly hardware requisition list",
    cadence: "Every 2 days",
    lastNudge: "Yesterday 14:00",
  },
];
