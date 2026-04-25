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
  type BlockSpec,
  createTestBlockType,
  createTestExercise,
  createTestScheme,
  createTestWorkoutWithBlocks,
} from "../../../test/library-helpers";

import { cloneWorkoutTree } from "./clone";

describe("cloneWorkoutTree (integration)", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let plan: Awaited<ReturnType<typeof createTestPlan>>;
  let blockTypeId: string;
  let schemeId: string;
  let emomSchemeId: string;
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

    const emomScheme = await createTestScheme({ kind: "EMOM" });

    emomSchemeId = emomScheme.id;

    const exerciseA = await createTestExercise(coach.user.id);

    exerciseAId = exerciseA.id;

    const exerciseB = await createTestExercise(coach.user.id);

    exerciseBId = exerciseB.id;

    toCleanup.push({ table: "exercise", id: exerciseAId });
    toCleanup.push({ table: "exercise", id: exerciseBId });
    toCleanup.push({ table: "scheme", id: emomSchemeId });
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
    expect(result.sectionIdMap.size).toBe(0);
    expect(result.slotIdMap.size).toBe(0);

    const targetBlocks = await cleanupRaw.workoutBlock.findMany({
      where: { workoutId: target.id },
    });

    expect(targetBlocks).toHaveLength(0);
  });

  it("clones 2 blocks x 2 sections x N exercises into target with new IDs", async () => {
    const blockSpecs: BlockSpec[] = [
      {
        blockTypeId,
        sections: [
          {
            schemeId,
            schemeKind: "STRAIGHT_SETS",
            exercises: [
              { exerciseId: exerciseAId, repValues: [5, 5, 5], sets: 3 },
              { exerciseId: exerciseBId, repValues: [5, 5, 5], sets: 3 },
            ],
          },
          {
            schemeId,
            schemeKind: "AMRAP",
            exercises: [{ exerciseId: exerciseAId, repValues: [10] }],
          },
        ],
      },
      {
        blockTypeId,
        sections: [
          {
            schemeId,
            schemeKind: "STRAIGHT_SETS",
            exercises: [{ exerciseId: exerciseBId, repValues: [10] }],
          },
        ],
      },
    ];

    const sourceFixture = await createTestWorkoutWithBlocks({
      planId: plan.id,
      blocks: blockSpecs,
    });

    toCleanup.push(...sourceFixture.toCleanup);

    const target = await createTestWorkout(plan.id, { title: "Multi-block target" });

    toCleanup.push({ table: "workout", id: target.id });

    const result = await prisma.$transaction(async (tx) => {
      return cloneWorkoutTree({
        sourceWorkoutId: sourceFixture.workout.id,
        targetWorkoutId: target.id,
        tx,
      });
    });

    expect(result.blockIdMap.size).toBe(2);
    expect(result.sectionIdMap.size).toBe(3);
    expect(result.slotIdMap.size).toBe(0);

    for (const [srcId, tgtId] of result.blockIdMap.entries()) {
      expect(srcId).not.toBe(tgtId);
    }

    for (const [srcId, tgtId] of result.sectionIdMap.entries()) {
      expect(srcId).not.toBe(tgtId);
    }

    const targetBlocks = await cleanupRaw.workoutBlock.findMany({
      where: { workoutId: target.id },
      orderBy: { sortOrder: "asc" },
      include: {
        sections: {
          orderBy: { sortOrder: "asc" },
          include: { exercises: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });

    expect(targetBlocks).toHaveLength(2);
    expect(targetBlocks[0]?.sections).toHaveLength(2);
    expect(targetBlocks[0]?.sections[0]?.exercises).toHaveLength(2);
    expect(targetBlocks[0]?.sections[1]?.exercises).toHaveLength(1);
    expect(targetBlocks[1]?.sections).toHaveLength(1);
    expect(targetBlocks[1]?.sections[0]?.exercises).toHaveLength(1);
  });

  it("clones an EMOM section with slots and slot exercises", async () => {
    const blockSpecs: BlockSpec[] = [
      {
        blockTypeId,
        sections: [
          {
            schemeId: emomSchemeId,
            schemeKind: "EMOM",
            emomSlots: [
              {
                minuteInRound: 0,
                exercises: [
                  { exerciseId: exerciseAId, repValues: [8] },
                  { exerciseId: exerciseBId, repValues: [8] },
                ],
              },
              {
                minuteInRound: 1,
                exercises: [
                  { exerciseId: exerciseAId, repValues: [12] },
                  { exerciseId: exerciseBId, repValues: [12] },
                ],
              },
            ],
          },
        ],
      },
    ];

    const sourceFixture = await createTestWorkoutWithBlocks({
      planId: plan.id,
      blocks: blockSpecs,
    });

    toCleanup.push(...sourceFixture.toCleanup);

    const target = await createTestWorkout(plan.id, { title: "EMOM target" });

    toCleanup.push({ table: "workout", id: target.id });

    const result = await prisma.$transaction(async (tx) => {
      return cloneWorkoutTree({
        sourceWorkoutId: sourceFixture.workout.id,
        targetWorkoutId: target.id,
        tx,
      });
    });

    expect(result.blockIdMap.size).toBe(1);
    expect(result.sectionIdMap.size).toBe(1);
    expect(result.slotIdMap.size).toBe(2);

    for (const [srcId, tgtId] of result.slotIdMap.entries()) {
      expect(srcId).not.toBe(tgtId);
    }

    const targetBlocks = await cleanupRaw.workoutBlock.findMany({
      where: { workoutId: target.id },
      include: {
        sections: {
          include: {
            emomSlots: {
              orderBy: { sortOrder: "asc" },
              include: { exercises: { orderBy: { sortOrder: "asc" } } },
            },
          },
        },
      },
    });

    expect(targetBlocks).toHaveLength(1);
    expect(targetBlocks[0]?.sections[0]?.schemeKind).toBe("EMOM");
    expect(targetBlocks[0]?.sections[0]?.emomSlots).toHaveLength(2);
    expect(targetBlocks[0]?.sections[0]?.emomSlots[0]?.exercises).toHaveLength(2);
    expect(targetBlocks[0]?.sections[0]?.emomSlots[1]?.exercises).toHaveLength(2);
  });

  it("does not mutate source rows", async () => {
    const blockSpecs: BlockSpec[] = [
      {
        blockTypeId,
        sections: [
          {
            schemeId,
            schemeKind: "STRAIGHT_SETS",
            exercises: [{ exerciseId: exerciseAId, repValues: [5] }],
          },
        ],
      },
    ];

    const sourceFixture = await createTestWorkoutWithBlocks({
      planId: plan.id,
      blocks: blockSpecs,
    });

    toCleanup.push(...sourceFixture.toCleanup);

    const target = await createTestWorkout(plan.id, { title: "Idempotence target" });

    toCleanup.push({ table: "workout", id: target.id });

    const sourceBlocksBefore = await cleanupRaw.workoutBlock.findMany({
      where: { workoutId: sourceFixture.workout.id },
      include: { sections: { include: { exercises: true } } },
    });

    await prisma.$transaction(async (tx) => {
      return cloneWorkoutTree({
        sourceWorkoutId: sourceFixture.workout.id,
        targetWorkoutId: target.id,
        tx,
      });
    });

    const sourceBlocksAfter = await cleanupRaw.workoutBlock.findMany({
      where: { workoutId: sourceFixture.workout.id },
      include: { sections: { include: { exercises: true } } },
    });

    expect(sourceBlocksAfter.map((b) => b.id)).toEqual(sourceBlocksBefore.map((b) => b.id));
    expect(sourceBlocksAfter[0]?.sections.map((s) => s.id)).toEqual(
      sourceBlocksBefore[0]?.sections.map((s) => s.id),
    );
  });
});
