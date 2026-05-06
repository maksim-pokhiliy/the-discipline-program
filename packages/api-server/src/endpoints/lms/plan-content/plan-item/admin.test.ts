import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { type CreatePlanItemRequest } from "@repo/contracts/lms/plan-item";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "@repo/errors";

import { cleanupRaw, createTestCoach, createTestPlan } from "../../../../test/helpers";

import { lmsPlanItemApi } from "./admin";

const uniqueSuffix = (): string => crypto.randomUUID().slice(0, 8);

const createTestExercise = async (overrides: { deletedAt?: Date | null } = {}) => {
  return cleanupRaw.exercise.create({
    data: {
      name: `test-exercise-${uniqueSuffix()}`,
      primaryMovement: "SQUAT",
      ...(overrides.deletedAt !== undefined && { deletedAt: overrides.deletedAt }),
    },
  });
};

const createTestSchemeType = async () => {
  return cleanupRaw.schemeType.create({
    data: {
      name: `test-scheme-${uniqueSuffix()}`,
      archetypeKind: "NONE",
    },
  });
};

const createTestPlanDay = async (planId: string, dateOffsetDays = 0) => {
  const date = new Date(Date.UTC(2026, 4, 12 + dateOffsetDays));

  return cleanupRaw.planDay.create({
    data: { planId, date },
  });
};

const createTestPlanSession = async (dayId: string, order = 0) => {
  return cleanupRaw.planSession.create({
    data: { dayId, order },
  });
};

const createTestPlanBlock = async (sessionId: string, schemeTypeId: string, order = 0) => {
  return cleanupRaw.planBlock.create({
    data: {
      sessionId,
      order,
      schemeTypeId,
      schemeParams: { kind: "NONE" },
    },
  });
};

const basePlanItemData = (
  exerciseId: string,
  overrides: Partial<CreatePlanItemRequest> = {},
): CreatePlanItemRequest => ({
  order: 0,
  exerciseId,
  prescription: {
    reps: { kind: "FIXED", value: 10 },
    sideMode: "BILATERAL",
    modifiers: [],
  },
  ...overrides,
});

describe("lmsPlanItemApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;
  let exercise: Awaited<ReturnType<typeof createTestExercise>>;
  let schemeType: Awaited<ReturnType<typeof createTestSchemeType>>;
  let activePlan: Awaited<ReturnType<typeof createTestPlan>>;
  let archivedPlan: Awaited<ReturnType<typeof createTestPlan>>;
  let foreignPlan: Awaited<ReturnType<typeof createTestPlan>>;
  let activeBlockId: string;
  let archivedBlockId: string;
  let foreignBlockId: string;

  beforeAll(async () => {
    coach = await createTestCoach();
    otherCoach = await createTestCoach();
    exercise = await createTestExercise();
    schemeType = await createTestSchemeType();

    activePlan = await createTestPlan(coach.user.id, { status: TrainingPlanStatus.ACTIVE });
    archivedPlan = await createTestPlan(coach.user.id, { status: TrainingPlanStatus.ARCHIVED });
    foreignPlan = await createTestPlan(otherCoach.user.id, {
      status: TrainingPlanStatus.ACTIVE,
    });

    const activeDay = await createTestPlanDay(activePlan.id, 0);
    const activeSession = await createTestPlanSession(activeDay.id);
    const activeBlock = await createTestPlanBlock(activeSession.id, schemeType.id);

    activeBlockId = activeBlock.id;

    const archivedDay = await createTestPlanDay(archivedPlan.id, 1);
    const archivedSession = await createTestPlanSession(archivedDay.id);
    const archivedBlock = await createTestPlanBlock(archivedSession.id, schemeType.id);

    archivedBlockId = archivedBlock.id;

    const foreignDay = await createTestPlanDay(foreignPlan.id, 2);
    const foreignSession = await createTestPlanSession(foreignDay.id);
    const foreignBlock = await createTestPlanBlock(foreignSession.id, schemeType.id);

    foreignBlockId = foreignBlock.id;
  });

  afterAll(async () => {
    await cleanupRaw.planItem.deleteMany({
      where: { blockId: { in: [activeBlockId, archivedBlockId, foreignBlockId] } },
    });
    await cleanupRaw.trainingPlan.delete({ where: { id: activePlan.id } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: archivedPlan.id } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: foreignPlan.id } }).catch(() => {});
    await cleanupRaw.schemeType.delete({ where: { id: schemeType.id } }).catch(() => {});
    await cleanupRaw.exercise.delete({ where: { id: exercise.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: otherCoach.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: otherCoach.user.id } }).catch(() => {});
  });

  describe("create", () => {
    it("rejects with ForbiddenError when caller is not the plan owner", async () => {
      await expect(
        lmsPlanItemApi.create(
          otherCoach.user.id,
          activePlan.id,
          activeBlockId,
          basePlanItemData(exercise.id),
        ),
      ).rejects.toThrow(ForbiddenError);
    });

    it("rejects with ForbiddenError when the plan is ARCHIVED", async () => {
      await expect(
        lmsPlanItemApi.create(
          coach.user.id,
          archivedPlan.id,
          archivedBlockId,
          basePlanItemData(exercise.id),
        ),
      ).rejects.toThrow(ForbiddenError);
    });

    it("rejects with NotFoundError when blockId belongs to a different plan", async () => {
      await expect(
        lmsPlanItemApi.create(
          coach.user.id,
          activePlan.id,
          foreignBlockId,
          basePlanItemData(exercise.id),
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it("rejects with BadRequestError when exerciseId points to a soft-deleted Exercise", async () => {
      const softDeleted = await createTestExercise({ deletedAt: new Date() });

      try {
        await expect(
          lmsPlanItemApi.create(
            coach.user.id,
            activePlan.id,
            activeBlockId,
            basePlanItemData(softDeleted.id),
          ),
        ).rejects.toThrow(BadRequestError);
      } finally {
        await cleanupRaw.exercise.delete({ where: { id: softDeleted.id } }).catch(() => {});
      }
    });

    it("rejects with BadRequestError when an alternative references a soft-deleted Exercise", async () => {
      const softDeleted = await createTestExercise({ deletedAt: new Date() });

      try {
        await expect(
          lmsPlanItemApi.create(
            coach.user.id,
            activePlan.id,
            activeBlockId,
            basePlanItemData(exercise.id, {
              alternatives: [{ exerciseId: softDeleted.id }],
            }),
          ),
        ).rejects.toThrow(BadRequestError);
      } finally {
        await cleanupRaw.exercise.delete({ where: { id: softDeleted.id } }).catch(() => {});
      }
    });

    it("creates a PlanItem with valid prescription and alternatives", async () => {
      const altExercise = await createTestExercise();

      try {
        const item = await lmsPlanItemApi.create(
          coach.user.id,
          activePlan.id,
          activeBlockId,
          basePlanItemData(exercise.id, {
            order: 0,
            alternatives: [{ exerciseId: altExercise.id, note: "easier swap" }],
            notes: "starter set",
          }),
        );

        try {
          expect(item.id).toBeDefined();
          expect(item.blockId).toBe(activeBlockId);
          expect(item.exerciseId).toBe(exercise.id);
          expect(item.alternatives).toEqual([{ exerciseId: altExercise.id, note: "easier swap" }]);
          expect(item.notes).toBe("starter set");
        } finally {
          await cleanupRaw.planItem.delete({ where: { id: item.id } }).catch(() => {});
        }
      } finally {
        await cleanupRaw.exercise.delete({ where: { id: altExercise.id } }).catch(() => {});
      }
    });

    it("rejects with ConflictError on duplicate (blockId, order)", async () => {
      const first = await lmsPlanItemApi.create(
        coach.user.id,
        activePlan.id,
        activeBlockId,
        basePlanItemData(exercise.id, { order: 33 }),
      );

      try {
        await expect(
          lmsPlanItemApi.create(
            coach.user.id,
            activePlan.id,
            activeBlockId,
            basePlanItemData(exercise.id, { order: 33 }),
          ),
        ).rejects.toThrow(ConflictError);
      } finally {
        await cleanupRaw.planItem.delete({ where: { id: first.id } }).catch(() => {});
      }
    });
  });

  describe("update", () => {
    it("updates prescription and alternatives on an existing item", async () => {
      const altExercise = await createTestExercise();
      const created = await lmsPlanItemApi.create(
        coach.user.id,
        activePlan.id,
        activeBlockId,
        basePlanItemData(exercise.id, { order: 1 }),
      );

      try {
        const updated = await lmsPlanItemApi.update(coach.user.id, activePlan.id, created.id, {
          prescription: {
            reps: { kind: "FIXED", value: 5 },
            sideMode: "BILATERAL",
            modifiers: [],
          },
          alternatives: [{ exerciseId: altExercise.id }],
          notes: "heavier",
        });

        expect(updated.id).toBe(created.id);
        expect(updated.prescription.reps).toEqual({ kind: "FIXED", value: 5 });
        expect(updated.alternatives).toEqual([{ exerciseId: altExercise.id }]);
        expect(updated.notes).toBe("heavier");
      } finally {
        await cleanupRaw.planItem.delete({ where: { id: created.id } }).catch(() => {});
        await cleanupRaw.exercise.delete({ where: { id: altExercise.id } }).catch(() => {});
      }
    });

    it("rejects with BadRequestError when update sets exerciseId to a soft-deleted exercise", async () => {
      const softDeleted = await createTestExercise({ deletedAt: new Date() });
      const created = await lmsPlanItemApi.create(
        coach.user.id,
        activePlan.id,
        activeBlockId,
        basePlanItemData(exercise.id, { order: 2 }),
      );

      try {
        await expect(
          lmsPlanItemApi.update(coach.user.id, activePlan.id, created.id, {
            exerciseId: softDeleted.id,
          }),
        ).rejects.toThrow(BadRequestError);
      } finally {
        await cleanupRaw.planItem.delete({ where: { id: created.id } }).catch(() => {});
        await cleanupRaw.exercise.delete({ where: { id: softDeleted.id } }).catch(() => {});
      }
    });
  });
});
