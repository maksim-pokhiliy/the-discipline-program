import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { type LegacyShimIdentity } from "@repo/api-routes/legacy-shim";
import { type PublishDayResult } from "@repo/contracts/coaching/mobile-publish";

import { prisma } from "../../../db/client";
import { createGetProgramApi } from "../../mobile-compat/get-program";
import { LEGACY_PLAN_INDIVIDUAL } from "../../mobile-compat/legacy-catalogs";

import { dayContentHash, type Hashable } from "./day-content-hash";
import { linksApi } from "./links";
import { createPublishApi } from "./publish";
import {
  cleanupFixtures,
  createFixtureTracker,
  createPublishFixture,
  createTrackedUser,
  mintFixtureLegacyUserId,
  mintFixtureLevelId,
  utcDate,
  type PublishFixture,
} from "./publish-fixture.test-helpers";

const WEEK_MONDAY = "2031-03-03";
const MONDAY = "2031-03-03";
const TUESDAY = "2031-03-04";
const SUNDAY = "2031-03-09";
const RACE_WEEK_MONDAY = "2031-03-10";
const FIRST_MINTED_ROW_ID = 1_000_000;
const LEGACY_PLAN_GENERAL = 1;
const LEGACY_ROLE_USER = 1;

const ONE_SESSION_DAY: Hashable & { isRestDay: false } = {
  isRestDay: false,
  dailyProgram: { dayTrainings: [{ trainingNumber: 1, blocks: [] }] },
};
const TWO_SESSION_DAY: Hashable & { isRestDay: false } = {
  isRestDay: false,
  dailyProgram: {
    dayTrainings: [
      { trainingNumber: 1, blocks: [] },
      { trainingNumber: 2, blocks: [] },
    ],
  },
};

const tracker = createFixtureTracker();
const publishApi = createPublishApi();
const getProgramApi = createGetProgramApi();

const actionsByDate = (results: PublishDayResult[]): Record<string, string> =>
  Object.fromEntries(results.map((result) => [result.scheduledDate, result.action]));

const loadRows = (linkId: string) =>
  prisma.mobilePublishedDay.findMany({
    where: { linkId },
    orderBy: { scheduledDate: "asc" },
    select: {
      scheduledDate: true,
      legacyRowId: true,
      contentHash: true,
      isRestDay: true,
      dailyProgram: true,
      publishedAt: true,
    },
  });

const publishWeek = (fixture: PublishFixture, linkId: string, startDate = WEEK_MONDAY) =>
  publishApi.publish(fixture.coachUserId, { linkId, startDate, scope: "week" });

describe("publish vertical: our own ledger is the snapshot the app reads", () => {
  let fixture: PublishFixture;
  let generalLinkId = "";
  let individualLinkId = "";
  const legacyLevelId = mintFixtureLevelId();
  const legacyUserId = mintFixtureLegacyUserId();

  beforeAll(async () => {
    fixture = await createPublishFixture(tracker, WEEK_MONDAY);

    const athleteId = await createTrackedUser(tracker);
    const general = await linksApi.createLink(fixture.coachUserId, {
      planId: fixture.planId,
      legacyLevelId,
    });
    const individual = await linksApi.createLink(fixture.coachUserId, {
      planId: fixture.planId,
      channel: "INDIVIDUAL",
      athleteId,
      legacyUserId,
    });

    generalLinkId = general.id;
    individualLinkId = individual.id;
  });

  afterAll(async () => {
    await cleanupFixtures(tracker);
  });

  it("creates every day with its content, the projection's hash and a minted id", async () => {
    const result = await publishWeek(fixture, generalLinkId);

    expect(actionsByDate(result.results)).toEqual({
      [MONDAY]: "created",
      [TUESDAY]: "created",
      [SUNDAY]: "created",
    });

    const rows = await loadRows(generalLinkId);

    expect(rows.map((row) => row.contentHash)).toEqual([
      dayContentHash(ONE_SESSION_DAY),
      dayContentHash(ONE_SESSION_DAY),
      dayContentHash({ isRestDay: true }),
    ]);
    expect(rows.map((row) => row.isRestDay)).toEqual([false, false, true]);
    expect(rows[0]?.dailyProgram).toEqual(ONE_SESSION_DAY.dailyProgram);
    expect(rows[2]?.dailyProgram).toBeNull();
    expect(rows.every((row) => row.legacyRowId >= FIRST_MINTED_ROW_ID)).toBe(true);
    expect(result.results.map((day) => day.legacyRowId)).toEqual(
      rows.map((row) => row.legacyRowId),
    );
  });

  it("skips every day of an immediate republish and leaves publishedAt untouched", async () => {
    const before = await loadRows(generalLinkId);
    const result = await publishWeek(fixture, generalLinkId);

    expect(result.results.map((day) => day.action)).toEqual(["skipped", "skipped", "skipped"]);
    expect(await loadRows(generalLinkId)).toEqual(before);
  });

  it("updates only the edited day, keeping its id and moving its publishedAt", async () => {
    const before = await loadRows(generalLinkId);

    await fixture.addMondaySession();

    const result = await publishWeek(fixture, generalLinkId);
    const after = await loadRows(generalLinkId);

    expect(actionsByDate(result.results)).toEqual({
      [MONDAY]: "updated",
      [TUESDAY]: "skipped",
      [SUNDAY]: "skipped",
    });
    expect(after[0]?.legacyRowId).toBe(before[0]?.legacyRowId);
    expect(after[0]?.contentHash).toBe(dayContentHash(TWO_SESSION_DAY));
    expect(after[0]?.publishedAt.getTime()).toBeGreaterThan(before[0]?.publishedAt.getTime() ?? 0);
    expect(after.slice(1)).toEqual(before.slice(1));
  });

  it("serves the published General days to an athlete of that level, id and rest day included", async () => {
    const rows = await loadRows(generalLinkId);
    const identity: LegacyShimIdentity = {
      userId: "general-athlete",
      legacyUserId,
      legacyRoleId: LEGACY_ROLE_USER,
      legacyPlanId: LEGACY_PLAN_GENERAL,
      legacyLevelId,
    };

    const monday = await getProgramApi.getProgram(identity, legacyUserId, MONDAY);
    const sunday = await getProgramApi.getProgram(identity, legacyUserId, SUNDAY);

    expect(monday).toMatchObject({
      kind: "ok-json",
      payload: {
        id: rows[0]?.legacyRowId,
        isRestDay: false,
        dailyProgram: TWO_SESSION_DAY.dailyProgram,
      },
    });
    expect(sunday).toMatchObject({
      kind: "ok-json",
      payload: { id: rows[2]?.legacyRowId, isRestDay: true, dailyProgram: null },
    });
  });

  it("serves the published Individual days to the linked athlete", async () => {
    const result = await publishWeek(fixture, individualLinkId);
    const rows = await loadRows(individualLinkId);
    const identity: LegacyShimIdentity = {
      userId: "individual-athlete",
      legacyUserId,
      legacyRoleId: LEGACY_ROLE_USER,
      legacyPlanId: LEGACY_PLAN_INDIVIDUAL,
      legacyLevelId,
    };

    expect(result.results.map((day) => day.action)).toEqual(["created", "created", "created"]);
    expect(await getProgramApi.getProgram(identity, legacyUserId, TUESDAY)).toMatchObject({
      kind: "ok-json",
      payload: { id: rows[1]?.legacyRowId, isRestDay: false },
    });
    expect(await getProgramApi.getProgram(identity, legacyUserId, SUNDAY)).toMatchObject({
      kind: "ok-json",
      payload: { id: rows[2]?.legacyRowId, isRestDay: true, dailyProgram: null },
    });
  });
});

describe("publish vertical: two concurrent runs for the same link", () => {
  let fixture: PublishFixture;
  let linkId = "";

  beforeAll(async () => {
    fixture = await createPublishFixture(tracker, RACE_WEEK_MONDAY);
    linkId = (
      await linksApi.createLink(fixture.coachUserId, {
        planId: fixture.planId,
        legacyLevelId: mintFixtureLevelId(),
      })
    ).id;
  });

  afterAll(async () => {
    await cleanupFixtures(tracker);
  });

  it("writes one row per day, fails no day and reports the same id from both runs", async () => {
    const [first, second] = await Promise.all([
      publishWeek(fixture, linkId, RACE_WEEK_MONDAY),
      publishWeek(fixture, linkId, RACE_WEEK_MONDAY),
    ]);
    const rows = await loadRows(linkId);

    expect([...first.results, ...second.results].some((day) => day.action === "failed")).toBe(
      false,
    );
    expect(rows.map((row) => row.scheduledDate)).toEqual([
      utcDate("2031-03-10"),
      utcDate("2031-03-11"),
      utcDate("2031-03-16"),
    ]);
    expect(first.results.map((day) => day.legacyRowId)).toEqual(
      second.results.map((day) => day.legacyRowId),
    );
  });
});
