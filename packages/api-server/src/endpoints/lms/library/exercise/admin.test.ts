import { afterAll, describe, expect, it } from "vitest";

import { ConflictError, NotFoundError } from "@repo/errors";

import { cleanup } from "../../../../test/helpers";

import { lmsExerciseAdminApi } from "./admin";

const uniqueName = (prefix: string): string => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

const baseExerciseData = (overrides: Record<string, unknown> = {}) => ({
  name: uniqueName("test-exercise"),
  urls: [],
  primaryMovement: "SQUAT" as const,
  ...overrides,
});

describe("lmsExerciseAdminApi", () => {
  const toCleanup: { table: string; id: string }[] = [];

  afterAll(async () => {
    await cleanup(...toCleanup);
  });

  describe("getExercises", () => {
    it("returns an array", async () => {
      const exercises = await lmsExerciseAdminApi.getExercises();

      expect(Array.isArray(exercises)).toBe(true);
    });
  });

  describe("createExercise", () => {
    it("creates and returns mapped exercise", async () => {
      const data = baseExerciseData();
      const exercise = await lmsExerciseAdminApi.createExercise(data);

      toCleanup.push({ table: "exercise", id: exercise.id });

      expect(exercise.id).toBeDefined();
      expect(exercise.name).toBe(data.name);
      expect(exercise.urls).toEqual([]);
      expect(exercise.primaryMovement).toBe("SQUAT");
      expect(exercise.benchmarkPrKind).toBeNull();
      expect(exercise.createdAt).toBeInstanceOf(Date);
      expect(exercise.updatedAt).toBeInstanceOf(Date);
    });

    it("creates with all optional fields", async () => {
      const data = baseExerciseData({
        urls: ["https://example.com/squat-1", "https://example.com/squat-2"],
        benchmarkPrKind: "ONE_REP_MAX",
      });
      const exercise = await lmsExerciseAdminApi.createExercise(data);

      toCleanup.push({ table: "exercise", id: exercise.id });

      expect(exercise.urls).toHaveLength(2);
      expect(exercise.benchmarkPrKind).toBe("ONE_REP_MAX");
    });

    it("rejects exact duplicate name with ConflictError", async () => {
      const data = baseExerciseData();
      const created = await lmsExerciseAdminApi.createExercise(data);

      toCleanup.push({ table: "exercise", id: created.id });

      await expect(lmsExerciseAdminApi.createExercise(data)).rejects.toThrow(ConflictError);
    });

    it("rejects case-insensitive duplicate name with ConflictError", async () => {
      const data = baseExerciseData({ name: uniqueName("ci-exercise") });
      const created = await lmsExerciseAdminApi.createExercise(data);

      toCleanup.push({ table: "exercise", id: created.id });

      await expect(
        lmsExerciseAdminApi.createExercise({ ...data, name: data.name.toUpperCase() }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("getExerciseById", () => {
    it("returns exercise by ID", async () => {
      const created = await lmsExerciseAdminApi.createExercise(baseExerciseData());

      toCleanup.push({ table: "exercise", id: created.id });

      const found = await lmsExerciseAdminApi.getExerciseById(created.id);

      expect(found.id).toBe(created.id);
      expect(found.name).toBe(created.name);
    });

    it("throws NotFoundError for non-existent ID", async () => {
      await expect(lmsExerciseAdminApi.getExerciseById("non-existent-id")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("updateExercise", () => {
    it("updates and returns exercise", async () => {
      const created = await lmsExerciseAdminApi.createExercise(baseExerciseData());

      toCleanup.push({ table: "exercise", id: created.id });

      const updated = await lmsExerciseAdminApi.updateExercise(created.id, {
        name: uniqueName("updated-exercise"),
        primaryMovement: "HINGE",
      });

      expect(updated.id).toBe(created.id);
      expect(updated.primaryMovement).toBe("HINGE");
    });

    it("allows updating to the same name (excludeId branch)", async () => {
      const created = await lmsExerciseAdminApi.createExercise(baseExerciseData());

      toCleanup.push({ table: "exercise", id: created.id });

      const updated = await lmsExerciseAdminApi.updateExercise(created.id, {
        name: created.name,
      });

      expect(updated.name).toBe(created.name);
    });

    it("rejects rename to existing other name with ConflictError", async () => {
      const first = await lmsExerciseAdminApi.createExercise(baseExerciseData());

      toCleanup.push({ table: "exercise", id: first.id });

      const second = await lmsExerciseAdminApi.createExercise(baseExerciseData());

      toCleanup.push({ table: "exercise", id: second.id });

      await expect(
        lmsExerciseAdminApi.updateExercise(second.id, { name: first.name }),
      ).rejects.toThrow(ConflictError);
    });

    it("throws NotFoundError for non-existent ID", async () => {
      await expect(
        lmsExerciseAdminApi.updateExercise("non-existent-id", { primaryMovement: "PULL_VERTICAL" }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteExercise", () => {
    it("soft-deletes exercise (invisible after)", async () => {
      const created = await lmsExerciseAdminApi.createExercise(baseExerciseData());

      toCleanup.push({ table: "exercise", id: created.id });

      await lmsExerciseAdminApi.deleteExercise(created.id);

      await expect(lmsExerciseAdminApi.getExerciseById(created.id)).rejects.toThrow(NotFoundError);
    });

    it("excludes soft-deleted exercise from getExercises list", async () => {
      const created = await lmsExerciseAdminApi.createExercise(baseExerciseData());

      toCleanup.push({ table: "exercise", id: created.id });

      await lmsExerciseAdminApi.deleteExercise(created.id);

      const exercises = await lmsExerciseAdminApi.getExercises();
      const ids = exercises.map((e) => e.id);

      expect(ids).not.toContain(created.id);
    });

    it("allows recreating with the same name after soft-delete", async () => {
      const reusableName = uniqueName("recreate-exercise");
      const first = await lmsExerciseAdminApi.createExercise(
        baseExerciseData({ name: reusableName }),
      );

      toCleanup.push({ table: "exercise", id: first.id });

      await lmsExerciseAdminApi.deleteExercise(first.id);

      const second = await lmsExerciseAdminApi.createExercise(
        baseExerciseData({ name: reusableName }),
      );

      toCleanup.push({ table: "exercise", id: second.id });

      expect(second.id).not.toBe(first.id);
      expect(second.name).toBe(reusableName);
    });
  });

  describe("getExercisesPageData", () => {
    it("returns shape with exercises array", async () => {
      const pageData = await lmsExerciseAdminApi.getExercisesPageData();

      expect(pageData).toHaveProperty("exercises");
      expect(Array.isArray(pageData.exercises)).toBe(true);
    });
  });
});
