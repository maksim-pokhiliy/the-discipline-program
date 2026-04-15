import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { BadRequestError } from "@repo/errors";

import { cleanup, createTestCoach, createTestPlan } from "../../test/helpers";

import { lmsWorkoutApi } from "./workout";

describe("lmsWorkoutApi", () => {
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

  describe("toUTCMidnight (tested through create)", () => {
    it("normalizes date to UTC midnight", async () => {
      const workout = await lmsWorkoutApi.create(coach.user.id, plan.id, {
        scheduledDate: new Date("2025-06-15T14:30:00Z"),
        title: "Midnight test",
      });

      toCleanup.push({ table: "workout", id: workout.id });

      expect(workout.scheduledDate).toEqual(new Date("2025-06-16T00:00:00Z"));
    });

    it("keeps same day when hours < 12", async () => {
      const workout = await lmsWorkoutApi.create(coach.user.id, plan.id, {
        scheduledDate: new Date("2025-06-15T08:00:00Z"),
        title: "Morning test",
      });

      toCleanup.push({ table: "workout", id: workout.id });

      expect(workout.scheduledDate).toEqual(new Date("2025-06-15T00:00:00Z"));
    });
  });

  describe("move", () => {
    it("normalizes target date to UTC midnight", async () => {
      const workout = await lmsWorkoutApi.create(coach.user.id, plan.id, {
        scheduledDate: new Date("2025-06-10T00:00:00Z"),
        title: "Move target",
      });

      toCleanup.push({ table: "workout", id: workout.id });

      const moved = await lmsWorkoutApi.move(
        coach.user.id,
        workout.id,
        new Date("2025-06-12T18:00:00Z"),
      );

      expect(moved.scheduledDate).toEqual(new Date("2025-06-13T00:00:00Z"));
    });

    it("reorders with explicit targetDayOrderedIds", async () => {
      const targetDate = new Date("2025-07-01T00:00:00Z");

      const w1 = await lmsWorkoutApi.create(coach.user.id, plan.id, {
        scheduledDate: targetDate,
        title: "Order A",
      });

      toCleanup.push({ table: "workout", id: w1.id });

      const w2 = await lmsWorkoutApi.create(coach.user.id, plan.id, {
        scheduledDate: targetDate,
        title: "Order B",
      });

      toCleanup.push({ table: "workout", id: w2.id });

      const w3 = await lmsWorkoutApi.create(coach.user.id, plan.id, {
        scheduledDate: new Date("2025-06-30T00:00:00Z"),
        title: "Moving in",
      });

      toCleanup.push({ table: "workout", id: w3.id });

      await lmsWorkoutApi.move(coach.user.id, w3.id, targetDate, [w2.id, w3.id, w1.id]);

      const all = await lmsWorkoutApi.getAll(coach.user.id, plan.id);
      const dayWorkouts = all
        .filter((w) => w.scheduledDate?.toISOString() === targetDate.toISOString())
        .sort((a, b) => a.sortOrder - b.sortOrder);

      expect(dayWorkouts.map((w) => w.id)).toEqual([w2.id, w3.id, w1.id]);
    });

    it("appends to end without explicit ordering", async () => {
      const targetDate = new Date("2025-08-01T00:00:00Z");

      const existing = await lmsWorkoutApi.create(coach.user.id, plan.id, {
        scheduledDate: targetDate,
        title: "Already here",
      });

      toCleanup.push({ table: "workout", id: existing.id });

      const moving = await lmsWorkoutApi.create(coach.user.id, plan.id, {
        scheduledDate: new Date("2025-07-31T00:00:00Z"),
        title: "Append me",
      });

      toCleanup.push({ table: "workout", id: moving.id });

      const moved = await lmsWorkoutApi.move(coach.user.id, moving.id, targetDate);

      expect(moved.sortOrder).toBeGreaterThan(0);
    });

    it("gives sortOrder 0 on empty day", async () => {
      const emptyDate = new Date("2025-09-15T00:00:00Z");

      const workout = await lmsWorkoutApi.create(coach.user.id, plan.id, {
        scheduledDate: new Date("2025-09-14T00:00:00Z"),
        title: "Lone wolf",
      });

      toCleanup.push({ table: "workout", id: workout.id });

      const moved = await lmsWorkoutApi.move(coach.user.id, workout.id, emptyDate);

      expect(moved.sortOrder).toBe(0);
    });
  });

  describe("copyWeek", () => {
    it("copies workouts with correct date shift", async () => {
      const sourceMonday = new Date("2025-10-06T00:00:00Z");

      const src = await lmsWorkoutApi.create(coach.user.id, plan.id, {
        scheduledDate: new Date("2025-10-07T00:00:00Z"),
        title: "Source workout",
      });

      toCleanup.push({ table: "workout", id: src.id });

      const targetMonday = new Date("2025-10-13T00:00:00Z");

      const copied = await lmsWorkoutApi.copyWeek(
        coach.user.id,
        plan.id,
        sourceMonday,
        targetMonday,
      );

      for (const w of copied) {
        toCleanup.push({ table: "workout", id: w.id });
      }

      expect(copied).toHaveLength(1);
      expect(copied[0]?.scheduledDate).toEqual(new Date("2025-10-14T00:00:00Z"));
      expect(copied[0]?.title).toBe("Source workout");
    });

    it("copies workout content field", async () => {
      const srcDate = new Date("2025-11-03T00:00:00Z");

      const srcWorkout = await lmsWorkoutApi.create(coach.user.id, plan.id, {
        scheduledDate: srcDate,
        title: "With content",
        content: "A. Back Squat\n5x5 @ 185lb",
      });

      toCleanup.push({ table: "workout", id: srcWorkout.id });

      const targetDate = new Date("2025-11-10T00:00:00Z");

      const copied = await lmsWorkoutApi.copyWeek(coach.user.id, plan.id, srcDate, targetDate);

      for (const w of copied) {
        toCleanup.push({ table: "workout", id: w.id });
      }

      expect(copied).toHaveLength(1);
      expect(copied[0]?.content).toBe("A. Back Squat\n5x5 @ 185lb");
    });

    it("returns empty array for empty source week", async () => {
      const empty = await lmsWorkoutApi.copyWeek(
        coach.user.id,
        plan.id,
        new Date("2030-01-01T00:00:00Z"),
        new Date("2030-01-08T00:00:00Z"),
      );

      expect(empty).toEqual([]);
    });
  });

  describe("reorder", () => {
    it("updates sortOrder for all provided IDs", async () => {
      const date = new Date("2025-12-01T00:00:00Z");

      const w1 = await lmsWorkoutApi.create(coach.user.id, plan.id, {
        scheduledDate: date,
        title: "Reorder A",
      });

      toCleanup.push({ table: "workout", id: w1.id });

      const w2 = await lmsWorkoutApi.create(coach.user.id, plan.id, {
        scheduledDate: date,
        title: "Reorder B",
      });

      toCleanup.push({ table: "workout", id: w2.id });

      await lmsWorkoutApi.reorder(coach.user.id, plan.id, [w2.id, w1.id]);

      const all = await lmsWorkoutApi.getAll(coach.user.id, plan.id);
      const w1After = all.find((w) => w.id === w1.id);
      const w2After = all.find((w) => w.id === w2.id);

      expect(w2After?.sortOrder).toBe(0);
      expect(w1After?.sortOrder).toBe(1);
    });

    it("throws on IDs not belonging to the plan", async () => {
      await expect(
        lmsWorkoutApi.reorder(coach.user.id, plan.id, [crypto.randomUUID()]),
      ).rejects.toThrow(BadRequestError);
    });
  });
});
