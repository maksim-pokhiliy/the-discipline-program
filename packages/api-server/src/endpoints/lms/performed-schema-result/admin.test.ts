import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "@repo/errors";

import { cleanup, cleanupRaw, createTestPlan, createTestUser } from "../../../test/helpers";
import {
  type CleanupEntry,
  createTestBenchmarkSchema,
  createTestPerformedSchemaResult,
  createTestPerformedSession,
} from "../../../test/schedule-helpers";

import { lmsPerformedSchemaResultApi } from "./admin";

describe("lmsPerformedSchemaResultApi", () => {
  let athlete: Awaited<ReturnType<typeof createTestUser>>;
  let otherAthlete: Awaited<ReturnType<typeof createTestUser>>;
  let coach: Awaited<ReturnType<typeof createTestUser>>;

  let planId: string;

  let benchmarkSchemaId: string;
  let nonBenchmarkSchemaId: string;
  let foreignSessionSchemaId: string;

  let performedSessionId: string;
  let otherPerformedSessionId: string;

  const toCleanup: CleanupEntry[] = [];

  beforeAll(async () => {
    athlete = await createTestUser();
    otherAthlete = await createTestUser();
    coach = await createTestUser();

    toCleanup.push(
      { table: "user", id: coach.id },
      { table: "user", id: otherAthlete.id },
      { table: "user", id: athlete.id },
    );

    const plan = await createTestPlan(coach.id, { status: "ACTIVE" });

    planId = plan.id;
    toCleanup.push({ table: "trainingPlan", id: planId });

    const performedDay = await createTestBenchmarkSchema(planId, { resultType: "time" });

    benchmarkSchemaId = performedDay.schema.id;
    toCleanup.push(...performedDay.toCleanup);

    const nonBenchmarkSchema = await cleanupRaw.schema.create({
      data: { blockId: performedDay.block.id, order: 1 },
    });

    nonBenchmarkSchemaId = nonBenchmarkSchema.id;
    toCleanup.push({ table: "schema", id: nonBenchmarkSchemaId });

    const foreignDay = await createTestBenchmarkSchema(planId, {
      resultType: "time",
      startDate: new Date("2026-02-02T00:00:00.000Z"),
    });

    foreignSessionSchemaId = foreignDay.schema.id;
    toCleanup.push(...foreignDay.toCleanup);

    const performed = await createTestPerformedSession(performedDay.session.id, athlete.id, {
      performedAt: new Date("2026-01-05T00:00:00.000Z"),
    });

    performedSessionId = performed.performed.id;
    toCleanup.push(...performed.toCleanup);

    const otherPerformed = await createTestPerformedSession(
      performedDay.session.id,
      otherAthlete.id,
      { performedAt: new Date("2026-01-05T00:00:00.000Z") },
    );

    otherPerformedSessionId = otherPerformed.performed.id;
    toCleanup.push(...otherPerformed.toCleanup);
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
  });

  describe("create", () => {
    it("persists a result for a benchmark schema in the performed session (happy path)", async () => {
      const created = await lmsPerformedSchemaResultApi.create(athlete.id, performedSessionId, {
        plannedSchemaId: benchmarkSchemaId,
        result: { type: "time", seconds: 180 },
      });

      try {
        expect(created.performedSessionId).toBe(performedSessionId);
        expect(created.plannedSchemaId).toBe(benchmarkSchemaId);
        expect(created.result).toEqual({ type: "time", seconds: 180 });
      } finally {
        await cleanup({ table: "performedSchemaResult", id: created.id });
      }
    });

    it("rejects a result on a non-benchmark schema (QA-005)", async () => {
      await expect(
        lmsPerformedSchemaResultApi.create(athlete.id, performedSessionId, {
          plannedSchemaId: nonBenchmarkSchemaId,
          result: { type: "time", seconds: 180 },
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it("rejects a result whose type does not match the benchmark resultType (QA-002)", async () => {
      await expect(
        lmsPerformedSchemaResultApi.create(athlete.id, performedSessionId, {
          plannedSchemaId: benchmarkSchemaId,
          result: { type: "load", kg: 100 },
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it("rejects a schema that is not in the performed session's session (QA-001)", async () => {
      await expect(
        lmsPerformedSchemaResultApi.create(athlete.id, performedSessionId, {
          plannedSchemaId: foreignSessionSchemaId,
          result: { type: "time", seconds: 180 },
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it("rejects attaching to another athlete's performed session (QA-003)", async () => {
      await expect(
        lmsPerformedSchemaResultApi.create(athlete.id, otherPerformedSessionId, {
          plannedSchemaId: benchmarkSchemaId,
          result: { type: "time", seconds: 180 },
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it("rejects a result for a missing performed session with NotFoundError", async () => {
      await expect(
        lmsPerformedSchemaResultApi.create(athlete.id, "ckmissingperformed000000000", {
          plannedSchemaId: benchmarkSchemaId,
          result: { type: "time", seconds: 180 },
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("rejects a duplicate (performedSessionId, plannedSchemaId) with ConflictError (QA-019)", async () => {
      const first = await createTestPerformedSchemaResult(performedSessionId, benchmarkSchemaId, {
        type: "time",
        seconds: 200,
      });

      try {
        await expect(
          lmsPerformedSchemaResultApi.create(athlete.id, performedSessionId, {
            plannedSchemaId: benchmarkSchemaId,
            result: { type: "time", seconds: 195 },
          }),
        ).rejects.toThrow(ConflictError);
      } finally {
        await cleanup({ table: "performedSchemaResult", id: first.result.id });
      }
    });
  });
});
