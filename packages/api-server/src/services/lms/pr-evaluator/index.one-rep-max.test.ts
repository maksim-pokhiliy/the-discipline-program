import { type Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import { cleanup, cleanupRaw, createTestUser } from "../../../test/helpers";

import { evaluatePr } from "./index";

describe("evaluatePr — ONE_REP_MAX (integration)", () => {
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
        name: `PR 1RM Test ${crypto.randomUUID().slice(0, 8)}`,
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
      data: { userId, startedAt: new Date(), status: "IN_PROGRESS" },
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
        schemeParamsSnapshot: { kind: "COUNT_DOWN", durationSec: 600 } as Prisma.InputJsonValue,
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
          name: "PR 1RM Test",
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

  it("creates ONE_REP_MAX using Epley formula (100kg × 5 reps ≈ 116.67 kg)", async () => {
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

    const oneRepPr = result.created.find((pr) => pr.kind === "ONE_REP_MAX");

    expect(oneRepPr).not.toBeUndefined();
    expect(oneRepPr?.unit).toBe("kg");

    const value = Number(oneRepPr?.value);

    expect(value).toBeCloseTo(116.67, 1);

    const ctx = oneRepPr?.context as { formula?: string } | null;

    expect(ctx?.formula).toBe("epley");
  });

  it("does not update ONE_REP_MAX when new set yields lower estimated 1RM", async () => {
    const setLog = await cleanupRaw.setLog.create({
      data: {
        exerciseLogId,
        order: 1,
        prescribed: { reps: { kind: "FIXED", value: 5 } } as Prisma.InputJsonValue,
        actual: { load: { kind: "BARBELL", kg: 60 }, reps: 5 } as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    await evaluatePr({ db: cleanupRaw, setLogId: setLog.id });

    const pr = await cleanupRaw.personalRecord.findUnique({
      where: { userId_exerciseId_kind: { userId, exerciseId, kind: "ONE_REP_MAX" } },
    });

    expect(Number(pr?.value)).toBeCloseTo(116.67, 1);
  });
});
