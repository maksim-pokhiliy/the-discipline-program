import { TrainingPlanStatus as PrismaTrainingPlanStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import { mapToTrainingPlan } from "./training-plan.mapper";

const NOW = new Date("2025-06-01T12:00:00Z");
const LATER = new Date("2025-06-15T12:00:00Z");

const makePlan = (overrides = {}) => ({
  id: "cls_plan_1",
  coachId: "cls_coach_1",
  name: "Strength Block A",
  description: "8-week hypertrophy focus",
  status: PrismaTrainingPlanStatus.DRAFT,
  createdAt: NOW,
  updatedAt: LATER,
  deletedAt: null,
  ...overrides,
});

describe("mapToTrainingPlan", () => {
  it("maps all fields correctly for DRAFT status", () => {
    const input = makePlan();
    const result = mapToTrainingPlan(input);

    expect(result).toEqual({
      id: "cls_plan_1",
      coachId: "cls_coach_1",
      name: "Strength Block A",
      description: "8-week hypertrophy focus",
      status: TrainingPlanStatus.DRAFT,
      createdAt: NOW,
      updatedAt: LATER,
    });
  });

  it("maps ACTIVE status", () => {
    const input = makePlan({ status: PrismaTrainingPlanStatus.ACTIVE });
    const result = mapToTrainingPlan(input);

    expect(result.status).toBe(TrainingPlanStatus.ACTIVE);
  });

  it("maps ARCHIVED status", () => {
    const input = makePlan({ status: PrismaTrainingPlanStatus.ARCHIVED });
    const result = mapToTrainingPlan(input);

    expect(result.status).toBe(TrainingPlanStatus.ARCHIVED);
  });

  it("passes date fields through as-is", () => {
    const input = makePlan();
    const result = mapToTrainingPlan(input);

    expect(result.createdAt).toBe(NOW);
    expect(result.updatedAt).toBe(LATER);
  });

  it("handles null description", () => {
    const input = makePlan({ description: null });
    const result = mapToTrainingPlan(input);

    expect(result.description).toBeNull();
  });

  it("excludes deletedAt from output", () => {
    const input = makePlan({ deletedAt: new Date() });
    const result = mapToTrainingPlan(input);

    expect(result).not.toHaveProperty("deletedAt");
  });
});
