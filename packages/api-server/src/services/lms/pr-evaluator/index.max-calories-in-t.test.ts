import { type Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import { cleanup, cleanupRaw, createTestUser } from "../../../test/helpers";

import { evaluatePr } from "./index";

describe("evaluatePr — MAX_CALORIES_IN_T (integration)", () => {
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
        name: `PR Calories Test ${crypto.randomUUID().slice(0, 8)}`,
        primaryMovement: "CARDIO_ROW",
        modality: "CARDIO",
        primaryBodyParts: ["BACK"],
        defaultMetrics: {
          canMeasureLoad: false,
          canMeasureReps: false,
          canMeasureDuration: true,
          canMeasureDistance: false,
          canMeasureCalories: true,
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
        kindName: "Conditioning",
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
          name: "PR Calories Test",
          primaryMovement: "CARDIO_ROW",
          modality: "CARDIO",
          primaryBodyParts: ["BACK"],
          defaultMetrics: {
            canMeasureLoad: false,
            canMeasureReps: false,
            canMeasureDuration: true,
            canMeasureDistance: false,
            canMeasureCalories: true,
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

  it("creates MAX_CALORIES_IN_T and stores timeSec context", async () => {
    const setLog = await cleanupRaw.setLog.create({
      data: {
        exerciseLogId,
        order: 0,
        prescribed: {} as Prisma.InputJsonValue,
        actual: { calories: 42, durationSec: 60 } as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    const result = await evaluatePr({ db: cleanupRaw, setLogId: setLog.id });

    const calPr = result.created.find((pr) => pr.kind === "MAX_CALORIES_IN_T");

    expect(calPr).not.toBeUndefined();
    expect(Number(calPr?.value)).toBe(42);
    expect(calPr?.unit).toBe("cal");

    const ctx = calPr?.context as { timeSec?: number } | null;

    expect(ctx?.timeSec).toBe(60);
  });
});
