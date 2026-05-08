import { type SchemeArchetypeKind } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { defaultSchemeParams } from "@repo/contracts/lms/_domain";
import {
  createPlanBlockRequestSchema,
  type CreatePlanBlockRequest,
} from "@repo/contracts/lms/plan-block";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@repo/errors";

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
        expect(created.items).toEqual([]);
      } finally {
        await cleanupRaw.planBlock.delete({ where: { id: created.id } }).catch(() => {});
      }
    });

    it("server-fills schemeParams from defaultSchemeParams matching SchemeType.archetypeKind", async () => {
      const noneCreated = await lmsPlanBlockApi.create(
        coach.user.id,
        activePlan.id,
        activeSessionId,
        baseCreateData(schemeTypeNone.id, [blockTypeA.id], { order: 30 }),
      );

      try {
        expect(noneCreated.schemeParams).toEqual(defaultSchemeParams("NONE"));
      } finally {
        await cleanupRaw.planBlock.delete({ where: { id: noneCreated.id } }).catch(() => {});
      }

      const countDownCreated = await lmsPlanBlockApi.create(
        coach.user.id,
        activePlan.id,
        activeSessionId,
        baseCreateData(schemeTypeCountDown.id, [blockTypeA.id], { order: 31 }),
      );

      try {
        expect(countDownCreated.schemeParams).toEqual(defaultSchemeParams("COUNT_DOWN"));
      } finally {
        await cleanupRaw.planBlock.delete({ where: { id: countDownCreated.id } }).catch(() => {});
      }
    });

    it("creates a block with non-empty items round-tripping the items in the response", async () => {
      const exerciseA = await cleanupRaw.exercise.create({
        data: { name: `nested-ex-a-${uniqueSuffix()}`, primaryMovement: "SQUAT" },
      });
      const exerciseB = await cleanupRaw.exercise.create({
        data: { name: `nested-ex-b-${uniqueSuffix()}`, primaryMovement: "PUSH_HORIZONTAL" },
      });

      const created = await lmsPlanBlockApi.create(
        coach.user.id,
        activePlan.id,
        activeSessionId,
        baseCreateData(schemeTypeNone.id, [blockTypeA.id], {
          order: 32,
          items: [
            {
              order: 0,
              exerciseId: exerciseA.id,
              prescription: {
                reps: { kind: "FIXED", value: 5 },
                sideMode: "BILATERAL",
                modifiers: [],
              },
            },
            {
              order: 1,
              exerciseId: exerciseB.id,
              prescription: {
                reps: { kind: "FIXED", value: 8 },
                sideMode: "BILATERAL",
                modifiers: [],
              },
            },
          ],
        }),
      );

      try {
        expect(created.items).toHaveLength(2);
        expect(created.items[0]?.exerciseId).toBe(exerciseA.id);
        expect(created.items[0]?.order).toBe(0);
        expect(created.items[1]?.exerciseId).toBe(exerciseB.id);
        expect(created.items[1]?.order).toBe(1);
      } finally {
        await cleanupRaw.planBlock.delete({ where: { id: created.id } }).catch(() => {});
        await cleanupRaw.exercise.delete({ where: { id: exerciseA.id } }).catch(() => {});
        await cleanupRaw.exercise.delete({ where: { id: exerciseB.id } }).catch(() => {});
      }
    });

    it("creates a block with empty items array producing no items", async () => {
      const created = await lmsPlanBlockApi.create(
        coach.user.id,
        activePlan.id,
        activeSessionId,
        baseCreateData(schemeTypeNone.id, [blockTypeA.id], { order: 33, items: [] }),
      );

      try {
        expect(created.items).toEqual([]);

        const itemCount = await cleanupRaw.planItem.count({ where: { blockId: created.id } });

        expect(itemCount).toBe(0);
      } finally {
        await cleanupRaw.planBlock.delete({ where: { id: created.id } }).catch(() => {});
      }
    });

    it("rejects with BadRequestError when items reference an unknown exerciseId and rolls back the block insert", async () => {
      const orderForFailedCreate = 34;
      const fakeExerciseId = "ckxabcdefghijklmnopqr00";

      const validExercise = await cleanupRaw.exercise.create({
        data: { name: `valid-ex-${uniqueSuffix()}`, primaryMovement: "SQUAT" },
      });

      try {
        await expect(
          lmsPlanBlockApi.create(
            coach.user.id,
            activePlan.id,
            activeSessionId,
            baseCreateData(schemeTypeNone.id, [blockTypeA.id], {
              order: orderForFailedCreate,
              items: [
                {
                  order: 0,
                  exerciseId: validExercise.id,
                  prescription: {
                    reps: { kind: "FIXED", value: 5 },
                    sideMode: "BILATERAL",
                    modifiers: [],
                  },
                },
                {
                  order: 1,
                  exerciseId: fakeExerciseId,
                  prescription: {
                    reps: { kind: "FIXED", value: 8 },
                    sideMode: "BILATERAL",
                    modifiers: [],
                  },
                },
              ],
            }),
          ),
        ).rejects.toThrow(BadRequestError);

        const orphans = await cleanupRaw.planBlock.findMany({
          where: { sessionId: activeSessionId, order: orderForFailedCreate },
        });

        expect(orphans).toEqual([]);
      } finally {
        await cleanupRaw.exercise.delete({ where: { id: validExercise.id } }).catch(() => {});
      }
    });

    it("rejects via Zod when items contain a prescription with a payload mismatching its kind discriminator", async () => {
      const malformedBody: unknown = {
        ...baseCreateData(schemeTypeNone.id, [blockTypeA.id], { order: 35 }),
        items: [
          {
            order: 0,
            exerciseId: "ckxabcdefghijklmnopqr11",
            prescription: {
              reps: { kind: "RANGE", value: 5 },
              sideMode: "BILATERAL",
              modifiers: [],
            },
          },
        ],
      };

      const parsed = createPlanBlockRequestSchema.safeParse(malformedBody);

      expect(parsed.success).toBe(false);

      if (!parsed.success) {
        const hasRangeIssue = parsed.error.issues.some((issue) =>
          issue.path.join(".").includes("reps"),
        );

        expect(hasRangeIssue).toBe(true);
      }
    });

    it("rejects with ConflictError on duplicate (sessionId, order)", async () => {
      const first = await lmsPlanBlockApi.create(
        coach.user.id,
        activePlan.id,
        activeSessionId,
        baseCreateData(schemeTypeNone.id, [blockTypeA.id], { order: 21 }),
      );

      try {
        await expect(
          lmsPlanBlockApi.create(
            coach.user.id,
            activePlan.id,
            activeSessionId,
            baseCreateData(schemeTypeNone.id, [blockTypeB.id], { order: 21 }),
          ),
        ).rejects.toThrow(ConflictError);
      } finally {
        await cleanupRaw.planBlock.delete({ where: { id: first.id } }).catch(() => {});
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

    it("bumps updatedAt when only blockTypeIds is patched", async () => {
      const created = await lmsPlanBlockApi.create(
        coach.user.id,
        activePlan.id,
        activeSessionId,
        baseCreateData(schemeTypeNone.id, [blockTypeA.id], { order: 10 }),
      );

      try {
        const before = await cleanupRaw.planBlock.findUniqueOrThrow({
          where: { id: created.id },
          select: { updatedAt: true },
        });

        const updated = await lmsPlanBlockApi.update(coach.user.id, activePlan.id, created.id, {
          blockTypeIds: [blockTypeB.id, blockTypeC.id],
        });

        expect(updated.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime());
      } finally {
        await cleanupRaw.planBlock.delete({ where: { id: created.id } }).catch(() => {});
      }
    });

    it("updates one item and creates one when items mix existing ids and new rows", async () => {
      const exerciseA = await cleanupRaw.exercise.create({
        data: { name: `mix-ex-a-${uniqueSuffix()}`, primaryMovement: "SQUAT" },
      });
      const exerciseB = await cleanupRaw.exercise.create({
        data: { name: `mix-ex-b-${uniqueSuffix()}`, primaryMovement: "PUSH_HORIZONTAL" },
      });

      const created = await lmsPlanBlockApi.create(
        coach.user.id,
        activePlan.id,
        activeSessionId,
        baseCreateData(schemeTypeNone.id, [blockTypeA.id], {
          order: 40,
          items: [
            {
              order: 0,
              exerciseId: exerciseA.id,
              prescription: {
                reps: { kind: "FIXED", value: 5 },
                sideMode: "BILATERAL",
                modifiers: [],
              },
            },
          ],
        }),
      );

      try {
        const existingItemId = created.items[0]?.id;

        expect(existingItemId).toBeDefined();

        const updated = await lmsPlanBlockApi.update(coach.user.id, activePlan.id, created.id, {
          items: [
            {
              id: existingItemId,
              order: 0,
              exerciseId: exerciseA.id,
              prescription: {
                reps: { kind: "FIXED", value: 8 },
                sideMode: "BILATERAL",
                modifiers: [],
              },
            },
            {
              order: 1,
              exerciseId: exerciseB.id,
              prescription: {
                reps: { kind: "FIXED", value: 10 },
                sideMode: "BILATERAL",
                modifiers: [],
              },
            },
          ],
        });

        expect(updated.items).toHaveLength(2);
        expect(updated.items[0]?.id).toBe(existingItemId);
        expect(updated.items[0]?.prescription).toMatchObject({
          reps: { kind: "FIXED", value: 8 },
        });
        expect(updated.items[1]?.exerciseId).toBe(exerciseB.id);
      } finally {
        await cleanupRaw.planBlock.delete({ where: { id: created.id } }).catch(() => {});
        await cleanupRaw.exercise.delete({ where: { id: exerciseA.id } }).catch(() => {});
        await cleanupRaw.exercise.delete({ where: { id: exerciseB.id } }).catch(() => {});
      }
    });

    it("hard-deletes items absent from the incoming items list", async () => {
      const exerciseA = await cleanupRaw.exercise.create({
        data: { name: `del-ex-a-${uniqueSuffix()}`, primaryMovement: "SQUAT" },
      });
      const exerciseB = await cleanupRaw.exercise.create({
        data: { name: `del-ex-b-${uniqueSuffix()}`, primaryMovement: "PUSH_HORIZONTAL" },
      });

      const created = await lmsPlanBlockApi.create(
        coach.user.id,
        activePlan.id,
        activeSessionId,
        baseCreateData(schemeTypeNone.id, [blockTypeA.id], {
          order: 41,
          items: [
            {
              order: 0,
              exerciseId: exerciseA.id,
              prescription: {
                reps: { kind: "FIXED", value: 5 },
                sideMode: "BILATERAL",
                modifiers: [],
              },
            },
            {
              order: 1,
              exerciseId: exerciseB.id,
              prescription: {
                reps: { kind: "FIXED", value: 5 },
                sideMode: "BILATERAL",
                modifiers: [],
              },
            },
          ],
        }),
      );

      try {
        const survivor = created.items[0];
        const removed = created.items[1];

        expect(survivor).toBeDefined();
        expect(removed).toBeDefined();

        const updated = await lmsPlanBlockApi.update(coach.user.id, activePlan.id, created.id, {
          items: [
            {
              id: survivor?.id,
              order: 0,
              exerciseId: exerciseA.id,
              prescription: {
                reps: { kind: "FIXED", value: 5 },
                sideMode: "BILATERAL",
                modifiers: [],
              },
            },
          ],
        });

        expect(updated.items).toHaveLength(1);
        expect(updated.items[0]?.id).toBe(survivor?.id);

        const removedRow = await cleanupRaw.planItem.findUnique({
          where: { id: removed?.id ?? "" },
        });

        expect(removedRow).toBeNull();
      } finally {
        await cleanupRaw.planBlock.delete({ where: { id: created.id } }).catch(() => {});
        await cleanupRaw.exercise.delete({ where: { id: exerciseA.id } }).catch(() => {});
        await cleanupRaw.exercise.delete({ where: { id: exerciseB.id } }).catch(() => {});
      }
    });

    it("is idempotent when the same items payload is re-applied", async () => {
      const exercise = await cleanupRaw.exercise.create({
        data: { name: `idem-ex-${uniqueSuffix()}`, primaryMovement: "SQUAT" },
      });

      const created = await lmsPlanBlockApi.create(
        coach.user.id,
        activePlan.id,
        activeSessionId,
        baseCreateData(schemeTypeNone.id, [blockTypeA.id], {
          order: 42,
          items: [
            {
              order: 0,
              exerciseId: exercise.id,
              prescription: {
                reps: { kind: "FIXED", value: 5 },
                sideMode: "BILATERAL",
                modifiers: [],
              },
            },
          ],
        }),
      );

      try {
        const itemId = created.items[0]?.id;

        expect(itemId).toBeDefined();

        const samePayload = {
          items: [
            {
              id: itemId,
              order: 0,
              exerciseId: exercise.id,
              prescription: {
                reps: { kind: "FIXED" as const, value: 5 },
                sideMode: "BILATERAL" as const,
                modifiers: [],
              },
            },
          ],
        };

        const firstUpdate = await lmsPlanBlockApi.update(
          coach.user.id,
          activePlan.id,
          created.id,
          samePayload,
        );
        const secondUpdate = await lmsPlanBlockApi.update(
          coach.user.id,
          activePlan.id,
          created.id,
          samePayload,
        );

        expect(firstUpdate.items).toHaveLength(1);
        expect(secondUpdate.items).toHaveLength(1);
        expect(secondUpdate.items[0]?.id).toBe(itemId);

        const itemCount = await cleanupRaw.planItem.count({ where: { blockId: created.id } });

        expect(itemCount).toBe(1);
      } finally {
        await cleanupRaw.planBlock.delete({ where: { id: created.id } }).catch(() => {});
        await cleanupRaw.exercise.delete({ where: { id: exercise.id } }).catch(() => {});
      }
    });

    it("updates only block-level fields when items field is omitted", async () => {
      const exercise = await cleanupRaw.exercise.create({
        data: { name: `omit-ex-${uniqueSuffix()}`, primaryMovement: "SQUAT" },
      });

      const created = await lmsPlanBlockApi.create(
        coach.user.id,
        activePlan.id,
        activeSessionId,
        baseCreateData(schemeTypeNone.id, [blockTypeA.id], {
          order: 43,
          items: [
            {
              order: 0,
              exerciseId: exercise.id,
              prescription: {
                reps: { kind: "FIXED", value: 5 },
                sideMode: "BILATERAL",
                modifiers: [],
              },
            },
          ],
        }),
      );

      try {
        const itemId = created.items[0]?.id;

        const updated = await lmsPlanBlockApi.update(coach.user.id, activePlan.id, created.id, {
          notes: "updated-notes-only",
        });

        expect(updated.notes).toBe("updated-notes-only");
        expect(updated.items).toHaveLength(1);
        expect(updated.items[0]?.id).toBe(itemId);
      } finally {
        await cleanupRaw.planBlock.delete({ where: { id: created.id } }).catch(() => {});
        await cleanupRaw.exercise.delete({ where: { id: exercise.id } }).catch(() => {});
      }
    });
  });

  describe("cross-plan smuggle", () => {
    it("rejects update with NotFoundError when blockId belongs to a different plan", async () => {
      const foreignBlock = await cleanupRaw.planBlock.create({
        data: {
          sessionId: foreignSessionId,
          order: 0,
          schemeTypeId: schemeTypeNone.id,
          schemeParams: { kind: "NONE" },
          notes: "foreign",
        },
      });

      try {
        await expect(
          lmsPlanBlockApi.update(coach.user.id, activePlan.id, foreignBlock.id, {
            notes: "smuggled",
          }),
        ).rejects.toThrow(NotFoundError);

        const unchanged = await cleanupRaw.planBlock.findUnique({
          where: { id: foreignBlock.id },
        });

        expect(unchanged?.notes).toBe("foreign");
      } finally {
        await cleanupRaw.planBlock.delete({ where: { id: foreignBlock.id } }).catch(() => {});
      }
    });

    it("rejects delete with NotFoundError when blockId belongs to a different plan", async () => {
      const foreignBlock = await cleanupRaw.planBlock.create({
        data: {
          sessionId: foreignSessionId,
          order: 1,
          schemeTypeId: schemeTypeNone.id,
          schemeParams: { kind: "NONE" },
        },
      });

      try {
        await expect(
          lmsPlanBlockApi.delete(coach.user.id, activePlan.id, foreignBlock.id),
        ).rejects.toThrow(NotFoundError);

        const survived = await cleanupRaw.planBlock.findUnique({
          where: { id: foreignBlock.id },
        });

        expect(survived).not.toBeNull();
      } finally {
        await cleanupRaw.planBlock.delete({ where: { id: foreignBlock.id } }).catch(() => {});
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
