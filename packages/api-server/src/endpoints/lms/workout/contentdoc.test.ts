import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { BadRequestError } from "@repo/errors";

import { cleanup, cleanupRaw, createTestCoach, createTestPlan } from "../../../test/helpers";
import {
  createTestBlockType,
  createTestExercise,
  createTestScheme,
} from "../../../test/library-helpers";
import { lmsWorkoutApi } from "../workout";

describe("lmsWorkoutApi contentDoc save + block tree write", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let plan: Awaited<ReturnType<typeof createTestPlan>>;

  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    coach = await createTestCoach();
    plan = await createTestPlan(coach.profile.id);
  });

  afterAll(async () => {
    await cleanup(
      ...toCleanup,
      { table: "trainingPlan", id: plan.id },
      { table: "coachProfile", id: coach.profile.id },
      { table: "user", id: coach.user.id },
    );
  });

  it("creates a workout with one block and one exercise mention and normalizes DB tables", async () => {
    const blockType = await createTestBlockType();
    const scheme = await createTestScheme();
    const exercise = await createTestExercise(coach.user.id, { status: "APPROVED" });

    toCleanup.push({ table: "exercise", id: exercise.id });
    toCleanup.push({ table: "scheme", id: scheme.id });
    toCleanup.push({ table: "blockType", id: blockType.id });

    const workout = await lmsWorkoutApi.create(coach.user.id, plan.id, {
      scheduledDate: new Date("2026-05-04T00:00:00Z"),
      title: "With blocks",
      contentDoc: {
        type: "doc",
        content: [
          {
            type: "straightSets",
            attrs: { blockTypeId: blockType.id, schemeId: scheme.id, schemeConfig: {} },
            content: [
              {
                type: "exerciseMention",
                attrs: { exerciseId: exercise.id, sets: 3, repValues: [5, 5, 5] },
              },
            ],
          },
        ],
      },
    });

    toCleanup.push({ table: "workout", id: workout.id });

    const blocks = await cleanupRaw.workoutBlock.findMany({
      where: { workoutId: workout.id },
      include: { exercises: true },
    });

    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.blockTypeId).toBe(blockType.id);
    expect(blocks[0]?.schemeId).toBe(scheme.id);
    expect(blocks[0]?.exercises).toHaveLength(1);
    expect(blocks[0]?.exercises[0]?.exerciseId).toBe(exercise.id);
  });

  it("update wipes old blocks and recreates from new contentDoc", async () => {
    const blockType = await createTestBlockType();
    const scheme = await createTestScheme();
    const exerciseA = await createTestExercise(coach.user.id, { status: "APPROVED" });
    const exerciseB = await createTestExercise(coach.user.id, { status: "APPROVED" });

    toCleanup.push({ table: "exercise", id: exerciseA.id });
    toCleanup.push({ table: "exercise", id: exerciseB.id });
    toCleanup.push({ table: "scheme", id: scheme.id });
    toCleanup.push({ table: "blockType", id: blockType.id });

    const workout = await lmsWorkoutApi.create(coach.user.id, plan.id, {
      scheduledDate: new Date("2026-06-08T00:00:00Z"),
      title: "Update flow",
      contentDoc: {
        type: "doc",
        content: [
          {
            type: "straightSets",
            attrs: { blockTypeId: blockType.id, schemeId: scheme.id, schemeConfig: {} },
            content: [
              {
                type: "exerciseMention",
                attrs: { exerciseId: exerciseA.id, sets: 3, repValues: [5, 5, 5] },
              },
            ],
          },
        ],
      },
    });

    toCleanup.push({ table: "workout", id: workout.id });

    const before = await cleanupRaw.workoutBlock.findMany({ where: { workoutId: workout.id } });

    expect(before).toHaveLength(1);

    await lmsWorkoutApi.update(coach.user.id, plan.id, workout.id, {
      contentDoc: {
        type: "doc",
        content: [
          {
            type: "amrap",
            attrs: { blockTypeId: blockType.id, schemeId: scheme.id, schemeConfig: {} },
            content: [
              {
                type: "exerciseMention",
                attrs: { exerciseId: exerciseB.id, sets: 1, repValues: [10] },
              },
            ],
          },
        ],
      },
    });

    const after = await cleanupRaw.workoutBlock.findMany({
      where: { workoutId: workout.id },
      include: { exercises: true },
    });

    expect(after).toHaveLength(1);
    expect(after[0]?.schemeKind).toBe("AMRAP");
    expect(after[0]?.exercises).toHaveLength(1);
    expect(after[0]?.exercises[0]?.exerciseId).toBe(exerciseB.id);
  });

  it("rejects save with invalid exerciseId and keeps DB unchanged", async () => {
    const blockType = await createTestBlockType();
    const scheme = await createTestScheme();
    const exercise = await createTestExercise(coach.user.id, { status: "APPROVED" });

    toCleanup.push({ table: "exercise", id: exercise.id });
    toCleanup.push({ table: "scheme", id: scheme.id });
    toCleanup.push({ table: "blockType", id: blockType.id });

    const workout = await lmsWorkoutApi.create(coach.user.id, plan.id, {
      scheduledDate: new Date("2026-07-12T00:00:00Z"),
      title: "Atomic update",
      contentDoc: {
        type: "doc",
        content: [
          {
            type: "straightSets",
            attrs: { blockTypeId: blockType.id, schemeId: scheme.id, schemeConfig: {} },
            content: [
              {
                type: "exerciseMention",
                attrs: { exerciseId: exercise.id, sets: 3, repValues: [5, 5, 5] },
              },
            ],
          },
        ],
      },
    });

    toCleanup.push({ table: "workout", id: workout.id });

    await expect(
      lmsWorkoutApi.update(coach.user.id, plan.id, workout.id, {
        contentDoc: {
          type: "doc",
          content: [
            {
              type: "straightSets",
              attrs: { blockTypeId: blockType.id, schemeId: scheme.id, schemeConfig: {} },
              content: [
                {
                  type: "exerciseMention",
                  attrs: {
                    exerciseId: "cljxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                    sets: 1,
                    repValues: [1],
                  },
                },
              ],
            },
          ],
        },
      }),
    ).rejects.toThrow(BadRequestError);

    const blocks = await cleanupRaw.workoutBlock.findMany({
      where: { workoutId: workout.id },
      include: { exercises: true },
    });

    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.exercises[0]?.exerciseId).toBe(exercise.id);
  });

  it("rejects save with non-approved exercise not owned by saving coach", async () => {
    const otherCoach = await createTestCoach();
    const blockType = await createTestBlockType();
    const scheme = await createTestScheme();
    const pendingOfOther = await createTestExercise(otherCoach.user.id, {
      status: "PENDING_REVIEW",
    });

    toCleanup.push({ table: "exercise", id: pendingOfOther.id });
    toCleanup.push({ table: "scheme", id: scheme.id });
    toCleanup.push({ table: "blockType", id: blockType.id });
    toCleanup.push({ table: "coachProfile", id: otherCoach.profile.id });
    toCleanup.push({ table: "user", id: otherCoach.user.id });

    await expect(
      lmsWorkoutApi.create(coach.user.id, plan.id, {
        scheduledDate: new Date("2026-08-03T00:00:00Z"),
        title: "Cross-coach pending",
        contentDoc: {
          type: "doc",
          content: [
            {
              type: "straightSets",
              attrs: { blockTypeId: blockType.id, schemeId: scheme.id, schemeConfig: {} },
              content: [
                {
                  type: "exerciseMention",
                  attrs: { exerciseId: pendingOfOther.id, sets: 1, repValues: [1] },
                },
              ],
            },
          ],
        },
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
