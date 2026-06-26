import { DayOfWeek } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { mobilePublishEnv } from "@repo/env/mobile-publish";

import { prisma } from "../../../db/client";
import {
  createLegacyMobileRestAdapter,
  type LegacyMobileClientPort,
} from "../../../infrastructure/legacy-mobile";
import {
  cleanupRaw,
  createTestCoach,
  createTestExercise,
  createTestPlan,
  createTestUser,
} from "../../../test/helpers";
import {
  createTestDay,
  createTestLabel,
  createTestSession,
  createTestWeek,
  type CleanupEntry,
} from "../../../test/schedule-helpers";
import { toInputJson } from "../../../utils/to-input-json";
import { sessionAbsoluteDateFromParts } from "../../lms/_shared";

import { projectDay } from "./projection/project-day";
import { loadExerciseById, loadTargetDays } from "./publish-loaders";

import { mobilePublishApi } from "./index";

const SHOULD_RUN = process.env.RUN_LEGACY_INTEGRATION === "1";

const ADMIN_EMAIL = "admin@tdp.local";
const ADMIN_PASSWORD = "Admin123!";
const ATHLETE_EMAIL = "athlete@tdp.local";
const PRO_LEVEL_ID = 2;
const PRO_LEVEL_NAME_FALLBACK = "Pro";

const WORKING_DAY_OF_WEEK = DayOfWeek.MONDAY;
const REST_DAY_OF_WEEK = DayOfWeek.SUNDAY;
const SESSION_ORDER = 10;
const BLOCK_ORDER = 0;
const SCHEMA_ORDER = 0;
const FIRST_ROW_ORDER = 0;
const FIRST_ROW_SETS = 5;
const FIRST_ROW_REPS = 3;
const FIRST_ROW_PERCENTAGE = 80;
const EDITED_ROW_SETS = 4;
const EDITED_ROW_PERCENTAGE = 70;

const mondayUtc = (base: Date): Date => {
  const day = base.getUTCDay();
  const offsetToMonday = day === 0 ? -6 : 1 - day;

  return new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + offsetToMonday),
  );
};

const toDateParam = (date: Date): string => date.toISOString().slice(0, 10);

const percentageLoad = (value: number): unknown => ({
  kind: "percentage",
  value,
  reference: { scope: "self" },
});

type PublishFixture = {
  userId: string;
  planId: string;
  weekStartParam: string;
  workingDate: string;
  restDate: string;
  schemaId: string;
  toCleanup: CleanupEntry[];
};

const createRow = async (
  schemaId: string,
  exerciseId: string,
  order: number,
  sets: number,
  percentage: number,
): Promise<CleanupEntry> => {
  const row = await cleanupRaw.schemaRow.create({
    data: {
      schemaId,
      exerciseId,
      order,
      sets,
      reps: toInputJson({ kind: "count", value: FIRST_ROW_REPS }),
      load: toInputJson(percentageLoad(percentage)),
    },
  });

  return { table: "schemaRow", id: row.id };
};

const buildPlanFixture = async (): Promise<PublishFixture> => {
  const toCleanup: CleanupEntry[] = [];

  const coach = await createTestCoach();

  toCleanup.push({ table: "coachProfile", id: coach.profile.id });
  toCleanup.push({ table: "user", id: coach.user.id });

  const plan = await createTestPlan(coach.user.id);

  toCleanup.push({ table: "trainingPlan", id: plan.id });

  const weekStart = mondayUtc(new Date());
  const weekResult = await createTestWeek(plan.id, { startDate: weekStart });

  toCleanup.push(...weekResult.toCleanup);

  const workLabel = await createTestLabel({ name: "Strength", rest: false });

  toCleanup.push(...workLabel.toCleanup);

  const restLabel = await createTestLabel({ name: "Rest", rest: true });

  toCleanup.push(...restLabel.toCleanup);

  const workingDay = await createTestDay(weekResult.week.id, {
    dayOfWeek: WORKING_DAY_OF_WEEK,
  });

  toCleanup.push(...workingDay.toCleanup);

  const restDay = await createTestDay(weekResult.week.id, {
    dayOfWeek: REST_DAY_OF_WEEK,
    labelId: restLabel.label.id,
  });

  toCleanup.push(...restDay.toCleanup);

  const session = await createTestSession(workingDay.day.id, { order: SESSION_ORDER });

  toCleanup.push(...session.toCleanup);

  const block = await cleanupRaw.block.create({
    data: { sessionId: session.session.id, order: BLOCK_ORDER },
  });

  toCleanup.push({ table: "block", id: block.id });

  const labelAssignment = await cleanupRaw.blockLabelAssignment.create({
    data: { blockId: block.id, labelId: workLabel.label.id, order: 0 },
  });

  toCleanup.push({ table: "blockLabelAssignment", id: labelAssignment.id });

  const schema = await cleanupRaw.schema.create({
    data: { blockId: block.id, order: SCHEMA_ORDER },
  });

  toCleanup.push({ table: "schema", id: schema.id });

  const exercise = await createTestExercise({ canonicalName: "Integration Back Squat" });

  toCleanup.push({ table: "exercise", id: exercise.id });

  const firstRow = await createRow(
    schema.id,
    exercise.id,
    FIRST_ROW_ORDER,
    FIRST_ROW_SETS,
    FIRST_ROW_PERCENTAGE,
  );

  toCleanup.push(firstRow);

  const workingDate = toDateParam(
    sessionAbsoluteDateFromParts(weekResult.week.startDate, WORKING_DAY_OF_WEEK),
  );
  const restDate = toDateParam(
    sessionAbsoluteDateFromParts(weekResult.week.startDate, REST_DAY_OF_WEEK),
  );

  return {
    userId: coach.user.id,
    planId: plan.id,
    weekStartParam: toDateParam(weekStart),
    workingDate,
    restDate,
    schemaId: schema.id,
    toCleanup,
  };
};

const expectedExercisesFor = async (planId: string, weekStartParam: string): Promise<string[]> => {
  const weekStart = mondayUtc(new Date(`${weekStartParam}T00:00:00.000Z`));
  const days = await loadTargetDays(planId, weekStart, WORKING_DAY_OF_WEEK);
  const day = days[0];

  if (day === undefined) {
    throw new Error("expected a working day to be loaded for the projection assertion");
  }

  const exerciseById = await loadExerciseById(days);
  const projected = projectDay(day, exerciseById);

  if (projected.isRestDay) {
    throw new Error("expected the working day projection not to be a rest day");
  }

  return projected.dailyProgram.dayTrainings.flatMap((training) =>
    training.blocks.flatMap((block) => block.exercises),
  );
};

const deleteLegacyRow = async (token: string, id: number): Promise<void> => {
  const response = await fetch(
    `${mobilePublishEnv.LEGACY_MOBILE_API_BASE_URL}/generalProgram/${id}`,
    { method: "DELETE", headers: { Authorization: token } },
  );

  if (!response.ok && response.status !== 404) {
    throw new Error(`legacy DELETE /generalProgram/${id} failed with ${response.status}`);
  }
};

describe.skipIf(!SHOULD_RUN)(
  "mobile-publish full pipeline against the live legacy harness (requires the gated migration applied + localhost:8080 up)",
  () => {
    const adapter: LegacyMobileClientPort = createLegacyMobileRestAdapter();

    let fixture: PublishFixture;
    let linkId: string;
    let rawToken: string;
    const legacyRowIds = new Set<number>();

    beforeAll(async () => {
      fixture = await buildPlanFixture();
      const signin = await adapter.signin(ADMIN_EMAIL, ADMIN_PASSWORD);

      rawToken = signin.accessToken;
    });

    afterAll(async () => {
      for (const id of legacyRowIds) {
        await deleteLegacyRow(rawToken, id).catch(() => undefined);
      }

      await cleanupRaw.mobilePublishedDay.deleteMany({
        where: { link: { planId: fixture.planId } },
      });
      await cleanupRaw.mobilePublishLink.deleteMany({ where: { planId: fixture.planId } });
      await cleanupRaw.mobileConnection.deleteMany({
        where: { coachProfile: { userId: fixture.userId } },
      });

      for (const { table, id } of [...fixture.toCleanup].reverse()) {
        const delegate = (
          cleanupRaw as unknown as Record<
            string,
            { delete: (args: { where: { id: string } }) => Promise<unknown> }
          >
        )[table];

        await delegate?.delete({ where: { id } }).catch(() => undefined);
      }

      await prisma.$disconnect();
    });

    it("stores a connection without exposing the token in the DTO", async () => {
      const connection = await mobilePublishApi.connect(fixture.userId, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      expect(connection).not.toHaveProperty("encryptedToken");
      expect(connection).not.toHaveProperty("token");
      expect(connection.legacyUserRole).toBe("ADMIN");

      const stored = await prisma.mobileConnection.findFirst({
        where: { coachProfile: { userId: fixture.userId } },
        select: { id: true, encryptedToken: true },
      });

      expect(stored).not.toBeNull();
      expect(stored?.encryptedToken).toBeTruthy();
    });

    it("lists the live training levels including Pro at id 2", async () => {
      const levels = await mobilePublishApi.listTrainingLevels(fixture.userId);
      const pro = levels.find((level) => level.id === PRO_LEVEL_ID);

      expect(pro).toBeDefined();
      expect((pro?.name ?? PRO_LEVEL_NAME_FALLBACK).length).toBeGreaterThan(0);
    });

    it("returns null from getGeneralProgram for an absent (level, date) — CORR-002", async () => {
      const absent = await adapter.getGeneralProgram(rawToken, PRO_LEVEL_ID, "1999-01-04");

      expect(absent).toBeNull();
    });

    it("creates a link from the plan to the Pro level", async () => {
      const link = await mobilePublishApi.createLink(fixture.userId, {
        planId: fixture.planId,
        legacyLevelId: PRO_LEVEL_ID,
      });

      expect(link.planId).toBe(fixture.planId);
      expect(link.legacyLevelId).toBe(PRO_LEVEL_ID);

      linkId = link.id;
    });

    it("publishes the week — working day created, rest day created — and the legacy content matches the projection", async () => {
      const result = await mobilePublishApi.publish(fixture.userId, {
        linkId,
        startDate: fixture.weekStartParam,
        scope: "week",
        overwriteUnowned: false,
      });

      const byDate = new Map(result.results.map((entry) => [entry.scheduledDate, entry]));
      const working = byDate.get(fixture.workingDate);
      const rest = byDate.get(fixture.restDate);

      expect(working?.action).toBe("created");
      expect(rest?.action).toBe("created");
      expect(working?.legacyRowId).not.toBeNull();
      expect(rest?.legacyRowId).not.toBeNull();

      for (const entry of result.results) {
        if (entry.legacyRowId !== null) {
          legacyRowIds.add(entry.legacyRowId);
        }
      }

      const legacyWorking = await adapter.getGeneralProgram(
        rawToken,
        PRO_LEVEL_ID,
        fixture.workingDate,
      );
      const legacyRest = await adapter.getGeneralProgram(rawToken, PRO_LEVEL_ID, fixture.restDate);

      expect(legacyWorking).not.toBeNull();
      expect(legacyWorking?.isRestDay).toBe(false);

      const expectedLines = await expectedExercisesFor(fixture.planId, fixture.weekStartParam);
      const legacyLines =
        legacyWorking?.dailyProgram?.dayTrainings.flatMap((training) =>
          training.blocks.flatMap((block) => block.exercises),
        ) ?? [];

      expect(legacyLines).toEqual(expectedLines);

      expect(legacyRest?.isRestDay).toBe(true);
      expect(legacyRest?.dailyProgram).toBeNull();
    });

    it("skips every day on an identical republish — CORR-001 (no legacy write)", async () => {
      const result = await mobilePublishApi.publish(fixture.userId, {
        linkId,
        startDate: fixture.weekStartParam,
        scope: "week",
        overwriteUnowned: false,
      });

      for (const entry of result.results) {
        expect(entry.action).toBe("skipped");
      }
    });

    it("updates the edited working day on republish and reflects the edit in legacy", async () => {
      await cleanupRaw.schemaRow.updateMany({
        where: { schemaId: fixture.schemaId, order: FIRST_ROW_ORDER },
        data: {
          sets: EDITED_ROW_SETS,
          load: toInputJson(percentageLoad(EDITED_ROW_PERCENTAGE)),
        },
      });

      const result = await mobilePublishApi.publish(fixture.userId, {
        linkId,
        startDate: fixture.weekStartParam,
        scope: "day",
        dayOfWeek: WORKING_DAY_OF_WEEK,
        overwriteUnowned: false,
      });

      const working = result.results.find((entry) => entry.scheduledDate === fixture.workingDate);

      expect(working?.action).toBe("updated");

      const legacyWorking = await adapter.getGeneralProgram(
        rawToken,
        PRO_LEVEL_ID,
        fixture.workingDate,
      );
      const expectedLines = await expectedExercisesFor(fixture.planId, fixture.weekStartParam);
      const legacyLines =
        legacyWorking?.dailyProgram?.dayTrainings.flatMap((training) =>
          training.blocks.flatMap((block) => block.exercises),
        ) ?? [];

      expect(legacyLines).toEqual(expectedLines);
      expect(legacyLines.some((line) => line.includes(String(EDITED_ROW_PERCENTAGE)))).toBe(true);
    });
  },
);

describe.skipIf(!SHOULD_RUN)(
  "mobile-publish individual channel against the live legacy harness (requires the gated migration applied + localhost:8080 up + a seeded user_plan_id=2 athlete)",
  () => {
    const adapter: LegacyMobileClientPort = createLegacyMobileRestAdapter();

    let fixture: PublishFixture;
    let athleteUserId: string;
    let legacyUserId: number;
    let linkId: string;
    let rawToken: string;
    let createdWorkingRowId: number;
    const legacyRowIds = new Set<number>();

    beforeAll(async () => {
      fixture = await buildPlanFixture();
      const athlete = await createTestUser();

      athleteUserId = athlete.id;
      const signin = await adapter.signin(ADMIN_EMAIL, ADMIN_PASSWORD);

      rawToken = signin.accessToken;
    });

    afterAll(async () => {
      for (const id of legacyRowIds) {
        await adapter.deleteIndividualProgram(rawToken, id).catch(() => undefined);
      }

      await cleanupRaw.mobilePublishedDay.deleteMany({
        where: { link: { planId: fixture.planId } },
      });
      await cleanupRaw.mobilePublishLink.deleteMany({ where: { planId: fixture.planId } });
      await cleanupRaw.mobileConnection.deleteMany({
        where: { coachProfile: { userId: fixture.userId } },
      });
      await cleanupRaw.user.delete({ where: { id: athleteUserId } }).catch(() => undefined);

      for (const { table, id } of [...fixture.toCleanup].reverse()) {
        const delegate = (
          cleanupRaw as unknown as Record<
            string,
            { delete: (args: { where: { id: string } }) => Promise<unknown> }
          >
        )[table];

        await delegate?.delete({ where: { id } }).catch(() => undefined);
      }

      await prisma.$disconnect();
    });

    it("stores a connection for the individual-channel coach", async () => {
      const connection = await mobilePublishApi.connect(fixture.userId, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      expect(connection).not.toHaveProperty("encryptedToken");
      expect(connection.legacyUserRole).toBe("ADMIN");
    });

    it("lists the seeded individual athlete and resolves its legacy user id", async () => {
      const athletes = await mobilePublishApi.listIndividualAthletes(fixture.userId);
      const seeded = athletes.find((athlete) => athlete.username === ATHLETE_EMAIL);

      expect(seeded).toBeDefined();

      if (seeded === undefined) {
        throw new Error(`expected the seeded individual athlete ${ATHLETE_EMAIL} to be present`);
      }

      legacyUserId = seeded.id;
      expect(legacyUserId).toBeGreaterThan(0);
    });

    it("returns null from getIndividualProgram for an absent (user, date)", async () => {
      const absent = await adapter.getIndividualProgram(rawToken, legacyUserId, "1999-01-04");

      expect(absent).toBeNull();
    });

    it("creates an INDIVIDUAL link bridging the platform athlete to the legacy user", async () => {
      const link = await mobilePublishApi.createLink(fixture.userId, {
        planId: fixture.planId,
        channel: "INDIVIDUAL",
        athleteId: athleteUserId,
        legacyUserId,
      });

      expect(link.channel).toBe("INDIVIDUAL");
      expect(link.legacyUserId).toBe(legacyUserId);
      expect(link.athleteId).toBe(athleteUserId);
      expect(link.legacyLevelId).toBeNull();

      linkId = link.id;
    });

    it("publishes the week to the athlete — working created, rest created — matching the projection", async () => {
      const result = await mobilePublishApi.publish(fixture.userId, {
        linkId,
        startDate: fixture.weekStartParam,
        scope: "week",
        overwriteUnowned: false,
      });

      const byDate = new Map(result.results.map((entry) => [entry.scheduledDate, entry]));
      const working = byDate.get(fixture.workingDate);
      const rest = byDate.get(fixture.restDate);

      expect(working?.action).toBe("created");
      expect(rest?.action).toBe("created");

      for (const entry of result.results) {
        if (entry.legacyRowId !== null) {
          legacyRowIds.add(entry.legacyRowId);
        }
      }

      if (working === undefined || working.legacyRowId === null) {
        throw new Error("expected the working day to have a legacy row id after create");
      }

      createdWorkingRowId = working.legacyRowId;

      const legacyWorking = await adapter.getIndividualProgram(
        rawToken,
        legacyUserId,
        fixture.workingDate,
      );
      const legacyRest = await adapter.getIndividualProgram(
        rawToken,
        legacyUserId,
        fixture.restDate,
      );

      expect(legacyWorking).not.toBeNull();
      expect(legacyWorking?.isRestDay).toBe(false);

      const expectedLines = await expectedExercisesFor(fixture.planId, fixture.weekStartParam);
      const legacyLines =
        legacyWorking?.dailyProgram?.dayTrainings.flatMap((training) =>
          training.blocks.flatMap((block) => block.exercises),
        ) ?? [];

      expect(legacyLines).toEqual(expectedLines);

      expect(legacyRest?.isRestDay).toBe(true);
      expect(legacyRest?.dailyProgram).toBeNull();
    });

    it("skips every day on an identical republish (no legacy write)", async () => {
      const result = await mobilePublishApi.publish(fixture.userId, {
        linkId,
        startDate: fixture.weekStartParam,
        scope: "week",
        overwriteUnowned: false,
      });

      for (const entry of result.results) {
        expect(entry.action).toBe("skipped");
      }
    });

    it("replaces the edited day via DELETE+POST, yielding a NEW legacyRowId (D-14 live proof)", async () => {
      await cleanupRaw.schemaRow.updateMany({
        where: { schemaId: fixture.schemaId, order: FIRST_ROW_ORDER },
        data: {
          sets: EDITED_ROW_SETS,
          load: toInputJson(percentageLoad(EDITED_ROW_PERCENTAGE)),
        },
      });

      const result = await mobilePublishApi.publish(fixture.userId, {
        linkId,
        startDate: fixture.weekStartParam,
        scope: "day",
        dayOfWeek: WORKING_DAY_OF_WEEK,
        overwriteUnowned: false,
      });

      const working = result.results.find((entry) => entry.scheduledDate === fixture.workingDate);

      expect(working?.action).toBe("updated");
      expect(working?.legacyRowId).not.toBeNull();
      expect(working?.legacyRowId).not.toBe(createdWorkingRowId);

      if (working !== undefined && working.legacyRowId !== null) {
        legacyRowIds.add(working.legacyRowId);
      }

      const legacyWorking = await adapter.getIndividualProgram(
        rawToken,
        legacyUserId,
        fixture.workingDate,
      );
      const expectedLines = await expectedExercisesFor(fixture.planId, fixture.weekStartParam);
      const legacyLines =
        legacyWorking?.dailyProgram?.dayTrainings.flatMap((training) =>
          training.blocks.flatMap((block) => block.exercises),
        ) ?? [];

      expect(legacyLines).toEqual(expectedLines);
      expect(legacyLines.some((line) => line.includes(String(EDITED_ROW_PERCENTAGE)))).toBe(true);
    });
  },
);
