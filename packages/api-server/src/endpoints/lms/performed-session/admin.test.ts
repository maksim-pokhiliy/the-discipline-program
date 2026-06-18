import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createPerformedSessionRequestSchema,
  PERFORMED_SESSION_CONSTANTS,
} from "@repo/contracts/lms/performed-session";
import { BadRequestError, ForbiddenError } from "@repo/errors";

import { cleanup, cleanupRaw, createTestPlan, createTestUser } from "../../../test/helpers";
import {
  type CleanupEntry,
  createTestBenchmarkSchema,
  createTestScheduleScenario,
} from "../../../test/schedule-helpers";
import { toInputJson } from "../../../utils";

import { lmsPerformedSessionApi } from "./admin";

const addBenchmarkSchemaToSession = async (
  sessionId: string,
  resultType: string,
): Promise<{ schemaId: string; toCleanup: CleanupEntry[] }> => {
  const block = await cleanupRaw.block.create({ data: { sessionId, order: 0 } });
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

const addPlainSchemaToSession = async (
  sessionId: string,
): Promise<{ schemaId: string; toCleanup: CleanupEntry[] }> => {
  const block = await cleanupRaw.block.create({ data: { sessionId, order: 1 } });
  const schema = await cleanupRaw.schema.create({ data: { blockId: block.id, order: 0 } });

  return {
    schemaId: schema.id,
    toCleanup: [
      { table: "schema", id: schema.id },
      { table: "block", id: block.id },
    ],
  };
};

describe("lmsPerformedSessionApi", () => {
  let scenario: Awaited<ReturnType<typeof createTestScheduleScenario>>;
  let enrolledSessionId: string;

  let unenrolledAthlete: Awaited<ReturnType<typeof createTestUser>>;
  let sessionInUnenrolledPlanId: string;

  const extraCleanup: CleanupEntry[] = [];

  beforeAll(async () => {
    scenario = await createTestScheduleScenario({
      tz: "UTC",
      weeksBack: 0,
      sessionsPerWeek: 1,
    });

    const firstSession = scenario.sessions[0];

    if (!firstSession) {
      throw new Error("schedule scenario produced no session");
    }

    enrolledSessionId = firstSession.sessionId;

    unenrolledAthlete = await createTestUser();
    extraCleanup.push({ table: "user", id: unenrolledAthlete.id });

    const unenrolledPlan = await createTestPlan(scenario.coach.user.id, { status: "ACTIVE" });

    extraCleanup.push({ table: "trainingPlan", id: unenrolledPlan.id });

    const benchmark = await createTestBenchmarkSchema(unenrolledPlan.id, { resultType: "time" });

    sessionInUnenrolledPlanId = benchmark.session.id;
    extraCleanup.push(...benchmark.toCleanup);
  });

  afterAll(async () => {
    await cleanup(...extraCleanup);
    await cleanup(...scenario.toCleanup);
  });

  describe("create", () => {
    it("persists a tick for a reachable session (QA-004)", async () => {
      const performed = await lmsPerformedSessionApi.create(scenario.athlete.id, {
        sessionId: enrolledSessionId,
        performedAt: new Date("2026-02-01T00:00:00.000Z"),
      });

      try {
        expect(performed.sessionId).toBe(enrolledSessionId);
        expect(performed.userId).toBe(scenario.athlete.id);
        expect(performed.performedAt.getTime()).toBe(
          new Date("2026-02-01T00:00:00.000Z").getTime(),
        );
      } finally {
        await cleanup({ table: "performedSession", id: performed.id });
      }
    });

    it("creates two rows when the same session is logged twice (unbounded, D-LAYERS)", async () => {
      const first = await lmsPerformedSessionApi.create(scenario.athlete.id, {
        sessionId: enrolledSessionId,
        performedAt: new Date("2026-02-01T00:00:00.000Z"),
      });
      const second = await lmsPerformedSessionApi.create(scenario.athlete.id, {
        sessionId: enrolledSessionId,
        performedAt: new Date("2026-02-08T00:00:00.000Z"),
      });

      try {
        expect(second.id).not.toBe(first.id);
        expect(first.sessionId).toBe(enrolledSessionId);
        expect(second.sessionId).toBe(enrolledSessionId);
      } finally {
        await cleanup(
          { table: "performedSession", id: second.id },
          { table: "performedSession", id: first.id },
        );
      }
    });

    it("rejects logging a session in a plan the athlete is not enrolled in (QA-004)", async () => {
      await expect(
        lmsPerformedSessionApi.create(unenrolledAthlete.id, {
          sessionId: enrolledSessionId,
          performedAt: new Date("2026-02-01T00:00:00.000Z"),
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it("rejects logging a session whose plan the athlete has no enrollment in (QA-004)", async () => {
      await expect(
        lmsPerformedSessionApi.create(scenario.athlete.id, {
          sessionId: sessionInUnenrolledPlanId,
          performedAt: new Date("2026-02-01T00:00:00.000Z"),
        }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("create with results (QA-001 — atomic multi-schema benchmark log)", () => {
    it("commits one performed-session and all its results in one transaction", async () => {
      const first = await addBenchmarkSchemaToSession(enrolledSessionId, "time");
      const second = await addBenchmarkSchemaToSession(enrolledSessionId, "rounds_reps");

      const performed = await lmsPerformedSessionApi.create(scenario.athlete.id, {
        sessionId: enrolledSessionId,
        performedAt: new Date("2026-03-01T00:00:00.000Z"),
        results: [
          { plannedSchemaId: first.schemaId, result: { type: "time", seconds: 540 } },
          {
            plannedSchemaId: second.schemaId,
            result: { type: "rounds_reps", rounds: 18, reps: 7 },
          },
        ],
      });

      try {
        const results = await cleanupRaw.performedSchemaResult.findMany({
          where: { performedSessionId: performed.id },
          orderBy: { plannedSchemaId: "asc" },
        });

        expect(performed.sessionId).toBe(enrolledSessionId);
        expect(results).toHaveLength(2);
        expect(results.map((row) => row.plannedSchemaId).sort()).toEqual(
          [first.schemaId, second.schemaId].sort(),
        );
      } finally {
        await cleanup({ table: "performedSession", id: performed.id });
        await cleanup(...second.toCleanup, ...first.toCleanup);
      }
    });

    it("rolls back the performed-session and all results when one result is invalid", async () => {
      const valid = await addBenchmarkSchemaToSession(enrolledSessionId, "time");
      const plain = await addPlainSchemaToSession(enrolledSessionId);

      const performedBefore = await cleanupRaw.performedSession.count({
        where: { sessionId: enrolledSessionId, userId: scenario.athlete.id },
      });
      const resultsBefore = await cleanupRaw.performedSchemaResult.count({
        where: { plannedSchemaId: { in: [valid.schemaId, plain.schemaId] } },
      });

      try {
        await expect(
          lmsPerformedSessionApi.create(scenario.athlete.id, {
            sessionId: enrolledSessionId,
            performedAt: new Date("2026-03-08T00:00:00.000Z"),
            results: [
              { plannedSchemaId: valid.schemaId, result: { type: "time", seconds: 540 } },
              { plannedSchemaId: plain.schemaId, result: { type: "time", seconds: 600 } },
            ],
          }),
        ).rejects.toThrow(BadRequestError);

        const performedAfter = await cleanupRaw.performedSession.count({
          where: { sessionId: enrolledSessionId, userId: scenario.athlete.id },
        });
        const resultsAfter = await cleanupRaw.performedSchemaResult.count({
          where: { plannedSchemaId: { in: [valid.schemaId, plain.schemaId] } },
        });

        expect(performedAfter).toBe(performedBefore);
        expect(resultsAfter).toBe(resultsBefore);
      } finally {
        await cleanup(...plain.toCleanup, ...valid.toCleanup);
      }
    });

    it("rolls back when a result type does not match the benchmark result type", async () => {
      const benchmark = await addBenchmarkSchemaToSession(enrolledSessionId, "time");

      try {
        await expect(
          lmsPerformedSessionApi.create(scenario.athlete.id, {
            sessionId: enrolledSessionId,
            performedAt: new Date("2026-03-15T00:00:00.000Z"),
            results: [
              {
                plannedSchemaId: benchmark.schemaId,
                result: { type: "rounds_reps", rounds: 10, reps: 5 },
              },
            ],
          }),
        ).rejects.toThrow(BadRequestError);

        const performedAfter = await cleanupRaw.performedSession.count({
          where: { sessionId: enrolledSessionId, userId: scenario.athlete.id },
        });

        expect(performedAfter).toBe(0);
      } finally {
        await cleanup(...benchmark.toCleanup);
      }
    });

    it("still logs an ordinary session with no results", async () => {
      const performed = await lmsPerformedSessionApi.create(scenario.athlete.id, {
        sessionId: enrolledSessionId,
        performedAt: new Date("2026-03-22T00:00:00.000Z"),
        results: [],
      });

      try {
        const results = await cleanupRaw.performedSchemaResult.count({
          where: { performedSessionId: performed.id },
        });

        expect(performed.sessionId).toBe(enrolledSessionId);
        expect(results).toBe(0);
      } finally {
        await cleanup({ table: "performedSession", id: performed.id });
      }
    });
  });

  describe("createPerformedSessionRequestSchema", () => {
    it("rejects athleteNotes longer than MAX_NOTE_LENGTH (QA-017)", () => {
      const result = createPerformedSessionRequestSchema.safeParse({
        sessionId: enrolledSessionId,
        performedAt: "2026-02-01T00:00:00.000Z",
        athleteNotes: "a".repeat(PERFORMED_SESSION_CONSTANTS.MAX_NOTE_LENGTH + 1),
      });

      expect(result.success).toBe(false);
    });

    it("accepts athleteNotes at exactly MAX_NOTE_LENGTH (QA-017)", () => {
      const result = createPerformedSessionRequestSchema.safeParse({
        sessionId: enrolledSessionId,
        performedAt: "2026-02-01T00:00:00.000Z",
        athleteNotes: "a".repeat(PERFORMED_SESSION_CONSTANTS.MAX_NOTE_LENGTH),
      });

      expect(result.success).toBe(true);
    });

    it("rejects duplicate plannedSchemaId values in results (QA-001)", () => {
      const result = createPerformedSessionRequestSchema.safeParse({
        sessionId: "clz000000000000000000sess1",
        performedAt: "2026-02-01T00:00:00.000Z",
        results: [
          { plannedSchemaId: "clz000000000000000000sch1", result: { type: "time", seconds: 540 } },
          { plannedSchemaId: "clz000000000000000000sch1", result: { type: "time", seconds: 600 } },
        ],
      });

      expect(result.success).toBe(false);
    });

    it("accepts distinct plannedSchemaId values in results (QA-001)", () => {
      const result = createPerformedSessionRequestSchema.safeParse({
        sessionId: "clz000000000000000000sess1",
        performedAt: "2026-02-01T00:00:00.000Z",
        results: [
          { plannedSchemaId: "clz000000000000000000sch1", result: { type: "time", seconds: 540 } },
          { plannedSchemaId: "clz000000000000000000sch2", result: { type: "time", seconds: 600 } },
        ],
      });

      expect(result.success).toBe(true);
    });
  });
});
