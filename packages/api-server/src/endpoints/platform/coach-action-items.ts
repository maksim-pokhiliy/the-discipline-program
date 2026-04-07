import type { CoachActionItem as PrismaCoachActionItemRecord } from "@prisma/client";

import { HEALTH_STATUS_LABELS, HealthStatus } from "@repo/contracts/athlete-profile";
import {
  ActionItemResolveReason,
  ActionItemSeverity,
  ActionItemStatus,
  ActionItemType,
  type CoachActionItem,
  type ReconcileResponse,
} from "@repo/contracts/coach-action-item";
import {
  MISSED_DAYS_CRITICAL,
  MISSED_DAYS_WARNING,
  NEW_ATHLETE_THRESHOLD_DAYS,
} from "@repo/contracts/coach-dashboard";
import { PlanEnrollmentStatus } from "@repo/contracts/plan-enrollment";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import {
  ACTION_ITEM_RESOLVE_REASON_MAP,
  ACTION_ITEM_SEVERITY_MAP,
  ACTION_ITEM_STATUS_MAP,
  ACTION_ITEM_TYPE_MAP,
  HEALTH_STATUS_MAP,
} from "../../mappers/enum-maps";
import { daysBetweenInTz, startOfTodayInTz } from "../../utils/date-helpers";
import { type EnrollmentWithData, createEnrollmentInclude } from "../../utils/enrollment-query";

import { resolveCoachId } from "./guards";

type Condition = {
  athleteId: string;
  type: ActionItemType;
  severity: ActionItemSeverity;
  message: string;
  metadata: Record<string, unknown>;
};

const computeConditions = (enrollments: EnrollmentWithData[], tz: string): Condition[] => {
  const conditions: Condition[] = [];
  const today = startOfTodayInTz(tz);
  const processedAthletes = new Set<string>();

  for (const e of enrollments) {
    const user = e.user;

    if (processedAthletes.has(user.id)) {
      continue;
    }

    processedAthletes.add(user.id);

    const lastLog =
      user.workoutLogs.length > 0
        ? user.workoutLogs.reduce((latest, l) => (l.date > latest.date ? l : latest))
        : null;

    if (lastLog) {
      const daysSince = daysBetweenInTz(new Date(lastLog.date), today, tz);

      if (daysSince >= MISSED_DAYS_WARNING) {
        conditions.push({
          athleteId: user.id,
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

    const enrolledDays = daysBetweenInTz(e.startDate, today, tz);

    if (enrolledDays <= NEW_ATHLETE_THRESHOLD_DAYS && user.workoutLogs.length === 0) {
      const enrolledText =
        enrolledDays === 0
          ? "Enrolled today"
          : enrolledDays === 1
            ? "Enrolled yesterday"
            : `Enrolled ${enrolledDays} days ago`;

      conditions.push({
        athleteId: user.id,
        type: ActionItemType.NEW_NO_START,
        severity: ActionItemSeverity.INFO,
        message: `${enrolledText}, no workouts started`,
        metadata: { enrollmentId: e.id },
      });
    }

    const healthStatus = user.athleteProfile
      ? HEALTH_STATUS_MAP[user.athleteProfile.healthStatus]
      : HealthStatus.HEALTHY;

    if (healthStatus !== HealthStatus.HEALTHY) {
      conditions.push({
        athleteId: user.id,
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
  resolvedMetadata: Record<string, unknown> | null,
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

const mapToCoachActionItem = (item: PrismaCoachActionItemRecord): CoachActionItem => ({
  id: item.id,
  coachId: item.coachId,
  athleteId: item.athleteId,
  type: ACTION_ITEM_TYPE_MAP[item.type],
  severity: ACTION_ITEM_SEVERITY_MAP[item.severity],
  status: ACTION_ITEM_STATUS_MAP[item.status],
  message: item.message,
  metadata: item.metadata as Record<string, unknown> | null,
  resolvedAt: item.resolvedAt,
  resolveReason: item.resolveReason ? ACTION_ITEM_RESOLVE_REASON_MAP[item.resolveReason] : null,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

export const platformCoachActionItemsApi = {
  reconcile: async (userId: string): Promise<ReconcileResponse> => {
    const coachId = await resolveCoachId(userId);

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timezone: true },
    });

    const tz = user.timezone;

    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`reconcile:${coachId}`}))`;

      const [enrollments, openItems, latestResolved] = await Promise.all([
        tx.planEnrollment.findMany({
          where: {
            status: PlanEnrollmentStatus.ACTIVE,
            trainingPlan: { coachId },
          },
          include: createEnrollmentInclude(coachId),
        }),
        tx.coachActionItem.findMany({
          where: { coachId, status: ActionItemStatus.OPEN },
        }),
        tx.coachActionItem.findMany({
          where: { coachId, status: ActionItemStatus.RESOLVED },
          orderBy: { resolvedAt: "desc" },
          distinct: ["athleteId", "type"],
        }),
      ]);

      const conditions = computeConditions(enrollments, tz);

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

      const activeAthleteIds = new Set(enrollments.map((e) => e.user.id));

      let created = 0;
      let updated = 0;
      let resolved = 0;

      for (const item of duplicates) {
        await tx.coachActionItem.update({
          where: { id: item.id },
          data: {
            status: ActionItemStatus.RESOLVED,
            resolvedAt: new Date(),
            resolveReason: ActionItemResolveReason.AUTO_CONDITION_CLEARED,
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
            existingOpen.severity !== condition.severity;

          if (needsUpdate) {
            await tx.coachActionItem.update({
              where: { id: existingOpen.id },
              data: {
                message: condition.message,
                severity: condition.severity,
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
          conditionMatchesResolved(
            condition,
            latestResolvedItem.metadata as Record<string, unknown> | null,
          )
        ) {
          continue;
        }

        await tx.coachActionItem.create({
          data: {
            coachId,
            athleteId: condition.athleteId,
            type: condition.type,
            severity: condition.severity,
            message: condition.message,
            metadata: condition.metadata,
          },
        });
        created++;
      }

      for (const [key, item] of openByKey) {
        const athleteId = key.split(":")[1] ?? "";
        const reason = activeAthleteIds.has(athleteId)
          ? ActionItemResolveReason.AUTO_CONDITION_CLEARED
          : ActionItemResolveReason.AUTO_ENROLLMENT_ENDED;

        await tx.coachActionItem.update({
          where: { id: item.id },
          data: {
            status: ActionItemStatus.RESOLVED,
            resolvedAt: new Date(),
            resolveReason: reason,
          },
        });
        resolved++;
      }

      return { created, updated, resolved };
    });
  },

  resolve: async (userId: string, itemId: string): Promise<CoachActionItem> => {
    const coachId = await resolveCoachId(userId);

    const item = await prisma.coachActionItem.findUnique({ where: { id: itemId } });

    if (!item || item.coachId !== coachId) {
      throw new NotFoundError("Action item not found", { itemId });
    }

    if (item.status === ActionItemStatus.RESOLVED) {
      return mapToCoachActionItem(item);
    }

    const updated = await prisma.coachActionItem.update({
      where: { id: itemId },
      data: {
        status: ActionItemStatus.RESOLVED,
        resolvedAt: new Date(),
        resolveReason: ActionItemResolveReason.MANUAL_CONTACTED,
      },
    });

    return mapToCoachActionItem(updated);
  },
};
