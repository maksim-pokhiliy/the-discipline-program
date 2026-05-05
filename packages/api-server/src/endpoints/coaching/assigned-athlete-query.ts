import type { Prisma } from "@prisma/client";

const baseAssignedAthleteInclude = {
  athlete: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      password: true,
      athleteProfile: { select: { healthStatus: true } },
    },
  },
} satisfies Prisma.CoachAthleteAssignmentInclude;

export const buildAssignedAthleteInclude = (_coachUserId: string) => baseAssignedAthleteInclude;

export type AssignedAthleteWithData = Prisma.CoachAthleteAssignmentGetPayload<{
  include: typeof baseAssignedAthleteInclude;
}>;
