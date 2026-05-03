import {
  BenchmarkSource as PrismaBenchmarkSource,
  RxStatus as PrismaRxStatus,
  SchemeArchetypeKind as PrismaSchemeArchetypeKind,
  TrainingPlanStatus as PrismaTrainingPlanStatus,
  WorkoutSessionStatus as PrismaWorkoutSessionStatus,
} from "@prisma/client";

import {
  type BenchmarkSource,
  type RxStatus,
  type SchemeArchetypeKind,
  type WorkoutSessionStatus,
} from "@repo/contracts/lms/_domain";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

export const TRAINING_PLAN_STATUS_MAP: Record<PrismaTrainingPlanStatus, TrainingPlanStatus> = {
  DRAFT: TrainingPlanStatus.DRAFT,
  ACTIVE: TrainingPlanStatus.ACTIVE,
  ARCHIVED: TrainingPlanStatus.ARCHIVED,
};

export const TRAINING_PLAN_STATUS_TO_PRISMA_MAP: Record<
  TrainingPlanStatus,
  PrismaTrainingPlanStatus
> = {
  [TrainingPlanStatus.DRAFT]: PrismaTrainingPlanStatus.DRAFT,
  [TrainingPlanStatus.ACTIVE]: PrismaTrainingPlanStatus.ACTIVE,
  [TrainingPlanStatus.ARCHIVED]: PrismaTrainingPlanStatus.ARCHIVED,
};

export const SCHEME_ARCHETYPE_KIND_MAP: Record<PrismaSchemeArchetypeKind, SchemeArchetypeKind> = {
  NONE: "NONE",
  COUNT_UP: "COUNT_UP",
  COUNT_DOWN: "COUNT_DOWN",
  INTERVAL_LOOP: "INTERVAL_LOOP",
  EMOM_LOOP: "EMOM_LOOP",
  TIME_BOXED: "TIME_BOXED",
};

export const SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP: Record<
  SchemeArchetypeKind,
  PrismaSchemeArchetypeKind
> = {
  NONE: PrismaSchemeArchetypeKind.NONE,
  COUNT_UP: PrismaSchemeArchetypeKind.COUNT_UP,
  COUNT_DOWN: PrismaSchemeArchetypeKind.COUNT_DOWN,
  INTERVAL_LOOP: PrismaSchemeArchetypeKind.INTERVAL_LOOP,
  EMOM_LOOP: PrismaSchemeArchetypeKind.EMOM_LOOP,
  TIME_BOXED: PrismaSchemeArchetypeKind.TIME_BOXED,
};

export const WORKOUT_SESSION_STATUS_MAP: Record<PrismaWorkoutSessionStatus, WorkoutSessionStatus> =
  {
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
    ABANDONED: "ABANDONED",
    SKIPPED: "SKIPPED",
  };

export const WORKOUT_SESSION_STATUS_TO_PRISMA_MAP: Record<
  WorkoutSessionStatus,
  PrismaWorkoutSessionStatus
> = {
  IN_PROGRESS: PrismaWorkoutSessionStatus.IN_PROGRESS,
  COMPLETED: PrismaWorkoutSessionStatus.COMPLETED,
  ABANDONED: PrismaWorkoutSessionStatus.ABANDONED,
  SKIPPED: PrismaWorkoutSessionStatus.SKIPPED,
};

export const RX_STATUS_MAP: Record<PrismaRxStatus, RxStatus> = {
  RX: "RX",
  SCALED: "SCALED",
  SUBSTITUTED: "SUBSTITUTED",
  MODIFIED: "MODIFIED",
};

export const RX_STATUS_TO_PRISMA_MAP: Record<RxStatus, PrismaRxStatus> = {
  RX: PrismaRxStatus.RX,
  SCALED: PrismaRxStatus.SCALED,
  SUBSTITUTED: PrismaRxStatus.SUBSTITUTED,
  MODIFIED: PrismaRxStatus.MODIFIED,
};

export const BENCHMARK_SOURCE_MAP: Record<PrismaBenchmarkSource, BenchmarkSource> = {
  MANUAL: "MANUAL",
  DERIVED_FROM_LOG: "DERIVED_FROM_LOG",
};

export const BENCHMARK_SOURCE_TO_PRISMA_MAP: Record<BenchmarkSource, PrismaBenchmarkSource> = {
  MANUAL: PrismaBenchmarkSource.MANUAL,
  DERIVED_FROM_LOG: PrismaBenchmarkSource.DERIVED_FROM_LOG,
};
