import { randomInt } from "node:crypto";

import { DayOfWeek } from "@prisma/client";

import { UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import {
  cleanupRaw,
  createTestCoach,
  createTestLegacyIdentity,
  createTestPlan,
  createTestUser,
} from "../../../test/helpers";
import {
  createTestDay,
  createTestLabel,
  createTestSession,
  createTestWeek,
} from "../../../test/schedule-helpers";
import { LEGACY_PLAN_INDIVIDUAL } from "../../mobile-compat/legacy-catalogs";

const FIXTURE_LEVEL_FLOOR = 700_000;
const FIXTURE_LEVEL_CEILING = 800_000;
const FIXTURE_USER_FLOOR = 100_000;
const FIXTURE_USER_CEILING = 900_000;
const SECOND_SESSION_ORDER = 1;

export const mintFixtureLevelId = (): number =>
  randomInt(FIXTURE_LEVEL_FLOOR, FIXTURE_LEVEL_CEILING);

export const mintFixtureLegacyUserId = (): number =>
  randomInt(FIXTURE_USER_FLOOR, FIXTURE_USER_CEILING);

export const utcDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

export type PublishFixture = {
  coachUserId: string;
  planId: string;
  mondayDayId: string;
  addMondaySession: () => Promise<void>;
};

export type FixtureTracker = {
  userIds: string[];
  planIds: string[];
  labelIds: string[];
  connectionIds: string[];
};

export const createFixtureTracker = (): FixtureTracker => ({
  userIds: [],
  planIds: [],
  labelIds: [],
  connectionIds: [],
});

export const cleanupFixtures = async (tracker: FixtureTracker): Promise<void> => {
  await cleanupRaw.mobileConnection.deleteMany({ where: { id: { in: tracker.connectionIds } } });
  await cleanupRaw.trainingPlan.deleteMany({ where: { id: { in: tracker.planIds } } });
  await cleanupRaw.label.deleteMany({ where: { id: { in: tracker.labelIds } } });
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
  legacyUserId: number,
): Promise<string> => {
  const athleteId = await createTrackedUser(tracker);

  await createTestLegacyIdentity(athleteId, { legacyUserId, legacyPlanId: LEGACY_PLAN_INDIVIDUAL });

  return athleteId;
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
  await createTestSession(mondayDay.id);
  await createTestSession(tuesdayDay.id);

  return {
    coachUserId: coach.user.id,
    planId: plan.id,
    mondayDayId: mondayDay.id,
    addMondaySession: async () => {
      await createTestSession(mondayDay.id, { order: SECOND_SESSION_ORDER });
    },
  };
};
