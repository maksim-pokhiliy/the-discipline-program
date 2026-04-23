import type { CoachActionItem as PrismaCoachActionItemRecord } from "@prisma/client";
import { type JsonObject } from "@prisma/client/runtime/library";

import { HEALTH_STATUS_LABELS, HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import {
  ActionItemResolveReason,
  ActionItemSeverity,
  ActionItemStatus,
  ActionItemType,
  type CoachActionItem,
  type HealthReportMetadata,
  type MissedWorkoutsMetadata,
  type NewNoStartMetadata,
  type ReconcileResponse,
} from "@repo/contracts/coaching/coach-action-item";
import {
  MISSED_DAYS_CRITICAL,
  MISSED_DAYS_WARNING,
  NEW_ATHLETE_THRESHOLD_DAYS,
} from "@repo/contracts/coaching/coach-dashboard";
import { NotFoundError } from "@repo/errors";

import { resolveCoachId } from "../../authz/guards";
import { prisma } from "../../db/client";
import {
  ACTION_ITEM_RESOLVE_REASON_TO_PRISMA_MAP,
  ACTION_ITEM_SEVERITY_MAP,
  ACTION_ITEM_SEVERITY_TO_PRISMA_MAP,
  ACTION_ITEM_STATUS_MAP,
  ACTION_ITEM_STATUS_TO_PRISMA_MAP,
  ACTION_ITEM_TYPE_TO_PRISMA_MAP,
  HEALTH_STATUS_MAP,
  mapToCoachActionItem,
} from "../../mappers/coaching";
import { findOrThrow, handlePrismaError } from "../../utils";
import { daysBetweenInTz, startOfTodayInTz } from "../../utils/date-helpers";
import { asJsonRecord } from "../../utils/json-record";

import {
  type AssignedAthleteWithData,
  buildAssignedAthleteInclude,
} from "./assigned-athlete-query";

type ConditionBase = {
  athleteId: string;
  severity: ActionItemSeverity;
  message: string;
};

type Condition =
  | (ConditionBase & { type: ActionItemType.MISSED_WORKOUTS; metadata: MissedWorkoutsMetadata })
  | (ConditionBase & { type: ActionItemType.NEW_NO_START; metadata: NewNoStartMetadata })
  | (ConditionBase & { type: ActionItemType.HEALTH_REPORT; metadata: HealthReportMetadata });

const computeConditions = (assignments: AssignedAthleteWithData[], tz: string): Condition[] => {
  const conditions: Condition[] = [];
  const today = startOfTodayInTz(tz);

  for (const a of assignments) {
    const athlete = a.athlete;

    const lastLog =
      athlete.workoutLogs.length > 0
        ? athlete.workoutLogs.reduce((latest, l) => (l.date > latest.date ? l : latest))
        : null;

    if (lastLog) {
      const daysSince = daysBetweenInTz(new Date(lastLog.date), today, tz);

      if (daysSince >= MISSED_DAYS_WARNING) {
        conditions.push({
          athleteId: athlete.id,
          type: ActionItemType.MISSED_WORKOUTS,
          severity:
            daysSince >= MISSED_DAYS_CRITICAL
              ? ActionItemSeverity.CRITICAL
              : ActionItemSeverity.WARNING,
          message: `${daysSince} days without activity`,
          metadata: { lastActivityDate: lastLog.date.toISOString() },
        });
      }
    }

    const earliestEnrollment =
      athlete.planEnrollments.length > 0
        ? athlete.planEnrollments.reduce((min, e) => (e.startDate < min.startDate ? e : min))
        : null;

    if (earliestEnrollment) {
      const enrolledDays = daysBetweenInTz(earliestEnrollment.startDate, today, tz);

      if (enrolledDays <= NEW_ATHLETE_THRESHOLD_DAYS && athlete.workoutLogs.length === 0) {
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

const conditionMatchesResolved = (
  condition: Condition,
  resolvedMetadata: JsonObject | null,
): boolean => {
  if (!resolvedMetadata) {
    return false;
  }

  switch (condition.type) {
    case ActionItemType.MISSED_WORKOUTS:
      return condition.metadata.lastActivityDate === resolvedMetadata.lastActivityDate;
    case ActionItemType.NEW_NO_START:
      return condition.metadata.enrollmentId === resolvedMetadata.enrollmentId;
    case ActionItemType.HEALTH_REPORT:
      return condition.metadata.healthStatus === resolvedMetadata.healthStatus;
    default:
      return false;
  }
};

export const coachingCoachActionItemApi = {
  reconcile: async (userId: string): Promise<ReconcileResponse & { coachId: string }> => {
    const coachId = await resolveCoachId(userId);

    const user = await findOrThrow(
      prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
      "User",
    );

    const tz = user.timezone;

    try {
      return prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`reconcile:${coachId}`}))`;

        const [assignments, openItems, latestResolved] = await Promise.all([
          tx.coachAthleteAssignment.findMany({
            where: { coachId },
            include: buildAssignedAthleteInclude(coachId),
          }),
          tx.coachActionItem.findMany({
            where: { coachId, status: ACTION_ITEM_STATUS_TO_PRISMA_MAP[ActionItemStatus.OPEN] },
          }),
          tx.coachActionItem.findMany({
            where: {
              coachId,
              status: ACTION_ITEM_STATUS_TO_PRISMA_MAP[ActionItemStatus.RESOLVED],
            },
            orderBy: { resolvedAt: "desc" },
            distinct: ["athleteId", "type"],
          }),
        ]);

        const conditions = computeConditions(assignments, tz);

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

        const resolvedByKey = new Map(
          latestResolved.map((item) => [`${item.type}:${item.athleteId}`, item]),
        );

        const activeAthleteIds = new Set(assignments.map((a) => a.athleteId));

        let created = 0;
        let updated = 0;
        let resolved = 0;

        for (const item of duplicates) {
          await tx.coachActionItem.update({
            where: { id: item.id },
            data: {
              status: ACTION_ITEM_STATUS_TO_PRISMA_MAP[ActionItemStatus.RESOLVED],
              resolvedAt: new Date(),
              resolveReason:
                ACTION_ITEM_RESOLVE_REASON_TO_PRISMA_MAP[
                  ActionItemResolveReason.AUTO_CONDITION_CLEARED
                ],
            },
          });
          resolved++;
        }

        for (const condition of conditions) {
          const key = `${condition.type}:${condition.athleteId}`;
          const existingOpen = openByKey.get(key);

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

            openByKey.delete(key);
            continue;
          }

          const latestResolvedItem = resolvedByKey.get(key);

          if (
            latestResolvedItem &&
            conditionMatchesResolved(condition, asJsonRecord(latestResolvedItem.metadata))
          ) {
            continue;
          }

          await tx.coachActionItem.create({
            data: {
              coachId,
              athleteId: condition.athleteId,
              type: ACTION_ITEM_TYPE_TO_PRISMA_MAP[condition.type],
              severity: ACTION_ITEM_SEVERITY_TO_PRISMA_MAP[condition.severity],
              message: condition.message,
              metadata: condition.metadata,
            },
          });
          created++;
        }

        for (const [key, item] of openByKey) {
          const athleteId = key.split(":")[1];

          if (!athleteId) {
            continue;
          }

          const reason = activeAthleteIds.has(athleteId)
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

        return { created, updated, resolved, coachId };
      });
    } catch (error) {
      return handlePrismaError(error, { entity: "Action item" });
    }
  },

  resolve: async (userId: string, itemId: string): Promise<CoachActionItem> => {
    const coachId = await resolveCoachId(userId);

    const item = await prisma.coachActionItem.findUnique({ where: { id: itemId } });

    if (!item || item.coachId !== coachId) {
      throw new NotFoundError("Action item not found", { itemId });
    }

    if (ACTION_ITEM_STATUS_MAP[item.status] === ActionItemStatus.RESOLVED) {
      return mapToCoachActionItem(item);
    }

    try {
      const updated = await prisma.coachActionItem.update({
        where: { id: itemId },
        data: {
          status: ACTION_ITEM_STATUS_TO_PRISMA_MAP[ActionItemStatus.RESOLVED],
          resolvedAt: new Date(),
          resolveReason:
            ACTION_ITEM_RESOLVE_REASON_TO_PRISMA_MAP[ActionItemResolveReason.MANUAL_CONTACTED],
        },
      });

      return mapToCoachActionItem(updated);
    } catch (error) {
      return handlePrismaError(error, { entity: "Action item" });
    }
  },
};
