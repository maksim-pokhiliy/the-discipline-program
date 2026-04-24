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
  let blockId: string;
  let emomBlockId: string;
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

    const scheduleBlock = await cleanupRaw.workoutBlock.create({
      data: {
        workoutId,
        blockTypeId,
        schemeKind: "STRAIGHT_SETS",
        schemeConfig: {},
        sortOrder: 0,
      },
    });

    blockId = scheduleBlock.id;
    toCleanup.push({ table: "workoutBlock", id: blockId });

    const emomBlock = await cleanupRaw.workoutBlock.create({
      data: {
        workoutId,
        blockTypeId,
        schemeKind: "EMOM",
        schemeConfig: {},
        sortOrder: 1,
      },
    });

    emomBlockId = emomBlock.id;
    toCleanup.push({ table: "workoutBlock", id: emomBlockId });

    const slot = await cleanupRaw.emomSlot.create({
      data: { blockId: emomBlockId, minuteInRound: 0, sortOrder: 0 },
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

  it("rejects a row with both blockId and emomSlotId null", async () => {
    await expect(
      cleanupRaw.workoutBlockExercise.create({
        data: {
          blockId: null,
          emomSlotId: null,
          exerciseId,
          repScheme: "STRAIGHT",
          repValues: [5],
          sortOrder: 0,
        },
      }),
    ).rejects.toThrow(/workout_block_exercise_xor/i);
  });

  it("rejects a row with both blockId and emomSlotId set", async () => {
    await expect(
      cleanupRaw.workoutBlockExercise.create({
        data: {
          blockId,
          emomSlotId,
          exerciseId,
          repScheme: "STRAIGHT",
          repValues: [5],
          sortOrder: 0,
        },
      }),
    ).rejects.toThrow(/workout_block_exercise_xor/i);
  });

  it("accepts a row with only blockId set", async () => {
    const row = await cleanupRaw.workoutBlockExercise.create({
      data: {
        blockId,
        emomSlotId: null,
        exerciseId,
        repScheme: "STRAIGHT",
        repValues: [5],
        sortOrder: 10,
      },
    });

    toCleanup.push({ table: "workoutBlockExercise", id: row.id });

    expect(row.blockId).toBe(blockId);
    expect(row.emomSlotId).toBeNull();
  });

  it("accepts a row with only emomSlotId set", async () => {
    const row = await cleanupRaw.workoutBlockExercise.create({
      data: {
        blockId: null,
        emomSlotId,
        exerciseId,
        repScheme: "STRAIGHT",
        repValues: [5],
        sortOrder: 11,
      },
    });

    toCleanup.push({ table: "workoutBlockExercise", id: row.id });

    expect(row.blockId).toBeNull();
    expect(row.emomSlotId).toBe(emomSlotId);
  });
});
