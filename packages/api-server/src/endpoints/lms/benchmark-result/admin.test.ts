import { DayOfWeek, EnrollmentStatus } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ONE_RM_MAX_KG } from "@repo/contracts/lms/_shared";
import { createBenchmarkResultSchema } from "@repo/contracts/lms/benchmark-result";
import { OneRMRecordSource } from "@repo/contracts/lms/one-rm-record";
import { BadRequestError, NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import {
  cleanup,
  cleanupRaw,
  createTestExercise,
  createTestPlan,
  createTestUser,
} from "../../../test/helpers";
import {
  type CleanupEntry,
  createTestEnrollment,
  createTestScheduleScenario,
} from "../../../test/schedule-helpers";
import { toInputJson } from "../../../utils";
import { lmsSessionDetailApi } from "../session-detail/session-detail";

import { lmsBenchmarkResultApi } from "./admin";

const PERCENT_VALUE = 75;

type BenchmarkSchemaInSession = {
  schemaId: string;
  exerciseId: string;
  toCleanup: CleanupEntry[];
};

const addBenchmarkSchemaWithRow = async (
  sessionId: string,
  resultType: string,
  order: number,
): Promise<BenchmarkSchemaInSession> => {
  const exercise = await createTestExercise();
  const block = await cleanupRaw.block.create({ data: { sessionId, order } });
  const schema = await cleanupRaw.schema.create({
    data: {
      blockId: block.id,
      order: 0,
      composition: toInputJson({ benchmark: { resultType } }),
    },
  });
  const row = await cleanupRaw.schemaRow.create({
    data: { schemaId: schema.id, order: 0, exerciseId: exercise.id },
  });

  return {
    schemaId: schema.id,
    exerciseId: exercise.id,
    toCleanup: [
      { table: "schemaRow", id: row.id },
      { table: "schema", id: schema.id },
      { table: "block", id: block.id },
      { table: "exercise", id: exercise.id },
    ],
  };
};

const addBenchmarkSchemaWithoutRows = async (
  sessionId: string,
  resultType: string,
  order: number,
): Promise<{ schemaId: string; toCleanup: CleanupEntry[] }> => {
  const block = await cleanupRaw.block.create({ data: { sessionId, order } });
  const schema = await cleanupRaw.schema.create({
    data: {
      blockId: block.id,
      order: 0,
      composition: toInputJson({ benchmark: { resultType } }),
    },
  });

  return {
    schemaId: schema.id,
    toCleanup: [
      { table: "schema", id: schema.id },
      { table: "block", id: block.id },
    ],
  };
};

const addPercentageRowToSession = async (
  sessionId: string,
  exerciseId: string,
  order: number,
): Promise<{ toCleanup: CleanupEntry[] }> => {
  const block = await cleanupRaw.block.create({ data: { sessionId, order } });
  const schema = await cleanupRaw.schema.create({ data: { blockId: block.id, order: 0 } });
  const row = await cleanupRaw.schemaRow.create({
    data: {
      schemaId: schema.id,
      order: 0,
      exerciseId,
      load: toInputJson({ kind: "percentage", value: PERCENT_VALUE, reference: { scope: "self" } }),
    },
  });

  return {
    toCleanup: [
      { table: "schemaRow", id: row.id },
      { table: "schema", id: schema.id },
      { table: "block", id: block.id },
    ],
  };
};

const addPlainSchema = async (
  sessionId: string,
  order: number,
): Promise<{ schemaId: string; toCleanup: CleanupEntry[] }> => {
  const block = await cleanupRaw.block.create({ data: { sessionId, order } });
  const schema = await cleanupRaw.schema.create({ data: { blockId: block.id, order: 0 } });

  return {
    schemaId: schema.id,
    toCleanup: [
      { table: "schema", id: schema.id },
      { table: "block", id: block.id },
    ],
  };
};

describe("lmsBenchmarkResultApi.logBenchmarkResult", () => {
  let scenario: Awaited<ReturnType<typeof createTestScheduleScenario>>;
  let sessionId: string;

  let roundsReps: BenchmarkSchemaInSession;

  let unenrolledAthlete: Awaited<ReturnType<typeof createTestUser>>;
  let foreignBenchmark: { schemaId: string; toCleanup: CleanupEntry[] };

  const extraCleanup: CleanupEntry[] = [];

  beforeAll(async () => {
    scenario = await createTestScheduleScenario({ tz: "UTC", weeksBack: 0, sessionsPerWeek: 1 });

    const firstSession = scenario.sessions[0];

    if (!firstSession) {
      throw new Error("schedule scenario produced no session");
    }

    sessionId = firstSession.sessionId;

    roundsReps = await addBenchmarkSchemaWithRow(sessionId, "rounds_reps", 0);
    extraCleanup.push(...roundsReps.toCleanup);

    unenrolledAthlete = await createTestUser();
    extraCleanup.push({ table: "user", id: unenrolledAthlete.id });

    const otherPlan = await createTestPlan(scenario.coach.user.id, { status: "ACTIVE" });

    extraCleanup.push({ table: "trainingPlan", id: otherPlan.id });

    const otherWeek = await cleanupRaw.week.create({
      data: { planId: otherPlan.id, startDate: new Date("2026-01-05T00:00:00.000Z") },
    });
    const otherDay = await cleanupRaw.day.create({
      data: { weekId: otherWeek.id, dayOfWeek: DayOfWeek.MONDAY },
    });
    const otherSession = await cleanupRaw.session.create({
      data: { dayId: otherDay.id, order: 0 },
    });

    foreignBenchmark = await addBenchmarkSchemaWithRow(otherSession.id, "rounds_reps", 0);
    extraCleanup.push(
      ...foreignBenchmark.toCleanup,
      { table: "session", id: otherSession.id },
      { table: "day", id: otherDay.id },
      { table: "week", id: otherWeek.id },
    );
  });

  afterAll(async () => {
    await cleanup(...extraCleanup);
    await cleanup(...scenario.toCleanup);
  });

  describe("append history (Must-Test 1, 2)", () => {
    it("creates an athlete-owned row with userId and recordedAt and no performedSessionId", async () => {
      const created = await lmsBenchmarkResultApi.logBenchmarkResult(
        scenario.athlete.id,
        sessionId,
        {
          plannedSchemaId: roundsReps.schemaId,
          result: { type: "rounds_reps", rounds: 18, reps: 7 },
        },
      );

      try {
        expect(created.userId).toBe(scenario.athlete.id);
        expect(created.plannedSchemaId).toBe(roundsReps.schemaId);
        expect(created.result).toEqual({ type: "rounds_reps", rounds: 18, reps: 7 });
        expect(created.recordedAt).toBeInstanceOf(Date);
        expect(created).not.toHaveProperty("performedSessionId");
      } finally {
        await cleanupRaw.benchmarkResult.delete({ where: { id: created.id } }).catch(() => {});
      }
    });

    it("appends a second row on re-log instead of overwriting (count === 2)", async () => {
      const first = await lmsBenchmarkResultApi.logBenchmarkResult(scenario.athlete.id, sessionId, {
        plannedSchemaId: roundsReps.schemaId,
        result: { type: "rounds_reps", rounds: 18, reps: 7 },
      });
      const second = await lmsBenchmarkResultApi.logBenchmarkResult(
        scenario.athlete.id,
        sessionId,
        {
          plannedSchemaId: roundsReps.schemaId,
          result: { type: "rounds_reps", rounds: 19, reps: 3 },
        },
      );

      try {
        expect(second.id).not.toBe(first.id);

        const count = await cleanupRaw.benchmarkResult.count({
          where: { userId: scenario.athlete.id, plannedSchemaId: roundsReps.schemaId },
        });

        expect(count).toBe(2);

        const response = await lmsSessionDetailApi.getDetail(scenario.athlete.id, sessionId);
        const schema = response.blocks
          .flatMap((block) => block.items)
          .flatMap((item) => (item.kind === "schema" ? [item.schema] : []))
          .find((entry) => entry.schemaId === roundsReps.schemaId);

        expect(schema?.existingResult).toEqual({ type: "rounds_reps", rounds: 19, reps: 3 });
      } finally {
        await cleanupRaw.benchmarkResult
          .deleteMany({ where: { id: { in: [first.id, second.id] } } })
          .catch(() => {});
      }
    });
  });

  describe("load → OneRMRecord (Must-Test 3)", () => {
    it("writes a OneRMRecord in the same transaction and resolves a dependent percentage row", async () => {
      const loadBenchmark = await addBenchmarkSchemaWithRow(sessionId, "load", 10);
      const percentage = await addPercentageRowToSession(sessionId, loadBenchmark.exerciseId, 11);

      const created = await lmsBenchmarkResultApi.logBenchmarkResult(
        scenario.athlete.id,
        sessionId,
        {
          plannedSchemaId: loadBenchmark.schemaId,
          result: { type: "load", kg: 100 },
        },
      );

      try {
        const oneRMRows = await cleanupRaw.oneRMRecord.findMany({
          where: { userId: scenario.athlete.id, exerciseId: loadBenchmark.exerciseId },
        });

        expect(oneRMRows).toHaveLength(1);
        expect(Number(oneRMRows[0]?.valueKg)).toBe(100);

        const response = await lmsSessionDetailApi.getDetail(scenario.athlete.id, sessionId);
        const resolvedStatuses = response.blocks
          .flatMap((block) => block.items)
          .flatMap((item) => (item.kind === "schema" ? [item.schema] : []))
          .flatMap((schema) => schema.items)
          .flatMap((rowItem) => (rowItem.kind === "row" ? [rowItem.row] : rowItem.members))
          .map((row) => row.resolvedLoad);

        expect(resolvedStatuses).toContainEqual({
          status: "resolved",
          kg: 75,
          perHand: false,
          source: {
            kind: "one_rm",
            exerciseId: loadBenchmark.exerciseId,
            percent: PERCENT_VALUE,
            baseKg: 100,
            recordedAt: expect.any(String),
            recordSource: OneRMRecordSource.MANUAL,
          },
        });
      } finally {
        await cleanupRaw.benchmarkResult.delete({ where: { id: created.id } }).catch(() => {});
        await cleanupRaw.oneRMRecord
          .deleteMany({
            where: { userId: scenario.athlete.id, exerciseId: loadBenchmark.exerciseId },
          })
          .catch(() => {});
        await cleanup(...percentage.toCleanup, ...loadBenchmark.toCleanup);
      }
    });
  });

  describe("decoupling (Must-Test 4)", () => {
    it("does not create a performed-session and keeps done false after a log", async () => {
      const created = await lmsBenchmarkResultApi.logBenchmarkResult(
        scenario.athlete.id,
        sessionId,
        {
          plannedSchemaId: roundsReps.schemaId,
          result: { type: "rounds_reps", rounds: 12, reps: 0 },
        },
      );

      try {
        const performedCount = await cleanupRaw.performedSession.count({
          where: { sessionId, userId: scenario.athlete.id },
        });

        expect(performedCount).toBe(0);

        const response = await lmsSessionDetailApi.getDetail(scenario.athlete.id, sessionId);

        expect(response.session.done).toBe(false);
        expect(response.session.completedAt).toBeNull();
      } finally {
        await cleanupRaw.benchmarkResult.delete({ where: { id: created.id } }).catch(() => {});
      }
    });
  });

  describe("guards", () => {
    it("throws NotFound for an athlete with no active enrollment (IDOR, Must-Test 5)", async () => {
      await expect(
        lmsBenchmarkResultApi.logBenchmarkResult(unenrolledAthlete.id, sessionId, {
          plannedSchemaId: roundsReps.schemaId,
          result: { type: "rounds_reps", rounds: 18, reps: 7 },
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws BadRequest for a non-benchmark schema (Must-Test 6)", async () => {
      const plain = await addPlainSchema(sessionId, 20);

      try {
        await expect(
          lmsBenchmarkResultApi.logBenchmarkResult(scenario.athlete.id, sessionId, {
            plannedSchemaId: plain.schemaId,
            result: { type: "rounds_reps", rounds: 1, reps: 1 },
          }),
        ).rejects.toThrow(BadRequestError);
      } finally {
        await cleanup(...plain.toCleanup);
      }
    });

    it("throws BadRequest when the result type does not match the benchmark (Must-Test 7)", async () => {
      await expect(
        lmsBenchmarkResultApi.logBenchmarkResult(scenario.athlete.id, sessionId, {
          plannedSchemaId: roundsReps.schemaId,
          result: { type: "time", seconds: 540 },
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequest when the schema belongs to a different session (Must-Test 8)", async () => {
      await expect(
        lmsBenchmarkResultApi.logBenchmarkResult(scenario.athlete.id, sessionId, {
          plannedSchemaId: foreignBenchmark.schemaId,
          result: { type: "rounds_reps", rounds: 18, reps: 7 },
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequest for a load benchmark with no rows before any write (Must-Test 9)", async () => {
      const rowless = await addBenchmarkSchemaWithoutRows(sessionId, "load", 21);

      try {
        await expect(
          lmsBenchmarkResultApi.logBenchmarkResult(scenario.athlete.id, sessionId, {
            plannedSchemaId: rowless.schemaId,
            result: { type: "load", kg: 100 },
          }),
        ).rejects.toThrow(BadRequestError);

        const benchmarkCount = await cleanupRaw.benchmarkResult.count({
          where: { userId: scenario.athlete.id, plannedSchemaId: rowless.schemaId },
        });
        const oneRMCount = await cleanupRaw.oneRMRecord.count({
          where: { userId: scenario.athlete.id },
        });

        expect(benchmarkCount).toBe(0);
        expect(oneRMCount).toBe(0);
      } finally {
        await cleanup(...rowless.toCleanup);
      }
    });
  });

  describe("load bound and atomicity (Must-Test 10, QA-003)", () => {
    it("rejects a load over the Decimal column bound at the request schema (Zod 400)", () => {
      const result = createBenchmarkResultSchema.safeParse({
        plannedSchemaId: "clz000000000000000000sch1",
        result: { type: "load", kg: ONE_RM_MAX_KG + 1 },
      });

      expect(result.success).toBe(false);
    });

    it("rolls back both rows when the OneRMRecord write overflows the column", async () => {
      const loadBenchmark = await addBenchmarkSchemaWithRow(sessionId, "load", 30);

      try {
        await expect(
          lmsBenchmarkResultApi.logBenchmarkResult(scenario.athlete.id, sessionId, {
            plannedSchemaId: loadBenchmark.schemaId,
            result: { type: "load", kg: 10000 },
          }),
        ).rejects.toThrow();

        const benchmarkCount = await cleanupRaw.benchmarkResult.count({
          where: { userId: scenario.athlete.id, plannedSchemaId: loadBenchmark.schemaId },
        });
        const oneRMCount = await cleanupRaw.oneRMRecord.count({
          where: { userId: scenario.athlete.id, exerciseId: loadBenchmark.exerciseId },
        });

        expect(benchmarkCount).toBe(0);
        expect(oneRMCount).toBe(0);
      } finally {
        await cleanup(...loadBenchmark.toCleanup);
      }
    });
  });

  describe("deterministic latest on a same-millisecond tie (Must-Test 11, QA-004)", () => {
    it("resolves the same existingResult on every read when two appends share recordedAt", async () => {
      const recordedAt = new Date("2026-06-18T10:00:00.000Z");
      const first = await cleanupRaw.benchmarkResult.create({
        data: {
          userId: scenario.athlete.id,
          plannedSchemaId: roundsReps.schemaId,
          result: toInputJson({ type: "rounds_reps", rounds: 10, reps: 1 }),
          recordedAt,
        },
      });
      const second = await cleanupRaw.benchmarkResult.create({
        data: {
          userId: scenario.athlete.id,
          plannedSchemaId: roundsReps.schemaId,
          result: toInputJson({ type: "rounds_reps", rounds: 20, reps: 2 }),
          recordedAt,
        },
      });

      try {
        const winnerId = first.id > second.id ? first.id : second.id;
        const winnerResult =
          winnerId === first.id
            ? { type: "rounds_reps", rounds: 10, reps: 1 }
            : { type: "rounds_reps", rounds: 20, reps: 2 };

        const readOnce = await lmsSessionDetailApi.getDetail(scenario.athlete.id, sessionId);
        const readTwice = await lmsSessionDetailApi.getDetail(scenario.athlete.id, sessionId);

        const existingOf = (
          response: Awaited<ReturnType<typeof lmsSessionDetailApi.getDetail>>,
        ): unknown =>
          response.blocks
            .flatMap((block) => block.items)
            .flatMap((item) => (item.kind === "schema" ? [item.schema] : []))
            .find((entry) => entry.schemaId === roundsReps.schemaId)?.existingResult;

        expect(existingOf(readOnce)).toEqual(winnerResult);
        expect(existingOf(readTwice)).toEqual(winnerResult);
      } finally {
        await cleanupRaw.benchmarkResult
          .deleteMany({ where: { id: { in: [first.id, second.id] } } })
          .catch(() => {});
      }
    });
  });

  describe("pre-boarding hidden session (Must-Test 12, QA-006)", () => {
    it("throws NotFound when the session is before a hidden boarding week, matching the read guard", async () => {
      const hiddenCoach = scenario.coach;
      const hiddenAthlete = await createTestUser();
      const hiddenPlan = await createTestPlan(hiddenCoach.user.id, { status: "ACTIVE" });
      const hiddenEnrollment = await createTestEnrollment(
        hiddenPlan.id,
        hiddenAthlete.id,
        hiddenCoach.user.id,
        { status: EnrollmentStatus.ACTIVE, boardedAt: new Date("2026-07-06T00:00:00.000Z") },
      );

      await prisma.planEnrollment.update({
        where: { id: hiddenEnrollment.enrollment.id },
        data: { hidePastBeforeBoarding: true },
      });

      const hiddenWeek = await cleanupRaw.week.create({
        data: { planId: hiddenPlan.id, startDate: new Date("2026-06-15T00:00:00.000Z") },
      });
      const hiddenDay = await cleanupRaw.day.create({
        data: { weekId: hiddenWeek.id, dayOfWeek: DayOfWeek.MONDAY },
      });
      const hiddenSession = await cleanupRaw.session.create({
        data: { dayId: hiddenDay.id, order: 0 },
      });
      const hiddenBenchmark = await addBenchmarkSchemaWithRow(hiddenSession.id, "rounds_reps", 0);

      try {
        await expect(
          lmsBenchmarkResultApi.logBenchmarkResult(hiddenAthlete.id, hiddenSession.id, {
            plannedSchemaId: hiddenBenchmark.schemaId,
            result: { type: "rounds_reps", rounds: 18, reps: 7 },
          }),
        ).rejects.toThrow(NotFoundError);
      } finally {
        await cleanup(
          ...hiddenBenchmark.toCleanup,
          { table: "session", id: hiddenSession.id },
          { table: "day", id: hiddenDay.id },
          { table: "week", id: hiddenWeek.id },
          ...hiddenEnrollment.toCleanup,
          { table: "trainingPlan", id: hiddenPlan.id },
          { table: "user", id: hiddenAthlete.id },
        );
      }
    });
  });
});
