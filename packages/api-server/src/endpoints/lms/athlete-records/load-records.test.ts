import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { prisma } from "../../../db/client";
import {
  cleanup,
  cleanupRaw,
  createTestAthleteProfile,
  createTestExercise,
  createTestUser,
} from "../../../test/helpers";
import { type CleanupEntry, createTestOneRMRecord } from "../../../test/schedule-helpers";

import { loadAthleteLoadContext } from "./load-records";

describe("loadAthleteLoadContext", () => {
  let athlete: Awaited<ReturnType<typeof createTestUser>>;
  let athleteWithoutProfile: Awaited<ReturnType<typeof createTestUser>>;
  let exerciseAId: string;
  let exerciseBId: string;

  const toCleanup: CleanupEntry[] = [];

  beforeAll(async () => {
    athlete = await createTestUser();
    athleteWithoutProfile = await createTestUser();

    const exerciseA = await createTestExercise();
    const exerciseB = await createTestExercise();

    exerciseAId = exerciseA.id;
    exerciseBId = exerciseB.id;

    const profile = await createTestAthleteProfile(athlete.id, {
      weightKg: 72.5,
      profileSelections: { level: "rx", gender: "f" },
    });

    toCleanup.push(
      { table: "athleteProfile", id: profile.id },
      { table: "exercise", id: exerciseAId },
      { table: "exercise", id: exerciseBId },
      { table: "user", id: athlete.id },
      { table: "user", id: athleteWithoutProfile.id },
    );

    const records = await Promise.all([
      createTestOneRMRecord(athlete.id, exerciseAId, {
        valueKg: 100,
        recordedAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
      createTestOneRMRecord(athlete.id, exerciseAId, {
        valueKg: 120,
        recordedAt: new Date("2026-02-01T00:00:00.000Z"),
      }),
      createTestOneRMRecord(athlete.id, exerciseAId, {
        valueKg: 110,
        recordedAt: new Date("2026-03-01T00:00:00.000Z"),
      }),
    ]);

    for (const record of records) {
      toCleanup.push(...record.toCleanup);
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await cleanupRaw.oneRMRecord.deleteMany({ where: { userId: athlete.id } }).catch(() => {});
    await cleanup(...toCleanup);
  });

  it("holds the latest-by-recordedAt valueKg per exercise as the current 1RM, not the max (QA-011)", async () => {
    const ctx = await loadAthleteLoadContext(athlete.id, [exerciseAId]);

    expect(ctx.currentOneRMByExercise.get(exerciseAId)).toBe(110);
  });

  it("lets a newer, lower 1RM lower the resolved current value (QA-011)", async () => {
    const dropped = await createTestOneRMRecord(athlete.id, exerciseBId, {
      valueKg: 130,
      recordedAt: new Date("2026-02-01T00:00:00.000Z"),
    });
    const later = await createTestOneRMRecord(athlete.id, exerciseBId, {
      valueKg: 105,
      recordedAt: new Date("2026-04-01T00:00:00.000Z"),
    });

    try {
      const ctx = await loadAthleteLoadContext(athlete.id, [exerciseBId]);

      expect(ctx.currentOneRMByExercise.get(exerciseBId)).toBe(105);
    } finally {
      await cleanupRaw.oneRMRecord
        .deleteMany({ where: { id: { in: [dropped.record.id, later.record.id] } } })
        .catch(() => {});
    }
  });

  it("breaks an equal-recordedAt tie by the higher id, deterministically (QA-011)", async () => {
    const recordedAt = new Date("2026-05-01T00:00:00.000Z");
    const tied = await Promise.all([
      createTestOneRMRecord(athlete.id, exerciseBId, { valueKg: 80, recordedAt }),
      createTestOneRMRecord(athlete.id, exerciseBId, { valueKg: 95, recordedAt }),
    ]);

    try {
      const [first, second] = tied;
      const winner = (first?.record.id ?? "") > (second?.record.id ?? "") ? first : second;

      const ctx = await loadAthleteLoadContext(athlete.id, [exerciseBId]);

      expect(ctx.currentOneRMByExercise.get(exerciseBId)).toBe(Number(winner?.record.valueKg));
    } finally {
      for (const record of tied) {
        await cleanupRaw.oneRMRecord.delete({ where: { id: record.record.id } }).catch(() => {});
      }
    }
  });

  it("reads bodyweightKg as Number(weightKg) from the profile (QA-011)", async () => {
    const ctx = await loadAthleteLoadContext(athlete.id, []);

    expect(ctx.bodyweightKg).toBe(72.5);
    expect(typeof ctx.bodyweightKg).toBe("number");
  });

  it("round-trips profileSelections from the profile (QA-011)", async () => {
    const ctx = await loadAthleteLoadContext(athlete.id, []);

    expect(ctx.profileSelections).toEqual({ level: "rx", gender: "f" });
  });

  it("returns a null bodyweight and an empty profileSelections when no profile exists (QA-011)", async () => {
    const ctx = await loadAthleteLoadContext(athleteWithoutProfile.id, []);

    expect(ctx.bodyweightKg).toBeNull();
    expect(ctx.profileSelections).toEqual({});
  });

  it("issues exactly one oneRMRecord findMany regardless of exercise count (no N+1, QA-011)", async () => {
    const findManySpy = vi.spyOn(prisma.oneRMRecord, "findMany");

    await loadAthleteLoadContext(athlete.id, [exerciseAId, exerciseBId]);

    expect(findManySpy).toHaveBeenCalledTimes(1);
  });

  it("skips the oneRMRecord query entirely when no exercises are requested (no N+1, QA-011)", async () => {
    const findManySpy = vi.spyOn(prisma.oneRMRecord, "findMany");

    await loadAthleteLoadContext(athlete.id, []);

    expect(findManySpy).not.toHaveBeenCalled();
  });
});
