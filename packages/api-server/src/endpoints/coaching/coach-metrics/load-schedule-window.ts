import { ADHERENCE_WINDOW_DAYS } from "@repo/contracts/coaching/coach-dashboard";
import { EnrollmentStatus } from "@repo/contracts/lms";

import { prisma } from "../../../db/client";
import { ENROLLMENT_STATUS_TO_PRISMA_MAP } from "../../../mappers/lms";
import { addDaysInTz, endOfWeekInTz, startOfTodayInTz } from "../../../utils/date-helpers";

import {
  buildPerformedKey,
  type PerformedByKey,
  scheduleInclude,
  type WindowedEnrollment,
} from "./coach-metrics.types";

type LoadScheduleWindowArgs = {
  athleteIds: string[];
  tz: string;
  now: Date;
};

export type ScheduleWindow = {
  enrollmentsByAthlete: Map<string, WindowedEnrollment[]>;
  performedByKey: PerformedByKey;
  weekCountByPlan: Map<string, number>;
  firstWeekStartByPlan: Map<string, Date>;
};

const emptyWindow = (): ScheduleWindow => ({
  enrollmentsByAthlete: new Map(),
  performedByKey: new Map(),
  weekCountByPlan: new Map(),
  firstWeekStartByPlan: new Map(),
});

const groupEnrollments = (enrollments: WindowedEnrollment[]): Map<string, WindowedEnrollment[]> => {
  const byAthlete = new Map<string, WindowedEnrollment[]>();

  for (const enrollment of enrollments) {
    const existing = byAthlete.get(enrollment.athleteId);

    if (existing) {
      existing.push(enrollment);
    } else {
      byAthlete.set(enrollment.athleteId, [enrollment]);
    }
  }

  return byAthlete;
};

export const loadScheduleWindow = async ({
  athleteIds,
  tz,
  now,
}: LoadScheduleWindowArgs): Promise<ScheduleWindow> => {
  if (athleteIds.length === 0) {
    return emptyWindow();
  }

  const windowStart = addDaysInTz(startOfTodayInTz(tz), -ADHERENCE_WINDOW_DAYS, tz);
  const windowEnd = endOfWeekInTz(now, tz);
  const activeStatus = ENROLLMENT_STATUS_TO_PRISMA_MAP[EnrollmentStatus.ACTIVE];

  const enrollments = await prisma.planEnrollment.findMany({
    where: {
      athleteId: { in: athleteIds },
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
            where: { startDate: { gte: windowStart, lte: windowEnd } },
          },
        },
      },
    },
  });

  const planIds = [...new Set(enrollments.map((enrollment) => enrollment.planId))];

  const [performed, weekCounts] = await Promise.all([
    prisma.performedSession.findMany({
      where: {
        userId: { in: athleteIds },
        session: { day: { week: { startDate: { gte: windowStart, lte: windowEnd } } } },
      },
      select: { userId: true, sessionId: true, startedAt: true, completedAt: true },
    }),
    prisma.week.groupBy({
      by: ["planId"],
      where: { planId: { in: planIds } },
      _count: { id: true },
      _min: { startDate: true },
    }),
  ]);

  const performedByKey: PerformedByKey = new Map();

  for (const entry of performed) {
    performedByKey.set(buildPerformedKey(entry.userId, entry.sessionId), {
      startedAt: entry.startedAt,
      completedAt: entry.completedAt,
    });
  }

  const weekCountByPlan = new Map<string, number>();
  const firstWeekStartByPlan = new Map<string, Date>();

  for (const row of weekCounts) {
    weekCountByPlan.set(row.planId, row._count.id);

    if (row._min.startDate) {
      firstWeekStartByPlan.set(row.planId, row._min.startDate);
    }
  }

  return {
    enrollmentsByAthlete: groupEnrollments(enrollments),
    performedByKey,
    weekCountByPlan,
    firstWeekStartByPlan,
  };
};
