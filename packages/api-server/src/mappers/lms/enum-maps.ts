import {
  PlanEnrollmentStatus as PrismaPlanEnrollmentStatus,
  TrainingPlanStatus as PrismaTrainingPlanStatus,
} from "@prisma/client";

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
