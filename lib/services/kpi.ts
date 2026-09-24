/**
 * IT Command Center — Authoritative KPI & JPA Calculation Engine
 * Matches formulas strictly per SPEC §13.1 & §13.2
 */

export interface TaskRecord {
  id: string;
  status: string;
  dueAt?: Date | null;
  doneAt?: Date | null;
  source?: string;
}

export interface SiteCheckRecord {
  ok: boolean;
}

export interface JpaWeights {
  delivery: number; // default 0.25
  timeliness: number; // default 0.25
  reliability: number; // default 0.15
  responsiveness: number; // default 0.10
  quality: number; // default 0.10
  leadReview: number; // default 0.15
}

export const DEFAULT_JPA_WEIGHTS: JpaWeights = {
  delivery: 0.25,
  timeliness: 0.25,
  reliability: 0.15,
  responsiveness: 0.10,
  quality: 0.10,
  leadReview: 0.15,
};

/**
 * KPI 1: Tasks completed in period (count with doneAt in period, not CANCELLED)
 */
export function calculateTasksCompleted(tasks: TaskRecord[]): number {
  return tasks.filter((t) => t.status === "DONE" && t.doneAt).length;
}

/**
 * KPI 2: On-time delivery % (done with dueAt >= doneAt / done with dueAt * 100)
 */
export function calculateOnTimeDelivery(tasks: TaskRecord[]): number {
  const doneWithDue = tasks.filter((t) => t.status === "DONE" && t.doneAt && t.dueAt);
  if (doneWithDue.length === 0) return 100;

  const onTimeCount = doneWithDue.filter((t) => t.doneAt!.getTime() <= t.dueAt!.getTime()).length;
  return Math.round((onTimeCount / doneWithDue.length) * 100);
}

/**
 * KPI 3: Overdue open tasks (open tasks with dueAt < periodEnd)
 */
export function calculateOverdueOpen(tasks: TaskRecord[], periodEnd: Date): number {
  return tasks.filter(
    (t) =>
      t.status !== "DONE" &&
      t.status !== "CANCELLED" &&
      t.dueAt &&
      t.dueAt.getTime() < periodEnd.getTime()
  ).length;
}

/**
 * KPI 4: Daily update compliance % (updates posted on-time / expected updates * 100)
 */
export function calculateDailyUpdateCompliance(onTimeCount: number, expectedCount: number): number {
  if (expectedCount <= 0) return 100;
  const pct = Math.round((onTimeCount / expectedCount) * 100);
  return Math.min(100, Math.max(0, pct));
}

/**
 * KPI 5: Follow-ups answered % (answered / sent * 100)
 */
export function calculateFollowUpsAnswered(answeredCount: number, sentCount: number): number {
  if (sentCount <= 0) return 100;
  return Math.round((answeredCount / sentCount) * 100);
}

/**
 * KPI 6: Leadership asks closed % (done / total * 100)
 */
export function calculateLeadershipAsksClosed(leadershipTasks: TaskRecord[]): number {
  if (leadershipTasks.length === 0) return 100;
  const closed = leadershipTasks.filter((t) => t.status === "DONE").length;
  return Math.round((closed / leadershipTasks.length) * 100);
}

/**
 * KPI 7: Website uptime % (successful checks / total checks * 100)
 */
export function calculateWebsiteUptime(checks: SiteCheckRecord[]): number {
  if (checks.length === 0) return 100;
  const okChecks = checks.filter((c) => c.ok).length;
  return Number(((okChecks / checks.length) * 100).toFixed(2));
}

/**
 * 5-point scale mapper for JPA metrics
 */
export function mapPercentageToScore(pct: number): number {
  if (pct >= 95) return 5.0;
  if (pct >= 85) return 4.0;
  if (pct >= 70) return 3.0;
  if (pct >= 50) return 2.0;
  return 1.0;
}

/**
 * JPA Overall Score calculation (weighted average 1-5, 1 decimal)
 */
export function calculateJpaOverallScore(
  scores: {
    delivery: number;
    timeliness: number;
    reliability: number;
    responsiveness: number;
    quality: number;
    leadReview: number;
  },
  weights: JpaWeights = DEFAULT_JPA_WEIGHTS
): number {
  const sum =
    scores.delivery * weights.delivery +
    scores.timeliness * weights.timeliness +
    scores.reliability * weights.reliability +
    scores.responsiveness * weights.responsiveness +
    scores.quality * weights.quality +
    scores.leadReview * weights.leadReview;

  return Math.round(sum * 10) / 10;
}

/**
 * JPA Rating label per SPEC §13.2
 * >= 4.3 Exceeds · >= 3.5 Meets · >= 2.5 Developing · else Needs support
 */
export function getRatingLabel(score: number): "Exceeds" | "Meets" | "Developing" | "Needs support" {
  if (score >= 4.3) return "Exceeds";
  if (score >= 3.5) return "Meets";
  if (score >= 2.5) return "Developing";
  return "Needs support";
}

/**
 * Standard File Naming per SPEC §13.5
 * IT_{Type}_{Audience}_{Scope}_{PeriodTag}.{ext}
 */
export function formatReportFileName(params: {
  type: string;
  audience: string;
  scope: string;
  periodTag: string;
  extension: "pdf" | "xlsx" | "docx";
}): string {
  const clean = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "");
  return `IT_${clean(params.type)}_${clean(params.audience)}_${clean(params.scope)}_${clean(params.periodTag)}.${params.extension}`;
}
