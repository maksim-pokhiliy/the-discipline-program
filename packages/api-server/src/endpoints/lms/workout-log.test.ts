import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ForbiddenError, NotFoundError } from "@repo/errors";

import { cleanup, createTestScenario, type TestScenario } from "../../test/helpers";

import { lmsWorkoutLogApi } from "./workout-log";

describe("lmsWorkoutLogApi", () => {
  let scenario: TestScenario;

  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    scenario = await createTestScenario({
      workoutCount: 10,
      athleteCount: 2,
    });
  });

  afterAll(async () => {
    await cleanup(...toCleanup, ...scenario.toCleanup);
  });

  const athlete = (index: number) => {
    const a = scenario.athletes[index];

    if (!a) {
      throw new Error(`athlete[${index}] not found`);
    }

    return a;
  };

  const workout = (index: number) => {
    const w = scenario.workouts[index];

    if (!w) {
      throw new Error(`workout[${index}] not found`);
    }

    return w;
  };

  describe("create", () => {
    it("creates a workout log for an enrolled user", async () => {
      const log = await lmsWorkoutLogApi.create(athlete(0).user.id, {
        workoutId: workout(0).id,
      });

      toCleanup.push({ table: "workoutLog", id: log.id });

      expect(log.id).toBeDefined();
      expect(log.userId).toBe(athlete(0).user.id);
      expect(log.workoutId).toBe(workout(0).id);
      expect(typeof log.isRx).toBe("boolean");
      expect(log.notes).toBeNull();
    });

    it("creates a log with notes and isRx", async () => {
      const log = await lmsWorkoutLogApi.create(athlete(0).user.id, {
        workoutId: workout(1).id,
        notes: "Felt strong today",
        isRx: true,
      });

      toCleanup.push({ table: "workoutLog", id: log.id });

      expect(log.notes).toBe("Felt strong today");
      expect(log.isRx).toBe(true);
    });

    it("throws NotFoundError for non-existent workout", async () => {
      const fakeWorkoutId = "cm000000000000000000fake3";

      await expect(
        lmsWorkoutLogApi.create(athlete(0).user.id, { workoutId: fakeWorkoutId }),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws ForbiddenError when user is not enrolled", async () => {
      await expect(
        lmsWorkoutLogApi.create(scenario.coach.user.id, { workoutId: workout(2).id }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("getAll", () => {
    it("returns logs only for the given user", async () => {
      const logA = await lmsWorkoutLogApi.create(athlete(0).user.id, {
        workoutId: workout(3).id,
      });

      toCleanup.push({ table: "workoutLog", id: logA.id });

      const logB = await lmsWorkoutLogApi.create(athlete(1).user.id, {
        workoutId: workout(4).id,
      });

      toCleanup.push({ table: "workoutLog", id: logB.id });

      const logsA = await lmsWorkoutLogApi.getAll(athlete(0).user.id);
      const logsB = await lmsWorkoutLogApi.getAll(athlete(1).user.id);

      expect(logsA.some((l) => l.id === logA.id)).toBe(true);
      expect(logsA.some((l) => l.id === logB.id)).toBe(false);

      expect(logsB.some((l) => l.id === logB.id)).toBe(true);
      expect(logsB.some((l) => l.id === logA.id)).toBe(false);
    });
  });

  describe("getById", () => {
    it("returns a log by ID for the owning user", async () => {
      const log = await lmsWorkoutLogApi.create(athlete(0).user.id, {
        workoutId: workout(5).id,
      });

      toCleanup.push({ table: "workoutLog", id: log.id });

      const fetched = await lmsWorkoutLogApi.getById(athlete(0).user.id, log.id);

      expect(fetched.id).toBe(log.id);
      expect(fetched.workoutId).toBe(workout(5).id);
    });

    it("throws NotFoundError when another user tries to access", async () => {
      const log = await lmsWorkoutLogApi.create(athlete(0).user.id, {
        workoutId: workout(6).id,
      });

      toCleanup.push({ table: "workoutLog", id: log.id });

      await expect(lmsWorkoutLogApi.getById(athlete(1).user.id, log.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws NotFoundError for non-existent log", async () => {
      const fakeId = "cm000000000000000000fake4";

      await expect(lmsWorkoutLogApi.getById(athlete(0).user.id, fakeId)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("delete", () => {
    it("deletes a log owned by the user", async () => {
      const log = await lmsWorkoutLogApi.create(athlete(0).user.id, {
        workoutId: workout(7).id,
      });

      await lmsWorkoutLogApi.delete(athlete(0).user.id, log.id);

      await expect(lmsWorkoutLogApi.getById(athlete(0).user.id, log.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws NotFoundError when another user tries to delete", async () => {
      const log = await lmsWorkoutLogApi.create(athlete(0).user.id, {
        workoutId: workout(8).id,
      });

      toCleanup.push({ table: "workoutLog", id: log.id });

      await expect(lmsWorkoutLogApi.delete(athlete(1).user.id, log.id)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
