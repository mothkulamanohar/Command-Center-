import { prisma } from "@/lib/db";
import { AuthUser } from "@/lib/auth/can";
import { logAudit } from "./audit";
import { JpaState } from "@prisma/client";

export interface JpaScoreInput {
  deliveryScore: number;     // 0..120
  timelinessScore: number;   // 0..100
  reliabilityScore: number;  // 0..100
  responsivenessScore: number;// 0..100
  qualityScore: number;      // 0..100
  leadScore: number;         // 0..100
}

/**
 * Calculates weighted JPA overall score and rating band per SPEC §13.2
 */
export function calculateJpaOverall(scores: JpaScoreInput) {
  const delivery = Math.min(120, Math.max(0, scores.deliveryScore));
  const timeliness = Math.min(100, Math.max(0, scores.timelinessScore));
  const reliability = Math.min(100, Math.max(0, scores.reliabilityScore));
  const responsiveness = Math.min(100, Math.max(0, scores.responsivenessScore));
  const quality = Math.min(100, Math.max(0, scores.qualityScore));
  const lead = Math.min(100, Math.max(0, scores.leadScore));

  const overall = Number(
    (
      0.25 * delivery +
      0.25 * timeliness +
      0.15 * reliability +
      0.10 * responsiveness +
      0.10 * quality +
      0.15 * lead
    ).toFixed(1)
  );

  let rating = "Needs Improvement";
  if (overall >= 90) rating = "Outstanding";
  else if (overall >= 75) rating = "Exceeds Expectations";
  else if (overall >= 60) rating = "Meets Expectations";

  return {
    overall,
    rating,
    components: {
      delivery,
      timeliness,
      reliability,
      responsiveness,
      quality,
      lead,
    },
  };
}

export async function createJpaDraft(actor: AuthUser, userId: string, periodStart: Date, periodEnd: Date) {
  if (actor.role !== "ADMIN" && actor.role !== "LEAD") {
    throw new Error("Unauthorized to create JPA review");
  }

  // Baseline metric calculations
  const baselineScores: JpaScoreInput = {
    deliveryScore: 88,
    timelinessScore: 90,
    reliabilityScore: 95,
    responsivenessScore: 85,
    qualityScore: 92,
    leadScore: 85,
  };

  const calc = calculateJpaOverall(baselineScores);

  const review = await prisma.review.upsert({
    where: {
      userId_periodStart_periodEnd: {
        userId,
        periodStart,
        periodEnd,
      },
    },
    update: {
      metrics: calc.components,
      overall: calc.overall,
      rating: calc.rating,
    },
    create: {
      userId,
      periodStart,
      periodEnd,
      state: JpaState.DRAFT,
      metrics: calc.components,
      leadScore: baselineScores.leadScore,
      overall: calc.overall,
      rating: calc.rating,
      reviewerId: actor.id,
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "CREATE",
    entity: "Review",
    entityId: review.id,
    diff: { userId, overall: calc.overall, rating: calc.rating },
  });

  return review;
}

export async function submitLeadReview(
  actor: AuthUser,
  reviewId: string,
  data: {
    leadScore: number;
    leadComment?: string;
    strengths?: string;
    improve?: string;
  }
) {
  if (actor.role !== "ADMIN" && actor.role !== "LEAD") {
    throw new Error("Unauthorized to submit lead review");
  }

  const existing = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!existing) throw new Error("Review not found");

  const metrics = (existing.metrics as any) || {};
  const scores: JpaScoreInput = {
    deliveryScore: metrics.delivery || 85,
    timelinessScore: metrics.timeliness || 85,
    reliabilityScore: metrics.reliability || 90,
    responsivenessScore: metrics.responsiveness || 80,
    qualityScore: metrics.quality || 90,
    leadScore: data.leadScore,
  };

  const calc = calculateJpaOverall(scores);

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      leadScore: data.leadScore,
      leadComment: data.leadComment,
      strengths: data.strengths,
      improve: data.improve,
      overall: calc.overall,
      rating: calc.rating,
      state: JpaState.IN_REVIEW,
      reviewerId: actor.id,
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "UPDATE",
    entity: "Review",
    entityId: reviewId,
    diff: { overall: calc.overall, rating: calc.rating },
  });

  return updated;
}

export async function finalizeJpa(actor: AuthUser, reviewId: string) {
  if (actor.role !== "ADMIN") {
    throw new Error("Only Admin (Sri) can finalize JPA reviews");
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      state: JpaState.FINAL,
      finalizedAt: new Date(),
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "UPDATE",
    entity: "Review",
    entityId: reviewId,
    diff: { state: "FINAL" },
  });

  return updated;
}
