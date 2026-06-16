import { type NextWorkout } from "@repo/contracts/coaching/coach-athletes";
import { EnrollmentStatus } from "@repo/contracts/lms";

import { prisma } from "../../../db/client";
import { ENROLLMENT_STATUS_TO_PRISMA_MAP } from "../../../mappers/lms";
import {
  createStartOfDayCache,
  startOfTodayInTz,
  startOfWeekInTz,
} from "../../../utils/date-helpers";

import { scheduleInclude } from "./coach-metrics.types";
import { findNextWorkout } from "./plan-data";
import { buildScheduledDays } from "./scheduled-day";

type FindNextWorkoutForAthleteArgs = {
  athleteId: string;
  tz: string;
  now: Date;
};

export const findNextWorkoutForAthlete = async ({
  athleteId,
  tz,
  now,
}: FindNextWorkoutForAthleteArgs): Promise<NextWorkout | null> => {
  const weekStart = startOfWeekInTz(now, tz);
  const activeStatus = ENROLLMENT_STATUS_TO_PRISMA_MAP[EnrollmentStatus.ACTIVE];

  const enrollments = await prisma.planEnrollment.findMany({
    where: {
      athleteId,
      status: activeStatus,
      deletedAt: null,
      plan: { deletedAt: null },
    },
    include: {
      ...scheduleInclude,
      plan: {
        include: {
          ...scheduleInclude.plan.include,
          weeks: {
            ...scheduleInclude.plan.include.weeks,
            where: { startDate: { gte: weekStart } },
          },
        },
      },
    },
  });

  const startOfDayCache = createStartOfDayCache(tz);
  const startOfToday = startOfDayCache(startOfTodayInTz(tz));
  const scheduledDays = buildScheduledDays(enrollments, tz, startOfDayCache);

  return findNextWorkout(scheduledDays, startOfToday);
};
