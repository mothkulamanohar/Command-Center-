import { describe, it, expect } from "vitest";
import { calculateJpaOverall } from "@/lib/services/jpa";

describe("Job Performance Appraisal (JPA) Scoring Formula (SPEC §13.2)", () => {
  it("calculates weighted overall score with correct component weights", () => {
    // 25% Delivery (100) + 25% Timeliness (100) + 15% Reliability (100) +
    // 10% Responsiveness (100) + 10% Quality (100) + 15% LeadScore (100) = 100
    const perfect = calculateJpaOverall({
      deliveryScore: 100,
      timelinessScore: 100,
      reliabilityScore: 100,
      responsivenessScore: 100,
      qualityScore: 100,
      leadScore: 100,
    });
    expect(perfect.overall).toBe(100);
    expect(perfect.rating).toBe("Outstanding");
  });

  it("assigns 'Outstanding' band for overall >= 90", () => {
    const res = calculateJpaOverall({
      deliveryScore: 95,
      timelinessScore: 92,
      reliabilityScore: 90,
      responsivenessScore: 90,
      qualityScore: 90,
      leadScore: 90,
    });
    expect(res.overall).toBeGreaterThanOrEqual(90);
    expect(res.rating).toBe("Outstanding");
  });

  it("assigns 'Exceeds Expectations' band for overall in [75, 89]", () => {
    const res = calculateJpaOverall({
      deliveryScore: 80,
      timelinessScore: 80,
      reliabilityScore: 80,
      responsivenessScore: 80,
      qualityScore: 80,
      leadScore: 80,
    });
    expect(res.overall).toBe(80);
    expect(res.rating).toBe("Exceeds Expectations");
  });

  it("assigns 'Meets Expectations' band for overall in [60, 74]", () => {
    const res = calculateJpaOverall({
      deliveryScore: 65,
      timelinessScore: 65,
      reliabilityScore: 65,
      responsivenessScore: 65,
      qualityScore: 65,
      leadScore: 65,
    });
    expect(res.overall).toBe(65);
    expect(res.rating).toBe("Meets Expectations");
  });

  it("assigns 'Needs Improvement' band for overall < 60", () => {
    const res = calculateJpaOverall({
      deliveryScore: 50,
      timelinessScore: 45,
      reliabilityScore: 50,
      responsivenessScore: 50,
      qualityScore: 50,
      leadScore: 50,
    });
    expect(res.overall).toBeLessThan(60);
    expect(res.rating).toBe("Needs Improvement");
  });

  it("caps delivery score at 120%", () => {
    const res = calculateJpaOverall({
      deliveryScore: 150, // exceeds cap
      timelinessScore: 100,
      reliabilityScore: 100,
      responsivenessScore: 100,
      qualityScore: 100,
      leadScore: 100,
    });
    expect(res.components.delivery).toBe(120);
  });
});
