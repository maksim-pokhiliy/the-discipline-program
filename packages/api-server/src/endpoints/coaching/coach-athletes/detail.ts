import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { ActionItemStatus } from "@repo/contracts/coaching/coach-action-item";
import type { CoachAthleteDetail } from "@repo/contracts/coaching/coach-athletes";
import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { NotFoundError } from "@repo/errors";

import { resolveCoachId, verifyAthleteBelongsToCoach } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import {
  ACTION_ITEM_SEVERITY_MAP,
  ACTION_ITEM_STATUS_TO_PRISMA_MAP,
  ACTION_ITEM_TYPE_MAP,
  HEALTH_STATUS_MAP,
  PLAN_ENROLLMENT_STATUS_MAP,
  PLAN_ENROLLMENT_STATUS_TO_PRISMA_MAP,
} from "../../../mappers/enum-maps";
import { findOrThrow } from "../../../utils";
import {
  DAYS_IN_WEEK,
  daysBetweenInTz,
  FOUR_WEEKS,
  MS_PER_DAY,
  startOfDayInTz,
  startOfTodayInTz,
  startOfWeekInTz,
  TWO_WEEKS,
} from "../../../utils/date-helpers";
import { computeAdherenceWindow, computeProcessStatus } from "../dashboard-computations";
import { createEnrollmentInclude } from "../enrollment-query";

export const getAthleteDetail = async (
  coachUserId: string,
  athleteUserId: string,
): Promise<CoachAthleteDetail> => {
  const coachId = await resolveCoachId(coachUserId);

  await verifyAthleteBelongsToCoach(athleteUserId, coachId);

  const { timezone: tz } = await findOrThrow(
    prisma.user.findUnique({ where: { id: coachUserId }, select: { timezone: true } }),
    "User",
  );

  const [athlete, enrollments, actionItems] = await Promise.all([
    findOrThrow(
      prisma.user.findUnique({
        where: { id: athleteUserId },
        select: {
          name: true,
          email: true,
          image: true,
          athleteProfile: { select: { healthStatus: true } },
        },
      }),
      "Athlete",
    ),

    prisma.planEnrollment.findMany({
      where: {
        userId: athleteUserId,
        status: PLAN_ENROLLMENT_STATUS_TO_PRISMA_MAP[PlanEnrollmentStatus.ACTIVE],
        trainingPlan: { coachId },
      },
      include: createEnrollmentInclude(coachId),
      orderBy: { startDate: "asc" },
    }),

    prisma.coachActionItem.findMany({
      where: {
        coachId,
        athleteId: athleteUserId,
        status: ACTION_ITEM_STATUS_TO_PRISMA_MAP[ActionItemStatus.OPEN],
      },
      select: { id: true, type: true, severity: true, message: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const mapActionItems = () =>
    actionItems.map((item) => ({
      id: item.id,
      type: ACTION_ITEM_TYPE_MAP[item.type],
      severity: ACTION_ITEM_SEVERITY_MAP[item.severity],
      message: item.message,
      createdAt: item.createdAt,
    }));

  if (enrollments.length === 0) {
    throw new NotFoundError("No active enrollments found for this athlete", { athleteUserId });
  }

  const now = new Date();
  const today = startOfTodayInTz(tz);
  const weekStart = startOfWeekInTz(today, tz);
  const nextWeekStart = new Date(weekStart.getTime() + DAYS_IN_WEEK * MS_PER_DAY);
  const rolling7Start = new Date(now.getTime() - DAYS_IN_WEEK * MS_PER_DAY);
  const rolling14Start = new Date(now.getTime() - TWO_WEEKS * MS_PER_DAY);

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

    const curWindow = computeAdherenceWindow(workouts, loggedIds, rolling7Start, now);
    const prevWindow = computeAdherenceWindow(workouts, loggedIds, rolling14Start, rolling7Start);

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

  const rolling28Start = new Date(now.getTime() - FOUR_WEEKS * MS_PER_DAY);
  const window28 = enrollments.reduce(
    (acc, e) => {
      const loggedIds = new Set(e.user.workoutLogs.map((l) => l.workoutId));
      const w = computeAdherenceWindow(e.trainingPlan.workouts, loggedIds, rolling28Start, now);

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
    if (workouts.every((w) => w.logged)) {
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
    actionItems: mapActionItems(),
    nextWorkout,
    consistency: { adherenceRate4w, currentStreak, missedThisWeek },
    enrolledSince: earliestEnrollment,
    lastActivityDate,
    daysSinceLastActivity,
  };
};
