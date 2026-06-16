import { HEALTH_STATUS_LABELS, HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import {
  ActionItemSeverity,
  ActionItemType,
  type HealthReportMetadata,
  type MissedWorkoutsMetadata,
} from "@repo/contracts/coaching/coach-action-item";
import {
  MISSED_DAYS_CRITICAL,
  MISSED_DAYS_WARNING,
} from "@repo/contracts/coaching/coach-dashboard";

import { HEALTH_STATUS_MAP } from "../../mappers/coaching";
import { createStartOfDayCache } from "../../utils/date-helpers";

import { type AssignedAthleteWithData } from "./assigned-athlete-query";
import { computeAthleteMetrics, loadScheduleWindow } from "./coach-metrics";

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

const buildMissedWorkoutsCondition = (
  athleteId: string,
  consecutiveMissedDays: number,
  lastActivityDate: Date | null,
): Condition | null => {
  if (consecutiveMissedDays < MISSED_DAYS_WARNING) {
    return null;
  }

  const severity =
    consecutiveMissedDays >= MISSED_DAYS_CRITICAL
      ? ActionItemSeverity.CRITICAL
      : ActionItemSeverity.WARNING;

  return {
    athleteId,
    type: ActionItemType.MISSED_WORKOUTS,
    severity,
    message: `${consecutiveMissedDays} consecutive days missed — reach out`,
    metadata: { lastActivityDate: lastActivityDate?.toISOString() ?? "" },
  };
};

export const computeMissedWorkoutsConditions = async (
  assignments: AssignedAthleteWithData[],
  tz: string,
): Promise<Condition[]> => {
  if (assignments.length === 0) {
    return [];
  }

  const now = new Date();
  const athleteIds = assignments.map((a) => a.athlete.id);
  const { enrollmentsByAthlete, performedByKey, weekCountByPlan, firstWeekStartByPlan } =
    await loadScheduleWindow({ athleteIds, tz, now });
  const startOfDayCache = createStartOfDayCache(tz);

  const conditions: Condition[] = [];

  for (const athleteId of athleteIds) {
    const metrics = computeAthleteMetrics({
      athleteId,
      enrollments: enrollmentsByAthlete.get(athleteId) ?? [],
      performedByKey,
      weekCountByPlan,
      firstWeekStartByPlan,
      tz,
      now,
      startOfDayCache,
    });

    const condition = buildMissedWorkoutsCondition(
      athleteId,
      metrics.consecutiveMissedDays,
      metrics.lastActivityDate,
    );

    if (condition) {
      conditions.push(condition);
    }
  }

  return conditions;
};
