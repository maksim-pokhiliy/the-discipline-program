import type { Prisma } from "@prisma/client";

const baseEnrollmentInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      workoutLogs: {
        select: { id: true, workoutId: true, date: true },
        orderBy: { date: "desc" as const },
      },
      athleteProfile: {
        select: { healthStatus: true },
      },
    },
  },
  trainingPlan: {
    select: {
      id: true,
      name: true,
      workouts: {
        select: {
          id: true,
          scheduledDate: true,
          createdAt: true,
          title: true,
        },
        orderBy: [{ scheduledDate: "asc" as const }, { createdAt: "asc" as const }],
      },
    },
  },
} satisfies Prisma.PlanEnrollmentInclude;

export const createEnrollmentInclude = (coachId: string) =>
  ({
    ...baseEnrollmentInclude,
    user: {
      select: {
        ...baseEnrollmentInclude.user.select,
        workoutLogs: {
          ...baseEnrollmentInclude.user.select.workoutLogs,
          where: { workout: { plan: { coachId } } },
        },
      },
    },
  }) satisfies Prisma.PlanEnrollmentInclude;

export type EnrollmentWithData = Prisma.PlanEnrollmentGetPayload<{
  include: typeof baseEnrollmentInclude;
}>;
