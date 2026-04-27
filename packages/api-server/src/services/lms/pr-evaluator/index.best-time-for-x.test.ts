import { type Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import { cleanup, cleanupRaw, createTestUser } from "../../../test/helpers";

import { evaluatePr } from "./index";

describe("evaluatePr — BEST_TIME_FOR_X (integration)", () => {
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
        name: `PR BestTime Test ${crypto.randomUUID().slice(0, 8)}`,
        primaryMovement: "CARDIO_RUN",
        modality: "CARDIO",
        primaryBodyParts: ["QUADS"],
        defaultMetrics: {
          canMeasureLoad: false,
          canMeasureReps: false,
          canMeasureDuration: true,
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
        kindName: "Cardio",
        weight: 1,
        archetypeKind: "COUNT_DOWN",
        schemeParamsSnapshot: { kind: "COUNT_DOWN", durationSec: 1200 } as Prisma.InputJsonValue,
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
          name: "PR BestTime Test",
          primaryMovement: "CARDIO_RUN",
          modality: "CARDIO",
          primaryBodyParts: ["QUADS"],
          defaultMetrics: {
            canMeasureLoad: false,
            canMeasureReps: false,
            canMeasureDuration: true,
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

  it("creates BEST_TIME_FOR_X when no prior record exists", async () => {
    const setLog = await cleanupRaw.setLog.create({
      data: {
        exerciseLogId,
        order: 0,
        prescribed: {} as Prisma.InputJsonValue,
        actual: { durationSec: 240 } as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    const result = await evaluatePr({ db: cleanupRaw, setLogId: setLog.id });

    const timePr = result.created.find((pr) => pr.kind === "BEST_TIME_FOR_X");

    expect(timePr).not.toBeUndefined();
    expect(Number(timePr?.value)).toBe(240);
    expect(timePr?.unit).toBe("sec");
  });

  it("updates BEST_TIME_FOR_X when a faster time is logged", async () => {
    const setLog = await cleanupRaw.setLog.create({
      data: {
        exerciseLogId,
        order: 1,
        prescribed: {} as Prisma.InputJsonValue,
        actual: { durationSec: 210 } as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    await evaluatePr({ db: cleanupRaw, setLogId: setLog.id });

    const pr = await cleanupRaw.personalRecord.findUnique({
      where: { userId_exerciseId_kind: { userId, exerciseId, kind: "BEST_TIME_FOR_X" } },
    });

    expect(Number(pr?.value)).toBe(210);
  });

  it("does not update BEST_TIME_FOR_X when a slower time is logged", async () => {
    const setLog = await cleanupRaw.setLog.create({
      data: {
        exerciseLogId,
        order: 2,
        prescribed: {} as Prisma.InputJsonValue,
        actual: { durationSec: 300 } as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    await evaluatePr({ db: cleanupRaw, setLogId: setLog.id });

    const pr = await cleanupRaw.personalRecord.findUnique({
      where: { userId_exerciseId_kind: { userId, exerciseId, kind: "BEST_TIME_FOR_X" } },
    });

    expect(Number(pr?.value)).toBe(210);
  });
});
