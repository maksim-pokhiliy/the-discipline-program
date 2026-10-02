import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { type LegacyShimIdentity } from "@repo/api-routes/legacy-shim";
import { UserRole } from "@repo/contracts/iam/auth";

import { prisma } from "../../../db/client";
import {
  LEGACY_LEVEL_PRO,
  LEGACY_LEVEL_SCALED,
  LEGACY_PLAN_GENERAL,
  LEGACY_ROLE_USER,
} from "../../../test/golden-fixture";
import { createGetProgramApi } from "../../mobile-compat/get-program";

import { linksApi } from "./links";
import { createPublishApi } from "./publish";
import {
  cleanupFixtures,
  createFixtureTracker,
  createPublishFixture,
  createTrackedUser,
  utcDate,
} from "./publish-fixture.test-helpers";

const EXERCISE_WEEK_MONDAY = "2031-06-02";
const DAY_SCOPE_WEEK_MONDAY = "2031-06-09";
const DAY_SCOPE_TUESDAY = "2031-06-10";
const READER_LEGACY_USER_ID = 424_243;

const tracker = createFixtureTracker();
const publishApi = createPublishApi();
const getProgramApi = createGetProgramApi();

describe("publish vertical: what the coach planned is what the app reads", () => {
  let adminUserId = "";

  beforeAll(async () => {
    adminUserId = await createTrackedUser(tracker, UserRole.ADMIN);
  });

  afterAll(async () => {
    await cleanupFixtures(tracker);
  });

  const linkLevel = async (planId: string, legacyLevelId: number): Promise<string> =>
    (await linksApi.createLink(adminUserId, { planId, legacyLevelId })).id;

  it("projects the day's exercises into the stored snapshot and the app's reply", async () => {
    const fixture = await createPublishFixture(tracker, EXERCISE_WEEK_MONDAY);
    const exerciseName = await fixture.addMondayExercise();
    const linkId = await linkLevel(fixture.planId, LEGACY_LEVEL_PRO);

    await publishApi.publish(adminUserId, {
      linkId,
      startDate: EXERCISE_WEEK_MONDAY,
      scope: "week",
    });

    const stored = await prisma.mobilePublishedDay.findUniqueOrThrow({
      where: {
        linkId_scheduledDate: { linkId, scheduledDate: utcDate(EXERCISE_WEEK_MONDAY) },
      },
      select: { dailyProgram: true },
    });
    const identity: LegacyShimIdentity = {
      userId: "exercise-reader",
      legacyUserId: READER_LEGACY_USER_ID,
      legacyRoleId: LEGACY_ROLE_USER,
      legacyPlanId: LEGACY_PLAN_GENERAL,
      legacyLevelId: LEGACY_LEVEL_PRO,
    };
    const served = await getProgramApi.getProgram(
      identity,
      READER_LEGACY_USER_ID,
      EXERCISE_WEEK_MONDAY,
    );

    expect(JSON.stringify(stored.dailyProgram)).toContain(exerciseName);
    expect(served).toMatchObject({ kind: "ok-json", payload: { isRestDay: false } });
    expect(JSON.stringify(served)).toContain(exerciseName);
  });

  it("writes only the requested day for a day-scope publish", async () => {
    const fixture = await createPublishFixture(tracker, DAY_SCOPE_WEEK_MONDAY);
    const linkId = await linkLevel(fixture.planId, LEGACY_LEVEL_SCALED);

    const result = await publishApi.publish(adminUserId, {
      linkId,
      startDate: DAY_SCOPE_WEEK_MONDAY,
      scope: "day",
      dayOfWeek: "TUESDAY",
    });
    const rows = await prisma.mobilePublishedDay.findMany({
      where: { linkId },
      select: { scheduledDate: true },
    });

    expect(result.results.map((day) => [day.scheduledDate, day.action])).toEqual([
      [DAY_SCOPE_TUESDAY, "created"],
    ]);
    expect(rows).toEqual([{ scheduledDate: utcDate(DAY_SCOPE_TUESDAY) }]);
  });
});
