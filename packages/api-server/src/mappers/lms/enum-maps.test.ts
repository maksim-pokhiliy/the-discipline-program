import {
  PlanEnrollmentStatus as PrismaPlanEnrollmentStatus,
  TrainingPlanStatus as PrismaTrainingPlanStatus,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import { PLAN_ENROLLMENT_STATUS_MAP, TRAINING_PLAN_STATUS_MAP } from "./enum-maps";

describe("TRAINING_PLAN_STATUS_MAP", () => {
  it("covers every Prisma TrainingPlanStatus value", () => {
    const prismaValues = Object.values(PrismaTrainingPlanStatus);

    expect(Object.keys(TRAINING_PLAN_STATUS_MAP)).toHaveLength(prismaValues.length);
    prismaValues.forEach((v) => {
      expect(TRAINING_PLAN_STATUS_MAP).toHaveProperty(v);
    });
  });

  it("maps to correct contract values", () => {
    expect(TRAINING_PLAN_STATUS_MAP.DRAFT).toBe(TrainingPlanStatus.DRAFT);
    expect(TRAINING_PLAN_STATUS_MAP.ACTIVE).toBe(TrainingPlanStatus.ACTIVE);
    expect(TRAINING_PLAN_STATUS_MAP.ARCHIVED).toBe(TrainingPlanStatus.ARCHIVED);
  });
});

describe("PLAN_ENROLLMENT_STATUS_MAP", () => {
  it("covers every Prisma PlanEnrollmentStatus value", () => {
    const prismaValues = Object.values(PrismaPlanEnrollmentStatus);

    expect(Object.keys(PLAN_ENROLLMENT_STATUS_MAP)).toHaveLength(prismaValues.length);
    prismaValues.forEach((v) => {
      expect(PLAN_ENROLLMENT_STATUS_MAP).toHaveProperty(v);
    });
  });

  it("maps to correct contract values", () => {
    expect(PLAN_ENROLLMENT_STATUS_MAP.ACTIVE).toBe(PlanEnrollmentStatus.ACTIVE);
    expect(PLAN_ENROLLMENT_STATUS_MAP.PAUSED).toBe(PlanEnrollmentStatus.PAUSED);
  });
});

describe("symmetry", () => {
  it("no two Prisma keys map to the same contract value in any lms map", () => {
    const maps = [TRAINING_PLAN_STATUS_MAP, PLAN_ENROLLMENT_STATUS_MAP];

    maps.forEach((map) => {
      const values = Object.values(map);
      const unique = new Set(values);

      expect(unique.size).toBe(values.length);
    });
  });
});
