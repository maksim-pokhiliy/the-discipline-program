import { type Prisma, EnrollmentStatus as PrismaEnrollmentStatus } from "@prisma/client";

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

const rosterAthleteInclude = {
  athlete: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      password: true,
      athleteProfile: {
        select: {
          healthStatus: true,
          healthNote: true,
          gender: true,
          heightCm: true,
          weightKg: true,
        },
      },
      planEnrollmentsAsAthlete: {
        where: { status: { not: PrismaEnrollmentStatus.REMOVED }, deletedAt: null },
        select: {
          planId: true,
          status: true,
          boardedAt: true,
          plan: { select: { name: true } },
        },
        orderBy: { plan: { name: "asc" } },
      },
    },
  },
} satisfies Prisma.CoachAthleteAssignmentInclude;

export const buildRosterAthleteInclude = () => rosterAthleteInclude;

export type RosterAthleteWithData = Prisma.CoachAthleteAssignmentGetPayload<{
  include: typeof rosterAthleteInclude;
}>;
