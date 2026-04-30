import {
  BenchmarkSource as PrismaBenchmarkSource,
  BlockStatus as PrismaBlockStatus,
  DayKind as PrismaDayKind,
  DayOfWeek as PrismaDayOfWeek,
  LibraryScope as PrismaLibraryScope,
  PlanEnrollmentStatus as PrismaPlanEnrollmentStatus,
  RxStatus as PrismaRxStatus,
  SchemeArchetypeKind as PrismaSchemeArchetypeKind,
  SideMode as PrismaSideMode,
  TrainingPlanStatus as PrismaTrainingPlanStatus,
  WorkoutSessionStatus as PrismaWorkoutSessionStatus,
} from "@prisma/client";

import {
  type BenchmarkSource,
  type BlockStatus,
  type DayKind,
  type DayOfWeek,
  type LibraryScope,
  type RxStatus,
  type SchemeArchetypeKind,
  type SideMode,
  type WorkoutSessionStatus,
} from "@repo/contracts/lms/_domain";
import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
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

export const PLAN_ENROLLMENT_STATUS_MAP: Record<PrismaPlanEnrollmentStatus, PlanEnrollmentStatus> =
  {
    ACTIVE: PlanEnrollmentStatus.ACTIVE,
    PAUSED: PlanEnrollmentStatus.PAUSED,
    COMPLETED: PlanEnrollmentStatus.COMPLETED,
  };

export const PLAN_ENROLLMENT_STATUS_TO_PRISMA_MAP: Record<
  PlanEnrollmentStatus,
  PrismaPlanEnrollmentStatus
> = {
  [PlanEnrollmentStatus.ACTIVE]: PrismaPlanEnrollmentStatus.ACTIVE,
  [PlanEnrollmentStatus.PAUSED]: PrismaPlanEnrollmentStatus.PAUSED,
  [PlanEnrollmentStatus.COMPLETED]: PrismaPlanEnrollmentStatus.COMPLETED,
};

export const DAY_KIND_MAP: Record<PrismaDayKind, DayKind> = {
  TRAINING: "TRAINING",
  REST: "REST",
  YOGA: "YOGA",
  OFF: "OFF",
};

export const DAY_KIND_TO_PRISMA_MAP: Record<DayKind, PrismaDayKind> = {
  TRAINING: PrismaDayKind.TRAINING,
  REST: PrismaDayKind.REST,
  YOGA: PrismaDayKind.YOGA,
  OFF: PrismaDayKind.OFF,
};

export const DAY_OF_WEEK_MAP: Record<PrismaDayOfWeek, DayOfWeek> = {
  MON: "MON",
  TUE: "TUE",
  WED: "WED",
  THU: "THU",
  FRI: "FRI",
  SAT: "SAT",
  SUN: "SUN",
};

export const DAY_OF_WEEK_TO_PRISMA_MAP: Record<DayOfWeek, PrismaDayOfWeek> = {
  MON: PrismaDayOfWeek.MON,
  TUE: PrismaDayOfWeek.TUE,
  WED: PrismaDayOfWeek.WED,
  THU: PrismaDayOfWeek.THU,
  FRI: PrismaDayOfWeek.FRI,
  SAT: PrismaDayOfWeek.SAT,
  SUN: PrismaDayOfWeek.SUN,
};

export const BLOCK_STATUS_MAP: Record<PrismaBlockStatus, BlockStatus> = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
};

export const BLOCK_STATUS_TO_PRISMA_MAP: Record<BlockStatus, PrismaBlockStatus> = {
  ACTIVE: PrismaBlockStatus.ACTIVE,
  SUSPENDED: PrismaBlockStatus.SUSPENDED,
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

export const LIBRARY_SCOPE_MAP: Record<PrismaLibraryScope, LibraryScope> = {
  SYSTEM: "SYSTEM",
  COACH: "COACH",
};

export const LIBRARY_SCOPE_TO_PRISMA_MAP: Record<LibraryScope, PrismaLibraryScope> = {
  SYSTEM: PrismaLibraryScope.SYSTEM,
  COACH: PrismaLibraryScope.COACH,
};

export const SIDE_MODE_MAP: Record<PrismaSideMode, SideMode> = {
  BILATERAL: "BILATERAL",
  EACH_ARM: "EACH_ARM",
  EACH_LEG: "EACH_LEG",
  ASYMMETRIC_HOLD: "ASYMMETRIC_HOLD",
  UNILATERAL_ALTERNATING: "UNILATERAL_ALTERNATING",
};

export const SIDE_MODE_TO_PRISMA_MAP: Record<SideMode, PrismaSideMode> = {
  BILATERAL: PrismaSideMode.BILATERAL,
  EACH_ARM: PrismaSideMode.EACH_ARM,
  EACH_LEG: PrismaSideMode.EACH_LEG,
  ASYMMETRIC_HOLD: PrismaSideMode.ASYMMETRIC_HOLD,
  UNILATERAL_ALTERNATING: PrismaSideMode.UNILATERAL_ALTERNATING,
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
