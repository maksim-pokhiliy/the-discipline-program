import type { Prisma } from "@prisma/client";

import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";

import { PLAN_ENROLLMENT_STATUS_TO_PRISMA_MAP } from "../../mappers/lms";

const baseAssignedAthleteInclude = {
  athlete: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      athleteProfile: { select: { healthStatus: true } },
      workoutLogs: {
        select: { id: true, workoutId: true, date: true },
        orderBy: { date: "desc" as const },
      },
      planEnrollments: {
        select: {
          id: true,
          status: true,
          startDate: true,
          trainingPlan: {
            select: {
              id: true,
              name: true,
              coachId: true,
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
        },
      },
    },
  },
} satisfies Prisma.CoachAthleteAssignmentInclude;

export const buildAssignedAthleteInclude = (coachId: string) =>
  ({
    ...baseAssignedAthleteInclude,
    athlete: {
      select: {
        ...baseAssignedAthleteInclude.athlete.select,
        workoutLogs: {
          ...baseAssignedAthleteInclude.athlete.select.workoutLogs,
          where: { workout: { plan: { coachId } } },
        },
        planEnrollments: {
          ...baseAssignedAthleteInclude.athlete.select.planEnrollments,
          where: {
            status: PLAN_ENROLLMENT_STATUS_TO_PRISMA_MAP[PlanEnrollmentStatus.ACTIVE],
            trainingPlan: { coachId },
          },
        },
      },
    },
  }) satisfies Prisma.CoachAthleteAssignmentInclude;

export type AssignedAthleteWithData = Prisma.CoachAthleteAssignmentGetPayload<{
  include: typeof baseAssignedAthleteInclude;
}>;
