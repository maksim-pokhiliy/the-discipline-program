import { type Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  cleanup,
  cleanupRaw,
  createTestCoach,
  createTestEnrollment,
  createTestPlan,
  createTestUser,
} from "../../../test/helpers";

import { lmsPlanOverrideApi } from "./plan-override";

const COUNT_DOWN_PARAMS = { kind: "COUNT_DOWN", durationSec: 600 } as Prisma.InputJsonValue;

describe("lmsPlanOverrideApi (integration)", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;
  let athlete: Awaited<ReturnType<typeof createTestUser>>;
  let enrollmentId: string;
  let planId: string;
  let blockId: string;
  let blockKindId: string;
  let sessionId: string;

  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    coach = await createTestCoach();
    otherCoach = await createTestCoach();
    athlete = await createTestUser();

    toCleanup.push(
      { table: "coachProfile", id: coach.profile.id },
      { table: "user", id: coach.user.id },
      { table: "coachProfile", id: otherCoach.profile.id },
      { table: "user", id: otherCoach.user.id },
      { table: "user", id: athlete.id },
    );

    const plan = await createTestPlan(coach.user.id);

    planId = plan.id;
    toCleanup.push({ table: "trainingPlan", id: planId });

    const enrollment = await createTestEnrollment(planId, athlete.id);

    enrollmentId = enrollment.id;
    toCleanup.push({ table: "planEnrollment", id: enrollmentId });

    const week = await cleanupRaw.week.create({ data: { planId, index: 0 } });
    const day = await cleanupRaw.day.create({ data: { weekId: week.id, dayOfWeek: "MON" } });
    const session = await cleanupRaw.lmsSession.create({ data: { dayId: day.id, order: 0 } });

    sessionId = session.id;

    const blockKind = await cleanupRaw.blockKind.create({
      data: {
        scope: "SYSTEM",
        name: `BK Override ${crypto.randomUUID().slice(0, 8)}`,
        defaultWeight: 1,
      },
    });

    blockKindId = blockKind.id;
    toCleanup.push({ table: "blockKind", id: blockKindId });

    const block = await cleanupRaw.block.create({
      data: { sessionId, order: 0, kindId: blockKindId, weight: 1 },
    });

    blockId = block.id;

    await cleanupRaw.blockSegment.create({
      data: {
        blockId,
        order: 0,
        archetypeKind: "COUNT_DOWN",
        schemeParams: COUNT_DOWN_PARAMS,
      },
    });
  });

  afterAll(async () => {
    await cleanupRaw.planOverride.deleteMany({ where: { enrollmentId } });
    await cleanup(...toCleanup);
  });

  it("create override as assigned coach → 201-equivalent: returns created row", async () => {
    const result = await lmsPlanOverrideApi.createForEnrollment(coach.user.id, enrollmentId, {
      scope: "BLOCK",
      scopeId: blockId,
      kind: "NOTE",
      payload: { kind: "NOTE", markdown: "Coach note" },
    });

    expect(result.id).toBeDefined();
    expect(result.enrollmentId).toBe(enrollmentId);
    expect(result.scope).toBe("BLOCK");
    expect(result.kind).toBe("NOTE");
  });

  it("create as non-assigned coach → ForbiddenError (403)", async () => {
    await expect(
      lmsPlanOverrideApi.createForEnrollment(otherCoach.user.id, enrollmentId, {
        scope: "BLOCK",
        scopeId: blockId,
        kind: "NOTE",
        payload: { kind: "NOTE", markdown: "Unauthorized note" },
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("invalid scope/kind combo → BadRequestError (400): APPEND on DAY scope", async () => {
    const fakeScopeId = `c${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;

    await expect(
      lmsPlanOverrideApi.createForEnrollment(coach.user.id, enrollmentId, {
        scope: "DAY",
        scopeId: fakeScopeId,
        kind: "APPEND",
        payload: {
          kind: "APPEND",
          entries: [],
        } as unknown as { kind: "APPEND"; entries: never[] },
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("list overrides for enrollment returns all in createdAt asc order", async () => {
    await cleanupRaw.planOverride.deleteMany({ where: { enrollmentId } });

    const first = await lmsPlanOverrideApi.createForEnrollment(coach.user.id, enrollmentId, {
      scope: "BLOCK",
      scopeId: blockId,
      kind: "NOTE",
      payload: { kind: "NOTE", markdown: "First" },
    });

    const second = await lmsPlanOverrideApi.createForEnrollment(coach.user.id, enrollmentId, {
      scope: "BLOCK",
      scopeId: blockId,
      kind: "NOTE",
      payload: { kind: "NOTE", markdown: "Second" },
    });

    const list = await lmsPlanOverrideApi.listForEnrollment(coach.user.id, enrollmentId);

    expect(list.length).toBeGreaterThanOrEqual(2);
    const ids = list.map((o) => o.id);

    expect(ids).toContain(first.id);
    expect(ids).toContain(second.id);

    const firstIdx = ids.indexOf(first.id);
    const secondIdx = ids.indexOf(second.id);

    expect(firstIdx).toBeLessThan(secondIdx);
  });

  it("deleteById removes the override from the list", async () => {
    const created = await lmsPlanOverrideApi.createForEnrollment(coach.user.id, enrollmentId, {
      scope: "BLOCK",
      scopeId: blockId,
      kind: "NOTE",
      payload: { kind: "NOTE", markdown: "To be deleted" },
    });

    await lmsPlanOverrideApi.deleteById(coach.user.id, created.id);

    const listAfter = await lmsPlanOverrideApi.listForEnrollment(coach.user.id, enrollmentId);
    const ids = listAfter.map((o) => o.id);

    expect(ids).not.toContain(created.id);
  });

  it("getEffectivePlan after REPLACE override marks node isOverridden", async () => {
    await cleanupRaw.planOverride.create({
      data: {
        enrollmentId,
        scope: "BLOCK",
        scopeId: blockId,
        kind: "REPLACE",
        payload: {
          kind: "REPLACE",
          snapshot: {
            id: blockId,
            sessionId,
            order: 0,
            kindId: blockKindId,
            title: null,
            status: "ACTIVE",
            weight: 1,
            notes: null,
            version: 1,
          },
        } as Prisma.InputJsonValue,
      },
    });

    const effective = await lmsPlanOverrideApi.getEffectivePlan(coach.user.id, enrollmentId, 0);

    const block = effective.days[0]?.sessions[0]?.blocks[0];

    expect(block?.isOverridden).toBe(true);
    expect(block?.overrideKind).toBe("REPLACE");
  });
});
