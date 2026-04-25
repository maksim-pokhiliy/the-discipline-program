import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  cleanup,
  cleanupRaw,
  createTestCoach,
  createTestPlan,
  createTestWorkout,
} from "../../../test/helpers";
import { createTestBlockType, createTestExercise } from "../../../test/library-helpers";

describe("WorkoutBlockExercise XOR check (DB constraint)", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let plan: Awaited<ReturnType<typeof createTestPlan>>;
  let blockTypeId: string;
  let exerciseId: string;
  let workoutId: string;
  let sectionId: string;
  let emomSlotId: string;

  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    coach = await createTestCoach();
    plan = await createTestPlan(coach.profile.id);

    const blockType = await createTestBlockType();

    blockTypeId = blockType.id;
    toCleanup.push({ table: "blockType", id: blockTypeId });

    const exercise = await createTestExercise(coach.user.id);

    exerciseId = exercise.id;
    toCleanup.push({ table: "exercise", id: exerciseId });

    const workout = await createTestWorkout(plan.id, { title: "XOR test workout" });

    workoutId = workout.id;
    toCleanup.push({ table: "workout", id: workoutId });

    const block = await cleanupRaw.workoutBlock.create({
      data: { workoutId, blockTypeId, sortOrder: 0 },
    });

    toCleanup.push({ table: "workoutBlock", id: block.id });

    const schemeSection = await cleanupRaw.schemeSection.create({
      data: { blockId: block.id, kind: "SCHEME", schemeKind: "STRAIGHT_SETS", sortOrder: 0 },
    });

    sectionId = schemeSection.id;
    toCleanup.push({ table: "schemeSection", id: sectionId });

    const emomSection = await cleanupRaw.schemeSection.create({
      data: { blockId: block.id, kind: "SCHEME", schemeKind: "EMOM", sortOrder: 1 },
    });

    toCleanup.push({ table: "schemeSection", id: emomSection.id });

    const slot = await cleanupRaw.emomSlot.create({
      data: { sectionId: emomSection.id, minuteInRound: 0, sortOrder: 0 },
    });

    emomSlotId = slot.id;
    toCleanup.push({ table: "emomSlot", id: emomSlotId });
  });

  afterAll(async () => {
    await cleanup(
      ...toCleanup,
      { table: "trainingPlan", id: plan.id },
      { table: "coachProfile", id: coach.profile.id },
      { table: "user", id: coach.user.id },
    );
  });

  it("rejects a row with both sectionId and emomSlotId null", async () => {
    await expect(
      cleanupRaw.$executeRawUnsafe(
        `INSERT INTO "app_workout_block_exercises"
          ("id", "sectionId", "emomSlotId", "exerciseId", "repScheme", "repValues", "sortOrder", "createdAt", "updatedAt")
         VALUES ($1, NULL, NULL, $2, 'STRAIGHT', ARRAY[5]::int[], 0, NOW(), NOW())`,
        crypto.randomUUID(),
        exerciseId,
      ),
    ).rejects.toThrow(/workout_block_exercise_xor/i);
  });

  it("rejects a row with both sectionId and emomSlotId set", async () => {
    await expect(
      cleanupRaw.$executeRawUnsafe(
        `INSERT INTO "app_workout_block_exercises"
          ("id", "sectionId", "emomSlotId", "exerciseId", "repScheme", "repValues", "sortOrder", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, 'STRAIGHT', ARRAY[5]::int[], 0, NOW(), NOW())`,
        crypto.randomUUID(),
        sectionId,
        emomSlotId,
        exerciseId,
      ),
    ).rejects.toThrow(/workout_block_exercise_xor/i);
  });

  it("accepts a row with only sectionId set", async () => {
    const row = await cleanupRaw.workoutBlockExercise.create({
      data: {
        sectionId,
        emomSlotId: null,
        exerciseId,
        repScheme: "STRAIGHT",
        repValues: [5],
        sortOrder: 10,
      },
    });

    toCleanup.push({ table: "workoutBlockExercise", id: row.id });

    expect(row.sectionId).toBe(sectionId);
    expect(row.emomSlotId).toBeNull();
  });

  it("accepts a row with only emomSlotId set", async () => {
    const row = await cleanupRaw.workoutBlockExercise.create({
      data: {
        sectionId: null,
        emomSlotId,
        exerciseId,
        repScheme: "STRAIGHT",
        repValues: [5],
        sortOrder: 11,
      },
    });

    toCleanup.push({ table: "workoutBlockExercise", id: row.id });

    expect(row.sectionId).toBeNull();
    expect(row.emomSlotId).toBe(emomSlotId);
  });
});
