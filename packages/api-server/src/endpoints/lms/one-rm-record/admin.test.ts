import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createOneRMRecordRequestSchema,
  OneRMRecordSource,
} from "@repo/contracts/lms/one-rm-record";

import { cleanupRaw, createTestExercise, createTestUser } from "../../../test/helpers";
import { type CleanupEntry } from "../../../test/schedule-helpers";

import { lmsOneRMRecordApi } from "./admin";

describe("lmsOneRMRecordApi", () => {
  let athlete: Awaited<ReturnType<typeof createTestUser>>;
  let otherAthlete: Awaited<ReturnType<typeof createTestUser>>;
  let exerciseAId: string;
  let exerciseBId: string;

  const toCleanup: CleanupEntry[] = [];

  beforeAll(async () => {
    athlete = await createTestUser();
    otherAthlete = await createTestUser();

    const exerciseA = await createTestExercise();
    const exerciseB = await createTestExercise();

    exerciseAId = exerciseA.id;
    exerciseBId = exerciseB.id;
  });

  afterAll(async () => {
    await cleanupRaw.oneRMRecord
      .deleteMany({ where: { userId: { in: [athlete.id, otherAthlete.id] } } })
      .catch(() => {});
    await cleanupRaw.exercise.delete({ where: { id: exerciseAId } }).catch(() => {});
    await cleanupRaw.exercise.delete({ where: { id: exerciseBId } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: athlete.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: otherAthlete.id } }).catch(() => {});

    for (const entry of toCleanup) {
      await cleanupRaw.oneRMRecord.delete({ where: { id: entry.id } }).catch(() => {});
    }
  });

  describe("create", () => {
    it("persists valueKg as a number and the source enum (QA-006)", async () => {
      const record = await lmsOneRMRecordApi.create(athlete.id, {
        exerciseId: exerciseAId,
        valueKg: 102.5,
        recordedAt: new Date("2026-02-01T00:00:00.000Z"),
        source: OneRMRecordSource.TESTED,
      });

      toCleanup.push({ table: "oneRMRecord", id: record.id });

      expect(record.userId).toBe(athlete.id);
      expect(record.exerciseId).toBe(exerciseAId);
      expect(record.valueKg).toBe(102.5);
      expect(typeof record.valueKg).toBe("number");
      expect(record.source).toBe(OneRMRecordSource.TESTED);
    });

    it("owns the record by the wrapper userId, ignoring a body-supplied userId (QA-006)", async () => {
      const parsed = createOneRMRecordRequestSchema.parse({
        exerciseId: exerciseAId,
        valueKg: 80,
        recordedAt: "2026-02-02T00:00:00.000Z",
        source: OneRMRecordSource.MANUAL,
        userId: otherAthlete.id,
      });

      expect(parsed).not.toHaveProperty("userId");

      const record = await lmsOneRMRecordApi.create(athlete.id, parsed);

      toCleanup.push({ table: "oneRMRecord", id: record.id });

      expect(record.userId).toBe(athlete.id);
    });

    it("persists multiple records for one exercise as history (QA-006)", async () => {
      const first = await lmsOneRMRecordApi.create(athlete.id, {
        exerciseId: exerciseBId,
        valueKg: 90,
        recordedAt: new Date("2026-01-01T00:00:00.000Z"),
        source: OneRMRecordSource.MANUAL,
      });
      const second = await lmsOneRMRecordApi.create(athlete.id, {
        exerciseId: exerciseBId,
        valueKg: 95,
        recordedAt: new Date("2026-03-01T00:00:00.000Z"),
        source: OneRMRecordSource.TESTED,
      });

      toCleanup.push(
        { table: "oneRMRecord", id: first.id },
        { table: "oneRMRecord", id: second.id },
      );

      const history = await lmsOneRMRecordApi.listByUser(athlete.id, { exerciseId: exerciseBId });

      expect(history.map((row) => row.id)).toContain(first.id);
      expect(history.map((row) => row.id)).toContain(second.id);
    });
  });

  describe("listByUser", () => {
    it("returns the full history ordered recordedAt desc with no cap (QA-006)", async () => {
      const dates = [
        "2026-01-10T00:00:00.000Z",
        "2026-02-10T00:00:00.000Z",
        "2026-03-10T00:00:00.000Z",
        "2026-04-10T00:00:00.000Z",
        "2026-05-10T00:00:00.000Z",
      ];
      const exercise = await createTestExercise();

      const created = [];

      for (const recordedAt of dates) {
        const record = await lmsOneRMRecordApi.create(athlete.id, {
          exerciseId: exercise.id,
          valueKg: 100,
          recordedAt: new Date(recordedAt),
          source: OneRMRecordSource.MANUAL,
        });

        created.push(record);
        toCleanup.push({ table: "oneRMRecord", id: record.id });
      }

      try {
        const history = await lmsOneRMRecordApi.listByUser(athlete.id, { exerciseId: exercise.id });

        expect(history).toHaveLength(dates.length);

        const times = history.map((row) => row.recordedAt.getTime());
        const descending = [...times].sort((a, b) => b - a);

        expect(times).toEqual(descending);
      } finally {
        for (const record of created) {
          await cleanupRaw.oneRMRecord.delete({ where: { id: record.id } }).catch(() => {});
        }
        await cleanupRaw.exercise.delete({ where: { id: exercise.id } }).catch(() => {});
      }
    });

    it("returns records across every exercise when no exerciseId filter is given (QA-006)", async () => {
      const aRecord = await lmsOneRMRecordApi.create(otherAthlete.id, {
        exerciseId: exerciseAId,
        valueKg: 60,
        recordedAt: new Date("2026-01-01T00:00:00.000Z"),
        source: OneRMRecordSource.MANUAL,
      });
      const bRecord = await lmsOneRMRecordApi.create(otherAthlete.id, {
        exerciseId: exerciseBId,
        valueKg: 70,
        recordedAt: new Date("2026-02-01T00:00:00.000Z"),
        source: OneRMRecordSource.MANUAL,
      });

      toCleanup.push(
        { table: "oneRMRecord", id: aRecord.id },
        { table: "oneRMRecord", id: bRecord.id },
      );

      const all = await lmsOneRMRecordApi.listByUser(otherAthlete.id, {});
      const exerciseIds = all.map((row) => row.exerciseId);

      expect(exerciseIds).toContain(exerciseAId);
      expect(exerciseIds).toContain(exerciseBId);
    });
  });
});
