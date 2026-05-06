import { type SchemeArchetypeKind } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { type CreatePlanBlockRequest } from "@repo/contracts/lms/plan-block";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import { BadRequestError, ForbiddenError, NotFoundError, ValidationError } from "@repo/errors";

import { cleanupRaw, createTestCoach, createTestPlan } from "../../../../test/helpers";

import { lmsPlanBlockApi } from "./admin";

const uniqueSuffix = (): string => crypto.randomUUID().slice(0, 8);

const createTestSchemeType = async (archetypeKind: SchemeArchetypeKind = "NONE") => {
  return cleanupRaw.schemeType.create({
    data: { name: `test-scheme-${uniqueSuffix()}`, archetypeKind },
  });
};

const createTestBlockType = async (overrides: { deletedAt?: Date | null } = {}) => {
  return cleanupRaw.blockType.create({
    data: {
      name: `test-block-type-${uniqueSuffix()}`,
      ...(overrides.deletedAt !== undefined && { deletedAt: overrides.deletedAt }),
    },
  });
};

const seedSession = async (planId: string, dateOffsetDays: number): Promise<string> => {
  const date = new Date(Date.UTC(2026, 4, 12 + dateOffsetDays));
  const day = await cleanupRaw.planDay.create({ data: { planId, date } });
  const session = await cleanupRaw.planSession.create({ data: { dayId: day.id, order: 0 } });

  return session.id;
};

const baseCreateData = (
  schemeTypeId: string,
  blockTypeIds: string[],
  overrides: Partial<CreatePlanBlockRequest> = {},
): CreatePlanBlockRequest => ({
  order: 0,
  schemeTypeId,
  blockTypeIds,
  schemeParams: { kind: "NONE" },
  ...overrides,
});

describe("lmsPlanBlockApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;

  let schemeTypeNone: Awaited<ReturnType<typeof createTestSchemeType>>;
  let schemeTypeCountDown: Awaited<ReturnType<typeof createTestSchemeType>>;
  let blockTypeA: Awaited<ReturnType<typeof createTestBlockType>>;
  let blockTypeB: Awaited<ReturnType<typeof createTestBlockType>>;
  let blockTypeC: Awaited<ReturnType<typeof createTestBlockType>>;
  let blockTypeD: Awaited<ReturnType<typeof createTestBlockType>>;
  let blockTypeE: Awaited<ReturnType<typeof createTestBlockType>>;

  let activePlan: Awaited<ReturnType<typeof createTestPlan>>;
  let archivedPlan: Awaited<ReturnType<typeof createTestPlan>>;
  let foreignPlan: Awaited<ReturnType<typeof createTestPlan>>;

  let activeSessionId: string;
  let archivedSessionId: string;
  let foreignSessionId: string;

  beforeAll(async () => {
    coach = await createTestCoach();
    otherCoach = await createTestCoach();

    schemeTypeNone = await createTestSchemeType("NONE");
    schemeTypeCountDown = await createTestSchemeType("COUNT_DOWN");
    blockTypeA = await createTestBlockType();
    blockTypeB = await createTestBlockType();
    blockTypeC = await createTestBlockType();
    blockTypeD = await createTestBlockType();
    blockTypeE = await createTestBlockType();

    activePlan = await createTestPlan(coach.user.id, { status: TrainingPlanStatus.ACTIVE });
    archivedPlan = await createTestPlan(coach.user.id, { status: TrainingPlanStatus.ARCHIVED });
    foreignPlan = await createTestPlan(otherCoach.user.id, {
      status: TrainingPlanStatus.ACTIVE,
    });

    activeSessionId = await seedSession(activePlan.id, 0);
    archivedSessionId = await seedSession(archivedPlan.id, 1);
    foreignSessionId = await seedSession(foreignPlan.id, 2);
  });

  afterAll(async () => {
    await cleanupRaw.planBlock.deleteMany({
      where: { sessionId: { in: [activeSessionId, archivedSessionId, foreignSessionId] } },
    });
    await cleanupRaw.trainingPlan.deleteMany({
      where: { id: { in: [activePlan.id, archivedPlan.id, foreignPlan.id] } },
    });
    await cleanupRaw.blockType.deleteMany({
      where: {
        id: { in: [blockTypeA, blockTypeB, blockTypeC, blockTypeD, blockTypeE].map((b) => b.id) },
      },
    });
    await cleanupRaw.schemeType.deleteMany({
      where: { id: { in: [schemeTypeNone.id, schemeTypeCountDown.id] } },
    });
    await cleanupRaw.coachProfile.deleteMany({
      where: { id: { in: [coach.profile.id, otherCoach.profile.id] } },
    });
    await cleanupRaw.user.deleteMany({
      where: { id: { in: [coach.user.id, otherCoach.user.id] } },
    });
  });

  describe("create", () => {
    it("rejects with ForbiddenError when caller is not the plan owner", async () => {
      await expect(
        lmsPlanBlockApi.create(
          otherCoach.user.id,
          activePlan.id,
          activeSessionId,
          baseCreateData(schemeTypeNone.id, [blockTypeA.id]),
        ),
      ).rejects.toThrow(ForbiddenError);
    });

    it("rejects with ForbiddenError when the plan is ARCHIVED", async () => {
      await expect(
        lmsPlanBlockApi.create(
          coach.user.id,
          archivedPlan.id,
          archivedSessionId,
          baseCreateData(schemeTypeNone.id, [blockTypeA.id]),
        ),
      ).rejects.toThrow(ForbiddenError);
    });

    it("rejects with NotFoundError when sessionId belongs to a different plan", async () => {
      await expect(
        lmsPlanBlockApi.create(
          coach.user.id,
          activePlan.id,
          foreignSessionId,
          baseCreateData(schemeTypeNone.id, [blockTypeA.id]),
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it("rejects with ValidationError when schemeParams.kind does not match SchemeType.archetypeKind", async () => {
      await expect(
        lmsPlanBlockApi.create(
          coach.user.id,
          activePlan.id,
          activeSessionId,
          baseCreateData(schemeTypeCountDown.id, [blockTypeA.id], {
            schemeParams: { kind: "COUNT_UP" },
          }),
        ),
      ).rejects.toThrow(ValidationError);
    });

    it("rejects with BadRequestError when schemeTypeId points to a soft-deleted SchemeType", async () => {
      const softDeleted = await cleanupRaw.schemeType.create({
        data: {
          name: `soft-scheme-${uniqueSuffix()}`,
          archetypeKind: "NONE",
          deletedAt: new Date(),
        },
      });

      try {
        await expect(
          lmsPlanBlockApi.create(
            coach.user.id,
            activePlan.id,
            activeSessionId,
            baseCreateData(softDeleted.id, [blockTypeA.id]),
          ),
        ).rejects.toThrow(BadRequestError);
      } finally {
        await cleanupRaw.schemeType.delete({ where: { id: softDeleted.id } }).catch(() => {});
      }
    });

    it("rejects with BadRequestError when one blockTypeId is missing or soft-deleted", async () => {
      const softDeleted = await createTestBlockType({ deletedAt: new Date() });

      try {
        await expect(
          lmsPlanBlockApi.create(
            coach.user.id,
            activePlan.id,
            activeSessionId,
            baseCreateData(schemeTypeNone.id, [blockTypeA.id, softDeleted.id]),
          ),
        ).rejects.toThrow(BadRequestError);
      } finally {
        await cleanupRaw.blockType.delete({ where: { id: softDeleted.id } }).catch(() => {});
      }
    });

    it("creates a block with multiple blockTypeIds preserving the input order", async () => {
      const created = await lmsPlanBlockApi.create(
        coach.user.id,
        activePlan.id,
        activeSessionId,
        baseCreateData(schemeTypeNone.id, [blockTypeC.id, blockTypeA.id, blockTypeB.id], {
          order: 5,
          notes: "warmup couplet",
        }),
      );

      try {
        expect(created.id).toBeDefined();
        expect(created.sessionId).toBe(activeSessionId);
        expect(created.blockTypeIds).toEqual([blockTypeC.id, blockTypeA.id, blockTypeB.id]);
        expect(created.notes).toBe("warmup couplet");
      } finally {
        await cleanupRaw.planBlock.delete({ where: { id: created.id } }).catch(() => {});
      }
    });
  });

  describe("update", () => {
    it("replaces blockTypeRefs atomically when blockTypeIds is in the patch", async () => {
      const created = await lmsPlanBlockApi.create(
        coach.user.id,
        activePlan.id,
        activeSessionId,
        baseCreateData(schemeTypeNone.id, [blockTypeA.id, blockTypeB.id], { order: 6 }),
      );

      try {
        const updated = await lmsPlanBlockApi.update(coach.user.id, activePlan.id, created.id, {
          blockTypeIds: [blockTypeC.id, blockTypeD.id, blockTypeE.id],
        });

        expect(updated.blockTypeIds).toEqual([blockTypeC.id, blockTypeD.id, blockTypeE.id]);

        const refCount = await cleanupRaw.planBlockTypeRef.count({
          where: { blockId: created.id },
        });

        expect(refCount).toBe(3);
      } finally {
        await cleanupRaw.planBlock.delete({ where: { id: created.id } }).catch(() => {});
      }
    });

    it("re-validates kind on update when only schemeParams is in the patch", async () => {
      const created = await lmsPlanBlockApi.create(
        coach.user.id,
        activePlan.id,
        activeSessionId,
        baseCreateData(schemeTypeNone.id, [blockTypeA.id], { order: 8 }),
      );

      try {
        await expect(
          lmsPlanBlockApi.update(coach.user.id, activePlan.id, created.id, {
            schemeParams: { kind: "COUNT_DOWN", durationSec: 60 },
          }),
        ).rejects.toThrow(ValidationError);
      } finally {
        await cleanupRaw.planBlock.delete({ where: { id: created.id } }).catch(() => {});
      }
    });

    it("re-validates kind on update when only schemeTypeId is swapped", async () => {
      const created = await lmsPlanBlockApi.create(
        coach.user.id,
        activePlan.id,
        activeSessionId,
        baseCreateData(schemeTypeNone.id, [blockTypeA.id], { order: 9 }),
      );

      try {
        await expect(
          lmsPlanBlockApi.update(coach.user.id, activePlan.id, created.id, {
            schemeTypeId: schemeTypeCountDown.id,
          }),
        ).rejects.toThrow(ValidationError);
      } finally {
        await cleanupRaw.planBlock.delete({ where: { id: created.id } }).catch(() => {});
      }
    });
  });

  describe("delete", () => {
    it("hard-deletes the block and cascades to PlanItem and PlanBlockTypeRef", async () => {
      const created = await lmsPlanBlockApi.create(
        coach.user.id,
        activePlan.id,
        activeSessionId,
        baseCreateData(schemeTypeNone.id, [blockTypeA.id], { order: 7 }),
      );

      const exercise = await cleanupRaw.exercise.create({
        data: { name: `cascade-ex-${uniqueSuffix()}`, primaryMovement: "SQUAT" },
      });

      const item = await cleanupRaw.planItem.create({
        data: {
          blockId: created.id,
          order: 0,
          exerciseId: exercise.id,
          prescription: {
            reps: { kind: "FIXED", value: 5 },
            sideMode: "BILATERAL",
            modifiers: [],
          },
        },
      });

      try {
        await lmsPlanBlockApi.delete(coach.user.id, activePlan.id, created.id);

        const blockAfter = await cleanupRaw.planBlock.findUnique({ where: { id: created.id } });
        const itemAfter = await cleanupRaw.planItem.findUnique({ where: { id: item.id } });
        const refsAfter = await cleanupRaw.planBlockTypeRef.findMany({
          where: { blockId: created.id },
        });

        expect(blockAfter).toBeNull();
        expect(itemAfter).toBeNull();
        expect(refsAfter).toEqual([]);
      } finally {
        await cleanupRaw.planItem.delete({ where: { id: item.id } }).catch(() => {});
        await cleanupRaw.planBlock.delete({ where: { id: created.id } }).catch(() => {});
        await cleanupRaw.exercise.delete({ where: { id: exercise.id } }).catch(() => {});
      }
    });
  });
});
