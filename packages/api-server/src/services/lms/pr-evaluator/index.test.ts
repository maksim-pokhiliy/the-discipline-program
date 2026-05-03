import { type Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import { cleanup, cleanupRaw, createTestUser } from "../../../test/helpers";

import { evaluatePr } from "./index";

describe("evaluatePr (stub contract)", () => {
  let userId: string;
  let workoutSessionId: string;
  let blockSessionId: string;
  let exerciseLogId: string;
  let setLogId: string;

  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    const user = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ATHLETE] });

    userId = user.id;
    toCleanup.push({ table: "user", id: userId });

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
        exerciseSnapshot: {
          name: "Stub Exercise",
          primaryMovement: "SQUAT",
          modality: "BARBELL",
          primaryBodyParts: ["QUADS"],
          defaultMetrics: ["LOAD", "REPS"],
        } as Prisma.InputJsonValue,
      },
    });

    exerciseLogId = el.id;

    const setLog = await cleanupRaw.setLog.create({
      data: {
        exerciseLogId,
        order: 0,
        prescribed: { reps: { kind: "FIXED", value: 5 } } as Prisma.InputJsonValue,
        actual: { load: { kind: "BARBELL", kg: 100 }, reps: 5 } as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    setLogId = setLog.id;
  });

  afterAll(async () => {
    await cleanupRaw.personalRecord.deleteMany({ where: { userId } }).catch(() => {});
    await cleanup(...toCleanup);
  });

  it("returns created: [] regardless of input setLog", async () => {
    const result = await evaluatePr({ db: cleanupRaw, setLogId });

    expect(result.created).toHaveLength(0);

    const count = await cleanupRaw.personalRecord.count({ where: { userId } });

    expect(count).toBe(0);
  });
});
