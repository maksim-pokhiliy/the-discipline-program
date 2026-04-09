import {
  ActionItemResolveReason as PrismaActionItemResolveReason,
  ActionItemSeverity as PrismaActionItemSeverity,
  ActionItemStatus as PrismaActionItemStatus,
  ActionItemType as PrismaActionItemType,
  ContactSubmissionStatus as PrismaContactSubmissionStatus,
  type Currency as PrismaCurrency,
  type Gender as PrismaGender,
  type HealthStatus as PrismaHealthStatus,
  MarketingBlogCategory as PrismaMarketingBlogCategory,
  PlanEnrollmentStatus as PrismaPlanEnrollmentStatus,
  type PriceInterval as PrismaPriceInterval,
  Role as PrismaRole,
  TrainingPlanStatus as PrismaTrainingPlanStatus,
} from "@prisma/client";

import { Gender, HealthStatus } from "@repo/contracts/athlete-profile";
import { UserRole } from "@repo/contracts/auth";
import { BlogCategory } from "@repo/contracts/blog";
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

export const TRAINING_PLAN_STATUS_TO_PRISMA_MAP: Record<
  TrainingPlanStatus,
  PrismaTrainingPlanStatus
> = {
  [TrainingPlanStatus.DRAFT]: PrismaTrainingPlanStatus.DRAFT,
  [TrainingPlanStatus.ACTIVE]: PrismaTrainingPlanStatus.ACTIVE,
  [TrainingPlanStatus.ARCHIVED]: PrismaTrainingPlanStatus.ARCHIVED,
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
  [UserRole.USER]: PrismaRole.USER,
  [UserRole.COACH]: PrismaRole.COACH,
  [UserRole.ADMIN]: PrismaRole.ADMIN,
};

export const BLOG_CATEGORY_MAP: Record<PrismaMarketingBlogCategory, BlogCategory> = {
  [PrismaMarketingBlogCategory.UNCATEGORIZED]: BlogCategory.UNCATEGORIZED,
  [PrismaMarketingBlogCategory.FITNESS]: BlogCategory.FITNESS,
  [PrismaMarketingBlogCategory.NUTRITION]: BlogCategory.NUTRITION,
  [PrismaMarketingBlogCategory.MINDSET]: BlogCategory.MINDSET,
  [PrismaMarketingBlogCategory.TRAINING]: BlogCategory.TRAINING,
  [PrismaMarketingBlogCategory.RECOVERY]: BlogCategory.RECOVERY,
};

export const GENDER_MAP: Record<PrismaGender, Gender> = {
  MALE: Gender.MALE,
  FEMALE: Gender.FEMALE,
};

export const GENDER_TO_PRISMA_MAP: Record<Gender, PrismaGender> = {
  [Gender.MALE]: "MALE",
  [Gender.FEMALE]: "FEMALE",
};

export const HEALTH_STATUS_MAP: Record<PrismaHealthStatus, HealthStatus> = {
  HEALTHY: HealthStatus.HEALTHY,
  INJURED: HealthStatus.INJURED,
  RESTRICTED: HealthStatus.RESTRICTED,
};

export const HEALTH_STATUS_TO_PRISMA_MAP: Record<HealthStatus, PrismaHealthStatus> = {
  [HealthStatus.HEALTHY]: "HEALTHY",
  [HealthStatus.INJURED]: "INJURED",
  [HealthStatus.RESTRICTED]: "RESTRICTED",
};

export const PLAN_ENROLLMENT_STATUS_MAP: Record<PrismaPlanEnrollmentStatus, PlanEnrollmentStatus> =
  {
    ACTIVE: PlanEnrollmentStatus.ACTIVE,
    PAUSED: PlanEnrollmentStatus.PAUSED,
  };

export const PLAN_ENROLLMENT_STATUS_TO_PRISMA_MAP: Record<
  PlanEnrollmentStatus,
  PrismaPlanEnrollmentStatus
> = {
  [PlanEnrollmentStatus.ACTIVE]: PrismaPlanEnrollmentStatus.ACTIVE,
  [PlanEnrollmentStatus.PAUSED]: PrismaPlanEnrollmentStatus.PAUSED,
};

export const ACTION_ITEM_TYPE_MAP: Record<PrismaActionItemType, ActionItemType> = {
  MISSED_WORKOUTS: ActionItemType.MISSED_WORKOUTS,
  NEW_NO_START: ActionItemType.NEW_NO_START,
  HEALTH_REPORT: ActionItemType.HEALTH_REPORT,
};

export const ACTION_ITEM_TYPE_TO_PRISMA_MAP: Record<ActionItemType, PrismaActionItemType> = {
  [ActionItemType.MISSED_WORKOUTS]: PrismaActionItemType.MISSED_WORKOUTS,
  [ActionItemType.NEW_NO_START]: PrismaActionItemType.NEW_NO_START,
  [ActionItemType.HEALTH_REPORT]: PrismaActionItemType.HEALTH_REPORT,
};

export const ACTION_ITEM_SEVERITY_MAP: Record<PrismaActionItemSeverity, ActionItemSeverity> = {
  INFO: ActionItemSeverity.INFO,
  WARNING: ActionItemSeverity.WARNING,
  CRITICAL: ActionItemSeverity.CRITICAL,
};

export const ACTION_ITEM_SEVERITY_TO_PRISMA_MAP: Record<
  ActionItemSeverity,
  PrismaActionItemSeverity
> = {
  [ActionItemSeverity.INFO]: PrismaActionItemSeverity.INFO,
  [ActionItemSeverity.WARNING]: PrismaActionItemSeverity.WARNING,
  [ActionItemSeverity.CRITICAL]: PrismaActionItemSeverity.CRITICAL,
};

export const ACTION_ITEM_STATUS_MAP: Record<PrismaActionItemStatus, ActionItemStatus> = {
  OPEN: ActionItemStatus.OPEN,
  RESOLVED: ActionItemStatus.RESOLVED,
};

export const ACTION_ITEM_STATUS_TO_PRISMA_MAP: Record<ActionItemStatus, PrismaActionItemStatus> = {
  [ActionItemStatus.OPEN]: PrismaActionItemStatus.OPEN,
  [ActionItemStatus.RESOLVED]: PrismaActionItemStatus.RESOLVED,
};

export const ACTION_ITEM_RESOLVE_REASON_MAP: Record<
  PrismaActionItemResolveReason,
  ActionItemResolveReason
> = {
  AUTO_CONDITION_CLEARED: ActionItemResolveReason.AUTO_CONDITION_CLEARED,
  AUTO_ENROLLMENT_ENDED: ActionItemResolveReason.AUTO_ENROLLMENT_ENDED,
  MANUAL_CONTACTED: ActionItemResolveReason.MANUAL_CONTACTED,
};

export const ACTION_ITEM_RESOLVE_REASON_TO_PRISMA_MAP: Record<
  ActionItemResolveReason,
  PrismaActionItemResolveReason
> = {
  [ActionItemResolveReason.AUTO_CONDITION_CLEARED]:
    PrismaActionItemResolveReason.AUTO_CONDITION_CLEARED,
  [ActionItemResolveReason.AUTO_ENROLLMENT_ENDED]:
    PrismaActionItemResolveReason.AUTO_ENROLLMENT_ENDED,
  [ActionItemResolveReason.MANUAL_CONTACTED]: PrismaActionItemResolveReason.MANUAL_CONTACTED,
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
