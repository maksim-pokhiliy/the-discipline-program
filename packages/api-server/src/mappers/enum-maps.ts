import {
  type ActionItemResolveReason as PrismaActionItemResolveReason,
  type ActionItemSeverity as PrismaActionItemSeverity,
  type ActionItemStatus as PrismaActionItemStatus,
  type ActionItemType as PrismaActionItemType,
  ContactSubmissionStatus as PrismaContactSubmissionStatus,
  type Currency as PrismaCurrency,
  type Gender as PrismaGender,
  type HealthStatus as PrismaHealthStatus,
  type PlanEnrollmentStatus as PrismaPlanEnrollmentStatus,
  type PriceInterval as PrismaPriceInterval,
  type Role as PrismaRole,
  type TrainingPlanStatus as PrismaTrainingPlanStatus,
} from "@prisma/client";

import { Gender, HealthStatus } from "@repo/contracts/athlete-profile";
import { UserRole } from "@repo/contracts/auth";
import {
  ActionItemResolveReason,
  ActionItemSeverity,
  ActionItemStatus,
  ActionItemType,
} from "@repo/contracts/coach-action-item";
import { ContactStatus } from "@repo/contracts/contact";
import { PlanEnrollmentStatus } from "@repo/contracts/plan-enrollment";
import { PriceInterval, ProductCurrency } from "@repo/contracts/product";
import { TrainingPlanStatus } from "@repo/contracts/training-plan";

export const TRAINING_PLAN_STATUS_MAP: Record<PrismaTrainingPlanStatus, TrainingPlanStatus> = {
  DRAFT: TrainingPlanStatus.DRAFT,
  ACTIVE: TrainingPlanStatus.ACTIVE,
  ARCHIVED: TrainingPlanStatus.ARCHIVED,
};

export const CURRENCY_MAP: Record<PrismaCurrency, ProductCurrency> = {
  USD: ProductCurrency.USD,
  EUR: ProductCurrency.EUR,
  UAH: ProductCurrency.UAH,
};

export const PRICE_INTERVAL_MAP: Record<PrismaPriceInterval, PriceInterval> = {
  MONTHLY: PriceInterval.MONTHLY,
  YEARLY: PriceInterval.YEARLY,
  ONE_TIME: PriceInterval.ONE_TIME,
};

export const ROLE_MAP: Record<PrismaRole, UserRole> = {
  USER: UserRole.USER,
  COACH: UserRole.COACH,
  ADMIN: UserRole.ADMIN,
};

export const ROLE_TO_PRISMA_MAP: Record<UserRole, PrismaRole> = {
  [UserRole.USER]: "USER",
  [UserRole.COACH]: "COACH",
  [UserRole.ADMIN]: "ADMIN",
};

export const GENDER_MAP: Record<PrismaGender, Gender> = {
  MALE: Gender.MALE,
  FEMALE: Gender.FEMALE,
};

export const HEALTH_STATUS_MAP: Record<PrismaHealthStatus, HealthStatus> = {
  HEALTHY: HealthStatus.HEALTHY,
  INJURED: HealthStatus.INJURED,
  RESTRICTED: HealthStatus.RESTRICTED,
};

export const PLAN_ENROLLMENT_STATUS_MAP: Record<PrismaPlanEnrollmentStatus, PlanEnrollmentStatus> =
  {
    ACTIVE: PlanEnrollmentStatus.ACTIVE,
    PAUSED: PlanEnrollmentStatus.PAUSED,
  };

export const ACTION_ITEM_TYPE_MAP: Record<PrismaActionItemType, ActionItemType> = {
  MISSED_WORKOUTS: ActionItemType.MISSED_WORKOUTS,
  NEW_NO_START: ActionItemType.NEW_NO_START,
  HEALTH_REPORT: ActionItemType.HEALTH_REPORT,
};

export const ACTION_ITEM_SEVERITY_MAP: Record<PrismaActionItemSeverity, ActionItemSeverity> = {
  INFO: ActionItemSeverity.INFO,
  WARNING: ActionItemSeverity.WARNING,
  CRITICAL: ActionItemSeverity.CRITICAL,
};

export const ACTION_ITEM_STATUS_MAP: Record<PrismaActionItemStatus, ActionItemStatus> = {
  OPEN: ActionItemStatus.OPEN,
  RESOLVED: ActionItemStatus.RESOLVED,
};

export const ACTION_ITEM_RESOLVE_REASON_MAP: Record<
  PrismaActionItemResolveReason,
  ActionItemResolveReason
> = {
  AUTO_CONDITION_CLEARED: ActionItemResolveReason.AUTO_CONDITION_CLEARED,
  AUTO_ENROLLMENT_ENDED: ActionItemResolveReason.AUTO_ENROLLMENT_ENDED,
  MANUAL_CONTACTED: ActionItemResolveReason.MANUAL_CONTACTED,
};

export const CONTACT_SUBMISSION_STATUS_MAP: Record<PrismaContactSubmissionStatus, ContactStatus> = {
  NEW: ContactStatus.NEW,
  IN_PROGRESS: ContactStatus.IN_PROGRESS,
  REPLIED: ContactStatus.REPLIED,
  CLOSED: ContactStatus.CLOSED,
};

export const CONTACT_STATUS_TO_PRISMA_MAP: Record<ContactStatus, PrismaContactSubmissionStatus> = {
  [ContactStatus.NEW]: PrismaContactSubmissionStatus.NEW,
  [ContactStatus.IN_PROGRESS]: PrismaContactSubmissionStatus.IN_PROGRESS,
  [ContactStatus.REPLIED]: PrismaContactSubmissionStatus.REPLIED,
  [ContactStatus.CLOSED]: PrismaContactSubmissionStatus.CLOSED,
};
