import { HEALTH_STATUS_LABELS, HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import {
  ActionItemSeverity,
  ActionItemType,
  type HealthReportMetadata,
  type MissedWorkoutsMetadata,
} from "@repo/contracts/coaching/coach-action-item";

import { prisma } from "../../db/client";
import { HEALTH_STATUS_MAP } from "../../mappers/coaching";
import { addDaysInTz, DAYS_IN_WEEK } from "../../utils/date-helpers";

import { type AssignedAthleteWithData } from "./assigned-athlete-query";

const MISSED_WORKOUT_RATIO_THRESHOLD = 0.3;

type ConditionBase = {
  athleteId: string;
  severity: ActionItemSeverity;
  message: string;
};

export type Condition =
  | (ConditionBase & { type: ActionItemType.HEALTH_REPORT; metadata: HealthReportMetadata })
  | (ConditionBase & { type: ActionItemType.MISSED_WORKOUTS; metadata: MissedWorkoutsMetadata });

const buildHealthReportCondition = (
  athlete: AssignedAthleteWithData["athlete"],
): Condition | null => {
  const healthStatus = athlete.athleteProfile
    ? HEALTH_STATUS_MAP[athlete.athleteProfile.healthStatus]
    : HealthStatus.HEALTHY;

  if (healthStatus === HealthStatus.HEALTHY) {
    return null;
  }

  return {
    athleteId: athlete.id,
    type: ActionItemType.HEALTH_REPORT,
    severity:
      healthStatus === HealthStatus.INJURED
        ? ActionItemSeverity.CRITICAL
        : ActionItemSeverity.WARNING,
    message: `Status: ${HEALTH_STATUS_LABELS[healthStatus].toLowerCase()} — review exercise assignments`,
    metadata: { healthStatus },
  };
};

export const computeBaseConditions = (assignments: AssignedAthleteWithData[]): Condition[] => {
  const conditions: Condition[] = [];

  for (const a of assignments) {
    const healthReport = buildHealthReportCondition(a.athlete);

    if (healthReport) {
      conditions.push(healthReport);
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
