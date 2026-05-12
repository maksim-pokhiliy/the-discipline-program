import { HEALTH_STATUS_LABELS, HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import {
  ActionItemSeverity,
  ActionItemType,
  type HealthReportMetadata,
  type MissedWorkoutsMetadata,
} from "@repo/contracts/coaching/coach-action-item";

import { HEALTH_STATUS_MAP } from "../../mappers/coaching";

import { type AssignedAthleteWithData } from "./assigned-athlete-query";

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
  _assignments: AssignedAthleteWithData[],
  _tz: string,
): Promise<Condition[]> => [];
