import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { ActionItemStatus } from "@repo/contracts/coaching/coach-action-item";
import type {
  AthleteConsistency,
  CoachAthleteDetail,
  NextWorkout,
  PlanDiscipline,
  RecentWorkout,
} from "@repo/contracts/coaching/coach-athletes";
import { type ProcessStatus } from "@repo/contracts/coaching/coach-dashboard";
import { ForbiddenError } from "@repo/errors";

import { resolveCoachId, verifyAthleteBelongsToCoach } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import {
  ACTION_ITEM_SEVERITY_MAP,
  ACTION_ITEM_STATUS_TO_PRISMA_MAP,
  ACTION_ITEM_TYPE_MAP,
  HEALTH_STATUS_MAP,
} from "../../../mappers/coaching";
import { PLAN_ENROLLMENT_STATUS_MAP } from "../../../mappers/lms";
import { findOrThrow } from "../../../utils";
import {
  createStartOfDayCache,
  DAYS_IN_WEEK,
  daysBetweenInTz,
  FOUR_WEEKS,
  MS_PER_DAY,
  startOfTodayInTz,
  startOfWeekInTz,
  TWO_WEEKS,
} from "../../../utils/date-helpers";
import {
  type AssignedAthleteWithData,
  buildAssignedAthleteInclude,
} from "../assigned-athlete-query";
import { computeAdherenceWindow, computeProcessStatus } from "../dashboard-computations";

type AthletePayload = AssignedAthleteWithData["athlete"];
type Enrollments = AthletePayload["planEnrollments"];
type Logs = AthletePayload["workoutLogs"];

type PlanDisciplineResult = {
  planDiscipline: PlanDiscipline[];
  processStatus: ProcessStatus;
  earliestEnrollment: Date;
  lastActivityDate: Date | null;
};

const computePlanDiscipline = (
  enrollments: Enrollments,
  logs: Logs,
  tz: string,
): PlanDisciplineResult => {
  const now = new Date();
  const today = startOfTodayInTz(tz);
  const weekStart = startOfWeekInTz(today, tz);
  const nextWeekStart = new Date(weekStart.getTime() + DAYS_IN_WEEK * MS_PER_DAY);
  const rolling7Start = new Date(now.getTime() - DAYS_IN_WEEK * MS_PER_DAY);
  const rolling14Start = new Date(now.getTime() - TWO_WEEKS * MS_PER_DAY);

  const firstEnrollment = enrollments[0];

  let earliestEnrollment = firstEnrollment ? firstEnrollment.startDate : new Date();
  const rollingCurrent = { completed: 0, available: 0 };
  const rollingPrevious = { completed: 0, available: 0 };

  const loggedIds = new Set(logs.map((l) => l.workoutId));

  const planDiscipline = enrollments.map((e) => {
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

  const lastLog = logs[0] ?? null;
  const lastActivityDate = lastLog?.date ?? null;

  const curRate =
    rollingCurrent.available > 0 ? rollingCurrent.completed / rollingCurrent.available : 0;
  const prevRate =
    rollingPrevious.available > 0 ? rollingPrevious.completed / rollingPrevious.available : 0;
  const processStatus = computeProcessStatus(curRate, prevRate);

  return { planDiscipline, processStatus, earliestEnrollment, lastActivityDate };
};

const findNextWorkout = (enrollments: Enrollments, logs: Logs): NextWorkout | null => {
  const now = new Date();
  const loggedIds = new Set(logs.map((l) => l.workoutId));

  let result: NextWorkout | null = null;

  for (const e of enrollments) {
    for (const w of e.trainingPlan.workouts) {
      if (!w.scheduledDate || w.scheduledDate.getTime() <= now.getTime()) {
        continue;
      }

      if (loggedIds.has(w.id)) {
        continue;
      }

      if (!result || w.scheduledDate.getTime() < result.date.getTime()) {
        result = { title: w.title, date: w.scheduledDate, planName: e.trainingPlan.name };
      }
    }
  }

  return result;
};

const computeConsistencyMetrics = (
  enrollments: Enrollments,
  logs: Logs,
  planDiscipline: PlanDiscipline[],
  tz: string,
): AthleteConsistency => {
  const now = new Date();
  const loggedIds = new Set(logs.map((l) => l.workoutId));

  const rolling28Start = new Date(now.getTime() - FOUR_WEEKS * MS_PER_DAY);
  const window28 = enrollments.reduce(
    (acc, e) => {
      const w = computeAdherenceWindow(e.trainingPlan.workouts, loggedIds, rolling28Start, now);

      acc.completed += w.completed;
      acc.available += w.available;

      return acc;
    },
    { completed: 0, available: 0 },
  );
  const adherenceRate4w = window28.available > 0 ? window28.completed / window28.available : 0;

  const scheduledByDay = new Map<string, { id: string; logged: boolean }[]>();
  const startOfDay = createStartOfDayCache(tz);

  for (const e of enrollments) {
    for (const w of e.trainingPlan.workouts) {
      if (!w.scheduledDate || w.scheduledDate.getTime() > now.getTime()) {
        continue;
      }

      const dayKey = startOfDay(w.scheduledDate).toISOString();
      const dayList = scheduledByDay.get(dayKey) ?? [];

      dayList.push({ id: w.id, logged: loggedIds.has(w.id) });
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

  return { adherenceRate4w, currentStreak, missedThisWeek };
};

const computeRecentWorkouts = (enrollments: Enrollments, logs: Logs): RecentWorkout[] => {
  const planWorkoutIndex = new Map<string, { title: string; planName: string }>();

  for (const e of enrollments) {
    for (const w of e.trainingPlan.workouts) {
      planWorkoutIndex.set(w.id, { title: w.title, planName: e.trainingPlan.name });
    }
  }

  const recent: RecentWorkout[] = [];

  for (const l of logs) {
    const meta = planWorkoutIndex.get(l.workoutId);

    if (!meta) {
      continue;
    }

    recent.push({
      id: l.id,
      title: meta.title,
      date: l.date,
      planName: meta.planName,
    });
  }

  return recent.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 7);
};

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

  const [assignment, actionItems] = await Promise.all([
    prisma.coachAthleteAssignment.findUnique({
      where: { coachId_athleteId: { coachId, athleteId: athleteUserId } },
      include: buildAssignedAthleteInclude(coachId),
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

  if (!assignment) {
    throw new ForbiddenError("Athlete does not belong to this coach");
  }

  const athlete = assignment.athlete;
  const enrollments = athlete.planEnrollments;
  const logs = athlete.workoutLogs;

  const healthStatus = athlete.athleteProfile
    ? HEALTH_STATUS_MAP[athlete.athleteProfile.healthStatus]
    : HealthStatus.HEALTHY;

  const today = startOfTodayInTz(tz);

  const mappedActionItems = actionItems.map((item) => ({
    id: item.id,
    type: ACTION_ITEM_TYPE_MAP[item.type],
    severity: ACTION_ITEM_SEVERITY_MAP[item.severity],
    message: item.message,
    createdAt: item.createdAt,
  }));

  if (enrollments.length === 0) {
    return {
      userId: athleteUserId,
      name: athlete.name,
      email: athlete.email,
      image: athlete.image,
      healthStatus,
      processStatus: computeProcessStatus(0, 0),
      planDiscipline: [],
      recentWorkouts: [],
      actionItems: mappedActionItems,
      nextWorkout: null,
      consistency: { adherenceRate4w: 0, currentStreak: 0, missedThisWeek: 0 },
      enrolledSince: assignment.createdAt,
      lastActivityDate: null,
      daysSinceLastActivity: null,
    };
  }

  const { planDiscipline, processStatus, earliestEnrollment, lastActivityDate } =
    computePlanDiscipline(enrollments, logs, tz);

  const nextWorkout = findNextWorkout(enrollments, logs);
  const consistency = computeConsistencyMetrics(enrollments, logs, planDiscipline, tz);
  const recentWorkouts = computeRecentWorkouts(enrollments, logs);

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
    actionItems: mappedActionItems,
    nextWorkout,
    consistency,
    enrolledSince: earliestEnrollment,
    lastActivityDate,
    daysSinceLastActivity,
  };
};
