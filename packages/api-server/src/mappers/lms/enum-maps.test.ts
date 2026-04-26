import {
  BenchmarkSource as PrismaBenchmarkSource,
  BlockStatus as PrismaBlockStatus,
  BodyPart as PrismaBodyPart,
  DayKind as PrismaDayKind,
  DayOfWeek as PrismaDayOfWeek,
  LibraryScope as PrismaLibraryScope,
  Modality as PrismaModality,
  MovementPattern as PrismaMovementPattern,
  PlanEnrollmentStatus as PrismaPlanEnrollmentStatus,
  PrKind as PrismaPrKind,
  RxStatus as PrismaRxStatus,
  SchemeArchetypeKind as PrismaSchemeArchetypeKind,
  SideMode as PrismaSideMode,
  SkillLevel as PrismaSkillLevel,
  TrainingPlanStatus as PrismaTrainingPlanStatus,
  WorkoutSessionStatus as PrismaWorkoutSessionStatus,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import {
  BENCHMARK_SOURCE_MAP,
  BENCHMARK_SOURCE_TO_PRISMA_MAP,
  BLOCK_STATUS_MAP,
  BLOCK_STATUS_TO_PRISMA_MAP,
  BODY_PART_MAP,
  BODY_PART_TO_PRISMA_MAP,
  DAY_KIND_MAP,
  DAY_KIND_TO_PRISMA_MAP,
  DAY_OF_WEEK_MAP,
  DAY_OF_WEEK_TO_PRISMA_MAP,
  LIBRARY_SCOPE_MAP,
  LIBRARY_SCOPE_TO_PRISMA_MAP,
  MODALITY_MAP,
  MODALITY_TO_PRISMA_MAP,
  MOVEMENT_PATTERN_MAP,
  MOVEMENT_PATTERN_TO_PRISMA_MAP,
  PLAN_ENROLLMENT_STATUS_MAP,
  PR_KIND_MAP,
  PR_KIND_TO_PRISMA_MAP,
  RX_STATUS_MAP,
  RX_STATUS_TO_PRISMA_MAP,
  SCHEME_ARCHETYPE_KIND_MAP,
  SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP,
  SIDE_MODE_MAP,
  SIDE_MODE_TO_PRISMA_MAP,
  SKILL_LEVEL_MAP,
  SKILL_LEVEL_TO_PRISMA_MAP,
  TRAINING_PLAN_STATUS_MAP,
  WORKOUT_SESSION_STATUS_MAP,
  WORKOUT_SESSION_STATUS_TO_PRISMA_MAP,
} from "./enum-maps";

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

const exhaustivePairs: Array<[string, Record<string, unknown>, Record<string, unknown>, string[]]> =
  [
    ["DAY_KIND", DAY_KIND_MAP, DAY_KIND_TO_PRISMA_MAP, Object.values(PrismaDayKind)],
    ["DAY_OF_WEEK", DAY_OF_WEEK_MAP, DAY_OF_WEEK_TO_PRISMA_MAP, Object.values(PrismaDayOfWeek)],
    [
      "BLOCK_STATUS",
      BLOCK_STATUS_MAP,
      BLOCK_STATUS_TO_PRISMA_MAP,
      Object.values(PrismaBlockStatus),
    ],
    [
      "SCHEME_ARCHETYPE_KIND",
      SCHEME_ARCHETYPE_KIND_MAP,
      SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP,
      Object.values(PrismaSchemeArchetypeKind),
    ],
    [
      "LIBRARY_SCOPE",
      LIBRARY_SCOPE_MAP,
      LIBRARY_SCOPE_TO_PRISMA_MAP,
      Object.values(PrismaLibraryScope),
    ],
    ["SIDE_MODE", SIDE_MODE_MAP, SIDE_MODE_TO_PRISMA_MAP, Object.values(PrismaSideMode)],
    [
      "WORKOUT_SESSION_STATUS",
      WORKOUT_SESSION_STATUS_MAP,
      WORKOUT_SESSION_STATUS_TO_PRISMA_MAP,
      Object.values(PrismaWorkoutSessionStatus),
    ],
    ["RX_STATUS", RX_STATUS_MAP, RX_STATUS_TO_PRISMA_MAP, Object.values(PrismaRxStatus)],
    [
      "MOVEMENT_PATTERN",
      MOVEMENT_PATTERN_MAP,
      MOVEMENT_PATTERN_TO_PRISMA_MAP,
      Object.values(PrismaMovementPattern),
    ],
    ["MODALITY", MODALITY_MAP, MODALITY_TO_PRISMA_MAP, Object.values(PrismaModality)],
    ["BODY_PART", BODY_PART_MAP, BODY_PART_TO_PRISMA_MAP, Object.values(PrismaBodyPart)],
    ["SKILL_LEVEL", SKILL_LEVEL_MAP, SKILL_LEVEL_TO_PRISMA_MAP, Object.values(PrismaSkillLevel)],
    ["PR_KIND", PR_KIND_MAP, PR_KIND_TO_PRISMA_MAP, Object.values(PrismaPrKind)],
    [
      "BENCHMARK_SOURCE",
      BENCHMARK_SOURCE_MAP,
      BENCHMARK_SOURCE_TO_PRISMA_MAP,
      Object.values(PrismaBenchmarkSource),
    ],
  ];

describe.each(exhaustivePairs)("%s maps", (label, forwardMap, reverseMap, prismaValues) => {
  it(`${label} forward map covers every Prisma value`, () => {
    expect(Object.keys(forwardMap)).toHaveLength(prismaValues.length);
    prismaValues.forEach((v) => {
      expect(forwardMap).toHaveProperty(v);
    });
  });

  it(`${label} round-trips Prisma -> contract -> Prisma`, () => {
    prismaValues.forEach((v) => {
      const forward = (forwardMap as Record<string, string | undefined>)[v];

      expect(forward).toBeDefined();

      if (forward === undefined) {
        return;
      }

      const back = (reverseMap as Record<string, string>)[forward];

      expect(back).toBe(v);
    });
  });

  it(`${label} forward map values are unique`, () => {
    const values = Object.values(forwardMap);
    const unique = new Set(values);

    expect(unique.size).toBe(values.length);
  });
});
