import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { type BulkPatchOp, TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import { ROLE_TO_PRISMA_MAP } from "../../../../mappers/iam";
import { cleanup, cleanupRaw, createTestCoach } from "../../../../test/helpers";
import { lmsTrainingPlanPatchApi } from "../training-plan-patch";

describe("lmsTrainingPlanPatchApi.patch — session ops (integration)", () => {
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
        name: `Plan SessOps ${crypto.randomUUID().slice(0, 8)}`,
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

  const buildDay = async (
    index: number,
    dayOfWeek: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN" = "MON",
  ) => {
    const week = await cleanupRaw.week.create({ data: { planId, index } });
    const day = await cleanupRaw.day.create({ data: { weekId: week.id, dayOfWeek } });

    return day;
  };

  describe("create-session", () => {
    it("happy path: explicit order persists with version=1", async () => {
      const day = await buildDay(600);

      const op: BulkPatchOp = {
        kind: "create-session",
        dayId: day.id,
        payload: { order: 3, label: "Strength A" },
      };

      const result = await lmsTrainingPlanPatchApi.patch(coach.user.id, planId, { ops: [op] });

      expect(result.conflicts).toBeUndefined();

      const session = await cleanupRaw.lmsSession.findUnique({
        where: { dayId_order: { dayId: day.id, order: 3 } },
      });

      expect(session).not.toBeNull();
      expect(session?.version).toBe(1);
      expect(session?.label).toBe("Strength A");
    });

    it("happy path: omitted order picks MAX(order)+1", async () => {
      const day = await buildDay(601);

      await cleanupRaw.lmsSession.createMany({
        data: [
          { dayId: day.id, order: 0 },
          { dayId: day.id, order: 1 },
        ],
      });

      const op: BulkPatchOp = {
        kind: "create-session",
        dayId: day.id,
        payload: { label: "Auto-ordered" },
      };

      const result = await lmsTrainingPlanPatchApi.patch(coach.user.id, planId, { ops: [op] });

      expect(result.conflicts).toBeUndefined();

      const created = await cleanupRaw.lmsSession.findUnique({
        where: { dayId_order: { dayId: day.id, order: 2 } },
      });

      expect(created).not.toBeNull();
      expect(created?.label).toBe("Auto-ordered");
      expect(created?.version).toBe(1);
    });

    it("conflict: explicit order collision raises 409 ConflictError via P2002", async () => {
      const day = await buildDay(602);

      await cleanupRaw.lmsSession.create({ data: { dayId: day.id, order: 0 } });

      const op: BulkPatchOp = {
        kind: "create-session",
        dayId: day.id,
        payload: { order: 0 },
      };

      await expect(
        lmsTrainingPlanPatchApi.patch(coach.user.id, planId, { ops: [op] }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe("update-session", () => {
    it("happy path: increments version, persists order/label/notes", async () => {
      const day = await buildDay(603);
      const session = await cleanupRaw.lmsSession.create({
        data: { dayId: day.id, order: 0 },
      });

      const op: BulkPatchOp = {
        kind: "update-session",
        sessionId: session.id,
        expectedVersion: 1,
        fullEntity: { order: 5, label: "Renamed", notes: "Heavy day" },
      };

      const result = await lmsTrainingPlanPatchApi.patch(coach.user.id, planId, { ops: [op] });

      expect(result.conflicts).toBeUndefined();

      const updated = await cleanupRaw.lmsSession.findUnique({ where: { id: session.id } });

      expect(updated?.version).toBe(2);
      expect(updated?.order).toBe(5);
      expect(updated?.label).toBe("Renamed");
      expect(updated?.notes).toBe("Heavy day");
    });

    it("conflict: stale expectedVersion returns conflict with currentVersion", async () => {
      const day = await buildDay(604);
      const session = await cleanupRaw.lmsSession.create({
        data: { dayId: day.id, order: 0 },
      });

      const op: BulkPatchOp = {
        kind: "update-session",
        sessionId: session.id,
        expectedVersion: 99,
        fullEntity: { label: "Will not stick" },
      };

      const result = await lmsTrainingPlanPatchApi.patch(coach.user.id, planId, { ops: [op] });

      expect(result.conflicts).toEqual([{ opIndex: 0, kind: "update-session", currentVersion: 1 }]);

      const after = await cleanupRaw.lmsSession.findUnique({ where: { id: session.id } });

      expect(after?.label).toBeNull();
      expect(after?.version).toBe(1);
    });
  });

  describe("delete-session", () => {
    it("happy path: deletes session and cascades blocks below", async () => {
      const day = await buildDay(605);
      const session = await cleanupRaw.lmsSession.create({
        data: { dayId: day.id, order: 0 },
      });
      const blockKind = await cleanupRaw.blockKind.create({
        data: { scope: "SYSTEM", name: `BK ${crypto.randomUUID().slice(0, 8)}`, defaultWeight: 1 },
      });

      const block = await cleanupRaw.block.create({
        data: { sessionId: session.id, order: 0, kindId: blockKind.id, weight: 1 },
      });

      const op: BulkPatchOp = {
        kind: "delete-session",
        sessionId: session.id,
        expectedVersion: 1,
      };

      const result = await lmsTrainingPlanPatchApi.patch(coach.user.id, planId, { ops: [op] });

      expect(result.conflicts).toBeUndefined();

      expect(await cleanupRaw.lmsSession.findUnique({ where: { id: session.id } })).toBeNull();
      expect(await cleanupRaw.block.findUnique({ where: { id: block.id } })).toBeNull();

      await cleanupRaw.blockKind.delete({ where: { id: blockKind.id } }).catch(() => {});
    });

    it("conflict: stale expectedVersion returns conflict with currentVersion", async () => {
      const day = await buildDay(606);
      const session = await cleanupRaw.lmsSession.create({
        data: { dayId: day.id, order: 0 },
      });

      const op: BulkPatchOp = {
        kind: "delete-session",
        sessionId: session.id,
        expectedVersion: 99,
      };

      const result = await lmsTrainingPlanPatchApi.patch(coach.user.id, planId, { ops: [op] });

      expect(result.conflicts).toEqual([{ opIndex: 0, kind: "delete-session", currentVersion: 1 }]);

      expect(await cleanupRaw.lmsSession.findUnique({ where: { id: session.id } })).not.toBeNull();
    });
  });

  describe("mixed batch", () => {
    it("creates a week and a session inside a pre-existing day in a single batch", async () => {
      const day = await buildDay(700, "TUE");

      const ops: BulkPatchOp[] = [
        {
          kind: "create-week",
          planId,
          payload: { index: 701, label: "Week from batch" },
        },
        {
          kind: "create-session",
          dayId: day.id,
          payload: { label: "Session from batch" },
        },
      ];

      const result = await lmsTrainingPlanPatchApi.patch(coach.user.id, planId, { ops });

      expect(result.conflicts).toBeUndefined();

      const newWeek = await cleanupRaw.week.findFirst({ where: { planId, index: 701 } });

      expect(newWeek).not.toBeNull();

      const newSession = await cleanupRaw.lmsSession.findUnique({
        where: { dayId_order: { dayId: day.id, order: 0 } },
      });

      expect(newSession?.label).toBe("Session from batch");
    });
  });
});

describe("lmsTrainingPlanPatchApi.patch — session-ops cross-plan ownership (integration)", () => {
  let coachA: Awaited<ReturnType<typeof createTestCoach>>;
  let coachB: Awaited<ReturnType<typeof createTestCoach>>;
  let planAId: string;
  let planBId: string;
  let dayAId: string;
  let sessionAId: string;

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
        name: `PlanA Sess ${crypto.randomUUID().slice(0, 8)}`,
        status: TrainingPlanStatus.DRAFT,
      },
    });

    planAId = planA.id;
    toCleanup.push({ table: "trainingPlan", id: planAId });

    const planB = await cleanupRaw.trainingPlan.create({
      data: {
        creatorId: coachB.user.id,
        name: `PlanB Sess ${crypto.randomUUID().slice(0, 8)}`,
        status: TrainingPlanStatus.DRAFT,
      },
    });

    planBId = planB.id;
    toCleanup.push({ table: "trainingPlan", id: planBId });

    const weekA = await cleanupRaw.week.create({ data: { planId: planAId, index: 0 } });
    const dayA = await cleanupRaw.day.create({
      data: { weekId: weekA.id, dayOfWeek: "MON" },
    });

    dayAId = dayA.id;

    const sessionA = await cleanupRaw.lmsSession.create({
      data: { dayId: dayAId, order: 0 },
    });

    sessionAId = sessionA.id;
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
    await cleanupRaw.coachProfile.delete({ where: { id: coachA.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coachA.user.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: coachB.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coachB.user.id } }).catch(() => {});
  });

  it("coach B cannot delete coach A's session (403 on plan ownership)", async () => {
    await expect(
      lmsTrainingPlanPatchApi.patch(coachB.user.id, planAId, {
        ops: [{ kind: "delete-session", sessionId: sessionAId, expectedVersion: 1 }],
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("rejects update-session against another coach's plan via verifyOpsBelongToPlan (MT-6, AuthZ)", async () => {
    await expect(
      lmsTrainingPlanPatchApi.patch(coachB.user.id, planBId, {
        ops: [
          {
            kind: "update-session",
            sessionId: sessionAId,
            expectedVersion: 1,
            fullEntity: { label: "spoofed" },
          },
        ],
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("rejects create-session with dayId from another coach's plan (MT-4, AuthZ)", async () => {
    await expect(
      lmsTrainingPlanPatchApi.patch(coachB.user.id, planBId, {
        ops: [
          {
            kind: "create-session",
            dayId: dayAId,
            payload: { label: "spoofed" },
          },
        ],
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
