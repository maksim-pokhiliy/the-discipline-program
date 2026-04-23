import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../../../db/client";
import {
  cleanup,
  cleanupRaw,
  createTestCoach,
  createTestPlan,
  createTestWorkout,
} from "../../../test/helpers";
import {
  createTestBlockType,
  createTestExercise,
  createTestScheme,
} from "../../../test/library-helpers";

import { cloneWorkoutTree } from "./clone";

describe("cloneWorkoutTree (integration)", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let plan: Awaited<ReturnType<typeof createTestPlan>>;
  let blockTypeId: string;
  let schemeId: string;
  let exerciseAId: string;
  let exerciseBId: string;

  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    coach = await createTestCoach();
    plan = await createTestPlan(coach.profile.id);

    const blockType = await createTestBlockType();

    blockTypeId = blockType.id;

    const scheme = await createTestScheme();

    schemeId = scheme.id;

    const exerciseA = await createTestExercise(coach.user.id);

    exerciseAId = exerciseA.id;

    const exerciseB = await createTestExercise(coach.user.id);

    exerciseBId = exerciseB.id;

    toCleanup.push({ table: "exercise", id: exerciseAId });
    toCleanup.push({ table: "exercise", id: exerciseBId });
    toCleanup.push({ table: "scheme", id: schemeId });
    toCleanup.push({ table: "blockType", id: blockTypeId });
  });

  afterAll(async () => {
    await cleanup(
      ...toCleanup,
      { table: "trainingPlan", id: plan.id },
      { table: "coachProfile", id: coach.profile.id },
      { table: "user", id: coach.user.id },
    );
  });

  it("returns empty maps when source has zero blocks", async () => {
    const source = await createTestWorkout(plan.id, { title: "Empty source" });
    const target = await createTestWorkout(plan.id, { title: "Empty target" });

    toCleanup.push({ table: "workout", id: target.id });
    toCleanup.push({ table: "workout", id: source.id });

    const result = await prisma.$transaction(async (tx) => {
      return cloneWorkoutTree({
        sourceWorkoutId: source.id,
        targetWorkoutId: target.id,
        tx,
      });
    });

    expect(result.blockIdMap.size).toBe(0);
    expect(result.slotIdMap.size).toBe(0);

    const targetBlocks = await cleanupRaw.workoutBlock.findMany({
      where: { workoutId: target.id },
    });

    expect(targetBlocks).toHaveLength(0);
  });

  it("clones 2 blocks x 2 exercises each into target with new IDs", async () => {
    const source = await createTestWorkout(plan.id, { title: "Multi-block source" });
    const target = await createTestWorkout(plan.id, { title: "Multi-block target" });

    toCleanup.push({ table: "workout", id: target.id });
    toCleanup.push({ table: "workout", id: source.id });

    const sourceBlock1 = await cleanupRaw.workoutBlock.create({
      data: {
        workoutId: source.id,
        blockTypeId,
        schemeId,
        schemeKind: "STRAIGHT_SETS",
        schemeConfig: {},
        sortOrder: 0,
      },
    });
    const sourceBlock2 = await cleanupRaw.workoutBlock.create({
      data: {
        workoutId: source.id,
        blockTypeId,
        schemeId,
        schemeKind: "STRAIGHT_SETS",
        schemeConfig: {},
        sortOrder: 1,
      },
    });

    await cleanupRaw.workoutBlockExercise.createMany({
      data: [
        {
          blockId: sourceBlock1.id,
          exerciseId: exerciseAId,
          repScheme: "STRAIGHT",
          repValues: [5, 5, 5],
          sets: 3,
          sortOrder: 0,
        },
        {
          blockId: sourceBlock1.id,
          exerciseId: exerciseBId,
          repScheme: "STRAIGHT",
          repValues: [5, 5, 5],
          sets: 3,
          sortOrder: 1,
        },
        {
          blockId: sourceBlock2.id,
          exerciseId: exerciseAId,
          repScheme: "STRAIGHT",
          repValues: [10],
          sets: 1,
          sortOrder: 0,
        },
        {
          blockId: sourceBlock2.id,
          exerciseId: exerciseBId,
          repScheme: "STRAIGHT",
          repValues: [10],
          sets: 1,
          sortOrder: 1,
        },
      ],
    });

    const result = await prisma.$transaction(async (tx) => {
      return cloneWorkoutTree({
        sourceWorkoutId: source.id,
        targetWorkoutId: target.id,
        tx,
      });
    });

    expect(result.blockIdMap.size).toBe(2);
    expect(result.blockIdMap.has(sourceBlock1.id)).toBe(true);
    expect(result.blockIdMap.has(sourceBlock2.id)).toBe(true);

    for (const [srcId, tgtId] of result.blockIdMap.entries()) {
      expect(srcId).not.toBe(tgtId);
    }

    const targetBlocks = await cleanupRaw.workoutBlock.findMany({
      where: { workoutId: target.id },
      orderBy: { sortOrder: "asc" },
      include: { exercises: { orderBy: { sortOrder: "asc" } } },
    });

    expect(targetBlocks).toHaveLength(2);
    expect(targetBlocks[0]?.sortOrder).toBe(0);
    expect(targetBlocks[0]?.exercises).toHaveLength(2);
    expect(targetBlocks[0]?.exercises[0]?.exerciseId).toBe(exerciseAId);
    expect(targetBlocks[0]?.exercises[1]?.exerciseId).toBe(exerciseBId);
    expect(targetBlocks[1]?.exercises).toHaveLength(2);
  });

  it("clones an EMOM block with slots and slot exercises", async () => {
    const source = await createTestWorkout(plan.id, { title: "EMOM source" });
    const target = await createTestWorkout(plan.id, { title: "EMOM target" });

    toCleanup.push({ table: "workout", id: target.id });
    toCleanup.push({ table: "workout", id: source.id });

    const sourceBlock = await cleanupRaw.workoutBlock.create({
      data: {
        workoutId: source.id,
        blockTypeId,
        schemeId,
        schemeKind: "EMOM",
        schemeConfig: {},
        sortOrder: 0,
      },
    });

    const slotA = await cleanupRaw.emomSlot.create({
      data: { blockId: sourceBlock.id, minuteInRound: 0, sortOrder: 0 },
    });
    const slotB = await cleanupRaw.emomSlot.create({
      data: { blockId: sourceBlock.id, minuteInRound: 1, sortOrder: 1 },
    });

    await cleanupRaw.workoutBlockExercise.createMany({
      data: [
        {
          emomSlotId: slotA.id,
          exerciseId: exerciseAId,
          repScheme: "STRAIGHT",
          repValues: [8],
          sets: 1,
          sortOrder: 0,
        },
        {
          emomSlotId: slotA.id,
          exerciseId: exerciseBId,
          repScheme: "STRAIGHT",
          repValues: [8],
          sets: 1,
          sortOrder: 1,
        },
        {
          emomSlotId: slotB.id,
          exerciseId: exerciseAId,
          repScheme: "STRAIGHT",
          repValues: [12],
          sets: 1,
          sortOrder: 0,
        },
        {
          emomSlotId: slotB.id,
          exerciseId: exerciseBId,
          repScheme: "STRAIGHT",
          repValues: [12],
          sets: 1,
          sortOrder: 1,
        },
      ],
    });

    const result = await prisma.$transaction(async (tx) => {
      return cloneWorkoutTree({
        sourceWorkoutId: source.id,
        targetWorkoutId: target.id,
        tx,
      });
    });

    expect(result.blockIdMap.size).toBe(1);
    expect(result.slotIdMap.size).toBe(2);
    expect(result.slotIdMap.has(slotA.id)).toBe(true);
    expect(result.slotIdMap.has(slotB.id)).toBe(true);

    const targetBlocks = await cleanupRaw.workoutBlock.findMany({
      where: { workoutId: target.id },
      include: {
        emomSlots: {
          orderBy: { sortOrder: "asc" },
          include: { exercises: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });

    expect(targetBlocks).toHaveLength(1);
    expect(targetBlocks[0]?.schemeKind).toBe("EMOM");
    expect(targetBlocks[0]?.emomSlots).toHaveLength(2);
    expect(targetBlocks[0]?.emomSlots[0]?.exercises).toHaveLength(2);
    expect(targetBlocks[0]?.emomSlots[1]?.exercises).toHaveLength(2);
    expect(targetBlocks[0]?.emomSlots[0]?.exercises[0]?.exerciseId).toBe(exerciseAId);
    expect(targetBlocks[0]?.emomSlots[0]?.exercises[1]?.exerciseId).toBe(exerciseBId);

    for (const [srcId, tgtId] of result.slotIdMap.entries()) {
      expect(srcId).not.toBe(tgtId);
    }
  });
});
