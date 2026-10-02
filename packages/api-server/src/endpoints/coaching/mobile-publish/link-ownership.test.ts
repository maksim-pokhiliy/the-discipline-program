import { EnrollmentStatus } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import {
  LEGACY_LEVEL_PRO,
  LEGACY_LEVEL_SCALED,
  LEGACY_PLAN_GENERAL,
} from "../../../test/golden-fixture";
import {
  releaseHeadCoachSlotAfter,
  takeHeadCoachSlot,
  type HeadCoachSlot,
} from "../../../test/head-coach-slot";
import { cleanupRaw, createTestLegacyIdentity } from "../../../test/helpers";
import { createTestEnrollment } from "../../../test/schedule-helpers";
import { LEGACY_PLAN_INDIVIDUAL } from "../../mobile-compat/legacy-catalogs";

import { linksApi } from "./links";
import { createPublishApi } from "./publish";
import {
  cleanupFixtures,
  createFixtureTracker,
  createPublishFixture,
  createTrackedCoach,
  createTrackedIndividualAthlete,
  createTrackedUser,
  type PublishFixture,
} from "./publish-fixture.test-helpers";

const WEEK_MONDAY = "2031-04-07";
const MISSING_LINK_ID = "clmissinglink000000000000";
const CONNECTION_TTL_MS = 60 * 60 * 1000;
const UNKNOWN_LEVEL_ID = 99;
const NOT_ENROLLED_MESSAGE = "This athlete is not enrolled in this plan";
const NO_INDIVIDUAL_ACCOUNT_MESSAGE =
  "This athlete has no Individual-plan account in the mobile app";

const tracker = createFixtureTracker();
const publishApi = createPublishApi();

const countPublishedDays = (linkId: string): Promise<number> =>
  prisma.mobilePublishedDay.count({ where: { linkId } });

describe("mobile links belong to their plan's coach", () => {
  let fixture: PublishFixture;
  let foreignCoachUserId = "";
  let headCoachUserId = "";
  let headCoachSlot: HeadCoachSlot | undefined;
  let generalLinkId = "";

  beforeAll(async () => {
    fixture = await createPublishFixture(tracker, WEEK_MONDAY);
    foreignCoachUserId = (await createTrackedCoach(tracker)).user.id;
    headCoachSlot = await takeHeadCoachSlot();
    headCoachUserId = await createTrackedUser(tracker, UserRole.HEAD_COACH);
  });

  afterAll(async () => {
    await releaseHeadCoachSlotAfter(headCoachSlot, async () => {
      await cleanupRaw.user.update({
        where: { id: headCoachUserId },
        data: { role: ROLE_TO_PRISMA_MAP[UserRole.COACH] },
      });
      await cleanupFixtures(tracker);
    });
  });

  it("lets a coach with no mobile connection create a General and an Individual link", async () => {
    const { athleteId, legacyUserId } = await createTrackedIndividualAthlete(tracker, fixture);

    expect(
      await cleanupRaw.mobileConnection.count({
        where: { coachProfile: { userId: fixture.coachUserId } },
      }),
    ).toBe(0);

    const general = await linksApi.createLink(fixture.coachUserId, {
      planId: fixture.planId,
      legacyLevelId: LEGACY_LEVEL_PRO,
    });
    const individual = await linksApi.createLink(fixture.coachUserId, {
      planId: fixture.planId,
      channel: "INDIVIDUAL",
      athleteId,
    });

    generalLinkId = general.id;

    expect(general.channel).toBe("GENERAL");
    expect(individual).toMatchObject({ channel: "INDIVIDUAL", athleteId, legacyUserId });
    expect(
      await cleanupRaw.mobilePublishLink.findMany({
        where: { id: { in: [general.id, individual.id] } },
        select: { connectionId: true },
      }),
    ).toEqual([{ connectionId: null }, { connectionId: null }]);
  });

  it("refuses another coach listing the plan's links", async () => {
    await expect(linksApi.listLinks(foreignCoachUserId, fixture.planId)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("refuses another coach publishing through the link and writes nothing", async () => {
    await expect(
      publishApi.publish(foreignCoachUserId, {
        linkId: generalLinkId,
        startDate: WEEK_MONDAY,
        scope: "week",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(await countPublishedDays(generalLinkId)).toBe(0);
  });

  it("refuses another coach deleting the link and keeps it", async () => {
    await expect(linksApi.deleteLink(foreignCoachUserId, generalLinkId)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(await cleanupRaw.mobilePublishLink.count({ where: { id: generalLinkId } })).toBe(1);
  });

  it("still reports an unknown link as not found", async () => {
    await expect(
      publishApi.publish(fixture.coachUserId, {
        linkId: MISSING_LINK_ID,
        startDate: WEEK_MONDAY,
        scope: "week",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("lets a head coach publish through another coach's link, as on the plan itself", async () => {
    const result = await publishApi.publish(headCoachUserId, {
      linkId: generalLinkId,
      startDate: WEEK_MONDAY,
      scope: "week",
    });

    expect(result.results.map((day) => day.action)).toEqual(["created", "created", "created"]);
    expect(await countPublishedDays(generalLinkId)).toBe(3);
  });
});

describe("a link created under the old connection model", () => {
  let fixture: PublishFixture;
  let linkId = "";

  beforeAll(async () => {
    fixture = await createPublishFixture(tracker, WEEK_MONDAY);

    const coachProfile = await cleanupRaw.coachProfile.findUniqueOrThrow({
      where: { userId: fixture.coachUserId },
    });
    const connection = await cleanupRaw.mobileConnection.create({
      data: {
        coachProfileId: coachProfile.id,
        encryptedToken: "test-encrypted-token",
        legacyUserId: "1",
        legacyUserName: "coach@tdp.local",
        legacyUserRole: "ADMIN",
        expiresAt: new Date(Date.now() - CONNECTION_TTL_MS),
      },
    });

    tracker.connectionIds.push(connection.id);

    const link = await cleanupRaw.mobilePublishLink.create({
      data: {
        connectionId: connection.id,
        planId: fixture.planId,
        channel: "GENERAL",
        legacyLevelId: LEGACY_LEVEL_SCALED,
      },
    });

    linkId = link.id;
  });

  afterAll(async () => {
    await cleanupFixtures(tracker);
  });

  it("is listed for the plan's coach even though its session expired", async () => {
    const links = await linksApi.listLinks(fixture.coachUserId, fixture.planId);

    expect(links.map((link) => link.id)).toEqual([linkId]);
  });

  it("publishes without reading the connection and keeps its connectionId", async () => {
    const result = await publishApi.publish(fixture.coachUserId, {
      linkId,
      startDate: WEEK_MONDAY,
      scope: "week",
    });

    expect(result.results.map((day) => day.action)).toEqual(["created", "created", "created"]);
    expect(
      (await cleanupRaw.mobilePublishLink.findUniqueOrThrow({ where: { id: linkId } }))
        .connectionId,
    ).not.toBeNull();
  });

  it("is deleted by the plan's coach", async () => {
    await linksApi.deleteLink(fixture.coachUserId, linkId);

    expect(await cleanupRaw.mobilePublishLink.count({ where: { id: linkId } })).toBe(0);
  });
});

describe("an Individual link uses the athlete's own app account", () => {
  let fixture: PublishFixture;

  beforeAll(async () => {
    fixture = await createPublishFixture(tracker, WEEK_MONDAY);
  });

  afterAll(async () => {
    await cleanupFixtures(tracker);
  });

  const countPlanLinks = (): Promise<number> =>
    cleanupRaw.mobilePublishLink.count({ where: { planId: fixture.planId } });

  const enrolledUser = async (): Promise<string> => {
    const athleteId = await createTrackedUser(tracker);

    await createTestEnrollment(fixture.planId, athleteId, fixture.coachUserId);

    return athleteId;
  };

  const linkIndividual = (athleteId: string) =>
    linksApi.createLink(fixture.coachUserId, {
      planId: fixture.planId,
      channel: "INDIVIDUAL",
      athleteId,
    });

  it("refuses an enrolled athlete with no app account and writes no link", async () => {
    await expect(linkIndividual(await enrolledUser())).rejects.toThrow(
      NO_INDIVIDUAL_ACCOUNT_MESSAGE,
    );
    expect(await countPlanLinks()).toBe(0);
  });

  it("refuses an enrolled athlete whose app account is on the General plan and writes no link", async () => {
    const athleteId = await enrolledUser();

    await createTestLegacyIdentity(athleteId, { legacyPlanId: LEGACY_PLAN_GENERAL });

    await expect(linkIndividual(athleteId)).rejects.toBeInstanceOf(BadRequestError);
    expect(await countPlanLinks()).toBe(0);
  });

  it("refuses an athlete with an Individual-plan account who is not enrolled in the plan", async () => {
    const athleteId = await createTrackedUser(tracker);

    await createTestLegacyIdentity(athleteId, { legacyPlanId: LEGACY_PLAN_INDIVIDUAL });

    await expect(linkIndividual(athleteId)).rejects.toThrow(NOT_ENROLLED_MESSAGE);
    expect(await countPlanLinks()).toBe(0);
  });

  it("refuses an athlete whose enrollment in the plan was removed", async () => {
    const { athleteId } = await createTrackedIndividualAthlete(tracker, fixture);

    await cleanupRaw.planEnrollment.updateMany({
      where: { planId: fixture.planId, athleteId },
      data: { status: EnrollmentStatus.REMOVED, deletedAt: new Date() },
    });

    await expect(linkIndividual(athleteId)).rejects.toThrow(NOT_ENROLLED_MESSAGE);
    expect(await countPlanLinks()).toBe(0);
  });

  it("refuses a soft-deleted athlete", async () => {
    const { athleteId } = await createTrackedIndividualAthlete(tracker, fixture);

    await cleanupRaw.user.update({ where: { id: athleteId }, data: { deletedAt: new Date() } });

    await expect(linkIndividual(athleteId)).rejects.toThrow(NOT_ENROLLED_MESSAGE);
    expect(await countPlanLinks()).toBe(0);
  });

  it("refuses a General link to a level outside the catalog", async () => {
    await expect(
      linksApi.createLink(fixture.coachUserId, {
        planId: fixture.planId,
        legacyLevelId: UNKNOWN_LEVEL_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(await countPlanLinks()).toBe(0);
  });

  it("refuses to pair an account an older link on the plan already gave to another athlete", async () => {
    const { athleteId, legacyUserId } = await createTrackedIndividualAthlete(tracker, fixture);
    const otherAthleteId = await createTrackedUser(tracker);

    await cleanupRaw.mobilePublishLink.create({
      data: {
        planId: fixture.planId,
        channel: "INDIVIDUAL",
        athleteId: otherAthleteId,
        legacyUserId,
      },
    });

    await expect(linkIndividual(athleteId)).rejects.toBeInstanceOf(ConflictError);
    expect(await countPlanLinks()).toBe(1);
  });
});
