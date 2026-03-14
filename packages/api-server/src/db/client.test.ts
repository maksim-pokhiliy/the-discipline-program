import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { cleanupRaw, createTestCoach, createTestExercise } from "../test/helpers";

import { prisma } from "./client";

describe("soft-delete extension", () => {
  const toCleanup: { table: string; id: string }[] = [];

  afterAll(async () => {
    for (const { table, id } of toCleanup.reverse()) {
      const delegate = (
        cleanupRaw as unknown as Record<
          string,
          { delete: (args: { where: { id: string } }) => Promise<unknown> }
        >
      )[table];

      if (!delegate) {
        continue;
      }

      await delegate.delete({ where: { id } }).catch(() => {});
    }
  });

  describe("Exercise (soft-delete model)", () => {
    it("findMany filters deleted records", async () => {
      const exercise = await createTestExercise();

      toCleanup.push({ table: "exercise", id: exercise.id });

      await prisma.exercise.delete({ where: { id: exercise.id } });

      const results = await prisma.exercise.findMany({
        where: { id: exercise.id },
      });

      expect(results).toHaveLength(0);
    });

    it("findUnique returns null for deleted records", async () => {
      const exercise = await createTestExercise();

      toCleanup.push({ table: "exercise", id: exercise.id });

      await prisma.exercise.delete({ where: { id: exercise.id } });

      const found = await prisma.exercise.findUnique({
        where: { id: exercise.id },
      });

      expect(found).toBeNull();
    });

    it("findMany with explicit deletedAt override returns deleted records", async () => {
      const exercise = await createTestExercise();

      toCleanup.push({ table: "exercise", id: exercise.id });

      await prisma.exercise.delete({ where: { id: exercise.id } });

      const results = await prisma.exercise.findMany({
        where: { id: exercise.id, deletedAt: { not: null } },
      });

      expect(results).toHaveLength(1);
      const found = results[0];

      if (!found) {
        throw new Error("expected record");
      }

      expect(found.id).toBe(exercise.id);
    });

    it("delete() sets deletedAt instead of removing the row", async () => {
      const exercise = await createTestExercise();

      toCleanup.push({ table: "exercise", id: exercise.id });

      await prisma.exercise.delete({ where: { id: exercise.id } });

      const raw = await cleanupRaw.exercise.findUnique({
        where: { id: exercise.id },
      });

      if (!raw) {
        throw new Error("expected raw record");
      }

      expect(raw.deletedAt).toBeInstanceOf(Date);
    });

    it("delete() mangles unique name field", async () => {
      const originalName = `Unique Exercise ${crypto.randomUUID().slice(0, 8)}`;
      const exercise = await createTestExercise({ name: originalName });

      toCleanup.push({ table: "exercise", id: exercise.id });

      await prisma.exercise.delete({ where: { id: exercise.id } });

      const raw = await cleanupRaw.exercise.findUnique({
        where: { id: exercise.id },
      });

      if (!raw) {
        throw new Error("expected raw record");
      }

      expect(raw.name).toMatch(new RegExp(`^${originalName}_deleted_\\d+$`));
    });
  });

  describe("Product slug mangling on delete", () => {
    it("delete() mangles unique slug field", async () => {
      const originalSlug = `test-slug-${crypto.randomUUID().slice(0, 8)}`;
      const product = await cleanupRaw.product.create({
        data: {
          slug: originalSlug,
          title: "Test Product",
          description: "Test",
          isActive: false,
        },
      });

      toCleanup.push({ table: "product", id: product.id });

      await prisma.product.delete({ where: { id: product.id } });

      const raw = await cleanupRaw.product.findUnique({
        where: { id: product.id },
      });

      if (!raw) {
        throw new Error("expected raw record");
      }

      expect(raw.slug).toMatch(new RegExp(`^${originalSlug}_deleted_\\d+$`));
      expect(raw.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe("non-soft-delete model (WorkoutBlock)", () => {
    let coachProfileId: string;

    beforeAll(async () => {
      const { user, profile } = await createTestCoach();

      coachProfileId = profile.id;
      toCleanup.push({ table: "coachProfile", id: profile.id }, { table: "user", id: user.id });
    });

    it("hard-deletes records not in SOFT_DELETE_MODELS", async () => {
      const plan = await cleanupRaw.trainingPlan.create({
        data: { coachId: coachProfileId, name: `Plan ${crypto.randomUUID().slice(0, 8)}` },
      });

      toCleanup.push({ table: "trainingPlan", id: plan.id });

      const workout = await cleanupRaw.workout.create({
        data: { planId: plan.id, title: "Test Workout", sortOrder: 0 },
      });

      toCleanup.push({ table: "workout", id: workout.id });

      const category = await cleanupRaw.exerciseCategory.findFirst();
      let categoryId: string;

      if (category) {
        categoryId = category.id;
      } else {
        const created = await cleanupRaw.exerciseCategory.create({
          data: { name: `Test Cat ${crypto.randomUUID().slice(0, 8)}` },
        });

        categoryId = created.id;
        toCleanup.push({ table: "exerciseCategory", id: categoryId });
      }

      const block = await cleanupRaw.workoutBlock.create({
        data: { workoutId: workout.id, categoryId, sortOrder: 0 },
      });

      await prisma.workoutBlock.delete({ where: { id: block.id } });

      const raw = await cleanupRaw.workoutBlock.findUnique({
        where: { id: block.id },
      });

      expect(raw).toBeNull();
    });
  });
});
