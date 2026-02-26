import type { Prisma } from "@prisma/client";

export const enrollmentInclude = {
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
        where: { deletedAt: null },
        select: {
          id: true,
          dayOrder: true,
          title: true,
          blocks: {
            select: {
              categoryId: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { dayOrder: "asc" as const },
      },
    },
  },
} as const;

export type EnrollmentWithData = Prisma.PlanEnrollmentGetPayload<{
  include: typeof enrollmentInclude;
}>;
