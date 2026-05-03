import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { type BulkPatchOp, TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import { ROLE_TO_PRISMA_MAP } from "../../../../mappers/iam";
import { cleanup, cleanupRaw, createTestCoach } from "../../../../test/helpers";
import { lmsTrainingPlanPatchApi } from "../training-plan-patch";

describe("lmsTrainingPlanPatchApi.patch — week ops (integration)", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let planId: string;
  let blockKindId: string;
  let exerciseId: string;

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
        name: `Plan WeekOps ${crypto.randomUUID().slice(0, 8)}`,
        status: TrainingPlanStatus.DRAFT,
      },
    });

    planId = plan.id;
    toCleanup.push({ table: "trainingPlan", id: planId });

    const blockKind = await cleanupRaw.blockKind.create({
      data: { scope: "SYSTEM", name: `BK ${crypto.randomUUID().slice(0, 8)}`, defaultWeight: 1 },
    });

    blockKindId = blockKind.id;
    toCleanup.push({ table: "blockKind", id: blockKindId });

    const exercise = await cleanupRaw.exerciseLibraryItem.create({
      data: {
        scope: "SYSTEM",
        name: `Ex ${crypto.randomUUID().slice(0, 8)}`,
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
      },
    });

    exerciseId = exercise.id;
    toCleanup.push({ table: "exerciseLibraryItem", id: exerciseId });
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
  });

  describe("create-week", () => {
    it("happy path: persists week with version=1 and 7 auto-created days MON..SUN", async () => {
      const op: BulkPatchOp = {
        kind: "create-week",
        planId,
        payload: { index: 100, label: "Block A", notes: "Hypertrophy" },
      };

      const result = await lmsTrainingPlanPatchApi.patch(coach.user.id, planId, { ops: [op] });

      expect(result.conflicts).toBeUndefined();

      const week = await cleanupRaw.week.findFirst({
        where: { planId, index: 100 },
        include: { days: true },
      });

      expect(week).not.toBeNull();
      expect(week?.version).toBe(1);
      expect(week?.label).toBe("Block A");
      expect(week?.notes).toBe("Hypertrophy");
      expect(week?.days.length).toBe(7);

      const expectedDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
      const actualDays = week?.days.map((d) => d.dayOfWeek).sort() ?? [];

      expect(actualDays.sort()).toEqual(expectedDays.sort());

      for (const day of week?.days ?? []) {
        expect(day.version).toBe(1);
        expect(day.kind).toBe("TRAINING");
      }
    });

    it("conflict: duplicate (planId, index) raises 409 ConflictError via P2002", async () => {
      await cleanupRaw.week.create({ data: { planId, index: 200 } });

      const op: BulkPatchOp = {
        kind: "create-week",
        planId,
        payload: { index: 200 },
      };

      await expect(
        lmsTrainingPlanPatchApi.patch(coach.user.id, planId, { ops: [op] }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe("update-week", () => {
    it("happy path: increments version, persists label/notes, leaves child day dayOfWeek unchanged", async () => {
      const week = await cleanupRaw.week.create({ data: { planId, index: 300 } });
      const day = await cleanupRaw.day.create({ data: { weekId: week.id, dayOfWeek: "MON" } });

      const op: BulkPatchOp = {
        kind: "update-week",
        weekId: week.id,
        expectedVersion: 1,
        fullEntity: { label: "Updated", notes: "Refresh" },
      };

      const result = await lmsTrainingPlanPatchApi.patch(coach.user.id, planId, { ops: [op] });

      expect(result.conflicts).toBeUndefined();

      const updated = await cleanupRaw.week.findUnique({ where: { id: week.id } });

      expect(updated?.version).toBe(2);
      expect(updated?.label).toBe("Updated");
      expect(updated?.notes).toBe("Refresh");

      const dayAfter = await cleanupRaw.day.findUnique({ where: { id: day.id } });

      expect(dayAfter?.dayOfWeek).toBe("MON");
      expect(dayAfter?.version).toBe(1);
    });

    it("conflict: stale expectedVersion returns conflict with currentVersion", async () => {
      const week = await cleanupRaw.week.create({ data: { planId, index: 301 } });

      const op: BulkPatchOp = {
        kind: "update-week",
        weekId: week.id,
        expectedVersion: 99,
        fullEntity: { label: "Will not stick" },
      };

      const result = await lmsTrainingPlanPatchApi.patch(coach.user.id, planId, { ops: [op] });

      expect(result.conflicts).toEqual([{ opIndex: 0, kind: "update-week", currentVersion: 1 }]);

      const after = await cleanupRaw.week.findUnique({ where: { id: week.id } });

      expect(after?.label).toBeNull();
      expect(after?.version).toBe(1);
    });

    it("conflict: index collision with another week in same plan raises 409", async () => {
      const taken = await cleanupRaw.week.create({ data: { planId, index: 310 } });
      const target = await cleanupRaw.week.create({ data: { planId, index: 311 } });

      const op: BulkPatchOp = {
        kind: "update-week",
        weekId: target.id,
        expectedVersion: 1,
        fullEntity: { index: 310 },
      };

      await expect(
        lmsTrainingPlanPatchApi.patch(coach.user.id, planId, { ops: [op] }),
      ).rejects.toMatchObject({ statusCode: 409 });

      const stillTaken = await cleanupRaw.week.findUnique({ where: { id: taken.id } });

      expect(stillTaken?.index).toBe(310);
    });
  });

  describe("delete-week", () => {
    it("happy path: empty week deleted, days cascade-deleted", async () => {
      const week = await cleanupRaw.week.create({ data: { planId, index: 400 } });

      await cleanupRaw.day.createMany({
        data: [
          { weekId: week.id, dayOfWeek: "MON" },
          { weekId: week.id, dayOfWeek: "TUE" },
        ],
      });

      const op: BulkPatchOp = {
        kind: "delete-week",
        weekId: week.id,
        expectedVersion: 1,
      };

      const result = await lmsTrainingPlanPatchApi.patch(coach.user.id, planId, { ops: [op] });

      expect(result.conflicts).toBeUndefined();

      const after = await cleanupRaw.week.findUnique({ where: { id: week.id } });

      expect(after).toBeNull();

      const remainingDays = await cleanupRaw.day.findMany({ where: { weekId: week.id } });

      expect(remainingDays).toHaveLength(0);
    });

    it("happy path: week with full subtree cascade-deletes days, sessions, blocks", async () => {
      const week = await cleanupRaw.week.create({ data: { planId, index: 401 } });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "MON" },
      });
      const session = await cleanupRaw.lmsSession.create({
        data: { dayId: day.id, order: 0 },
      });
      const block = await cleanupRaw.block.create({
        data: { sessionId: session.id, order: 0, kindId: blockKindId, weight: 1 },
      });
      const segment = await cleanupRaw.blockSegment.create({
        data: {
          blockId: block.id,
          order: 0,
          archetypeKind: "COUNT_DOWN",
          schemeParams: { kind: "COUNT_DOWN", durationSec: 600 },
        },
      });
      const setGroup = await cleanupRaw.setGroup.create({
        data: { segmentId: segment.id, order: 0 },
      });
      const entry = await cleanupRaw.exerciseEntry.create({
        data: {
          setGroupId: setGroup.id,
          order: 0,
          exerciseId,
          exerciseSnapshot: { id: exerciseId },
          prescription: {
            reps: { kind: "FIXED", value: 5 },
            sideMode: "BILATERAL",
            modifiers: [],
          },
          alternatives: [],
        },
      });

      const op: BulkPatchOp = {
        kind: "delete-week",
        weekId: week.id,
        expectedVersion: 1,
      };

      const result = await lmsTrainingPlanPatchApi.patch(coach.user.id, planId, { ops: [op] });

      expect(result.conflicts).toBeUndefined();

      expect(await cleanupRaw.week.findUnique({ where: { id: week.id } })).toBeNull();
      expect(await cleanupRaw.day.findUnique({ where: { id: day.id } })).toBeNull();
      expect(await cleanupRaw.lmsSession.findUnique({ where: { id: session.id } })).toBeNull();
      expect(await cleanupRaw.block.findUnique({ where: { id: block.id } })).toBeNull();
      expect(await cleanupRaw.blockSegment.findUnique({ where: { id: segment.id } })).toBeNull();
      expect(await cleanupRaw.setGroup.findUnique({ where: { id: setGroup.id } })).toBeNull();
      expect(await cleanupRaw.exerciseEntry.findUnique({ where: { id: entry.id } })).toBeNull();
    });

    it("conflict: stale expectedVersion returns conflict with currentVersion", async () => {
      const week = await cleanupRaw.week.create({ data: { planId, index: 402 } });

      const op: BulkPatchOp = {
        kind: "delete-week",
        weekId: week.id,
        expectedVersion: 99,
      };

      const result = await lmsTrainingPlanPatchApi.patch(coach.user.id, planId, { ops: [op] });

      expect(result.conflicts).toEqual([{ opIndex: 0, kind: "delete-week", currentVersion: 1 }]);

      const stillThere = await cleanupRaw.week.findUnique({ where: { id: week.id } });

      expect(stillThere).not.toBeNull();
    });
  });
});

describe("lmsTrainingPlanPatchApi.patch — week-ops cross-plan ownership (integration)", () => {
  let coachA: Awaited<ReturnType<typeof createTestCoach>>;
  let coachB: Awaited<ReturnType<typeof createTestCoach>>;
  let planAId: string;
  let planBId: string;
  let weekAId: string;

  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    coachA = await createTestCoach();
    coachB = await createTestCoach();

    await cleanupRaw.user.update({
      where: { id: coachA.user.id },
      data: { role: ROLE_TO_PRISMA_MAP[UserRole.COACH] },
    });
    await cleanupRaw.user.update({
      where: { id: coachB.user.id },
      data: { role: ROLE_TO_PRISMA_MAP[UserRole.COACH] },
    });

    const planA = await cleanupRaw.trainingPlan.create({
      data: {
        creatorId: coachA.user.id,
        name: `PlanA ${crypto.randomUUID().slice(0, 8)}`,
        status: TrainingPlanStatus.DRAFT,
      },
    });

    planAId = planA.id;
    toCleanup.push({ table: "trainingPlan", id: planAId });

    const planB = await cleanupRaw.trainingPlan.create({
      data: {
        creatorId: coachB.user.id,
        name: `PlanB ${crypto.randomUUID().slice(0, 8)}`,
        status: TrainingPlanStatus.DRAFT,
      },
    });

    planBId = planB.id;
    toCleanup.push({ table: "trainingPlan", id: planBId });

    const weekA = await cleanupRaw.week.create({ data: { planId: planAId, index: 0 } });

    weekAId = weekA.id;
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
    await cleanupRaw.coachProfile.delete({ where: { id: coachA.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coachA.user.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: coachB.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coachB.user.id } }).catch(() => {});
  });

  it("coach B cannot delete coach A's week (403 on plan ownership)", async () => {
    await expect(
      lmsTrainingPlanPatchApi.patch(coachB.user.id, planAId, {
        ops: [{ kind: "delete-week", weekId: weekAId, expectedVersion: 1 }],
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("rejects update-week against another coach's plan via verifyOpsBelongToPlan (MT-5, AuthZ)", async () => {
    await expect(
      lmsTrainingPlanPatchApi.patch(coachB.user.id, planBId, {
        ops: [
          {
            kind: "update-week",
            weekId: weekAId,
            expectedVersion: 1,
            fullEntity: { label: "spoofed" },
          },
        ],
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("rejects create-week with planId from another coach's plan (MT-7, AuthZ)", async () => {
    await expect(
      lmsTrainingPlanPatchApi.patch(coachB.user.id, planBId, {
        ops: [
          {
            kind: "create-week",
            planId: planAId,
            payload: { index: 999 },
          },
        ],
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
