import { OneRMRecordSource } from "@prisma/client";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

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
  createTestBenchmarkResult,
  createTestBenchmarkSchema,
  createTestOneRMRecord,
} from "../../../test/schedule-helpers";

import { lmsRecordsViewApi } from "./records-view";

const exerciseName = (suffix: string): { canonicalName: string; canonicalNameLower: string } => ({
  canonicalName: `Back Squat ${suffix}`,
  canonicalNameLower: `back squat ${suffix}`,
});

type RecordsFixture = {
  athlete: Awaited<ReturnType<typeof createTestUser>>;
  squatExerciseId: string;
  benchmarkSchemaId: string;
  toCleanup: CleanupEntry[];
};

const buildRecordsFixture = async (): Promise<RecordsFixture> => {
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

  const suffix = crypto.randomUUID().slice(0, 8);
  const squat = await createTestExercise(exerciseName(suffix));

  toCleanup.push({ table: "exercise", id: squat.id });

  const benchmark = await createTestBenchmarkSchema(plan.id, { resultType: "time" });

  toCleanup.push(...benchmark.toCleanup);

  await prisma.schema.update({
    where: { id: benchmark.schema.id },
    data: { header: "Fran" },
  });
  await prisma.schemaRow.create({
    data: {
      schemaId: benchmark.schema.id,
      order: 0,
      exerciseId: squat.id,
    },
  });

  return {
    athlete,
    squatExerciseId: squat.id,
    benchmarkSchemaId: benchmark.schema.id,
    toCleanup,
  };
};

describe("lmsRecordsViewApi.getRecords", () => {
  describe("assembled response", () => {
    let fixture: RecordsFixture;

    beforeAll(async () => {
      fixture = await buildRecordsFixture();

      const first = await createTestOneRMRecord(fixture.athlete.id, fixture.squatExerciseId, {
        valueKg: 100,
        recordedAt: new Date("2026-01-01T00:00:00.000Z"),
        source: OneRMRecordSource.MANUAL,
      });
      const second = await createTestOneRMRecord(fixture.athlete.id, fixture.squatExerciseId, {
        valueKg: 120,
        recordedAt: new Date("2026-02-01T00:00:00.000Z"),
        source: OneRMRecordSource.TESTED,
      });
      const third = await createTestOneRMRecord(fixture.athlete.id, fixture.squatExerciseId, {
        valueKg: 110,
        recordedAt: new Date("2026-03-01T00:00:00.000Z"),
        source: OneRMRecordSource.MANUAL,
      });

      const earlier = await createTestBenchmarkResult(
        fixture.athlete.id,
        fixture.benchmarkSchemaId,
        { type: "time", seconds: 180 },
        { recordedAt: new Date("2026-01-10T00:00:00.000Z") },
      );
      const later = await createTestBenchmarkResult(
        fixture.athlete.id,
        fixture.benchmarkSchemaId,
        { type: "time", seconds: 150 },
        { recordedAt: new Date("2026-02-10T00:00:00.000Z") },
      );

      fixture.toCleanup.push(
        ...first.toCleanup,
        ...second.toCleanup,
        ...third.toCleanup,
        ...earlier.toCleanup,
        ...later.toCleanup,
      );
    });

    afterAll(async () => {
      await cleanup(...fixture.toCleanup);
    });

    it("groups one exercise into a single 1RM entry with the JOINed exercise name", async () => {
      const response = await lmsRecordsViewApi.getRecords(fixture.athlete.id);

      expect(response.oneRM).toHaveLength(1);

      const record = response.oneRM[0];

      expect(record?.exerciseId).toBe(fixture.squatExerciseId);
      expect(record?.exerciseName.startsWith("Back Squat ")).toBe(true);
      expect(record?.recordCount).toBe(3);
    });

    it("resolves the all-time best 1RM and a de-load delta from real rows", async () => {
      const response = await lmsRecordsViewApi.getRecords(fixture.athlete.id);
      const record = response.oneRM[0];

      expect(record?.best).toBe(120);
      expect(record?.bestSource).toBe(OneRMRecordSource.TESTED);
      expect(record?.delta).toBe(110 - 120);
    });

    it("emits ISO-string dates for the 1RM headline and series", async () => {
      const response = await lmsRecordsViewApi.getRecords(fixture.athlete.id);
      const record = response.oneRM[0];

      expect(record?.bestRecordedAt).toBe(new Date("2026-02-01T00:00:00.000Z").toISOString());
      expect(record?.lastRecordedAt).toBe(new Date("2026-03-01T00:00:00.000Z").toISOString());
      expect(record?.series.map((point) => point.recordedAt)).toEqual([
        new Date("2026-01-01T00:00:00.000Z").toISOString(),
        new Date("2026-02-01T00:00:00.000Z").toISOString(),
        new Date("2026-03-01T00:00:00.000Z").toISOString(),
      ]);
    });

    it("groups one schema into a single benchmark entry with the JOINed title and subline", async () => {
      const response = await lmsRecordsViewApi.getRecords(fixture.athlete.id);

      expect(response.benchmarks).toHaveLength(1);

      const record = response.benchmarks[0];

      expect(record?.plannedSchemaId).toBe(fixture.benchmarkSchemaId);
      expect(record?.title).toBe("Fran");
      expect(record?.subline).toContain("Back Squat");
      expect(record?.resultType).toBe("time");
    });

    it("resolves the direction-aware best benchmark and an improving delta from real rows", async () => {
      const response = await lmsRecordsViewApi.getRecords(fixture.athlete.id);
      const record = response.benchmarks[0];

      expect(record?.best).toEqual({ type: "time", seconds: 150 });
      expect(record?.bestRecordedAt).toBe(new Date("2026-02-10T00:00:00.000Z").toISOString());
      expect(record?.delta).toEqual({ value: 150 - 180, improved: true });
      expect(record?.attemptCount).toBe(2);
    });
  });

  describe("athlete isolation (IDOR)", () => {
    it("returns only the requesting athlete's records, never another athlete's", async () => {
      const fixtureA = await buildRecordsFixture();
      const fixtureB = await buildRecordsFixture();

      const oneRmA = await createTestOneRMRecord(fixtureA.athlete.id, fixtureA.squatExerciseId, {
        valueKg: 140,
      });
      const oneRmB = await createTestOneRMRecord(fixtureB.athlete.id, fixtureB.squatExerciseId, {
        valueKg: 90,
      });
      const benchA = await createTestBenchmarkResult(
        fixtureA.athlete.id,
        fixtureA.benchmarkSchemaId,
        { type: "time", seconds: 200 },
      );
      const benchB = await createTestBenchmarkResult(
        fixtureB.athlete.id,
        fixtureB.benchmarkSchemaId,
        { type: "time", seconds: 210 },
      );

      try {
        const response = await lmsRecordsViewApi.getRecords(fixtureA.athlete.id);

        expect(response.oneRM).toHaveLength(1);
        expect(response.oneRM[0]?.exerciseId).toBe(fixtureA.squatExerciseId);
        expect(
          response.oneRM.some((record) => record.exerciseId === fixtureB.squatExerciseId),
        ).toBe(false);

        expect(response.benchmarks).toHaveLength(1);
        expect(response.benchmarks[0]?.plannedSchemaId).toBe(fixtureA.benchmarkSchemaId);
        expect(
          response.benchmarks.some(
            (record) => record.plannedSchemaId === fixtureB.benchmarkSchemaId,
          ),
        ).toBe(false);
      } finally {
        await cleanup(
          ...fixtureA.toCleanup,
          ...fixtureB.toCleanup,
          ...oneRmA.toCleanup,
          ...oneRmB.toCleanup,
          ...benchA.toCleanup,
          ...benchB.toCleanup,
        );
      }
    });
  });

  describe("query-count invariant (no N+1, D-RV-11)", () => {
    let fixture: RecordsFixture;

    beforeAll(async () => {
      fixture = await buildRecordsFixture();

      const secondExercise = await createTestExercise(
        exerciseName(crypto.randomUUID().slice(0, 8)),
      );

      fixture.toCleanup.push({ table: "exercise", id: secondExercise.id });

      const oneRmOne = await createTestOneRMRecord(fixture.athlete.id, fixture.squatExerciseId, {
        valueKg: 100,
      });
      const oneRmTwo = await createTestOneRMRecord(fixture.athlete.id, secondExercise.id, {
        valueKg: 80,
      });
      const benchOne = await createTestBenchmarkResult(
        fixture.athlete.id,
        fixture.benchmarkSchemaId,
        { type: "time", seconds: 180 },
        { recordedAt: new Date("2026-01-10T00:00:00.000Z") },
      );
      const benchTwo = await createTestBenchmarkResult(
        fixture.athlete.id,
        fixture.benchmarkSchemaId,
        { type: "time", seconds: 150 },
        { recordedAt: new Date("2026-02-10T00:00:00.000Z") },
      );

      fixture.toCleanup.push(
        ...oneRmOne.toCleanup,
        ...oneRmTwo.toCleanup,
        ...benchOne.toCleanup,
        ...benchTwo.toCleanup,
      );
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    afterAll(async () => {
      await cleanup(...fixture.toCleanup);
    });

    it("issues exactly one findMany per model across a multi-exercise, multi-attempt fixture", async () => {
      const oneRMSpy = vi.spyOn(prisma.oneRMRecord, "findMany");
      const benchmarkSpy = vi.spyOn(prisma.benchmarkResult, "findMany");

      await lmsRecordsViewApi.getRecords(fixture.athlete.id);

      expect(oneRMSpy).toHaveBeenCalledTimes(1);
      expect(benchmarkSpy).toHaveBeenCalledTimes(1);
    });
  });
});
