import { type Prisma } from "@prisma/client";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  cleanup,
  cleanupRaw,
  createTestBlockSession,
  createTestExerciseLog,
  createTestSetLog,
  createTestUser,
  createTestWorkoutSession,
} from "../../test/helpers";

import { aggregateWeeklyVolume } from "./weekly-volume-aggregator";

const weekStartDate = new Date("2026-04-21T00:00:00.000Z");

const makeExercise = (primaryMovement: string) =>
  cleanupRaw.exerciseLibraryItem.create({
    data: {
      scope: "SYSTEM",
      name: `Vol Test ${crypto.randomUUID().slice(0, 8)}`,
      primaryMovement: primaryMovement as Prisma.ExerciseLibraryItemCreateInput["primaryMovement"],
      modality: "BARBELL",
      primaryBodyParts: ["QUADS"],
      defaultMetrics: {
        canMeasureLoad: true,
        canMeasureReps: true,
        canMeasureDuration: false,
        canMeasureDistance: false,
        canMeasureCalories: false,
      } as Prisma.InputJsonValue,
    },
  });

const barbellActual = (kg: number, reps: number): Prisma.InputJsonValue => ({
  load: { kind: "BARBELL", kg },
  reps,
});

describe("aggregateWeeklyVolume (integration)", () => {
  let userId: string;
  let exerciseId: string;
  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    const user = await createTestUser();

    userId = user.id;
    toCleanup.push({ table: "user", id: userId });

    const exercise = await makeExercise("SQUAT");

    exerciseId = exercise.id;
    toCleanup.push({ table: "exerciseLibraryItem", id: exerciseId });
  });

  afterAll(async () => {
    await cleanupRaw.weeklyVolume.deleteMany({ where: { userId } });
    await cleanup(...toCleanup);
  });

  afterEach(async () => {
    await cleanupRaw.workoutSession.deleteMany({ where: { userId } });
  });

  it("aggregates single set tonnage and counts a fully-completed session", async () => {
    const ws = await createTestWorkoutSession({
      userId,
      overrides: { completionRatio: 0.95, startedAt: weekStartDate },
    });
    const bs = await createTestBlockSession({ workoutSessionId: ws.id });
    const el = await createTestExerciseLog({ blockSessionId: bs.id, exerciseId });

    await createTestSetLog({
      exerciseLogId: el.id,
      overrides: { actual: barbellActual(100, 5) },
    });

    const result = await aggregateWeeklyVolume({ db: cleanupRaw, userId, weekStartDate });

    expect(Number(result.totalTonnageKg)).toBe(500);
    const pattern = result.tonnageByPattern as Record<string, number>;

    expect(pattern["SQUAT"]).toBe(500);
    expect(result.workoutsFullyCompleted).toBe(1);
    expect(result.workoutsScheduled).toBe(1);
  });

  it("completionRatio 0.95 → workoutsFullyCompleted", async () => {
    await createTestWorkoutSession({
      userId,
      overrides: { completionRatio: 0.95, startedAt: weekStartDate },
    });

    const result = await aggregateWeeklyVolume({ db: cleanupRaw, userId, weekStartDate });

    expect(result.workoutsFullyCompleted).toBe(1);
    expect(result.workoutsPartiallyCompleted).toBe(0);
    expect(result.workoutsMissed).toBe(0);
  });

  it("completionRatio 0.5 → workoutsPartiallyCompleted", async () => {
    await createTestWorkoutSession({
      userId,
      overrides: { completionRatio: 0.5, startedAt: weekStartDate },
    });

    const result = await aggregateWeeklyVolume({ db: cleanupRaw, userId, weekStartDate });

    expect(result.workoutsFullyCompleted).toBe(0);
    expect(result.workoutsPartiallyCompleted).toBe(1);
    expect(result.workoutsMissed).toBe(0);
  });

  it("completionRatio 0.1 → workoutsMissed", async () => {
    await createTestWorkoutSession({
      userId,
      overrides: { completionRatio: 0.1, startedAt: weekStartDate },
    });

    const result = await aggregateWeeklyVolume({ db: cleanupRaw, userId, weekStartDate });

    expect(result.workoutsFullyCompleted).toBe(0);
    expect(result.workoutsPartiallyCompleted).toBe(0);
    expect(result.workoutsMissed).toBe(1);
  });

  it("tonnageByPattern splits across different primaryMovement values", async () => {
    const pushExercise = await makeExercise("PUSH_VERTICAL");

    toCleanup.push({ table: "exerciseLibraryItem", id: pushExercise.id });

    const ws = await createTestWorkoutSession({
      userId,
      overrides: { startedAt: weekStartDate },
    });
    const bs = await createTestBlockSession({ workoutSessionId: ws.id });

    const elSquat = await createTestExerciseLog({ blockSessionId: bs.id, exerciseId });
    const elPush = await createTestExerciseLog({
      blockSessionId: bs.id,
      exerciseId: pushExercise.id,
    });

    await createTestSetLog({
      exerciseLogId: elSquat.id,
      overrides: { actual: barbellActual(80, 5) },
    });
    await createTestSetLog({
      exerciseLogId: elPush.id,
      overrides: { actual: barbellActual(60, 3) },
    });

    const result = await aggregateWeeklyVolume({ db: cleanupRaw, userId, weekStartDate });

    const pattern = result.tonnageByPattern as Record<string, number>;

    expect(pattern["SQUAT"]).toBe(400);
    expect(pattern["PUSH_VERTICAL"]).toBe(180);
    expect(Number(result.totalTonnageKg)).toBe(580);
  });

  it("rxStatus RX vs SCALED increments correct counters", async () => {
    const ws = await createTestWorkoutSession({
      userId,
      overrides: { startedAt: weekStartDate },
    });

    await createTestBlockSession({
      workoutSessionId: ws.id,
      overrides: { rxStatus: "RX", order: 0 },
    });
    await createTestBlockSession({
      workoutSessionId: ws.id,
      overrides: { rxStatus: "SCALED", order: 1 },
    });

    const result = await aggregateWeeklyVolume({ db: cleanupRaw, userId, weekStartDate });

    expect(result.workoutsRx).toBe(1);
    expect(result.workoutsScaled).toBe(1);
  });

  it("empty week produces a row with all numeric fields zeroed", async () => {
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

  it("idempotency: calling twice produces the same row, no duplicates", async () => {
    const ws = await createTestWorkoutSession({
      userId,
      overrides: { completionRatio: 1.0, startedAt: weekStartDate },
    });
    const bs = await createTestBlockSession({ workoutSessionId: ws.id });
    const el = await createTestExerciseLog({ blockSessionId: bs.id, exerciseId });

    await createTestSetLog({
      exerciseLogId: el.id,
      overrides: { actual: barbellActual(50, 10) },
    });

    const first = await aggregateWeeklyVolume({ db: cleanupRaw, userId, weekStartDate });
    const second = await aggregateWeeklyVolume({ db: cleanupRaw, userId, weekStartDate });

    expect(second.id).toBe(first.id);
    expect(Number(second.totalTonnageKg)).toBe(500);
    expect(second.workoutsFullyCompleted).toBe(1);

    const count = await cleanupRaw.weeklyVolume.count({ where: { userId, weekStartDate } });

    expect(count).toBe(1);
  });
});
