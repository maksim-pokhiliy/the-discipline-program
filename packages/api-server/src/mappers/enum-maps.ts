import {
  type ActionItemResolveReason as PrismaActionItemResolveReason,
  type ActionItemSeverity as PrismaActionItemSeverity,
  type ActionItemStatus as PrismaActionItemStatus,
  type ActionItemType as PrismaActionItemType,
  type Currency as PrismaCurrency,
  type Gender as PrismaGender,
  type HealthStatus as PrismaHealthStatus,
  type PlanEnrollmentStatus as PrismaPlanEnrollmentStatus,
  type PriceInterval as PrismaPriceInterval,
  type Role as PrismaRole,
  type ScoreType as PrismaScoreType,
  type SectionType as PrismaSectionType,
  type TrainingPlanStatus as PrismaTrainingPlanStatus,
  type Unit as PrismaUnit,
  type WeightType as PrismaWeightType,
} from "@prisma/client";

import { Gender, HealthStatus } from "@repo/contracts/athlete-profile";
import { UserRole } from "@repo/contracts/auth";
import {
  ActionItemResolveReason,
  ActionItemSeverity,
  ActionItemStatus,
  ActionItemType,
} from "@repo/contracts/coach-action-item";
import { PlanEnrollmentStatus } from "@repo/contracts/plan-enrollment";
import { WeightType, WeightUnit } from "@repo/contracts/prescribed-set";
import { PriceInterval, ProductCurrency } from "@repo/contracts/product";
import { TrainingPlanStatus } from "@repo/contracts/training-plan";
import { ScoreType, SectionType } from "@repo/contracts/workout-block";

export const UNIT_MAP: Record<PrismaUnit, WeightUnit> = {
  KG: WeightUnit.KG,
  LB: WeightUnit.LB,
};

export const WEIGHT_TYPE_MAP: Record<PrismaWeightType, WeightType> = {
  ABSOLUTE: WeightType.ABSOLUTE,
  PERCENTAGE: WeightType.PERCENTAGE,
};

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
    COMPLETED: PlanEnrollmentStatus.COMPLETED,
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

export const SECTION_TYPE_MAP: Record<PrismaSectionType, SectionType> = {
  FOR_TIME: SectionType.FOR_TIME,
  AMRAP: SectionType.AMRAP,
  EMOM: SectionType.EMOM,
  TABATA: SectionType.TABATA,
  STRENGTH: SectionType.STRENGTH,
  CUSTOM: SectionType.CUSTOM,
};

export const SCORE_TYPE_MAP: Record<PrismaScoreType, ScoreType> = {
  TIME: ScoreType.TIME,
  ROUNDS_REPS: ScoreType.ROUNDS_REPS,
  LOAD: ScoreType.LOAD,
  REPS: ScoreType.REPS,
  PASS_FAIL: ScoreType.PASS_FAIL,
  NONE: ScoreType.NONE,
};
