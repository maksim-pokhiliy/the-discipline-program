import {
  EnrollmentStatus as PrismaEnrollmentStatus,
  TrainingPlanStatus as PrismaTrainingPlanStatus,
} from "@prisma/client";

import { EnrollmentStatus } from "@repo/contracts/lms";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

export const ENROLLMENT_STATUS_MAP: Record<PrismaEnrollmentStatus, EnrollmentStatus> = {
  ACTIVE: EnrollmentStatus.ACTIVE,
  PAUSED: EnrollmentStatus.PAUSED,
  REMOVED: EnrollmentStatus.REMOVED,
};

export const ENROLLMENT_STATUS_TO_PRISMA_MAP: Record<EnrollmentStatus, PrismaEnrollmentStatus> = {
  [EnrollmentStatus.ACTIVE]: PrismaEnrollmentStatus.ACTIVE,
  [EnrollmentStatus.PAUSED]: PrismaEnrollmentStatus.PAUSED,
  [EnrollmentStatus.REMOVED]: PrismaEnrollmentStatus.REMOVED,
};

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
