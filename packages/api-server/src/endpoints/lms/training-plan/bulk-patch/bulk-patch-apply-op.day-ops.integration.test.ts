import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { type BulkPatchOp, TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import { ROLE_TO_PRISMA_MAP } from "../../../../mappers/iam";
import { cleanup, cleanupRaw, createTestCoach } from "../../../../test/helpers";
import { lmsTrainingPlanPatchApi } from "../training-plan-patch";

describe("lmsTrainingPlanPatchApi.patch — day ops (integration)", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
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
        name: `Plan DayOps ${crypto.randomUUID().slice(0, 8)}`,
        status: TrainingPlanStatus.DRAFT,
      },
    });

    planId = plan.id;
    toCleanup.push({ table: "trainingPlan", id: planId });
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
  });

  describe("create-day", () => {
    it("happy path: creates day in week with version=1, default kind=TRAINING", async () => {
      const week = await cleanupRaw.week.create({ data: { planId, index: 500 } });

      await cleanupRaw.day.createMany({
        data: [
          { weekId: week.id, dayOfWeek: "MON" },
          { weekId: week.id, dayOfWeek: "TUE" },
          { weekId: week.id, dayOfWeek: "WED" },
          { weekId: week.id, dayOfWeek: "THU" },
          { weekId: week.id, dayOfWeek: "FRI" },
          { weekId: week.id, dayOfWeek: "SAT" },
        ],
      });

      const op: BulkPatchOp = {
        kind: "create-day",
        weekId: week.id,
        payload: { dayOfWeek: "SUN", notes: "Recovery" },
      };

      const result = await lmsTrainingPlanPatchApi.patch(coach.user.id, planId, { ops: [op] });

      expect(result.conflicts).toBeUndefined();

      const sun = await cleanupRaw.day.findUnique({
        where: { weekId_dayOfWeek: { weekId: week.id, dayOfWeek: "SUN" } },
      });

      expect(sun).not.toBeNull();
      expect(sun?.version).toBe(1);
      expect(sun?.kind).toBe("TRAINING");
      expect(sun?.notes).toBe("Recovery");
    });

    it("conflict: duplicate (weekId, dayOfWeek) raises 409 ConflictError via P2002", async () => {
      const week = await cleanupRaw.week.create({ data: { planId, index: 501 } });

      await cleanupRaw.day.create({ data: { weekId: week.id, dayOfWeek: "MON" } });

      const op: BulkPatchOp = {
        kind: "create-day",
        weekId: week.id,
        payload: { dayOfWeek: "MON" },
      };

      await expect(
        lmsTrainingPlanPatchApi.patch(coach.user.id, planId, { ops: [op] }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe("update-day", () => {
    it("happy path: increments version, persists kind/notes, leaves dayOfWeek untouched", async () => {
      const week = await cleanupRaw.week.create({ data: { planId, index: 502 } });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "MON" },
      });

      const op: BulkPatchOp = {
        kind: "update-day",
        dayId: day.id,
        expectedVersion: 1,
        fullEntity: { kind: "REST", notes: "Active recovery" },
      };

      const result = await lmsTrainingPlanPatchApi.patch(coach.user.id, planId, { ops: [op] });

      expect(result.conflicts).toBeUndefined();

      const updated = await cleanupRaw.day.findUnique({ where: { id: day.id } });

      expect(updated?.version).toBe(2);
      expect(updated?.kind).toBe("REST");
      expect(updated?.notes).toBe("Active recovery");
      expect(updated?.dayOfWeek).toBe("MON");
    });

    it("conflict: stale expectedVersion returns conflict with currentVersion", async () => {
      const week = await cleanupRaw.week.create({ data: { planId, index: 503 } });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "MON" },
      });

      const op: BulkPatchOp = {
        kind: "update-day",
        dayId: day.id,
        expectedVersion: 99,
        fullEntity: { kind: "REST" },
      };

      const result = await lmsTrainingPlanPatchApi.patch(coach.user.id, planId, { ops: [op] });

      expect(result.conflicts).toEqual([{ opIndex: 0, kind: "update-day", currentVersion: 1 }]);

      const after = await cleanupRaw.day.findUnique({ where: { id: day.id } });

      expect(after?.kind).toBe("TRAINING");
      expect(after?.version).toBe(1);
    });
  });

  describe("delete-day", () => {
    it("happy path: deletes day and cascades sessions/blocks below", async () => {
      const week = await cleanupRaw.week.create({ data: { planId, index: 504 } });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "MON" },
      });
      const session = await cleanupRaw.lmsSession.create({
        data: { dayId: day.id, order: 0 },
      });

      const op: BulkPatchOp = {
        kind: "delete-day",
        dayId: day.id,
        expectedVersion: 1,
      };

      const result = await lmsTrainingPlanPatchApi.patch(coach.user.id, planId, { ops: [op] });

      expect(result.conflicts).toBeUndefined();

      expect(await cleanupRaw.day.findUnique({ where: { id: day.id } })).toBeNull();
      expect(await cleanupRaw.lmsSession.findUnique({ where: { id: session.id } })).toBeNull();
    });

    it("conflict: stale expectedVersion returns conflict with currentVersion", async () => {
      const week = await cleanupRaw.week.create({ data: { planId, index: 505 } });
      const day = await cleanupRaw.day.create({
        data: { weekId: week.id, dayOfWeek: "MON" },
      });

      const op: BulkPatchOp = {
        kind: "delete-day",
        dayId: day.id,
        expectedVersion: 99,
      };

      const result = await lmsTrainingPlanPatchApi.patch(coach.user.id, planId, { ops: [op] });

      expect(result.conflicts).toEqual([{ opIndex: 0, kind: "delete-day", currentVersion: 1 }]);

      expect(await cleanupRaw.day.findUnique({ where: { id: day.id } })).not.toBeNull();
    });
  });
});

describe("lmsTrainingPlanPatchApi.patch — day-ops cross-plan ownership (integration)", () => {
  let coachA: Awaited<ReturnType<typeof createTestCoach>>;
  let coachB: Awaited<ReturnType<typeof createTestCoach>>;
  let planAId: string;
  let planBId: string;
  let weekAId: string;
  let dayAId: string;

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
        name: `PlanA Day ${crypto.randomUUID().slice(0, 8)}`,
        status: TrainingPlanStatus.DRAFT,
      },
    });

    planAId = planA.id;
    toCleanup.push({ table: "trainingPlan", id: planAId });

    const planB = await cleanupRaw.trainingPlan.create({
      data: {
        creatorId: coachB.user.id,
        name: `PlanB Day ${crypto.randomUUID().slice(0, 8)}`,
        status: TrainingPlanStatus.DRAFT,
      },
    });

    planBId = planB.id;
    toCleanup.push({ table: "trainingPlan", id: planBId });

    const weekA = await cleanupRaw.week.create({ data: { planId: planAId, index: 0 } });

    weekAId = weekA.id;

    const dayA = await cleanupRaw.day.create({
      data: { weekId: weekAId, dayOfWeek: "MON" },
    });

    dayAId = dayA.id;
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
    await cleanupRaw.coachProfile.delete({ where: { id: coachA.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coachA.user.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: coachB.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coachB.user.id } }).catch(() => {});
  });

  it("coach B cannot delete coach A's day (403 on plan ownership)", async () => {
    await expect(
      lmsTrainingPlanPatchApi.patch(coachB.user.id, planAId, {
        ops: [{ kind: "delete-day", dayId: dayAId, expectedVersion: 1 }],
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("rejects update-day against another coach's plan via verifyOpsBelongToPlan (MT-6, AuthZ)", async () => {
    await expect(
      lmsTrainingPlanPatchApi.patch(coachB.user.id, planBId, {
        ops: [
          {
            kind: "update-day",
            dayId: dayAId,
            expectedVersion: 1,
            fullEntity: { kind: "REST" },
          },
        ],
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("rejects create-day with weekId from another coach's plan (MT-3, AuthZ)", async () => {
    await expect(
      lmsTrainingPlanPatchApi.patch(coachB.user.id, planBId, {
        ops: [
          {
            kind: "create-day",
            weekId: weekAId,
            payload: { dayOfWeek: "TUE" },
          },
        ],
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
