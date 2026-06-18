import { DayOfWeek, EnrollmentStatus } from "@prisma/client";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { type Load } from "@repo/contracts/lms/_shared";
import { AppError } from "@repo/errors";

import { prisma } from "../../../db/client";
import {
  cleanup,
  createTestCoach,
  createTestExercise,
  createTestPlan,
  createTestUser,
} from "../../../test/helpers";
import {
  type CleanupEntry,
  createTestEnrollment,
  createTestOneRMRecord,
  createTestPerformedSchemaResult,
  createTestPerformedSession,
} from "../../../test/schedule-helpers";
import { toInputJson } from "../../../utils/to-input-json";

import { lmsSessionDetailApi } from "./session-detail";

const WEEK_START = new Date("2026-06-15T00:00:00.000Z");
const SELF_PERCENT_VALUE = 80;
const ONE_RM_KG = 100;
const ABSOLUTE_KG = 60;

type SessionFixture = {
  coach: Awaited<ReturnType<typeof createTestCoach>>;
  athlete: Awaited<ReturnType<typeof createTestUser>>;
  plan: Awaited<ReturnType<typeof createTestPlan>>;
  sessionId: string;
  benchmarkSchemaId: string;
  squatExerciseId: string;
  toCleanup: CleanupEntry[];
};

type FixtureOptions = {
  status?: EnrollmentStatus;
  hidePastBeforeBoarding?: boolean;
  boardedAt?: Date;
};

const buildSessionFixture = async (options: FixtureOptions = {}): Promise<SessionFixture> => {
  const toCleanup: CleanupEntry[] = [];
  const coach = await createTestCoach();

  toCleanup.push(
    { table: "coachProfile", id: coach.profile.id },
    { table: "user", id: coach.user.id },
  );

  const athlete = await createTestUser();

  toCleanup.push({ table: "user", id: athlete.id });

  const plan = await createTestPlan(coach.user.id, { status: "ACTIVE" });

  toCleanup.push({ table: "trainingPlan", id: plan.id });

  const enrollment = await createTestEnrollment(plan.id, athlete.id, coach.user.id, {
    status: options.status ?? EnrollmentStatus.ACTIVE,
    boardedAt: options.boardedAt ?? WEEK_START,
  });

  toCleanup.push(...enrollment.toCleanup);

  if (options.hidePastBeforeBoarding) {
    await prisma.planEnrollment.update({
      where: { id: enrollment.enrollment.id },
      data: { hidePastBeforeBoarding: true },
    });
  }

  const squat = await createTestExercise({
    canonicalName: "Back Squat",
    canonicalNameLower: "back squat",
  });
  const pullup = await createTestExercise({
    canonicalName: "Pull-up",
    canonicalNameLower: "pull-up",
  });

  toCleanup.push({ table: "exercise", id: squat.id }, { table: "exercise", id: pullup.id });

  const week = await prisma.week.create({ data: { planId: plan.id, startDate: WEEK_START } });
  const day = await prisma.day.create({ data: { weekId: week.id, dayOfWeek: DayOfWeek.MONDAY } });
  const session = await prisma.session.create({ data: { dayId: day.id, order: 0 } });
  const block = await prisma.block.create({ data: { sessionId: session.id, order: 0 } });

  const ordinarySchema = await prisma.schema.create({ data: { blockId: block.id, order: 0 } });
  const benchmarkSchema = await prisma.schema.create({
    data: {
      blockId: block.id,
      order: 1,
      composition: toInputJson({ benchmark: { resultType: "load" } }),
    },
  });

  const selfPercent: Load = {
    kind: "percentage",
    value: SELF_PERCENT_VALUE,
    reference: { scope: "self" },
  };

  await prisma.schemaRow.create({
    data: {
      schemaId: ordinarySchema.id,
      order: 0,
      exerciseId: squat.id,
      load: toInputJson({ kind: "absolute", count: 1, kg: ABSOLUTE_KG }),
    },
  });
  await prisma.schemaRow.create({
    data: {
      schemaId: ordinarySchema.id,
      order: 1,
      exerciseId: squat.id,
      load: toInputJson(selfPercent),
    },
  });
  await prisma.schemaRow.create({
    data: {
      schemaId: ordinarySchema.id,
      order: 2,
      exerciseId: pullup.id,
      load: toInputJson({ kind: "bodyweight" }),
    },
  });
  await prisma.schemaRow.create({
    data: { schemaId: benchmarkSchema.id, order: 0, exerciseId: squat.id },
  });

  toCleanup.push(
    { table: "week", id: week.id },
    { table: "day", id: day.id },
    { table: "session", id: session.id },
    { table: "block", id: block.id },
  );

  return {
    coach,
    athlete,
    plan,
    sessionId: session.id,
    benchmarkSchemaId: benchmarkSchema.id,
    squatExerciseId: squat.id,
    toCleanup,
  };
};

const allRowViews = (response: Awaited<ReturnType<typeof lmsSessionDetailApi.getDetail>>) =>
  response.blocks.flatMap((block) =>
    block.items.flatMap((item) =>
      (item.kind === "schema" ? [item.schema] : item.tracks.map((track) => track.schema)).flatMap(
        (schema) =>
          schema.items.flatMap((rowItem) =>
            rowItem.kind === "row" ? [rowItem.row] : rowItem.members,
          ),
      ),
    ),
  );

describe("lmsSessionDetailApi.getDetail", () => {
  describe("assembled response", () => {
    let fixture: SessionFixture;

    beforeAll(async () => {
      fixture = await buildSessionFixture();
    });

    afterAll(async () => {
      await cleanup(...fixture.toCleanup);
    });

    it("returns the session header with a tz-stable absolute date", async () => {
      const response = await lmsSessionDetailApi.getDetail(fixture.athlete.id, fixture.sessionId);

      expect(response.session.sessionId).toBe(fixture.sessionId);
      expect(response.session.dayOfWeek).toBe("MONDAY");
      expect(response.session.dayOfMonth).toBe(15);
      expect(response.session.done).toBe(false);
    });

    it("renders an absolute, a self-percentage, and a bodyweight load state on real data", async () => {
      const oneRM = await createTestOneRMRecord(fixture.athlete.id, fixture.squatExerciseId, {
        valueKg: ONE_RM_KG,
      });

      fixture.toCleanup.push(...oneRM.toCleanup);

      const response = await lmsSessionDetailApi.getDetail(fixture.athlete.id, fixture.sessionId);
      const statuses = allRowViews(response)
        .map((row) => row.resolvedLoad?.status ?? null)
        .filter((status) => status !== null);

      expect(statuses).toContain("resolved");
      expect(statuses).toContain("not_applicable");
    });

    it("marks the benchmark schema and surfaces its result type", async () => {
      const response = await lmsSessionDetailApi.getDetail(fixture.athlete.id, fixture.sessionId);
      const schemas = response.blocks.flatMap((block) =>
        block.items.flatMap((item) =>
          item.kind === "schema" ? [item.schema] : item.tracks.map((track) => track.schema),
        ),
      );
      const benchmark = schemas.find((schema) => schema.schemaId === fixture.benchmarkSchemaId);

      expect(benchmark?.isBenchmark).toBe(true);
      expect(benchmark?.resultType).toBe("load");
    });

    it("surfaces the latest logged result for the benchmark schema and flips done", async () => {
      const performed = await createTestPerformedSession(fixture.sessionId, fixture.athlete.id);
      const result = await createTestPerformedSchemaResult(
        performed.performed.id,
        fixture.benchmarkSchemaId,
        {
          type: "load",
          kg: 95,
        },
      );

      try {
        const response = await lmsSessionDetailApi.getDetail(fixture.athlete.id, fixture.sessionId);
        const schemas = response.blocks.flatMap((block) =>
          block.items.flatMap((item) => (item.kind === "schema" ? [item.schema] : [])),
        );
        const benchmark = schemas.find((schema) => schema.schemaId === fixture.benchmarkSchemaId);

        expect(response.session.done).toBe(true);
        expect(benchmark?.existingResult).toEqual({ type: "load", kg: 95 });
      } finally {
        await cleanup(...result.toCleanup, ...performed.toCleanup);
      }
    });
  });

  describe("access guard", () => {
    it("throws NotFound for an unknown session", async () => {
      await expect(
        lmsSessionDetailApi.getDetail("clz0000000000000000user01", "clz0000000000000000none01"),
      ).rejects.toThrow(AppError);
    });

    it("throws NotFound for an athlete with no enrollment", async () => {
      const fixture = await buildSessionFixture();
      const stranger = await createTestUser();

      try {
        await expect(lmsSessionDetailApi.getDetail(stranger.id, fixture.sessionId)).rejects.toThrow(
          AppError,
        );
      } finally {
        await cleanup({ table: "user", id: stranger.id }, ...fixture.toCleanup);
      }
    });

    it("throws NotFound for a PAUSED enrollment", async () => {
      const fixture = await buildSessionFixture({ status: EnrollmentStatus.PAUSED });

      try {
        await expect(
          lmsSessionDetailApi.getDetail(fixture.athlete.id, fixture.sessionId),
        ).rejects.toThrow(AppError);
      } finally {
        await cleanup(...fixture.toCleanup);
      }
    });

    it("throws NotFound when the session is before a hidden boarding week", async () => {
      const fixture = await buildSessionFixture({
        hidePastBeforeBoarding: true,
        boardedAt: new Date("2026-07-06T00:00:00.000Z"),
      });

      try {
        await expect(
          lmsSessionDetailApi.getDetail(fixture.athlete.id, fixture.sessionId),
        ).rejects.toThrow(AppError);
      } finally {
        await cleanup(...fixture.toCleanup);
      }
    });

    it("does not let athlete B read athlete A's session", async () => {
      const fixture = await buildSessionFixture();
      const athleteB = await createTestUser();

      try {
        await expect(lmsSessionDetailApi.getDetail(athleteB.id, fixture.sessionId)).rejects.toThrow(
          AppError,
        );
      } finally {
        await cleanup({ table: "user", id: athleteB.id }, ...fixture.toCleanup);
      }
    });
  });

  describe("query-count invariant (no N+1)", () => {
    let fixture: SessionFixture;

    beforeAll(async () => {
      fixture = await buildSessionFixture();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    afterAll(async () => {
      await cleanup(...fixture.toCleanup);
    });

    it("issues a bounded, per-model query budget", async () => {
      const sessionSpy = vi.spyOn(prisma.session, "findUnique");
      const enrollmentSpy = vi.spyOn(prisma.planEnrollment, "findFirst");
      const oneRMSpy = vi.spyOn(prisma.oneRMRecord, "findMany");
      const performedSpy = vi.spyOn(prisma.performedSession, "findMany");
      const profileSpy = vi.spyOn(prisma.athleteProfile, "findUnique");

      await lmsSessionDetailApi.getDetail(fixture.athlete.id, fixture.sessionId);

      expect(sessionSpy).toHaveBeenCalledTimes(1);
      expect(enrollmentSpy).toHaveBeenCalledTimes(1);
      expect(oneRMSpy.mock.calls.length).toBeLessThanOrEqual(1);
      expect(performedSpy).toHaveBeenCalledTimes(1);
      expect(profileSpy).toHaveBeenCalledTimes(1);
    });
  });
});
