import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { cleanupRaw, createTestCoach, createTestExercise } from "../../test/helpers";

import { platformPrescribedSetsApi } from "./prescribed-sets";

describe("platformPrescribedSetsApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let exercise: Awaited<ReturnType<typeof createTestExercise>>;
  let exercise2: Awaited<ReturnType<typeof createTestExercise>>;
  let category: Awaited<ReturnType<typeof cleanupRaw.exerciseCategory.create>>;
  let planId: string;
  let workoutId: string;
  let blockId: string;
  let block2Id: string;
  const createdSetIds: string[] = [];

  beforeAll(async () => {
    coach = await createTestCoach();

    category = await cleanupRaw.exerciseCategory.create({
      data: { name: `Cat ${crypto.randomUUID().slice(0, 8)}` },
    });

    exercise = await createTestExercise({ categoryId: category.id });
    exercise2 = await createTestExercise({ categoryId: category.id });

    const plan = await cleanupRaw.trainingPlan.create({
      data: { coachId: coach.profile.id, name: "Sets Test Plan" },
    });

    planId = plan.id;

    const workout = await cleanupRaw.workout.create({
      data: { planId: plan.id, title: "Sets Workout", sortOrder: 0 },
    });

    workoutId = workout.id;

    const block = await cleanupRaw.workoutBlock.create({
      data: { workoutId: workout.id, categoryId: category.id, sortOrder: 0 },
    });

    blockId = block.id;

    const block2 = await cleanupRaw.workoutBlock.create({
      data: { workoutId: workout.id, categoryId: category.id, sortOrder: 1 },
    });

    block2Id = block2.id;
  });

  afterAll(async () => {
    for (const setId of createdSetIds) {
      await cleanupRaw.prescribedSet.delete({ where: { id: setId } }).catch(() => {});
    }

    await cleanupRaw.workoutBlock.delete({ where: { id: blockId } }).catch(() => {});
    await cleanupRaw.workoutBlock.delete({ where: { id: block2Id } }).catch(() => {});
    await cleanupRaw.workout.delete({ where: { id: workoutId } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: planId } }).catch(() => {});
    await cleanupRaw.exercise.delete({ where: { id: exercise.id } }).catch(() => {});
    await cleanupRaw.exercise.delete({ where: { id: exercise2.id } }).catch(() => {});
    await cleanupRaw.exerciseCategory.delete({ where: { id: category.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
  });

  describe("create", () => {
    it("first set in block gets sortOrder 0", async () => {
      const set = await platformPrescribedSetsApi.create(coach.user.id, block2Id, {
        exerciseId: exercise.id,
        reps: 10,
      });

      createdSetIds.push(set.id);

      expect(set.sortOrder).toBe(0);
    });

    it("assigns correct sortOrder (max + 1)", async () => {
      const set1 = await platformPrescribedSetsApi.create(coach.user.id, blockId, {
        exerciseId: exercise.id,
        reps: 10,
      });

      createdSetIds.push(set1.id);

      const set2 = await platformPrescribedSetsApi.create(coach.user.id, blockId, {
        exerciseId: exercise2.id,
        reps: 8,
      });

      createdSetIds.push(set2.id);

      expect(set1.sortOrder).toBe(0);
      expect(set2.sortOrder).toBe(1);
    });

    it("multiple creates keep incrementing sortOrder", async () => {
      const set3 = await platformPrescribedSetsApi.create(coach.user.id, blockId, {
        exerciseId: exercise.id,
        reps: 6,
      });

      createdSetIds.push(set3.id);

      expect(set3.sortOrder).toBe(2);
    });
  });
});
