import { type Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { cleanup, cleanupRaw, createTestCoach } from "../../test/helpers";

import { lmsBlockSegmentApi } from "./block-segment";

describe("lmsBlockSegmentApi (integration)", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let blockId: string;
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

    blockId = block.id;
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
  });

  it("creates a COUNT_DOWN segment with valid scheme params", async () => {
    const segment = await lmsBlockSegmentApi.create(coach.user.id, {
      blockId,
      order: 0,
      archetypeKind: "COUNT_DOWN",
      schemeParams: { kind: "COUNT_DOWN", durationSec: 600 },
    });

    expect(segment.archetypeKind).toBe("COUNT_DOWN");
    expect(segment.schemeParams).toEqual({ kind: "COUNT_DOWN", durationSec: 600 });
    expect(segment.version).toBe(1);
  });

  it("DB CHECK rejects schemeParams whose kind does not match archetypeKind", async () => {
    await expect(
      cleanupRaw.blockSegment.create({
        data: {
          blockId,
          order: 99,
          archetypeKind: "EMOM_LOOP",
          schemeParams: { kind: "COUNT_UP" } as Prisma.InputJsonValue,
        },
      }),
    ).rejects.toThrow();
  });

  it("update returns full entity with version incremented", async () => {
    const segment = await lmsBlockSegmentApi.create(coach.user.id, {
      blockId,
      order: 10,
      archetypeKind: "COUNT_UP",
      schemeParams: { kind: "COUNT_UP", cap: 300 },
    });

    expect(segment.version).toBe(1);

    const updated = await lmsBlockSegmentApi.update(coach.user.id, segment.id, {
      expectedVersion: 1,
      order: 11,
      label: "Updated label",
      archetypeKind: "COUNT_UP",
      schemeParams: { kind: "COUNT_UP", cap: 600 },
      schemeTemplateId: null,
      restConfig: null,
    });

    expect(updated.version).toBe(2);
    expect(updated.order).toBe(11);
    expect(updated.label).toBe("Updated label");
    expect(updated.schemeParams).toEqual({ kind: "COUNT_UP", cap: 600 });
  });

  it("update throws ConflictError on stale expectedVersion", async () => {
    const segment = await lmsBlockSegmentApi.create(coach.user.id, {
      blockId,
      order: 20,
      archetypeKind: "COUNT_DOWN",
      schemeParams: { kind: "COUNT_DOWN", durationSec: 120 },
    });

    await lmsBlockSegmentApi.update(coach.user.id, segment.id, {
      expectedVersion: 1,
      order: 20,
      label: null,
      archetypeKind: "COUNT_DOWN",
      schemeParams: { kind: "COUNT_DOWN", durationSec: 180 },
      schemeTemplateId: null,
      restConfig: null,
    });

    await expect(
      lmsBlockSegmentApi.update(coach.user.id, segment.id, {
        expectedVersion: 1,
        order: 20,
        label: null,
        archetypeKind: "COUNT_DOWN",
        schemeParams: { kind: "COUNT_DOWN", durationSec: 240 },
        schemeTemplateId: null,
        restConfig: null,
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      details: { currentVersion: 2, expectedVersion: 1 },
    });
  });
});
