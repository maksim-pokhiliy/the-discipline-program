import { type Prisma } from "@prisma/client";

import {
  type Last7Day,
  type NextWorkout,
  type PlanDiscipline,
  type RecentWorkout,
} from "@repo/contracts/coaching/coach-athletes";
import { type ProcessStatus, type TodayStatus } from "@repo/contracts/coaching/coach-dashboard";

const labelSelect = { select: { name: true, rest: true } } as const;

export const scheduleInclude = {
  plan: {
    include: {
      weeks: {
        include: {
          days: {
            include: {
              label: labelSelect,
              sessions: { include: { label: labelSelect } },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.PlanEnrollmentInclude;

export type WindowedEnrollment = Prisma.PlanEnrollmentGetPayload<{
  include: typeof scheduleInclude;
}>;

export type WindowedWeek = WindowedEnrollment["plan"]["weeks"][number];
export type WindowedDay = WindowedWeek["days"][number];
export type WindowedSession = WindowedDay["sessions"][number];

export type PerformedEntry = { startedAt: Date; completedAt: Date | null };

export type PerformedByKey = Map<string, PerformedEntry>;

export const buildPerformedKey = (userId: string, sessionId: string): string =>
  `${userId}:${sessionId}`;

export type AthleteMetricsResult = {
  primaryPlanId: string | null;
  primaryPlanName: string | null;
  todayStatus: TodayStatus;
  todayWorkoutTitle: string | null;
  missedCount: number;
  missedThisWeek: number;
  consecutiveMissedDays: number;
  lastActivityDate: Date | null;
  daysSinceLastActivity: number | null;
  adherenceRate: number;
  processStatus: ProcessStatus;
  engagementPct: number;
  weeklyDelta: number | null;
  planDiscipline: PlanDiscipline[];
  recentWorkouts: RecentWorkout[];
  nextWorkout: NextWorkout | null;
  last7Days: Last7Day[];
  currentWeek: number | null;
  totalWeeks: number;
  currentStreak: number;
};
