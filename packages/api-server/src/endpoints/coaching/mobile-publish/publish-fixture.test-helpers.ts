import { DayOfWeek } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import {
  cleanupRaw,
  createTestCoach,
  createTestExercise,
  createTestLegacyIdentity,
  createTestPlan,
  createTestUser,
} from "../../../test/helpers";
import {
  createTestDay,
  createTestEnrollment,
  createTestLabel,
  createTestSession,
  createTestWeek,
} from "../../../test/schedule-helpers";
import { toInputJson } from "../../../utils/to-input-json";
import { LEGACY_PLAN_INDIVIDUAL } from "../../mobile-compat/legacy-catalogs";

const SECOND_SESSION_ORDER = 1;
const EXERCISE_SETS = 5;
const EXERCISE_REPS = 3;

const addExerciseBlock = async (tracker: FixtureTracker, sessionId: string): Promise<string> => {
  const exercise = await createTestExercise();

  tracker.exerciseIds.push(exercise.id);

  const block = await cleanupRaw.block.create({ data: { sessionId, order: 0 } });
  const schema = await cleanupRaw.schema.create({ data: { blockId: block.id, order: 0 } });

  await cleanupRaw.schemaRow.create({
    data: {
      schemaId: schema.id,
      exerciseId: exercise.id,
      order: 0,
      sets: EXERCISE_SETS,
      reps: toInputJson({ kind: "count", value: EXERCISE_REPS }),
    },
  });

  return exercise.canonicalName;
};

export const utcDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

export type PublishFixture = {
  coachUserId: string;
  planId: string;
  mondayDayId: string;
  addMondaySession: () => Promise<void>;
  addMondayExercise: () => Promise<string>;
};

export type FixtureTracker = {
  userIds: string[];
  planIds: string[];
  labelIds: string[];
  connectionIds: string[];
  exerciseIds: string[];
};

export const createFixtureTracker = (): FixtureTracker => ({
  userIds: [],
  planIds: [],
  labelIds: [],
  connectionIds: [],
  exerciseIds: [],
});

export const cleanupFixtures = async (tracker: FixtureTracker): Promise<void> => {
  await cleanupRaw.mobileConnection.deleteMany({ where: { id: { in: tracker.connectionIds } } });
  await cleanupRaw.trainingPlan.deleteMany({ where: { id: { in: tracker.planIds } } });
  await cleanupRaw.label.deleteMany({ where: { id: { in: tracker.labelIds } } });
  await cleanupRaw.exercise.deleteMany({ where: { id: { in: tracker.exerciseIds } } });
  await cleanupRaw.user.deleteMany({ where: { id: { in: tracker.userIds } } });
};

export const createTrackedUser = async (
  tracker: FixtureTracker,
  role: UserRole = UserRole.ATHLETE,
): Promise<string> => {
  const user = await createTestUser({ role: ROLE_TO_PRISMA_MAP[role] });

  tracker.userIds.push(user.id);

  return user.id;
};

export const createTrackedIndividualAthlete = async (
  tracker: FixtureTracker,
  plan: { planId: string; coachUserId: string },
): Promise<{ athleteId: string; legacyUserId: number }> => {
  const athleteId = await createTrackedUser(tracker);
  const identity = await createTestLegacyIdentity(athleteId, {
    legacyPlanId: LEGACY_PLAN_INDIVIDUAL,
  });

  await createTestEnrollment(plan.planId, athleteId, plan.coachUserId);

  return { athleteId, legacyUserId: identity.legacyUserId };
};

export const createTrackedCoach = async (tracker: FixtureTracker) => {
  const coach = await createTestCoach();

  tracker.userIds.push(coach.user.id);

  return coach;
};

export const createPublishFixture = async (
  tracker: FixtureTracker,
  monday: string,
): Promise<PublishFixture> => {
  const coach = await createTrackedCoach(tracker);
  const plan = await createTestPlan(coach.user.id);

  tracker.planIds.push(plan.id);

  const { label: restLabel } = await createTestLabel({ rest: true });

  tracker.labelIds.push(restLabel.id);

  const { week } = await createTestWeek(plan.id, { startDate: utcDate(monday) });
  const { day: mondayDay } = await createTestDay(week.id, { dayOfWeek: DayOfWeek.MONDAY });
  const { day: tuesdayDay } = await createTestDay(week.id, { dayOfWeek: DayOfWeek.TUESDAY });

  await createTestDay(week.id, { dayOfWeek: DayOfWeek.SUNDAY, labelId: restLabel.id });
  const { session: mondaySession } = await createTestSession(mondayDay.id);

  await createTestSession(tuesdayDay.id);

  return {
    coachUserId: coach.user.id,
    planId: plan.id,
    mondayDayId: mondayDay.id,
    addMondaySession: async () => {
      await createTestSession(mondayDay.id, { order: SECOND_SESSION_ORDER });
    },
    addMondayExercise: () => addExerciseBlock(tracker, mondaySession.id),
  };
};
