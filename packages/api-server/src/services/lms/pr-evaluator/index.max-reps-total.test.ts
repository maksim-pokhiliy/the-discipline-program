import { type Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import { cleanup, cleanupRaw, createTestUser } from "../../../test/helpers";

import { evaluatePr } from "./index";

describe("evaluatePr — MAX_REPS_TOTAL (integration)", () => {
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
        name: `PR RepsTotal Test ${crypto.randomUUID().slice(0, 8)}`,
        primaryMovement: "PULL_VERTICAL",
        modality: "BODYWEIGHT",
        primaryBodyParts: ["BACK"],
        defaultMetrics: {
          canMeasureLoad: false,
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
          name: "PR RepsTotal Test",
          primaryMovement: "PULL_VERTICAL",
          modality: "BODYWEIGHT",
          primaryBodyParts: ["BACK"],
          defaultMetrics: {
            canMeasureLoad: false,
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

  it("creates MAX_REPS_TOTAL summing all sets in the exercise log", async () => {
    const s1 = await cleanupRaw.setLog.create({
      data: {
        exerciseLogId,
        order: 0,
        prescribed: {} as Prisma.InputJsonValue,
        actual: { reps: 10 } as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    await cleanupRaw.setLog.create({
      data: {
        exerciseLogId,
        order: 1,
        prescribed: {} as Prisma.InputJsonValue,
        actual: { reps: 8 } as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    const result = await evaluatePr({ db: cleanupRaw, setLogId: s1.id });

    const totalRepsPr = result.created.find((pr) => pr.kind === "MAX_REPS_TOTAL");

    expect(totalRepsPr).not.toBeUndefined();
    expect(totalRepsPr?.unit).toBe("reps");
    expect(Number(totalRepsPr?.value)).toBe(18);

    const ctx = totalRepsPr?.context as { totalReps?: number } | null;

    expect(ctx?.totalReps).toBe(18);
  });
});
