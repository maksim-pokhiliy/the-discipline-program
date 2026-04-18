import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { ConflictError, ForbiddenError, NotFoundError } from "@repo/errors";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import {
  cleanup,
  cleanupRaw,
  createTestBenchmarkDefinition,
  createTestCoach,
  createTestUser,
} from "../../test/helpers";

import { lmsBenchmarkDefinitionApi } from "./benchmark-definition";

describe("lmsBenchmarkDefinitionApi", () => {
  let adminUser: Awaited<ReturnType<typeof createTestUser>>;
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let regularUser: Awaited<ReturnType<typeof createTestUser>>;

  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    adminUser = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });
    coach = await createTestCoach();
    regularUser = await createTestUser();
  });

  afterAll(async () => {
    await cleanup(
      ...toCleanup,
      { table: "user", id: adminUser.id },
      { table: "coachProfile", id: coach.profile.id },
      { table: "user", id: coach.user.id },
      { table: "user", id: regularUser.id },
    );
  });

  describe("create", () => {
    it("creates a benchmark definition when user is an admin", async () => {
      const definition = await lmsBenchmarkDefinitionApi.create(adminUser.id, {
        name: `Bench Press ${crypto.randomUUID().slice(0, 8)}`,
        unit: "kg",
      });

      toCleanup.push({ table: "benchmarkDefinition", id: definition.id });

      expect(definition.id).toBeDefined();
      expect(definition.unit).toBe("kg");
      expect(definition.category).toBeNull();
    });

    it("creates a benchmark definition with optional category", async () => {
      const definition = await lmsBenchmarkDefinitionApi.create(adminUser.id, {
        name: `Deadlift ${crypto.randomUUID().slice(0, 8)}`,
        unit: "kg",
        category: "Strength",
      });

      toCleanup.push({ table: "benchmarkDefinition", id: definition.id });

      expect(definition.category).toBe("Strength");
    });

    it("throws ForbiddenError when user is not admin", async () => {
      await expect(
        lmsBenchmarkDefinitionApi.create(regularUser.id, {
          name: "Should Fail",
          unit: "kg",
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it("throws ConflictError for duplicate name", async () => {
      const uniqueName = `Duplicate Test ${crypto.randomUUID().slice(0, 8)}`;

      const first = await lmsBenchmarkDefinitionApi.create(adminUser.id, {
        name: uniqueName,
        unit: "kg",
      });

      toCleanup.push({ table: "benchmarkDefinition", id: first.id });

      await expect(
        lmsBenchmarkDefinitionApi.create(adminUser.id, {
          name: uniqueName,
          unit: "reps",
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("getAll", () => {
    it("returns all benchmark definitions", async () => {
      const definition = await lmsBenchmarkDefinitionApi.create(adminUser.id, {
        name: `GetAll Test ${crypto.randomUUID().slice(0, 8)}`,
        unit: "sec",
      });

      toCleanup.push({ table: "benchmarkDefinition", id: definition.id });

      const all = await lmsBenchmarkDefinitionApi.getAll();

      expect(all.some((d) => d.id === definition.id)).toBe(true);
    });
  });

  describe("getById", () => {
    it("returns a definition by ID", async () => {
      const definition = await lmsBenchmarkDefinitionApi.create(adminUser.id, {
        name: `GetById Test ${crypto.randomUUID().slice(0, 8)}`,
        unit: "m",
      });

      toCleanup.push({ table: "benchmarkDefinition", id: definition.id });

      const fetched = await lmsBenchmarkDefinitionApi.getById(definition.id);

      expect(fetched.id).toBe(definition.id);
      expect(fetched.unit).toBe("m");
    });

    it("throws NotFoundError for non-existent definition", async () => {
      const fakeId = "cm000000000000000000fake0";

      await expect(lmsBenchmarkDefinitionApi.getById(fakeId)).rejects.toThrow(NotFoundError);
    });
  });

  describe("update", () => {
    it("updates a definition name and unit", async () => {
      const definition = await lmsBenchmarkDefinitionApi.create(adminUser.id, {
        name: `Update Test ${crypto.randomUUID().slice(0, 8)}`,
        unit: "kg",
      });

      toCleanup.push({ table: "benchmarkDefinition", id: definition.id });

      const updated = await lmsBenchmarkDefinitionApi.update(adminUser.id, definition.id, {
        unit: "lb",
      });

      expect(updated.unit).toBe("lb");
      expect(updated.id).toBe(definition.id);
    });

    it("throws NotFoundError for non-existent definition", async () => {
      const fakeId = "cm000000000000000000fake1";

      await expect(
        lmsBenchmarkDefinitionApi.update(adminUser.id, fakeId, { unit: "lb" }),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws ForbiddenError when user is not admin", async () => {
      const definition = await lmsBenchmarkDefinitionApi.create(adminUser.id, {
        name: `AuthUpdate Test ${crypto.randomUUID().slice(0, 8)}`,
        unit: "kg",
      });

      toCleanup.push({ table: "benchmarkDefinition", id: definition.id });

      await expect(
        lmsBenchmarkDefinitionApi.update(regularUser.id, definition.id, { unit: "lb" }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("delete", () => {
    it("deletes a definition with no references", async () => {
      const definition = await lmsBenchmarkDefinitionApi.create(adminUser.id, {
        name: `Delete Test ${crypto.randomUUID().slice(0, 8)}`,
        unit: "kg",
      });

      await lmsBenchmarkDefinitionApi.delete(adminUser.id, definition.id);

      await expect(lmsBenchmarkDefinitionApi.getById(definition.id)).rejects.toThrow(NotFoundError);
    });

    it("throws ConflictError when definition has user benchmarks", async () => {
      const definition = await createTestBenchmarkDefinition();

      toCleanup.push({ table: "benchmarkDefinition", id: definition.id });

      const userBenchmark = await cleanupRaw.userBenchmark.create({
        data: {
          userId: coach.user.id,
          benchmarkDefinitionId: definition.id,
          value: 100,
        },
      });

      toCleanup.push({ table: "userBenchmark", id: userBenchmark.id });

      await expect(lmsBenchmarkDefinitionApi.delete(adminUser.id, definition.id)).rejects.toThrow(
        ConflictError,
      );
    });

    it("throws NotFoundError for non-existent definition", async () => {
      const fakeId = "cm000000000000000000fake2";

      await expect(lmsBenchmarkDefinitionApi.delete(adminUser.id, fakeId)).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws ForbiddenError when user is not admin", async () => {
      const definition = await lmsBenchmarkDefinitionApi.create(adminUser.id, {
        name: `AuthDelete Test ${crypto.randomUUID().slice(0, 8)}`,
        unit: "kg",
      });

      toCleanup.push({ table: "benchmarkDefinition", id: definition.id });

      await expect(lmsBenchmarkDefinitionApi.delete(regularUser.id, definition.id)).rejects.toThrow(
        ForbiddenError,
      );
    });
  });
});
