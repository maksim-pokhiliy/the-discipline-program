import { type Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  cleanup,
  cleanupRaw,
  createTestCoach,
  createTestEnrollment,
  createTestPlan,
  createTestUser,
} from "../../test/helpers";

import { lmsPlanOverrideApi } from "./plan-override";

const COUNT_DOWN_PARAMS = { kind: "COUNT_DOWN", durationSec: 600 } as Prisma.InputJsonValue;

describe("lmsPlanOverrideApi scope/kind combos (integration)", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let athlete: Awaited<ReturnType<typeof createTestUser>>;
  let enrollmentId: string;
  let planId: string;
  let sessionId: string;
  let blockId: string;
  let blockKindId: string;
  let segmentId: string;
  let dayId: string;

  const toCleanup: { table: string; id: string }[] = [];
  const overrideIds: string[] = [];

  beforeAll(async () => {
    coach = await createTestCoach();
    athlete = await createTestUser();

    toCleanup.push(
      { table: "coachProfile", id: coach.profile.id },
      { table: "user", id: coach.user.id },
      { table: "user", id: athlete.id },
    );

    const blockKind = await cleanupRaw.blockKind.create({
      data: {
        scope: "SYSTEM",
        name: `BK Combo ${crypto.randomUUID().slice(0, 8)}`,
        defaultWeight: 1,
      },
    });

    blockKindId = blockKind.id;
    toCleanup.push({ table: "blockKind", id: blockKindId });

    const plan = await createTestPlan(coach.user.id);

    planId = plan.id;
    toCleanup.push({ table: "trainingPlan", id: planId });

    const enrollment = await createTestEnrollment(planId, athlete.id);

    enrollmentId = enrollment.id;
    toCleanup.push({ table: "planEnrollment", id: enrollmentId });

    const week = await cleanupRaw.week.create({ data: { planId, index: 0 } });
    const day = await cleanupRaw.day.create({ data: { weekId: week.id, dayOfWeek: "MON" } });

    dayId = day.id;

    const session = await cleanupRaw.lmsSession.create({ data: { dayId, order: 0 } });

    sessionId = session.id;

    const block = await cleanupRaw.block.create({
      data: { sessionId, order: 0, kindId: blockKindId, weight: 1 },
    });

    blockId = block.id;

    const segment = await cleanupRaw.blockSegment.create({
      data: {
        blockId,
        order: 0,
        archetypeKind: "COUNT_DOWN",
        schemeParams: COUNT_DOWN_PARAMS,
      },
    });

    segmentId = segment.id;
  });

  afterAll(async () => {
    for (const id of overrideIds) {
      await cleanupRaw.planOverride.delete({ where: { id } }).catch(() => {});
    }

    await cleanup(...toCleanup);
  });

  describe("validateScopeKindCombo (createForEnrollment)", () => {
    it("APPEND on BLOCK scope is allowed", async () => {
      const o = await lmsPlanOverrideApi.createForEnrollment(coach.user.id, enrollmentId, {
        scope: "BLOCK",
        scopeId: blockId,
        kind: "APPEND",
        payload: {
          kind: "APPEND",
          entries: [
            {
              id: "ckappendentry000000000001",
              setGroupId: "ckfakesg000000000000000",
              order: 0,
              exerciseId: "ckfakeexercise00000000001",
              exerciseSnapshot: {
                id: "ckfakeexercise00000000001",
                name: "Snap",
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
              },
              prescription: {
                reps: { kind: "FIXED", value: 5 },
                sideMode: "BILATERAL",
                modifiers: [],
              },
              alternatives: [],
              externalUrl: null,
              notes: null,
              version: 1,
            },
          ],
        },
      });

      overrideIds.push(o.id);
      expect(o.kind).toBe("APPEND");
      expect(o.scope).toBe("BLOCK");
    });

    it("APPEND on BLOCK_SEGMENT scope is allowed", async () => {
      const o = await lmsPlanOverrideApi.createForEnrollment(coach.user.id, enrollmentId, {
        scope: "BLOCK_SEGMENT",
        scopeId: segmentId,
        kind: "APPEND",
        payload: {
          kind: "APPEND",
          entries: [
            {
              id: "ckappendentry000000000002",
              setGroupId: "ckfakesg000000000000000",
              order: 0,
              exerciseId: "ckfakeexercise00000000001",
              exerciseSnapshot: {
                id: "ckfakeexercise00000000001",
                name: "Snap",
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
              },
              prescription: {
                reps: { kind: "FIXED", value: 5 },
                sideMode: "BILATERAL",
                modifiers: [],
              },
              alternatives: [],
              externalUrl: null,
              notes: null,
              version: 1,
            },
          ],
        },
      });

      overrideIds.push(o.id);
      expect(o.scope).toBe("BLOCK_SEGMENT");
    });

    it("APPEND on DAY rejects with 400", async () => {
      await expect(
        lmsPlanOverrideApi.createForEnrollment(coach.user.id, enrollmentId, {
          scope: "DAY",
          scopeId: dayId,
          kind: "APPEND",
          payload: {
            kind: "APPEND",
            entries: [],
          } as unknown as { kind: "APPEND"; entries: never[] },
        }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("APPEND on SESSION rejects with 400", async () => {
      await expect(
        lmsPlanOverrideApi.createForEnrollment(coach.user.id, enrollmentId, {
          scope: "SESSION",
          scopeId: sessionId,
          kind: "APPEND",
          payload: {
            kind: "APPEND",
            entries: [],
          } as unknown as { kind: "APPEND"; entries: never[] },
        }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("APPEND on ENTRY rejects with 400", async () => {
      const fakeId = "ckfakeentry00000000000001";

      await expect(
        lmsPlanOverrideApi.createForEnrollment(coach.user.id, enrollmentId, {
          scope: "ENTRY",
          scopeId: fakeId,
          kind: "APPEND",
          payload: {
            kind: "APPEND",
            entries: [],
          } as unknown as { kind: "APPEND"; entries: never[] },
        }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("SUSPEND on DAY scope is allowed", async () => {
      const o = await lmsPlanOverrideApi.createForEnrollment(coach.user.id, enrollmentId, {
        scope: "DAY",
        scopeId: dayId,
        kind: "SUSPEND",
        payload: { kind: "SUSPEND" },
      });

      overrideIds.push(o.id);
      expect(o.kind).toBe("SUSPEND");
      expect(o.scope).toBe("DAY");
    });

    it("SUSPEND on SESSION scope is allowed", async () => {
      const o = await lmsPlanOverrideApi.createForEnrollment(coach.user.id, enrollmentId, {
        scope: "SESSION",
        scopeId: sessionId,
        kind: "SUSPEND",
        payload: { kind: "SUSPEND" },
      });

      overrideIds.push(o.id);
      expect(o.scope).toBe("SESSION");
    });

    it("SUSPEND on BLOCK scope is allowed", async () => {
      const o = await lmsPlanOverrideApi.createForEnrollment(coach.user.id, enrollmentId, {
        scope: "BLOCK",
        scopeId: blockId,
        kind: "SUSPEND",
        payload: { kind: "SUSPEND" },
      });

      overrideIds.push(o.id);
      expect(o.scope).toBe("BLOCK");
    });

    it("NOTE on every scope is allowed", async () => {
      const scopes: { scope: "DAY" | "SESSION" | "BLOCK" | "BLOCK_SEGMENT"; scopeId: string }[] = [
        { scope: "DAY", scopeId: dayId },
        { scope: "SESSION", scopeId: sessionId },
        { scope: "BLOCK", scopeId: blockId },
        { scope: "BLOCK_SEGMENT", scopeId: segmentId },
      ];

      for (const s of scopes) {
        const o = await lmsPlanOverrideApi.createForEnrollment(coach.user.id, enrollmentId, {
          scope: s.scope,
          scopeId: s.scopeId,
          kind: "NOTE",
          payload: { kind: "NOTE", markdown: `Note on ${s.scope}` },
        });

        overrideIds.push(o.id);
        expect(o.kind).toBe("NOTE");
        expect(o.scope).toBe(s.scope);
      }
    });
  });

  describe("resolver flags (existing-feature regression)", () => {
    it("NOTE override exposes notes[] on the block node and isOverridden=true", async () => {
      await cleanupRaw.planOverride.deleteMany({ where: { enrollmentId, scopeId: blockId } });

      await cleanupRaw.planOverride.create({
        data: {
          enrollmentId,
          scope: "BLOCK",
          scopeId: blockId,
          kind: "NOTE",
          payload: { kind: "NOTE", markdown: "Block-level note" } as Prisma.InputJsonValue,
        },
      });

      await cleanupRaw.planOverride.create({
        data: {
          enrollmentId,
          scope: "BLOCK",
          scopeId: blockId,
          kind: "SUSPEND",
          payload: { kind: "SUSPEND" } as Prisma.InputJsonValue,
        },
      });

      const effective = await lmsPlanOverrideApi.getEffectivePlan(coach.user.id, enrollmentId, 0);

      const block = effective.days[0]?.sessions[0]?.blocks[0];

      expect(block?.isOverridden).toBe(true);
      expect(block?.notes.some((n) => n.includes("Block-level note"))).toBe(true);
      expect(block?.suspended).toBe(true);
    });
  });
});
