import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { cleanup, cleanupRaw, createTestUser } from "../../test/helpers";

import { aggregateWeeklyVolume } from "./weekly-volume-aggregator";

const weekStartDate = new Date("2026-04-21T00:00:00.000Z");

describe("aggregateWeeklyVolume (stub contract)", () => {
  let userId: string;

  beforeAll(async () => {
    const user = await createTestUser();

    userId = user.id;
  });

  afterAll(async () => {
    await cleanupRaw.weeklyVolume.deleteMany({ where: { userId } });
    await cleanup({ table: "user", id: userId });
  });

  it("returns a row with all numeric fields zeroed and empty tonnageByPattern", async () => {
    const result = await aggregateWeeklyVolume({ db: cleanupRaw, userId, weekStartDate });

    expect(Number(result.totalTonnageKg)).toBe(0);
    expect(result.workoutsScheduled).toBe(0);
    expect(result.workoutsFullyCompleted).toBe(0);
    expect(result.workoutsPartiallyCompleted).toBe(0);
    expect(result.workoutsMissed).toBe(0);
    expect(result.workoutsRx).toBe(0);
    expect(result.workoutsScaled).toBe(0);
    expect(result.totalDurationSec).toBe(0);
    expect(result.tonnageByPattern).toEqual({});
  });

  it("idempotency: calling twice upserts the same row", async () => {
    const first = await aggregateWeeklyVolume({ db: cleanupRaw, userId, weekStartDate });
    const second = await aggregateWeeklyVolume({ db: cleanupRaw, userId, weekStartDate });

    expect(second.id).toBe(first.id);
  });
});
