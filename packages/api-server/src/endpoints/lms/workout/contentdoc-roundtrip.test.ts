import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { type TiptapDoc } from "@repo/contracts/common/tiptap-doc";

import { cleanup, cleanupRaw, createTestCoach, createTestPlan } from "../../../test/helpers";
import {
  createTestBlockType,
  createTestExercise,
  createTestScheme,
} from "../../../test/library-helpers";
import { lmsWorkoutApi } from "../workout";

describe("lmsWorkoutApi contentDoc round-trip", () => {
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

  it("round-trips a doc with two blocks and two sections each", async () => {
    const blockType = await createTestBlockType();
    const scheme = await createTestScheme();
    const exerciseA = await createTestExercise(coach.user.id, { status: "APPROVED" });
    const exerciseB = await createTestExercise(coach.user.id, { status: "APPROVED" });

    toCleanup.push({ table: "exercise", id: exerciseA.id });
    toCleanup.push({ table: "exercise", id: exerciseB.id });
    toCleanup.push({ table: "scheme", id: scheme.id });
    toCleanup.push({ table: "blockType", id: blockType.id });

    const doc: TiptapDoc = {
      type: "doc",
      content: [
        {
          type: "block",
          attrs: { blockTypeId: blockType.id, title: "Block A", sortOrder: 0 },
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
                      attrs: { exerciseId: exerciseA.id, sets: 3, repValues: [5, 5, 5] },
                    },
                  ],
                },
              ],
            },
            {
              type: "schemeSection",
              attrs: {
                schemeId: scheme.id,
                schemeKind: "AMRAP",
                schemeConfig: {},
                effortPct: null,
                pace: null,
                note: null,
                sortOrder: 1,
              },
              content: [
                {
                  type: "exerciseLine",
                  attrs: { sortOrder: 0 },
                  content: [
                    {
                      type: "exerciseMention",
                      attrs: { exerciseId: exerciseB.id, sets: 1, repValues: [10] },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: "block",
          attrs: { blockTypeId: blockType.id, title: "Block B", sortOrder: 1 },
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
                      attrs: { exerciseId: exerciseA.id, sets: 1, repValues: [21] },
                    },
                  ],
                },
              ],
            },
            {
              type: "schemeSection",
              attrs: {
                schemeId: null,
                schemeKind: null,
                schemeConfig: null,
                effortPct: null,
                pace: null,
                note: "Rest 3 min",
                sortOrder: 1,
              },
              content: [],
            },
          ],
        },
      ],
    };
    const workout = await lmsWorkoutApi.create(coach.user.id, plan.id, {
      scheduledDate: new Date("2026-05-05T00:00:00Z"),
      title: "Round trip",
      contentDoc: doc,
    });

    toCleanup.push({ table: "workout", id: workout.id });

    const fetched = await lmsWorkoutApi.getById(coach.user.id, plan.id, workout.id);

    expect(fetched.contentDoc).toEqual(doc);

    const blocks = await cleanupRaw.workoutBlock.findMany({
      where: { workoutId: workout.id },
      orderBy: { sortOrder: "asc" },
      include: { sections: { orderBy: { sortOrder: "asc" }, include: { exercises: true } } },
    });

    expect(blocks).toHaveLength(2);
    expect(blocks[0]?.sections).toHaveLength(2);
    expect(blocks[1]?.sections).toHaveLength(2);
    expect(blocks[0]?.sections[0]?.schemeKind).toBe("STRAIGHT_SETS");
    expect(blocks[0]?.sections[1]?.schemeKind).toBe("AMRAP");
    expect(blocks[1]?.sections[0]?.schemeKind).toBe("STRAIGHT_SETS");
    expect(blocks[1]?.sections[1]?.schemeKind).toBeNull();
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

    const buildDoc = (exerciseId: string, schemeKind: "STRAIGHT_SETS" | "AMRAP"): TiptapDoc => ({
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
                schemeKind,
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
      scheduledDate: new Date("2026-06-08T00:00:00Z"),
      title: "Update flow",
      contentDoc: buildDoc(exerciseA.id, "STRAIGHT_SETS"),
    });

    toCleanup.push({ table: "workout", id: workout.id });

    const before = await cleanupRaw.workoutBlock.findMany({
      where: { workoutId: workout.id },
      include: { sections: { include: { exercises: true } } },
    });

    expect(before).toHaveLength(1);
    expect(before[0]?.sections[0]?.exercises[0]?.exerciseId).toBe(exerciseA.id);

    await lmsWorkoutApi.update(coach.user.id, plan.id, workout.id, {
      contentDoc: buildDoc(exerciseB.id, "AMRAP"),
    });

    const after = await cleanupRaw.workoutBlock.findMany({
      where: { workoutId: workout.id },
      include: { sections: { include: { exercises: true } } },
    });

    expect(after).toHaveLength(1);
    expect(after[0]?.sections[0]?.schemeKind).toBe("AMRAP");
    expect(after[0]?.sections[0]?.exercises).toHaveLength(1);
    expect(after[0]?.sections[0]?.exercises[0]?.exerciseId).toBe(exerciseB.id);
  });
});
