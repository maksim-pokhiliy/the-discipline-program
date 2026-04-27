import type { WorkoutSession } from "@prisma/client";

import {
  cleanup,
  cleanupRaw,
  createTestAssignment,
  createTestCoach,
  createTestEnrollment,
  createTestPlan,
  createTestUser,
  createTestWorkoutSession,
} from "../../test/helpers";

export type AthleteWithSessions = {
  athleteId: string;
  enrollmentId: string;
  sessions: WorkoutSession[];
  toCleanup: { table: string; id: string }[];
};

export const createAthleteWithSessions = async (
  coachId: string,
  options: {
    sessionsCount?: number;
    completionRatios?: number[];
    enrollmentId?: string;
    weekOffsets?: number[];
  } = {},
): Promise<AthleteWithSessions> => {
  const { sessionsCount = 3, completionRatios, weekOffsets } = options;

  const toCleanup: { table: string; id: string }[] = [];

  const athleteUser = await createTestUser();

  toCleanup.push({ table: "user", id: athleteUser.id });

  const assignment = await createTestAssignment(coachId, athleteUser.id);

  toCleanup.push({ table: "coachAthleteAssignment", id: assignment.id });

  let enrollmentId = options.enrollmentId;

  if (!enrollmentId) {
    const coachUser = await cleanupRaw.coachProfile.findUnique({ where: { id: coachId } });
    const creatorId = coachUser?.userId ?? athleteUser.id;
    const plan = await createTestPlan(creatorId);

    toCleanup.push({ table: "trainingPlan", id: plan.id });

    const enrollment = await createTestEnrollment(plan.id, athleteUser.id);

    enrollmentId = enrollment.id;

    toCleanup.push({ table: "planEnrollment", id: enrollmentId });
  }

  const MS_PER_DAY = 86_400_000;
  const sessions: WorkoutSession[] = [];

  for (let i = 0; i < sessionsCount; i++) {
    const offsetDays = weekOffsets?.[i] ?? -i;
    const sessionDate = new Date(Date.now() + offsetDays * MS_PER_DAY);
    const completionRatio = completionRatios?.[i] ?? 1.0;

    const session = await createTestWorkoutSession({
      userId: athleteUser.id,
      enrollmentId,
      overrides: {
        startedAt: sessionDate,
        completedAt: sessionDate,
        completionRatio,
      },
    });

    toCleanup.push({ table: "workoutSession", id: session.id });
    sessions.push(session);
  }

  return {
    athleteId: athleteUser.id,
    enrollmentId,
    sessions,
    toCleanup,
  };
};

export const createCoachWithAthleteSessions = async (
  options: {
    sessionsCount?: number;
    completionRatios?: number[];
    weekOffsets?: number[];
  } = {},
): Promise<{
  coachId: string;
  coachProfileId: string;
  athlete: AthleteWithSessions;
  toCleanup: { table: string; id: string }[];
}> => {
  const toCleanup: { table: string; id: string }[] = [];

  const coach = await createTestCoach();

  toCleanup.push(
    { table: "coachProfile", id: coach.profile.id },
    { table: "user", id: coach.user.id },
  );

  const athlete = await createAthleteWithSessions(coach.profile.id, options);

  toCleanup.push(...athlete.toCleanup);

  return {
    coachId: coach.user.id,
    coachProfileId: coach.profile.id,
    athlete,
    toCleanup,
  };
};

export { cleanup };
