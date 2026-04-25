import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { type TiptapDoc } from "@repo/contracts/common/tiptap-doc";
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

  it("creates a workout with one block, one schemeSection and one mention; normalizes DB tables", async () => {
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
            type: "block",
            attrs: { blockTypeId: blockType.id, title: "Strength", sortOrder: 0 },
            content: [
              {
                type: "schemeSection",
                attrs: {
                  schemeId: scheme.id,
                  schemeKind: "STRAIGHT_SETS",
                  schemeConfig: {},
                  effortPct: null,
                  pace: null,
                  note: null,
                  sortOrder: 0,
                },
                content: [
                  {
                    type: "exerciseLine",
                    attrs: { sortOrder: 0 },
                    content: [
                      {
                        type: "exerciseMention",
                        attrs: { exerciseId: exercise.id, sets: 3, repValues: [5, 5, 5] },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    toCleanup.push({ table: "workout", id: workout.id });

    const blocks = await cleanupRaw.workoutBlock.findMany({
      where: { workoutId: workout.id },
      include: { sections: { include: { exercises: true } } },
    });

    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.blockTypeId).toBe(blockType.id);
    expect(blocks[0]?.sections).toHaveLength(1);
    expect(blocks[0]?.sections[0]?.schemeId).toBe(scheme.id);
    expect(blocks[0]?.sections[0]?.schemeKind).toBe("STRAIGHT_SETS");
    expect(blocks[0]?.sections[0]?.exercises).toHaveLength(1);
    expect(blocks[0]?.sections[0]?.exercises[0]?.exerciseId).toBe(exercise.id);
  });

  it("rejects save with invalid exerciseId and keeps DB unchanged", async () => {
    const blockType = await createTestBlockType();
    const scheme = await createTestScheme();
    const exercise = await createTestExercise(coach.user.id, { status: "APPROVED" });

    toCleanup.push({ table: "exercise", id: exercise.id });
    toCleanup.push({ table: "scheme", id: scheme.id });
    toCleanup.push({ table: "blockType", id: blockType.id });

    const buildDoc = (exerciseId: string): TiptapDoc => ({
      type: "doc",
      content: [
        {
          type: "block",
          attrs: { blockTypeId: blockType.id, title: null, sortOrder: 0 },
          content: [
            {
              type: "schemeSection",
              attrs: {
                schemeId: scheme.id,
                schemeKind: "STRAIGHT_SETS",
                schemeConfig: {},
                effortPct: null,
                pace: null,
                note: null,
                sortOrder: 0,
              },
              content: [
                {
                  type: "exerciseLine",
                  attrs: { sortOrder: 0 },
                  content: [
                    {
                      type: "exerciseMention",
                      attrs: { exerciseId, sets: 3, repValues: [5, 5, 5] },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    const workout = await lmsWorkoutApi.create(coach.user.id, plan.id, {
      scheduledDate: new Date("2026-07-12T00:00:00Z"),
      title: "Atomic update",
      contentDoc: buildDoc(exercise.id),
    });

    toCleanup.push({ table: "workout", id: workout.id });

    await expect(
      lmsWorkoutApi.update(coach.user.id, plan.id, workout.id, {
        contentDoc: buildDoc("cljxxxxxxxxxxxxxxxxxxxxxxxxxxxx"),
      }),
    ).rejects.toThrow(BadRequestError);

    const blocks = await cleanupRaw.workoutBlock.findMany({
      where: { workoutId: workout.id },
      include: { sections: { include: { exercises: true } } },
    });

    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.sections[0]?.exercises[0]?.exerciseId).toBe(exercise.id);
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
              type: "block",
              attrs: { blockTypeId: blockType.id, title: null, sortOrder: 0 },
              content: [
                {
                  type: "schemeSection",
                  attrs: {
                    schemeId: scheme.id,
                    schemeKind: "STRAIGHT_SETS",
                    schemeConfig: {},
                    effortPct: null,
                    pace: null,
                    note: null,
                    sortOrder: 0,
                  },
                  content: [
                    {
                      type: "exerciseLine",
                      attrs: { sortOrder: 0 },
                      content: [
                        {
                          type: "exerciseMention",
                          attrs: { exerciseId: pendingOfOther.id, sets: 1, repValues: [1] },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
