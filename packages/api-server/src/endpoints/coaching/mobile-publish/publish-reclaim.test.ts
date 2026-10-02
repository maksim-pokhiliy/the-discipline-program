import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { type LegacyShimIdentity } from "@repo/api-routes/legacy-shim";
import { UserRole } from "@repo/contracts/iam/auth";

import { prisma } from "../../../db/client";
import {
  LEGACY_LEVEL_SCALED,
  LEGACY_PLAN_GENERAL,
  LEGACY_ROLE_USER,
} from "../../../test/golden-fixture";
import { createTestEnrollment } from "../../../test/schedule-helpers";
import { createGetProgramApi } from "../../mobile-compat/get-program";
import { LEGACY_PLAN_INDIVIDUAL } from "../../mobile-compat/legacy-catalogs";

import { linksApi } from "./links";
import { createPublishApi } from "./publish";
import {
  cleanupFixtures,
  createFixtureTracker,
  createPublishFixture,
  createTrackedIndividualAthlete,
  createTrackedUser,
  type PublishFixture,
} from "./publish-fixture.test-helpers";

const GENERAL_WEEK_MONDAY = "2031-05-05";
const GENERAL_TUESDAY = "2031-05-06";
const INDIVIDUAL_WEEK_MONDAY = "2031-05-12";
const INDIVIDUAL_TUESDAY = "2031-05-13";
const GENERAL_READER_LEGACY_USER_ID = 424_242;

const tracker = createFixtureTracker();
const publishApi = createPublishApi();
const getProgramApi = createGetProgramApi();

type PlanSide = { fixture: PublishFixture; linkId: string; actorUserId: string };

const loadRows = (linkId: string) =>
  prisma.mobilePublishedDay.findMany({
    where: { linkId },
    orderBy: { scheduledDate: "asc" },
    select: { legacyRowId: true, publishedAt: true },
  });

const publishWeek = (side: PlanSide, startDate: string) =>
  publishApi.publish(side.actorUserId, { linkId: side.linkId, startDate, scope: "week" });

const servedId = async (
  identity: LegacyShimIdentity,
  scheduledDate: string,
): Promise<number | null> => {
  const outcome = await getProgramApi.getProgram(identity, identity.legacyUserId, scheduledDate);

  return outcome.kind === "ok-json" ? outcome.payload.id : null;
};

const expectReclaim = async (
  planA: PlanSide,
  planB: PlanSide,
  startDate: string,
  identity: LegacyShimIdentity,
  probeDate: string,
): Promise<void> => {
  await publishWeek(planA, startDate);
  const firstRowsOfA = await loadRows(planA.linkId);

  await publishWeek(planB, startDate);
  const rowsOfB = await loadRows(planB.linkId);

  expect(await servedId(identity, probeDate)).toBe(rowsOfB[1]?.legacyRowId);

  const reclaim = await publishWeek(planA, startDate);
  const reclaimedRowsOfA = await loadRows(planA.linkId);

  expect(reclaim.results.map((day) => day.action)).toEqual(["updated", "updated", "updated"]);
  expect(reclaimedRowsOfA.map((row) => row.legacyRowId)).toEqual(
    firstRowsOfA.map((row) => row.legacyRowId),
  );
  expect(reclaimedRowsOfA[1]?.publishedAt.getTime()).toBeGreaterThan(
    rowsOfB[1]?.publishedAt.getTime() ?? Number.POSITIVE_INFINITY,
  );
  expect(await servedId(identity, probeDate)).toBe(firstRowsOfA[1]?.legacyRowId);

  const again = await publishWeek(planA, startDate);

  expect(again.results.map((day) => day.action)).toEqual(["skipped", "skipped", "skipped"]);
  expect(await loadRows(planA.linkId)).toEqual(reclaimedRowsOfA);
};

describe("a re-publish takes the day back for its audience", () => {
  const actorTracker = createFixtureTracker();
  let adminUserId = "";

  beforeAll(async () => {
    adminUserId = await createTrackedUser(actorTracker, UserRole.ADMIN);
  });

  afterAll(async () => {
    await cleanupFixtures(tracker);
    await cleanupFixtures(actorTracker);
  });

  it("serves the plan that published a General day last, and an unchanged re-publish reclaims it", async () => {
    const generalSide = async (): Promise<PlanSide> => {
      const fixture = await createPublishFixture(tracker, GENERAL_WEEK_MONDAY);
      const link = await linksApi.createLink(adminUserId, {
        planId: fixture.planId,
        legacyLevelId: LEGACY_LEVEL_SCALED,
      });

      return { fixture, linkId: link.id, actorUserId: adminUserId };
    };

    await expectReclaim(
      await generalSide(),
      await generalSide(),
      GENERAL_WEEK_MONDAY,
      {
        userId: "general-reader",
        legacyUserId: GENERAL_READER_LEGACY_USER_ID,
        legacyRoleId: LEGACY_ROLE_USER,
        legacyPlanId: LEGACY_PLAN_GENERAL,
        legacyLevelId: LEGACY_LEVEL_SCALED,
      },
      GENERAL_TUESDAY,
    );
  });

  it("serves the plan that published an Individual day last, and an unchanged re-publish reclaims it", async () => {
    const fixtureA = await createPublishFixture(tracker, INDIVIDUAL_WEEK_MONDAY);
    const fixtureB = await createPublishFixture(tracker, INDIVIDUAL_WEEK_MONDAY);
    const athlete = await createTrackedIndividualAthlete(tracker, fixtureA);

    await createTestEnrollment(fixtureB.planId, athlete.athleteId, fixtureB.coachUserId);

    const linkFor = async (fixture: PublishFixture): Promise<PlanSide> => {
      const link = await linksApi.createLink(fixture.coachUserId, {
        planId: fixture.planId,
        channel: "INDIVIDUAL",
        athleteId: athlete.athleteId,
      });

      return { fixture, linkId: link.id, actorUserId: fixture.coachUserId };
    };

    await expectReclaim(
      await linkFor(fixtureA),
      await linkFor(fixtureB),
      INDIVIDUAL_WEEK_MONDAY,
      {
        userId: "individual-reader",
        legacyUserId: athlete.legacyUserId,
        legacyRoleId: LEGACY_ROLE_USER,
        legacyPlanId: LEGACY_PLAN_INDIVIDUAL,
        legacyLevelId: LEGACY_LEVEL_SCALED,
      },
      INDIVIDUAL_TUESDAY,
    );
  });
});
