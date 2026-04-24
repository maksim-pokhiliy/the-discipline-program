import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  cleanup,
  cleanupRaw,
  createTestCoach,
  createTestPlan,
  createTestWorkout,
} from "../../../test/helpers";

import { copyWorkoutWeek } from "./copy-week";

const SOURCE_WEEK_START = new Date(Date.UTC(2026, 0, 5));
const TARGET_WEEK_START = new Date(Date.UTC(2026, 0, 12));

describe("copyWorkoutWeek sortOrder re-sequence (integration)", () => {
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

  it("copies two workouts on distinct days into an empty target week with sortOrder 0", async () => {
    const sourceA = await createTestWorkout(plan.id, {
      scheduledDate: SOURCE_WEEK_START,
      title: "Source A",
      sortOrder: 0,
    });
    const sourceDay2 = new Date(SOURCE_WEEK_START);

    sourceDay2.setUTCDate(sourceDay2.getUTCDate() + 1);

    const sourceB = await createTestWorkout(plan.id, {
      scheduledDate: sourceDay2,
      title: "Source B",
      sortOrder: 0,
    });

    toCleanup.push({ table: "workout", id: sourceA.id });
    toCleanup.push({ table: "workout", id: sourceB.id });

    const copied = await copyWorkoutWeek(
      coach.user.id,
      plan.id,
      SOURCE_WEEK_START,
      TARGET_WEEK_START,
    );

    for (const w of copied) {
      toCleanup.push({ table: "workout", id: w.id });
    }

    const targetEnd = new Date(TARGET_WEEK_START);

    targetEnd.setUTCDate(targetEnd.getUTCDate() + 7);

    const targetWorkouts = await cleanupRaw.workout.findMany({
      where: {
        planId: plan.id,
        scheduledDate: { gte: TARGET_WEEK_START, lt: targetEnd },
      },
      orderBy: [{ scheduledDate: "asc" }, { sortOrder: "asc" }],
    });

    expect(targetWorkouts).toHaveLength(2);
    expect(targetWorkouts[0]?.sortOrder).toBe(0);
    expect(targetWorkouts[1]?.sortOrder).toBe(0);
  });

  it("copies one workout into a target that already has one workout on the same day", async () => {
    const localSourceStart = new Date(Date.UTC(2026, 1, 2));
    const localTargetStart = new Date(Date.UTC(2026, 1, 9));
    const sameDay = new Date(localTargetStart);

    const preExisting = await createTestWorkout(plan.id, {
      scheduledDate: sameDay,
      title: "Target pre-existing",
      sortOrder: 0,
    });
    const source = await createTestWorkout(plan.id, {
      scheduledDate: localSourceStart,
      title: "Source single",
      sortOrder: 0,
    });

    toCleanup.push({ table: "workout", id: preExisting.id });
    toCleanup.push({ table: "workout", id: source.id });

    const copied = await copyWorkoutWeek(
      coach.user.id,
      plan.id,
      localSourceStart,
      localTargetStart,
    );

    for (const w of copied) {
      toCleanup.push({ table: "workout", id: w.id });
    }

    const targetEnd = new Date(localTargetStart);

    targetEnd.setUTCDate(targetEnd.getUTCDate() + 7);

    const targetWorkouts = await cleanupRaw.workout.findMany({
      where: {
        planId: plan.id,
        scheduledDate: { gte: localTargetStart, lt: targetEnd },
      },
      orderBy: [{ scheduledDate: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });

    expect(targetWorkouts).toHaveLength(2);
    expect(targetWorkouts.map((w) => w.sortOrder)).toEqual([0, 1]);
    expect(targetWorkouts[0]?.id).toBe(preExisting.id);
  });

  it("copies two workouts scheduled on the same day into an empty target week", async () => {
    const localSourceStart = new Date(Date.UTC(2026, 2, 2));
    const localTargetStart = new Date(Date.UTC(2026, 2, 9));

    const sourceA = await createTestWorkout(plan.id, {
      scheduledDate: localSourceStart,
      title: "Same-day source A",
      sortOrder: 0,
    });
    const sourceB = await createTestWorkout(plan.id, {
      scheduledDate: localSourceStart,
      title: "Same-day source B",
      sortOrder: 1,
    });

    toCleanup.push({ table: "workout", id: sourceA.id });
    toCleanup.push({ table: "workout", id: sourceB.id });

    const copied = await copyWorkoutWeek(
      coach.user.id,
      plan.id,
      localSourceStart,
      localTargetStart,
    );

    for (const w of copied) {
      toCleanup.push({ table: "workout", id: w.id });
    }

    const targetEnd = new Date(localTargetStart);

    targetEnd.setUTCDate(targetEnd.getUTCDate() + 7);

    const targetWorkouts = await cleanupRaw.workout.findMany({
      where: {
        planId: plan.id,
        scheduledDate: { gte: localTargetStart, lt: targetEnd },
      },
      orderBy: [{ scheduledDate: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });

    expect(targetWorkouts).toHaveLength(2);
    expect(targetWorkouts.map((w) => w.sortOrder)).toEqual([0, 1]);
  });

  it("re-sequences when target week has pre-existing multi-row same-date", async () => {
    const localSourceStart = new Date(Date.UTC(2026, 3, 6));
    const localTargetStart = new Date(Date.UTC(2026, 3, 13));

    const preExistingA = await createTestWorkout(plan.id, {
      scheduledDate: localTargetStart,
      title: "Pre-existing A",
      sortOrder: 0,
    });
    const preExistingB = await createTestWorkout(plan.id, {
      scheduledDate: localTargetStart,
      title: "Pre-existing B",
      sortOrder: 1,
    });
    const sourceA = await createTestWorkout(plan.id, {
      scheduledDate: localSourceStart,
      title: "Source A",
      sortOrder: 0,
    });
    const sourceB = await createTestWorkout(plan.id, {
      scheduledDate: localSourceStart,
      title: "Source B",
      sortOrder: 1,
    });

    toCleanup.push({ table: "workout", id: preExistingA.id });
    toCleanup.push({ table: "workout", id: preExistingB.id });
    toCleanup.push({ table: "workout", id: sourceA.id });
    toCleanup.push({ table: "workout", id: sourceB.id });

    const copied = await copyWorkoutWeek(
      coach.user.id,
      plan.id,
      localSourceStart,
      localTargetStart,
    );

    for (const w of copied) {
      toCleanup.push({ table: "workout", id: w.id });
    }

    const targetEnd = new Date(localTargetStart);

    targetEnd.setUTCDate(targetEnd.getUTCDate() + 7);

    const targetWorkouts = await cleanupRaw.workout.findMany({
      where: {
        planId: plan.id,
        scheduledDate: { gte: localTargetStart, lt: targetEnd },
      },
      orderBy: [{ scheduledDate: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });

    expect(targetWorkouts).toHaveLength(4);
    expect(targetWorkouts.map((w) => w.sortOrder)).toEqual([0, 1, 2, 3]);

    const ids = targetWorkouts.map((w) => w.id);

    expect(ids).toContain(preExistingA.id);
    expect(ids).toContain(preExistingB.id);
    expect(ids.indexOf(preExistingA.id)).toBeLessThan(ids.indexOf(preExistingB.id));
  });
});
