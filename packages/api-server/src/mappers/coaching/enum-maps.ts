import {
  ActionItemResolveReason as PrismaActionItemResolveReason,
  ActionItemSeverity as PrismaActionItemSeverity,
  ActionItemStatus as PrismaActionItemStatus,
  ActionItemType as PrismaActionItemType,
  Gender as PrismaGender,
  HealthStatus as PrismaHealthStatus,
} from "@prisma/client";

import { Gender, HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import {
  ActionItemResolveReason,
  ActionItemSeverity,
  ActionItemStatus,
  ActionItemType,
} from "@repo/contracts/coaching/coach-action-item";

export const GENDER_MAP: Record<PrismaGender, Gender> = {
  MALE: Gender.MALE,
  FEMALE: Gender.FEMALE,
};

export const GENDER_TO_PRISMA_MAP: Record<Gender, PrismaGender> = {
  [Gender.MALE]: PrismaGender.MALE,
  [Gender.FEMALE]: PrismaGender.FEMALE,
};

export const HEALTH_STATUS_MAP: Record<PrismaHealthStatus, HealthStatus> = {
  HEALTHY: HealthStatus.HEALTHY,
  INJURED: HealthStatus.INJURED,
  RESTRICTED: HealthStatus.RESTRICTED,
};

export const HEALTH_STATUS_TO_PRISMA_MAP: Record<HealthStatus, PrismaHealthStatus> = {
  [HealthStatus.HEALTHY]: PrismaHealthStatus.HEALTHY,
  [HealthStatus.INJURED]: PrismaHealthStatus.INJURED,
  [HealthStatus.RESTRICTED]: PrismaHealthStatus.RESTRICTED,
};

export const ACTION_ITEM_TYPE_MAP: Record<PrismaActionItemType, ActionItemType> = {
  MISSED_WORKOUTS: ActionItemType.MISSED_WORKOUTS,
  HEALTH_REPORT: ActionItemType.HEALTH_REPORT,
};

export const ACTION_ITEM_TYPE_TO_PRISMA_MAP: Record<ActionItemType, PrismaActionItemType> = {
  [ActionItemType.MISSED_WORKOUTS]: PrismaActionItemType.MISSED_WORKOUTS,
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
