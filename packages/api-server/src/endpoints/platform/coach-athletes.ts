import { HealthStatus } from "@repo/contracts/athlete-profile";
import { ActionItemStatus } from "@repo/contracts/coach-action-item";
import type {
  CoachAthleteDetail,
  CoachAthleteListItem,
  CoachAthletesData,
} from "@repo/contracts/coach-athletes";
import { ProcessStatus } from "@repo/contracts/coach-dashboard";
import { PlanEnrollmentStatus } from "@repo/contracts/plan-enrollment";

import { prisma } from "../../db/client";
import {
  ACTION_ITEM_SEVERITY_MAP,
  ACTION_ITEM_TYPE_MAP,
  HEALTH_STATUS_MAP,
  PLAN_ENROLLMENT_STATUS_MAP,
} from "../../mappers/enum-maps";
import { computeProcessStatus } from "../../utils/dashboard-computations";
import {
  daysBetweenInTz,
  startOfDayInTz,
  startOfTodayInTz,
  startOfWeekInTz,
} from "../../utils/date-helpers";
import { enrollmentInclude } from "../../utils/enrollment-query";

import { resolveCoachId, verifyAthleteBelongsToCoach } from "./guards";

type AdherenceWindow = { completed: number; available: number };

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

const computeWindow = (
  workouts: { id: string; scheduledDate: Date | null }[],
  loggedIds: Set<string>,
  start: Date,
  end: Date,
): AdherenceWindow => {
  let available = 0;
  let completed = 0;

  for (const w of workouts) {
    if (!w.scheduledDate) {
      continue;
    }

    const t = w.scheduledDate.getTime();

    if (t >= start.getTime() && t < end.getTime()) {
      available++;

      if (loggedIds.has(w.id)) {
        completed++;
      }
    }
  }

  return { completed, available };
};

export const platformCoachAthletesApi = {
  getAthletes: async (userId: string): Promise<CoachAthletesData> => {
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

    const actionItemsMap = new Map(
      actionItemCounts.map((item) => [item.athleteId, item._count.id]),
    );

    const now = new Date();
    const today = startOfTodayInTz(tz);
    const currentStart = new Date(now.getTime() - 7 * 86_400_000);
    const previousStart = new Date(now.getTime() - 14 * 86_400_000);
    const athleteMap = new Map<string, AggregatedAthlete>();

    for (const e of enrollments) {
      const user = e.user;
      const loggedIds = new Set(user.workoutLogs.map((l) => l.workoutId));
      const workouts = e.trainingPlan.workouts;

      const curWindow = computeWindow(workouts, loggedIds, currentStart, now);
      const prevWindow = computeWindow(workouts, loggedIds, previousStart, currentStart);

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
  },

  getAthleteDetail: async (
    coachUserId: string,
    athleteUserId: string,
  ): Promise<CoachAthleteDetail> => {
    const coachId = await resolveCoachId(coachUserId);

    await verifyAthleteBelongsToCoach(athleteUserId, coachId);

    const { timezone: tz } = await prisma.user.findUniqueOrThrow({
      where: { id: coachUserId },
      select: { timezone: true },
    });

    const [athlete, enrollments, actionItems] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: athleteUserId },
        select: {
          name: true,
          email: true,
          image: true,
          athleteProfile: { select: { healthStatus: true } },
        },
      }),

      prisma.planEnrollment.findMany({
        where: {
          userId: athleteUserId,
          status: PlanEnrollmentStatus.ACTIVE,
          trainingPlan: { coachId, deletedAt: null },
        },
        include: enrollmentInclude,
        orderBy: { startDate: "asc" },
      }),

      prisma.coachActionItem.findMany({
        where: { coachId, athleteId: athleteUserId, status: ActionItemStatus.OPEN },
        select: { id: true, type: true, severity: true, message: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (enrollments.length === 0) {
      return {
        userId: athleteUserId,
        name: athlete.name,
        email: athlete.email,
        image: athlete.image,
        healthStatus: athlete.athleteProfile
          ? HEALTH_STATUS_MAP[athlete.athleteProfile.healthStatus]
          : HealthStatus.HEALTHY,
        processStatus: ProcessStatus.STEADY,
        planDiscipline: [],
        recentWorkouts: [],
        actionItems: actionItems.map((item) => ({
          id: item.id,
          type: ACTION_ITEM_TYPE_MAP[item.type],
          severity: ACTION_ITEM_SEVERITY_MAP[item.severity],
          message: item.message,
          createdAt: item.createdAt,
        })),
        nextWorkout: null,
        consistency: { adherenceRate4w: 0, currentStreak: 0, missedThisWeek: 0 },
        enrolledSince: new Date(),
        lastActivityDate: null,
        daysSinceLastActivity: null,
      };
    }

    const now = new Date();
    const today = startOfTodayInTz(tz);
    const weekStart = startOfWeekInTz(today, tz);
    const nextWeekStart = new Date(weekStart.getTime() + 7 * 86_400_000);
    const rolling7Start = new Date(now.getTime() - 7 * 86_400_000);
    const rolling14Start = new Date(now.getTime() - 14 * 86_400_000);

    let earliestEnrollment = enrollments[0]?.startDate ?? new Date();
    let lastActivityDate: Date | null = null;
    const rollingCurrent = { completed: 0, available: 0 };
    const rollingPrevious = { completed: 0, available: 0 };

    const planDiscipline = enrollments.map((e) => {
      const loggedIds = new Set(e.user.workoutLogs.map((l) => l.workoutId));
      const workouts = e.trainingPlan.workouts;

      let completed = 0;
      let available = 0;
      let planned = 0;

      for (const w of workouts) {
        if (!w.scheduledDate) {
          continue;
        }

        const t = w.scheduledDate.getTime();

        if (t >= weekStart.getTime() && t < nextWeekStart.getTime()) {
          planned++;

          if (t <= today.getTime()) {
            available++;

            if (loggedIds.has(w.id)) {
              completed++;
            }
          }
        }
      }

      const curWindow = computeWindow(workouts, loggedIds, rolling7Start, now);
      const prevWindow = computeWindow(workouts, loggedIds, rolling14Start, rolling7Start);

      rollingCurrent.completed += curWindow.completed;
      rollingCurrent.available += curWindow.available;
      rollingPrevious.completed += prevWindow.completed;
      rollingPrevious.available += prevWindow.available;

      if (e.startDate < earliestEnrollment) {
        earliestEnrollment = e.startDate;
      }

      const userLastLog =
        e.user.workoutLogs.length > 0
          ? e.user.workoutLogs.reduce((latest, l) => (l.date > latest.date ? l : latest))
          : null;

      if (userLastLog && (!lastActivityDate || userLastLog.date > lastActivityDate)) {
        lastActivityDate = userLastLog.date;
      }

      return {
        planId: e.trainingPlan.id,
        planName: e.trainingPlan.name,
        enrollmentStatus: PLAN_ENROLLMENT_STATUS_MAP[e.status],
        enrolledDate: e.startDate,
        completed,
        available,
        planned,
      };
    });

    const curRate =
      rollingCurrent.available > 0 ? rollingCurrent.completed / rollingCurrent.available : 0;
    const prevRate =
      rollingPrevious.available > 0 ? rollingPrevious.completed / rollingPrevious.available : 0;
    const processStatus = computeProcessStatus(curRate, prevRate);

    const allLoggedIds = new Set(
      enrollments.flatMap((e) => e.user.workoutLogs.map((l) => l.workoutId)),
    );

    let nextWorkout: { title: string; date: Date; planName: string } | null = null;

    for (const e of enrollments) {
      for (const w of e.trainingPlan.workouts) {
        if (!w.scheduledDate || w.scheduledDate.getTime() <= now.getTime()) {
          continue;
        }

        if (allLoggedIds.has(w.id)) {
          continue;
        }

        if (!nextWorkout || w.scheduledDate.getTime() < nextWorkout.date.getTime()) {
          nextWorkout = { title: w.title, date: w.scheduledDate, planName: e.trainingPlan.name };
        }
      }
    }

    const rolling28Start = new Date(now.getTime() - 28 * 86_400_000);
    const window28 = enrollments.reduce(
      (acc, e) => {
        const loggedIds = new Set(e.user.workoutLogs.map((l) => l.workoutId));
        const w = computeWindow(e.trainingPlan.workouts, loggedIds, rolling28Start, now);

        acc.completed += w.completed;
        acc.available += w.available;

        return acc;
      },
      { completed: 0, available: 0 },
    );
    const adherenceRate4w = window28.available > 0 ? window28.completed / window28.available : 0;

    const scheduledByDay = new Map<string, { id: string; logged: boolean }[]>();

    for (const e of enrollments) {
      for (const w of e.trainingPlan.workouts) {
        if (!w.scheduledDate || w.scheduledDate.getTime() > now.getTime()) {
          continue;
        }

        const dayKey = startOfDayInTz(w.scheduledDate, tz).toISOString();
        const dayList = scheduledByDay.get(dayKey) ?? [];

        dayList.push({ id: w.id, logged: allLoggedIds.has(w.id) });
        scheduledByDay.set(dayKey, dayList);
      }
    }

    const sortedDays = [...scheduledByDay.entries()].sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime(),
    );

    let currentStreak = 0;

    for (const [, workouts] of sortedDays) {
      const allDone = workouts.every((w) => w.logged);

      if (allDone) {
        currentStreak++;
      } else {
        break;
      }
    }

    const weekAggregate = planDiscipline.reduce(
      (acc, p) => ({
        available: acc.available + p.available,
        completed: acc.completed + p.completed,
      }),
      { available: 0, completed: 0 },
    );
    const missedThisWeek = weekAggregate.available - weekAggregate.completed;

    const allLogs = enrollments.flatMap((e) => {
      const planWorkoutMap = new Map(e.trainingPlan.workouts.map((w) => [w.id, w]));

      return e.user.workoutLogs
        .filter((l) => planWorkoutMap.has(l.workoutId))
        .map((l) => {
          const workout = planWorkoutMap.get(l.workoutId);

          return {
            id: l.id,
            title: workout?.title ?? "Workout",
            date: l.date,
            planName: e.trainingPlan.name,
          };
        });
    });

    const seenLogIds = new Set<string>();
    const recentWorkouts = allLogs
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .filter((l) => {
        if (seenLogIds.has(l.id)) {
          return false;
        }

        seenLogIds.add(l.id);

        return true;
      })
      .slice(0, 7);

    const healthStatus = athlete.athleteProfile
      ? HEALTH_STATUS_MAP[athlete.athleteProfile.healthStatus]
      : HealthStatus.HEALTHY;

    const daysSinceLastActivity = lastActivityDate
      ? daysBetweenInTz(new Date(lastActivityDate), today, tz)
      : null;

    return {
      userId: athleteUserId,
      name: athlete.name,
      email: athlete.email,
      image: athlete.image,
      healthStatus,
      processStatus,
      planDiscipline,
      recentWorkouts,
      actionItems: actionItems.map((item) => ({
        id: item.id,
        type: ACTION_ITEM_TYPE_MAP[item.type],
        severity: ACTION_ITEM_SEVERITY_MAP[item.severity],
        message: item.message,
        createdAt: item.createdAt,
      })),
      nextWorkout,
      consistency: { adherenceRate4w, currentStreak, missedThisWeek },
      enrolledSince: earliestEnrollment,
      lastActivityDate,
      daysSinceLastActivity,
    };
  },
};
