import { type Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import { cleanup, cleanupRaw, createTestUser } from "../../../test/helpers";

import { evaluatePr } from "./index";

describe("evaluatePr (integration)", () => {
  let userId: string;
  let exerciseId: string;
  let workoutSessionId: string;
  let blockSessionId: string;
  let exerciseLogId: string;

  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    const user = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ATHLETE] });

    userId = user.id;
    toCleanup.push({ table: "user", id: userId });

    const exercise = await cleanupRaw.exerciseLibraryItem.create({
      data: {
        scope: "SYSTEM",
        name: `PR Test ${crypto.randomUUID().slice(0, 8)}`,
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

    const ws = await cleanupRaw.workoutSession.create({
      data: {
        userId,
        startedAt: new Date(),
        status: "IN_PROGRESS",
      },
    });

    workoutSessionId = ws.id;
    toCleanup.push({ table: "workoutSession", id: workoutSessionId });

    const bs = await cleanupRaw.blockSession.create({
      data: {
        workoutSessionId,
        order: 0,
        kindName: "Strength",
        weight: 1,
        archetypeKind: "COUNT_DOWN",
        schemeParamsSnapshot: {
          kind: "COUNT_DOWN",
          durationSec: 600,
        } as Prisma.InputJsonValue,
      },
    });

    blockSessionId = bs.id;

    const el = await cleanupRaw.exerciseLog.create({
      data: {
        blockSessionId,
        order: 0,
        exerciseId,
        exerciseSnapshot: {
          id: exerciseId,
          name: "PR Test",
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
        } as Prisma.InputJsonValue,
      },
    });

    exerciseLogId = el.id;
  });

  afterAll(async () => {
    await cleanupRaw.personalRecord.deleteMany({ where: { userId, exerciseId } }).catch(() => {});
    await cleanup(...toCleanup);
  });

  it("creates a PersonalRecord row when SetLog beats prior best", async () => {
    const setLog = await cleanupRaw.setLog.create({
      data: {
        exerciseLogId,
        order: 0,
        prescribed: { reps: { kind: "FIXED", value: 5 } } as Prisma.InputJsonValue,
        actual: { load: { kind: "BARBELL", kg: 100 }, reps: 5 } as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    const result = await evaluatePr({ db: cleanupRaw, setLogId: setLog.id });

    expect(result.created).not.toBeNull();
    expect(result.created?.value.toString()).toBe("100");
    expect(result.created?.unit).toBe("kg");
    const ctx = result.created?.context as { fixedReps?: number } | null;

    expect(ctx?.fixedReps).toBe(5);
  });

  it("returns created: null when SetLog load is below prior PR for same reps", async () => {
    const setLog = await cleanupRaw.setLog.create({
      data: {
        exerciseLogId,
        order: 1,
        prescribed: { reps: { kind: "FIXED", value: 5 } } as Prisma.InputJsonValue,
        actual: { load: { kind: "BARBELL", kg: 90 }, reps: 5 } as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    const result = await evaluatePr({ db: cleanupRaw, setLogId: setLog.id });

    expect(result.created).toBeNull();

    const persisted = await cleanupRaw.personalRecord.findUnique({
      where: {
        userId_exerciseId_kind: {
          userId,
          exerciseId,
          kind: "MAX_LOAD_FOR_REPS",
        },
      },
    });

    expect(persisted?.value.toString()).toBe("100");
  });
});
