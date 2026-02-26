import type { CoachActionItem as PrismaCoachActionItemRecord } from "@prisma/client";

import type {
  ActionItemSeverity,
  ActionItemType,
  CoachActionItem,
  ReconcileResponse,
} from "@repo/contracts/coach-action-item";
import {
  MISSED_DAYS_CRITICAL,
  MISSED_DAYS_WARNING,
  NEW_ATHLETE_THRESHOLD_DAYS,
} from "@repo/contracts/coach-dashboard";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";
import { daysBetween, startOfToday } from "../../utils/date-helpers";
import { type EnrollmentWithData, enrollmentInclude } from "../../utils/enrollment-query";

import { resolveCoachId } from "./guards";

type Condition = {
  athleteId: string;
  type: ActionItemType;
  severity: ActionItemSeverity;
  message: string;
  metadata: Record<string, unknown>;
};

const computeConditions = (enrollments: EnrollmentWithData[]): Condition[] => {
  const conditions: Condition[] = [];
  const today = startOfToday();
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
      const daysSince = daysBetween(new Date(lastLog.date), today);

      if (daysSince >= MISSED_DAYS_WARNING) {
        conditions.push({
          athleteId: user.id,
          type: "MISSED_WORKOUTS",
          severity: daysSince >= MISSED_DAYS_CRITICAL ? "CRITICAL" : "WARNING",
          message: `${daysSince} days without activity`,
          metadata: { lastActivityDate: lastLog.date.toISOString() },
        });
      }
    }

    const enrolledDays = daysBetween(e.startDate, today);

    if (enrolledDays <= NEW_ATHLETE_THRESHOLD_DAYS && user.workoutLogs.length === 0) {
      conditions.push({
        athleteId: user.id,
        type: "NEW_NO_START",
        severity: "INFO",
        message: `Enrolled ${enrolledDays} day(s) ago, no workouts started`,
        metadata: { enrollmentId: e.id },
      });
    }

    const healthStatus = user.athleteProfile?.healthStatus ?? "HEALTHY";

    if (healthStatus !== "HEALTHY") {
      conditions.push({
        athleteId: user.id,
        type: "HEALTH_REPORT",
        severity: healthStatus === "INJURED" ? "CRITICAL" : "WARNING",
        message: `Athlete reported: ${healthStatus.toLowerCase()}`,
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
    case "MISSED_WORKOUTS":
      return condition.metadata.lastActivityDate === resolvedMetadata.lastActivityDate;
    case "NEW_NO_START":
      return condition.metadata.enrollmentId === resolvedMetadata.enrollmentId;
    case "HEALTH_REPORT":
      return condition.metadata.healthStatus === resolvedMetadata.healthStatus;
    default:
      return false;
  }
};

const mapToCoachActionItem = (item: PrismaCoachActionItemRecord): CoachActionItem => ({
  id: item.id,
  coachId: item.coachId,
  athleteId: item.athleteId,
  type: item.type as CoachActionItem["type"],
  severity: item.severity as CoachActionItem["severity"],
  status: item.status as CoachActionItem["status"],
  message: item.message,
  metadata: item.metadata as Record<string, unknown> | null,
  resolvedAt: item.resolvedAt,
  resolveReason: item.resolveReason as CoachActionItem["resolveReason"],
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

export const platformCoachActionItemsApi = {
  reconcile: async (userId: string): Promise<ReconcileResponse> => {
    const coachId = await resolveCoachId(userId);

    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`reconcile:${coachId}`}))`;

      const [enrollments, openItems, latestResolved] = await Promise.all([
        tx.planEnrollment.findMany({
          where: {
            status: "ACTIVE",
            trainingPlan: { coachId, deletedAt: null },
          },
          include: enrollmentInclude,
        }),
        tx.coachActionItem.findMany({
          where: { coachId, status: "OPEN" },
        }),
        tx.coachActionItem.findMany({
          where: { coachId, status: "RESOLVED" },
          orderBy: { resolvedAt: "desc" },
          distinct: ["athleteId", "type"],
        }),
      ]);

      const conditions = computeConditions(enrollments);

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
            status: "RESOLVED",
            resolvedAt: new Date(),
            resolveReason: "AUTO_CONDITION_CLEARED",
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
        const athleteId = key.split(":")[1];
        const reason = activeAthleteIds.has(athleteId!)
          ? "AUTO_CONDITION_CLEARED"
          : "AUTO_ENROLLMENT_ENDED";

        await tx.coachActionItem.update({
          where: { id: item.id },
          data: {
            status: "RESOLVED",
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

    if (item.status === "RESOLVED") {
      return mapToCoachActionItem(item);
    }

    const updated = await prisma.coachActionItem.update({
      where: { id: itemId },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolveReason: "MANUAL_CONTACTED",
      },
    });

    return mapToCoachActionItem(updated);
  },
};
