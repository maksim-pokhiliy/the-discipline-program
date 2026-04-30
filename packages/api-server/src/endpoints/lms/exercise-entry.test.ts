import { type Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { type ExerciseSnapshot, type Prescription } from "@repo/contracts/lms/_domain";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { cleanup, cleanupRaw, createTestCoach } from "../../test/helpers";

import { lmsExerciseEntryApi } from "./exercise-entry";

const buildSnapshot = (
  id: string,
  overrides: Partial<ExerciseSnapshot> = {},
): ExerciseSnapshot => ({
  id,
  name: "Back Squat",
  primaryMovement: "SQUAT",
  modality: "BARBELL",
  primaryBodyParts: ["QUADS"],
  defaultMetrics: {
    canMeasureLoad: true,
    canMeasureReps: true,
    canMeasureDuration: false,
    canMeasureDistance: false,
    canMeasureCalories: false,
  },
  demoVideoUrl: null,
  demoImageUrl: null,
  ...overrides,
});

const buildPrescription = (overrides: Partial<Prescription> = {}): Prescription => ({
  reps: { kind: "FIXED", value: 5 },
  sideMode: "BILATERAL",
  modifiers: [],
  ...overrides,
});

describe("lmsExerciseEntryApi (integration)", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let setGroupId: string;
  let exerciseId: string;
  let exerciseId2: string;
  let blockKindId: string;
  let planId: string;

  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    coach = await createTestCoach();

    await cleanupRaw.user.update({
      where: { id: coach.user.id },
      data: { role: ROLE_TO_PRISMA_MAP[UserRole.COACH] },
    });

    const plan = await cleanupRaw.trainingPlan.create({
      data: {
        creatorId: coach.user.id,
        name: `Plan ${crypto.randomUUID().slice(0, 8)}`,
        status: TrainingPlanStatus.DRAFT,
      },
    });

    planId = plan.id;
    toCleanup.push({ table: "trainingPlan", id: planId });

    const week = await cleanupRaw.week.create({
      data: { planId, index: 0 },
    });

    const day = await cleanupRaw.day.create({
      data: { weekId: week.id, dayOfWeek: "MON" },
    });

    const session = await cleanupRaw.lmsSession.create({
      data: { dayId: day.id, order: 0 },
    });

    const blockKind = await cleanupRaw.blockKind.create({
      data: {
        scope: "SYSTEM",
        name: `Test Kind ${crypto.randomUUID().slice(0, 8)}`,
        defaultWeight: 1,
      },
    });

    blockKindId = blockKind.id;
    toCleanup.push({ table: "blockKind", id: blockKindId });

    const block = await cleanupRaw.block.create({
      data: {
        sessionId: session.id,
        order: 0,
        kindId: blockKindId,
        weight: 1,
      },
    });

    const segment = await cleanupRaw.blockSegment.create({
      data: {
        blockId: block.id,
        order: 0,
        archetypeKind: "COUNT_DOWN",
        schemeParams: {
          kind: "COUNT_DOWN",
          durationSec: 600,
        } as Prisma.InputJsonValue,
      },
    });

    const setGroup = await cleanupRaw.setGroup.create({
      data: {
        segmentId: segment.id,
        order: 0,
      },
    });

    setGroupId = setGroup.id;

    const exercise = await cleanupRaw.exerciseLibraryItem.create({
      data: {
        scope: "SYSTEM",
        name: `Test Exercise ${crypto.randomUUID().slice(0, 8)}`,
        primaryMovement: "SQUAT",
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

    exerciseId = exercise.id;
    toCleanup.push({ table: "exerciseLibraryItem", id: exerciseId });

    const exercise2 = await cleanupRaw.exerciseLibraryItem.create({
      data: {
        scope: "SYSTEM",
        name: `Alt Exercise ${crypto.randomUUID().slice(0, 8)}`,
        primaryMovement: "PULL_VERTICAL",
        modality: "BARBELL",
        primaryBodyParts: ["BACK"],
        defaultMetrics: {
          canMeasureLoad: true,
          canMeasureReps: true,
          canMeasureDuration: false,
          canMeasureDistance: false,
          canMeasureCalories: false,
        } as Prisma.InputJsonValue,
      },
    });

    exerciseId2 = exercise2.id;
    toCleanup.push({ table: "exerciseLibraryItem", id: exerciseId2 });
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
  });

  it("update returns the full entity with version incremented and server-derived snapshot", async () => {
    const created = await lmsExerciseEntryApi.create(coach.user.id, {
      setGroupId,
      order: 0,
      exerciseId,
      exerciseSnapshot: buildSnapshot(exerciseId),
      prescription: buildPrescription(),
      alternatives: [],
    });

    expect(created.version).toBe(1);

    const updated = await lmsExerciseEntryApi.update(coach.user.id, created.id, {
      expectedVersion: 1,
      order: 1,
      exerciseId,
      exerciseSnapshot: buildSnapshot("stale-client-id", { name: "Stale Name" }),
      prescription: buildPrescription({ reps: { kind: "FIXED", value: 8 } }),
      alternatives: [],
      externalUrl: null,
      notes: "updated notes",
    });

    expect(updated.version).toBe(2);
    expect(updated.order).toBe(1);
    expect(updated.notes).toBe("updated notes");
    expect(updated.exerciseSnapshot.id).toBe(exerciseId);
    expect(updated.exerciseSnapshot.name).not.toBe("Stale Name");
  });

  it("update throws ConflictError on stale expectedVersion", async () => {
    const created = await lmsExerciseEntryApi.create(coach.user.id, {
      setGroupId,
      order: 5,
      exerciseId,
      exerciseSnapshot: buildSnapshot(exerciseId),
      prescription: buildPrescription(),
      alternatives: [],
    });

    await lmsExerciseEntryApi.update(coach.user.id, created.id, {
      expectedVersion: 1,
      order: 5,
      exerciseId,
      exerciseSnapshot: buildSnapshot(exerciseId),
      prescription: buildPrescription({ reps: { kind: "FIXED", value: 6 } }),
      alternatives: [],
      externalUrl: null,
      notes: null,
    });

    await expect(
      lmsExerciseEntryApi.update(coach.user.id, created.id, {
        expectedVersion: 1,
        order: 5,
        exerciseId,
        exerciseSnapshot: buildSnapshot(exerciseId),
        prescription: buildPrescription({ reps: { kind: "FIXED", value: 7 } }),
        alternatives: [],
        externalUrl: null,
        notes: null,
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      details: { currentVersion: 2, expectedVersion: 1 },
    });
  });

  it("update overwrites exerciseSnapshot from the live library row when exerciseId changes", async () => {
    const created = await lmsExerciseEntryApi.create(coach.user.id, {
      setGroupId,
      order: 9,
      exerciseId,
      exerciseSnapshot: buildSnapshot(exerciseId),
      prescription: buildPrescription(),
      alternatives: [],
    });

    const updated = await lmsExerciseEntryApi.update(coach.user.id, created.id, {
      expectedVersion: 1,
      order: 9,
      exerciseId: exerciseId2,
      exerciseSnapshot: buildSnapshot(exerciseId2, { name: "client lie" }),
      prescription: buildPrescription(),
      alternatives: [],
      externalUrl: null,
      notes: null,
    });

    expect(updated.exerciseId).toBe(exerciseId2);
    expect(updated.exerciseSnapshot.id).toBe(exerciseId2);
    expect(updated.exerciseSnapshot.primaryMovement).toBe("PULL_VERTICAL");
    expect(updated.exerciseSnapshot.name).not.toBe("client lie");
  });
});
