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
        orderBy: { date: "desc" },
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
          scheduledDate: true,
          createdAt: true,
          title: true,
        },
        orderBy: [{ scheduledDate: "asc" }, { createdAt: "asc" }],
      },
    },
  },
} satisfies Prisma.PlanEnrollmentInclude;

export type EnrollmentWithData = Prisma.PlanEnrollmentGetPayload<{
  include: typeof enrollmentInclude;
}>;
