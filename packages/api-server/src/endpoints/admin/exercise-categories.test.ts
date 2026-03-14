import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ConflictError } from "@repo/errors";

import { cleanupRaw, createTestExercise } from "../../test/helpers";

import { adminExerciseCategoriesApi } from "./exercise-categories";

describe("adminExerciseCategoriesApi", () => {
  let categoryWithExercises: Awaited<ReturnType<typeof cleanupRaw.exerciseCategory.create>>;
  let categoryEmpty: Awaited<ReturnType<typeof cleanupRaw.exerciseCategory.create>>;
  let exercise: Awaited<ReturnType<typeof createTestExercise>>;

  beforeAll(async () => {
    categoryWithExercises = await cleanupRaw.exerciseCategory.create({
      data: { name: `CatWithEx ${crypto.randomUUID().slice(0, 8)}` },
    });

    categoryEmpty = await cleanupRaw.exerciseCategory.create({
      data: { name: `CatEmpty ${crypto.randomUUID().slice(0, 8)}` },
    });

    exercise = await createTestExercise({ categoryId: categoryWithExercises.id });
  });

  afterAll(async () => {
    await cleanupRaw.exercise.delete({ where: { id: exercise.id } }).catch(() => {});
    await cleanupRaw.exerciseCategory
      .delete({ where: { id: categoryWithExercises.id } })
      .catch(() => {});
    await cleanupRaw.exerciseCategory.delete({ where: { id: categoryEmpty.id } }).catch(() => {});
  });

  describe("delete", () => {
    it("successfully deletes category with no exercises", async () => {
      const tempCategory = await cleanupRaw.exerciseCategory.create({
        data: { name: `TempCat ${crypto.randomUUID().slice(0, 8)}` },
      });

      await expect(adminExerciseCategoriesApi.delete(tempCategory.id)).resolves.toBeUndefined();

      const found = await cleanupRaw.exerciseCategory.findUnique({
        where: { id: tempCategory.id },
      });

      expect(found).toBeNull();
    });

    it("throws ConflictError when category has exercises assigned", async () => {
      await expect(adminExerciseCategoriesApi.delete(categoryWithExercises.id)).rejects.toThrow(
        ConflictError,
      );
    });
  });
});
