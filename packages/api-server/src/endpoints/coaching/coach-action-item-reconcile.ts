import type { CoachActionItem as PrismaCoachActionItemRecord } from "@prisma/client";
import type { JsonObject } from "@prisma/client/runtime/library";

import { HEALTH_STATUS_LABELS, HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import {
  ActionItemResolveReason,
  ActionItemSeverity,
  ActionItemStatus,
  ActionItemType,
  type HealthReportMetadata,
  type MissedWorkoutsMetadata,
  type NewNoStartMetadata,
} from "@repo/contracts/coaching/coach-action-item";
import { NEW_ATHLETE_THRESHOLD_DAYS } from "@repo/contracts/coaching/coach-dashboard";

import { prisma } from "../../db/client";
import { type TxClient } from "../../db/tx";
import {
  ACTION_ITEM_RESOLVE_REASON_TO_PRISMA_MAP,
  ACTION_ITEM_SEVERITY_MAP,
  ACTION_ITEM_SEVERITY_TO_PRISMA_MAP,
  ACTION_ITEM_STATUS_TO_PRISMA_MAP,
  ACTION_ITEM_TYPE_TO_PRISMA_MAP,
  HEALTH_STATUS_MAP,
} from "../../mappers/coaching";
import {
  addDaysInTz,
  DAYS_IN_WEEK,
  daysBetweenInTz,
  startOfTodayInTz,
} from "../../utils/date-helpers";
import { asJsonRecord } from "../../utils/json-record";

import { type AssignedAthleteWithData } from "./assigned-athlete-query";

const MISSED_WORKOUT_RATIO_THRESHOLD = 0.3;

type ConditionBase = {
  athleteId: string;
  severity: ActionItemSeverity;
  message: string;
};

export type Condition =
  | (ConditionBase & { type: ActionItemType.NEW_NO_START; metadata: NewNoStartMetadata })
  | (ConditionBase & { type: ActionItemType.HEALTH_REPORT; metadata: HealthReportMetadata })
  | (ConditionBase & { type: ActionItemType.MISSED_WORKOUTS; metadata: MissedWorkoutsMetadata });

export const computeBaseConditions = (
  assignments: AssignedAthleteWithData[],
  tz: string,
): Condition[] => {
  const conditions: Condition[] = [];
  const today = startOfTodayInTz(tz);

  for (const a of assignments) {
    const athlete = a.athlete;

    const earliestEnrollment =
      athlete.planEnrollments.length > 0
        ? athlete.planEnrollments.reduce((min, e) =>
            e.startedOnDate < min.startedOnDate ? e : min,
          )
        : null;

    if (earliestEnrollment) {
      const enrolledDays = daysBetweenInTz(earliestEnrollment.startedOnDate, today, tz);

      if (enrolledDays <= NEW_ATHLETE_THRESHOLD_DAYS) {
        const enrolledText =
          enrolledDays === 0
            ? "Enrolled today"
            : enrolledDays === 1
              ? "Enrolled yesterday"
              : `Enrolled ${enrolledDays} days ago`;

        conditions.push({
          athleteId: athlete.id,
          type: ActionItemType.NEW_NO_START,
          severity: ActionItemSeverity.INFO,
          message: `${enrolledText}, no workouts started`,
          metadata: { enrollmentId: earliestEnrollment.id },
        });
      }
    }

    const healthStatus = athlete.athleteProfile
      ? HEALTH_STATUS_MAP[athlete.athleteProfile.healthStatus]
      : HealthStatus.HEALTHY;

    if (healthStatus !== HealthStatus.HEALTHY) {
      conditions.push({
        athleteId: athlete.id,
        type: ActionItemType.HEALTH_REPORT,
        severity:
          healthStatus === HealthStatus.INJURED
            ? ActionItemSeverity.CRITICAL
            : ActionItemSeverity.WARNING,
        message: `Status: ${HEALTH_STATUS_LABELS[healthStatus].toLowerCase()} — review exercise assignments`,
        metadata: { healthStatus },
      });
    }
  }

  return conditions;
};

export const computeMissedWorkoutsConditions = async (
  assignments: AssignedAthleteWithData[],
  tz: string,
): Promise<Condition[]> => {
  if (assignments.length === 0) {
    return [];
  }

  const athleteIds = assignments.map((a) => a.athlete.id);
  const sevenDaysAgo = addDaysInTz(new Date(), -DAYS_IN_WEEK, tz);

  const [missedGroups, latestSessions] = await Promise.all([
    prisma.workoutSession.groupBy({
      by: ["userId"],
      where: {
        userId: { in: athleteIds },
        completionRatio: { lt: MISSED_WORKOUT_RATIO_THRESHOLD },
        startedAt: { gte: sevenDaysAgo },
      },
      _count: { _all: true },
    }),
    prisma.workoutSession.findMany({
      where: { userId: { in: athleteIds } },
      distinct: ["userId"],
      orderBy: [{ userId: "asc" }, { startedAt: "desc" }],
      select: { userId: true, startedAt: true },
    }),
  ]);

  const missedByAthleteId = new Map(missedGroups.map((g) => [g.userId, g._count._all]));
  const latestByAthleteId = new Map(latestSessions.map((s) => [s.userId, s.startedAt]));

  const conditions: Condition[] = [];

  for (const a of assignments) {
    const athlete = a.athlete;
    const missedCount = missedByAthleteId.get(athlete.id) ?? 0;

    if (missedCount === 0) {
      continue;
    }

    const lastActivityDate = (latestByAthleteId.get(athlete.id) ?? new Date(0)).toISOString();

    conditions.push({
      athleteId: athlete.id,
      type: ActionItemType.MISSED_WORKOUTS,
      severity: ActionItemSeverity.WARNING,
      message: `${missedCount} missed workout${missedCount === 1 ? "" : "s"} in the last 7 days`,
      metadata: { lastActivityDate },
    });
  }

  return conditions;
};

const conditionMatchesResolved = (
  condition: Condition,
  resolvedMetadata: JsonObject | null,
): boolean => {
  if (!resolvedMetadata) {
    return false;
  }

  switch (condition.type) {
    case ActionItemType.NEW_NO_START:
      return condition.metadata.enrollmentId === resolvedMetadata.enrollmentId;
    case ActionItemType.HEALTH_REPORT:
      return condition.metadata.healthStatus === resolvedMetadata.healthStatus;
    case ActionItemType.MISSED_WORKOUTS:
      return false;
    default:
      return false;
  }
};

export const partitionOpenItems = (
  openItems: PrismaCoachActionItemRecord[],
): {
  openByKey: Map<string, PrismaCoachActionItemRecord>;
  duplicates: PrismaCoachActionItemRecord[];
} => {
  const openByKey = new Map<string, PrismaCoachActionItemRecord>();
  const duplicates: PrismaCoachActionItemRecord[] = [];

  for (const item of openItems) {
    const key = `${item.type}:${item.athleteId}`;

    if (openByKey.has(key)) {
      duplicates.push(item);
    } else {
      openByKey.set(key, item);
    }
  }

  return { openByKey, duplicates };
};

export const resolveDuplicates = async (
  tx: TxClient,
  duplicates: PrismaCoachActionItemRecord[],
): Promise<number> => {
  for (const item of duplicates) {
    await tx.coachActionItem.update({
      where: { id: item.id },
      data: {
        status: ACTION_ITEM_STATUS_TO_PRISMA_MAP[ActionItemStatus.RESOLVED],
        resolvedAt: new Date(),
        resolveReason:
          ACTION_ITEM_RESOLVE_REASON_TO_PRISMA_MAP[ActionItemResolveReason.AUTO_CONDITION_CLEARED],
      },
    });
  }

  return duplicates.length;
};

export type ApplyConditionsResult = { created: number; updated: number };

export const applyConditions = async (
  tx: TxClient,
  args: {
    coachId: string;
    conditions: Condition[];
    openByKey: Map<string, PrismaCoachActionItemRecord>;
    resolvedByKey: Map<string, PrismaCoachActionItemRecord>;
  },
): Promise<ApplyConditionsResult> => {
  let created = 0;
  let updated = 0;

  for (const condition of args.conditions) {
    const key = `${condition.type}:${condition.athleteId}`;
    const existingOpen = args.openByKey.get(key);

    if (existingOpen) {
      const needsUpdate =
        existingOpen.message !== condition.message ||
        ACTION_ITEM_SEVERITY_MAP[existingOpen.severity] !== condition.severity;

      if (needsUpdate) {
        await tx.coachActionItem.update({
          where: { id: existingOpen.id },
          data: {
            message: condition.message,
            severity: ACTION_ITEM_SEVERITY_TO_PRISMA_MAP[condition.severity],
            metadata: condition.metadata,
          },
        });
        updated++;
      }

      args.openByKey.delete(key);
      continue;
    }

    const latestResolvedItem = args.resolvedByKey.get(key);

    if (
      latestResolvedItem &&
      conditionMatchesResolved(condition, asJsonRecord(latestResolvedItem.metadata))
    ) {
      continue;
    }

    await tx.coachActionItem.create({
      data: {
        coachId: args.coachId,
        athleteId: condition.athleteId,
        type: ACTION_ITEM_TYPE_TO_PRISMA_MAP[condition.type],
        severity: ACTION_ITEM_SEVERITY_TO_PRISMA_MAP[condition.severity],
        message: condition.message,
        metadata: condition.metadata,
      },
    });
    created++;
  }

  return { created, updated };
};

export const closeOrphanedOpenItems = async (
  tx: TxClient,
  args: {
    openByKey: Map<string, PrismaCoachActionItemRecord>;
    activeAthleteIds: Set<string>;
  },
): Promise<number> => {
  let resolved = 0;

  for (const [key, item] of args.openByKey) {
    const athleteId = key.split(":")[1];

    if (!athleteId) {
      continue;
    }

    const reason = args.activeAthleteIds.has(athleteId)
      ? ActionItemResolveReason.AUTO_CONDITION_CLEARED
      : ActionItemResolveReason.AUTO_ENROLLMENT_ENDED;

    await tx.coachActionItem.update({
      where: { id: item.id },
      data: {
        status: ACTION_ITEM_STATUS_TO_PRISMA_MAP[ActionItemStatus.RESOLVED],
        resolvedAt: new Date(),
        resolveReason: ACTION_ITEM_RESOLVE_REASON_TO_PRISMA_MAP[reason],
      },
    });
    resolved++;
  }

  return resolved;
};
