import {
  PlanEnrollmentStatus as PrismaPlanEnrollmentStatus,
  PrescriptionKind as PrismaPrescriptionKind,
  TrainingPlanStatus as PrismaTrainingPlanStatus,
  WorkoutRepScheme as PrismaWorkoutRepScheme,
} from "@prisma/client";

import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import { PrescriptionKind, WorkoutRepScheme } from "@repo/contracts/lms/workout-block";

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

export const WORKOUT_REP_SCHEME_MAP: Record<PrismaWorkoutRepScheme, WorkoutRepScheme> = {
  STRAIGHT: WorkoutRepScheme.STRAIGHT,
  LADDER: WorkoutRepScheme.LADDER,
  PYRAMID: WorkoutRepScheme.PYRAMID,
  REVERSE_LADDER: WorkoutRepScheme.REVERSE_LADDER,
  CUSTOM: WorkoutRepScheme.CUSTOM,
};

export const WORKOUT_REP_SCHEME_TO_PRISMA_MAP: Record<WorkoutRepScheme, PrismaWorkoutRepScheme> = {
  [WorkoutRepScheme.STRAIGHT]: PrismaWorkoutRepScheme.STRAIGHT,
  [WorkoutRepScheme.LADDER]: PrismaWorkoutRepScheme.LADDER,
  [WorkoutRepScheme.PYRAMID]: PrismaWorkoutRepScheme.PYRAMID,
  [WorkoutRepScheme.REVERSE_LADDER]: PrismaWorkoutRepScheme.REVERSE_LADDER,
  [WorkoutRepScheme.CUSTOM]: PrismaWorkoutRepScheme.CUSTOM,
};

export const PRESCRIPTION_KIND_MAP: Record<PrismaPrescriptionKind, PrescriptionKind> = {
  PERCENT_OF_1RM: PrescriptionKind.PERCENT_OF_1RM,
  KG: PrescriptionKind.KG,
  RPE: PrescriptionKind.RPE,
  NONE: PrescriptionKind.NONE,
};

export const PRESCRIPTION_KIND_TO_PRISMA_MAP: Record<PrescriptionKind, PrismaPrescriptionKind> = {
  [PrescriptionKind.PERCENT_OF_1RM]: PrismaPrescriptionKind.PERCENT_OF_1RM,
  [PrescriptionKind.KG]: PrismaPrescriptionKind.KG,
  [PrescriptionKind.RPE]: PrismaPrescriptionKind.RPE,
  [PrescriptionKind.NONE]: PrismaPrescriptionKind.NONE,
};
