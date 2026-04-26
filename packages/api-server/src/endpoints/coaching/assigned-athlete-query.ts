import type { Prisma } from "@prisma/client";

import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import {
  PLAN_ENROLLMENT_STATUS_TO_PRISMA_MAP,
  TRAINING_PLAN_STATUS_TO_PRISMA_MAP,
} from "../../mappers/lms";

const baseAssignedAthleteInclude = {
  athlete: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      password: true,
      athleteProfile: { select: { healthStatus: true } },
      planEnrollments: {
        select: {
          id: true,
          status: true,
          startedOnDate: true,
          plan: {
            select: {
              id: true,
              name: true,
              creatorId: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CoachAthleteAssignmentInclude;

export const buildAssignedAthleteInclude = (coachUserId: string) =>
  ({
    ...baseAssignedAthleteInclude,
    athlete: {
      select: {
        ...baseAssignedAthleteInclude.athlete.select,
        planEnrollments: {
          ...baseAssignedAthleteInclude.athlete.select.planEnrollments,
          where: {
            status: PLAN_ENROLLMENT_STATUS_TO_PRISMA_MAP[PlanEnrollmentStatus.ACTIVE],
            plan: {
              OR: [
                { creatorId: coachUserId },
                { coachAssignments: { some: { coachId: coachUserId } } },
              ],
              status: TRAINING_PLAN_STATUS_TO_PRISMA_MAP[TrainingPlanStatus.ACTIVE],
            },
          },
        },
      },
    },
  }) satisfies Prisma.CoachAthleteAssignmentInclude;

export type AssignedAthleteWithData = Prisma.CoachAthleteAssignmentGetPayload<{
  include: typeof baseAssignedAthleteInclude;
}>;
