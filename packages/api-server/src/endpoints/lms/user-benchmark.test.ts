import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ForbiddenError, NotFoundError } from "@repo/errors";

import {
  cleanup,
  createTestBenchmarkDefinition,
  createTestScenario,
  createTestUser,
  type TestScenario,
} from "../../test/helpers";

import { lmsUserBenchmarkApi } from "./user-benchmark";

describe("lmsUserBenchmarkApi", () => {
  let scenario: TestScenario;
  let definition: Awaited<ReturnType<typeof createTestBenchmarkDefinition>>;
  let definition2: Awaited<ReturnType<typeof createTestBenchmarkDefinition>>;
  let outsideUser: Awaited<ReturnType<typeof createTestUser>>;

  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    scenario = await createTestScenario({ athleteCount: 2 });
    definition = await createTestBenchmarkDefinition();
    definition2 = await createTestBenchmarkDefinition();
    outsideUser = await createTestUser();
  });

  afterAll(async () => {
    await cleanup(
      ...toCleanup,
      { table: "benchmarkDefinition", id: definition.id },
      { table: "benchmarkDefinition", id: definition2.id },
      { table: "user", id: outsideUser.id },
      ...scenario.toCleanup,
    );
  });

  const athlete = (index: number) => {
    const a = scenario.athletes[index];

    if (!a) {
      throw new Error(`athlete[${index}] not found`);
    }

    return a;
  };

  describe("create", () => {
    it("creates a user benchmark for self", async () => {
      const benchmark = await lmsUserBenchmarkApi.create(athlete(0).user.id, athlete(0).user.id, {
        benchmarkDefinitionId: definition.id,
        value: 120.5,
      });

      toCleanup.push({ table: "userBenchmark", id: benchmark.id });

      expect(benchmark.id).toBeDefined();
      expect(benchmark.userId).toBe(athlete(0).user.id);
      expect(benchmark.benchmarkDefinitionId).toBe(definition.id);
      expect(benchmark.value).toBe(120.5);
    });

    it("creates a user benchmark by coach for athlete", async () => {
      const benchmark = await lmsUserBenchmarkApi.create(
        scenario.coach.user.id,
        athlete(1).user.id,
        { benchmarkDefinitionId: definition.id, value: 80 },
      );

      toCleanup.push({ table: "userBenchmark", id: benchmark.id });

      expect(benchmark.userId).toBe(athlete(1).user.id);
      expect(benchmark.value).toBe(80);
    });

    it("throws ForbiddenError when non-coach accesses another user", async () => {
      await expect(
        lmsUserBenchmarkApi.create(outsideUser.id, athlete(0).user.id, {
          benchmarkDefinitionId: definition2.id,
          value: 50,
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it("throws ForbiddenError when coach accesses non-enrolled user", async () => {
      await expect(
        lmsUserBenchmarkApi.create(scenario.coach.user.id, outsideUser.id, {
          benchmarkDefinitionId: definition2.id,
          value: 50,
        }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("getByUser", () => {
    it("returns benchmarks for self", async () => {
      const benchmark = await lmsUserBenchmarkApi.create(athlete(0).user.id, athlete(0).user.id, {
        benchmarkDefinitionId: definition2.id,
        value: 200,
      });

      toCleanup.push({ table: "userBenchmark", id: benchmark.id });

      const benchmarks = await lmsUserBenchmarkApi.getByUser(
        athlete(0).user.id,
        athlete(0).user.id,
      );

      expect(benchmarks.some((b) => b.id === benchmark.id)).toBe(true);
    });

    it("returns benchmarks when coach accesses enrolled athlete", async () => {
      const benchmarks = await lmsUserBenchmarkApi.getByUser(
        scenario.coach.user.id,
        athlete(0).user.id,
      );

      expect(Array.isArray(benchmarks)).toBe(true);
    });

    it("throws ForbiddenError when non-coach accesses another user", async () => {
      await expect(
        lmsUserBenchmarkApi.getByUser(outsideUser.id, athlete(0).user.id),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("update", () => {
    it("updates own benchmark value", async () => {
      const benchmark = await lmsUserBenchmarkApi.create(athlete(1).user.id, athlete(1).user.id, {
        benchmarkDefinitionId: definition2.id,
        value: 60,
      });

      toCleanup.push({ table: "userBenchmark", id: benchmark.id });

      const updated = await lmsUserBenchmarkApi.update(athlete(1).user.id, benchmark.id, {
        value: 75,
      });

      expect(updated.value).toBe(75);
      expect(updated.id).toBe(benchmark.id);
    });

    it("throws NotFoundError for non-existent benchmark", async () => {
      const fakeId = "cm000000000000000000fake0";

      await expect(
        lmsUserBenchmarkApi.update(athlete(0).user.id, fakeId, { value: 100 }),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws ForbiddenError when another athlete tries to update", async () => {
      const extraDef = await createTestBenchmarkDefinition();

      toCleanup.push({ table: "benchmarkDefinition", id: extraDef.id });

      const benchmark = await lmsUserBenchmarkApi.create(athlete(0).user.id, athlete(0).user.id, {
        benchmarkDefinitionId: extraDef.id,
        value: 90,
      });

      toCleanup.push({ table: "userBenchmark", id: benchmark.id });

      await expect(
        lmsUserBenchmarkApi.update(outsideUser.id, benchmark.id, { value: 999 }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("delete", () => {
    it("deletes own benchmark", async () => {
      const def = await createTestBenchmarkDefinition();

      toCleanup.push({ table: "benchmarkDefinition", id: def.id });

      const benchmark = await lmsUserBenchmarkApi.create(athlete(0).user.id, athlete(0).user.id, {
        benchmarkDefinitionId: def.id,
        value: 100,
      });

      await lmsUserBenchmarkApi.delete(athlete(0).user.id, benchmark.id);

      const remaining = await lmsUserBenchmarkApi.getByUser(athlete(0).user.id, athlete(0).user.id);

      expect(remaining.some((b) => b.id === benchmark.id)).toBe(false);
    });

    it("throws NotFoundError for non-existent benchmark", async () => {
      const fakeId = "cm000000000000000000fake1";

      await expect(lmsUserBenchmarkApi.delete(athlete(0).user.id, fakeId)).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws ForbiddenError when outsider tries to delete", async () => {
      const def = await createTestBenchmarkDefinition();

      toCleanup.push({ table: "benchmarkDefinition", id: def.id });

      const benchmark = await lmsUserBenchmarkApi.create(athlete(0).user.id, athlete(0).user.id, {
        benchmarkDefinitionId: def.id,
        value: 50,
      });

      toCleanup.push({ table: "userBenchmark", id: benchmark.id });

      await expect(lmsUserBenchmarkApi.delete(outsideUser.id, benchmark.id)).rejects.toThrow(
        ForbiddenError,
      );
    });
  });
});
