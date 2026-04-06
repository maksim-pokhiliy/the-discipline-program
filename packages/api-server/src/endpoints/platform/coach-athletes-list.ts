import { HealthStatus } from "@repo/contracts/athlete-profile";
import { ActionItemStatus } from "@repo/contracts/coach-action-item";
import type { CoachAthleteListItem, CoachAthletesData } from "@repo/contracts/coach-athletes";
import { PlanEnrollmentStatus } from "@repo/contracts/plan-enrollment";

import { prisma } from "../../db/client";
import { HEALTH_STATUS_MAP } from "../../mappers/enum-maps";
import {
  type AdherenceWindow,
  computeAdherenceWindow,
  computeProcessStatus,
} from "../../utils/dashboard-computations";
import { daysBetweenInTz, startOfTodayInTz } from "../../utils/date-helpers";
import { enrollmentInclude } from "../../utils/enrollment-query";

import { resolveCoachId } from "./guards";

type AggregatedAthlete = {
  name: string | null;
  email: string;
  image: string | null;
  healthStatus: HealthStatus;
  activePlans: { id: string; name: string }[];
  currentAdherence: AdherenceWindow;
  previousAdherence: AdherenceWindow;
  lastActivityDate: Date | null;
  enrolledSince: Date;
};

export const getAthletes = async (userId: string): Promise<CoachAthletesData> => {
  const coachId = await resolveCoachId(userId);

  const { timezone: tz } = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { timezone: true },
  });

  const [enrollments, actionItemCounts] = await Promise.all([
    prisma.planEnrollment.findMany({
      where: {
        status: PlanEnrollmentStatus.ACTIVE,
        trainingPlan: { coachId, deletedAt: null },
      },
      include: enrollmentInclude,
    }),
    prisma.coachActionItem.groupBy({
      by: ["athleteId"],
      where: { coachId, status: ActionItemStatus.OPEN },
      _count: { id: true },
    }),
  ]);

  const actionItemsMap = new Map(actionItemCounts.map((item) => [item.athleteId, item._count.id]));

  const now = new Date();
  const today = startOfTodayInTz(tz);
  const currentStart = new Date(now.getTime() - 7 * 86_400_000);
  const previousStart = new Date(now.getTime() - 14 * 86_400_000);
  const athleteMap = new Map<string, AggregatedAthlete>();

  for (const e of enrollments) {
    const user = e.user;
    const loggedIds = new Set(user.workoutLogs.map((l) => l.workoutId));
    const workouts = e.trainingPlan.workouts;

    const curWindow = computeAdherenceWindow(workouts, loggedIds, currentStart, now);
    const prevWindow = computeAdherenceWindow(workouts, loggedIds, previousStart, currentStart);

    const existing = athleteMap.get(user.id);

    if (existing) {
      existing.activePlans.push({ id: e.trainingPlan.id, name: e.trainingPlan.name });
      existing.currentAdherence.completed += curWindow.completed;
      existing.currentAdherence.available += curWindow.available;
      existing.previousAdherence.completed += prevWindow.completed;
      existing.previousAdherence.available += prevWindow.available;

      if (e.startDate < existing.enrolledSince) {
        existing.enrolledSince = e.startDate;
      }
    } else {
      const lastLog =
        user.workoutLogs.length > 0
          ? user.workoutLogs.reduce((latest, l) => (l.date > latest.date ? l : latest))
          : null;

      athleteMap.set(user.id, {
        name: user.name,
        email: user.email,
        image: user.image,
        healthStatus: user.athleteProfile
          ? HEALTH_STATUS_MAP[user.athleteProfile.healthStatus]
          : HealthStatus.HEALTHY,
        activePlans: [{ id: e.trainingPlan.id, name: e.trainingPlan.name }],
        currentAdherence: { ...curWindow },
        previousAdherence: { ...prevWindow },
        lastActivityDate: lastLog?.date ?? null,
        enrolledSince: e.startDate,
      });
    }
  }

  const athletes: CoachAthleteListItem[] = [];
  let needsAttentionCount = 0;
  let injuredCount = 0;
  let restrictedCount = 0;

  for (const [visitorId, data] of athleteMap) {
    const curRate =
      data.currentAdherence.available > 0
        ? data.currentAdherence.completed / data.currentAdherence.available
        : 0;
    const prevRate =
      data.previousAdherence.available > 0
        ? data.previousAdherence.completed / data.previousAdherence.available
        : 0;

    const processStatus = computeProcessStatus(curRate, prevRate);

    const daysSinceLastActivity = data.lastActivityDate
      ? daysBetweenInTz(new Date(data.lastActivityDate), today, tz)
      : null;

    const openActionItemsCount = actionItemsMap.get(visitorId) ?? 0;
    const needsAttention = openActionItemsCount > 0;

    if (needsAttention) {
      needsAttentionCount++;
    }

    if (data.healthStatus === HealthStatus.INJURED) {
      injuredCount++;
    }

    if (data.healthStatus === HealthStatus.RESTRICTED) {
      restrictedCount++;
    }

    athletes.push({
      userId: visitorId,
      name: data.name,
      email: data.email,
      image: data.image,
      healthStatus: data.healthStatus,
      activePlans: data.activePlans,
      processStatus,
      lastActivityDate: data.lastActivityDate,
      daysSinceLastActivity,
      openActionItemsCount,
      needsAttention,
      enrolledSince: data.enrolledSince,
    });
  }

  return {
    summary: {
      total: athleteMap.size,
      active: athleteMap.size,
      needsAttention: needsAttentionCount,
      injured: injuredCount,
      restricted: restrictedCount,
    },
    athletes,
  };
};
