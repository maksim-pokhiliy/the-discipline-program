import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import { ROLE_TO_PRISMA_MAP } from "../../../../mappers/iam";
import {
  cleanupRaw,
  createTestCoach,
  createTestPlan,
  createTestUser,
} from "../../../../test/helpers";

import { lmsPlanDayApi } from "./admin";

const uniqueSuffix = (): string => crypto.randomUUID().slice(0, 8);

const dayDate = (offsetDays: number): Date => {
  const base = new Date("2030-01-01T00:00:00.000Z");

  base.setUTCDate(base.getUTCDate() + offsetDays);

  return base;
};

describe("lmsPlanDayApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;
  let headCoach: Awaited<ReturnType<typeof createTestUser>>;
  let planId: string;
  let foreignPlanId: string;
  let archivedPlanId: string;
  let softDeletedPlanId: string;
  let dayTypeId: string;
  let softDeletedDayTypeId: string;

  const createdDayIds: string[] = [];
  const createdSessionIds: string[] = [];

  beforeAll(async () => {
    coach = await createTestCoach();
    otherCoach = await createTestCoach();

    const preexistingHeads = await cleanupRaw.user.findMany({
      where: { role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] },
      select: { id: true },
    });

    for (const hc of preexistingHeads) {
      await cleanupRaw.user.update({
        where: { id: hc.id },
        data: { role: ROLE_TO_PRISMA_MAP[UserRole.COACH] },
      });
    }

    headCoach = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] });

    const plan = await createTestPlan(coach.user.id, { status: "ACTIVE" });

    planId = plan.id;

    const foreignPlan = await createTestPlan(otherCoach.user.id, { status: "ACTIVE" });

    foreignPlanId = foreignPlan.id;

    const archivedPlan = await createTestPlan(coach.user.id, { status: "ARCHIVED" });

    archivedPlanId = archivedPlan.id;

    const softDeletedPlan = await createTestPlan(coach.user.id, {
      status: "ACTIVE",
      deletedAt: new Date(),
    });

    softDeletedPlanId = softDeletedPlan.id;

    const dayType = await cleanupRaw.dayType.create({
      data: { name: `dt-active-${uniqueSuffix()}`, color: "#ff0000" },
    });

    dayTypeId = dayType.id;

    const deletedDayType = await cleanupRaw.dayType.create({
      data: {
        name: `dt-deleted-${uniqueSuffix()}`,
        color: "#00ff00",
        deletedAt: new Date(),
      },
    });

    softDeletedDayTypeId = deletedDayType.id;
  });

  afterAll(async () => {
    for (const sessionId of createdSessionIds) {
      await cleanupRaw.planSession.delete({ where: { id: sessionId } }).catch(() => {});
    }

    for (const dayId of createdDayIds) {
      await cleanupRaw.planDay.delete({ where: { id: dayId } }).catch(() => {});
    }

    await cleanupRaw.dayType.delete({ where: { id: dayTypeId } }).catch(() => {});
    await cleanupRaw.dayType.delete({ where: { id: softDeletedDayTypeId } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: planId } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: foreignPlanId } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: archivedPlanId } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: softDeletedPlanId } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: otherCoach.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: otherCoach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: headCoach.id } }).catch(() => {});
  });

  describe("getById", () => {
    it("rejects with ForbiddenError when caller is not the plan creator", async () => {
      const day = await cleanupRaw.planDay.create({
        data: { planId, date: dayDate(1) },
      });

      createdDayIds.push(day.id);

      await expect(lmsPlanDayApi.getById(otherCoach.user.id, planId, day.id)).rejects.toThrow(
        ForbiddenError,
      );
    });
  });

  describe("upsert", () => {
    it("rejects with ForbiddenError when the plan is ARCHIVED", async () => {
      await expect(
        lmsPlanDayApi.upsert(coach.user.id, archivedPlanId, {
          date: dayDate(2),
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it("rejects with BadRequestError when dayTypeId references a soft-deleted DayType", async () => {
      await expect(
        lmsPlanDayApi.upsert(coach.user.id, planId, {
          date: dayDate(3),
          dayTypeId: softDeletedDayTypeId,
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it("returns isNew=true on first call and isNew=false on second call with same (planId, date)", async () => {
      const date = dayDate(4);

      const first = await lmsPlanDayApi.upsert(coach.user.id, planId, {
        date,
        dayTypeId,
      });

      createdDayIds.push(first.day.id);

      expect(first.isNew).toBe(true);

      const second = await lmsPlanDayApi.upsert(coach.user.id, planId, {
        date,
        dayTypeId,
      });

      expect(second.day.id).toBe(first.day.id);
      expect(second.isNew).toBe(false);
    });

    it("rejects with NotFoundError when plan is soft-deleted", async () => {
      await expect(
        lmsPlanDayApi.upsert(coach.user.id, softDeletedPlanId, {
          date: dayDate(7),
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("allows HEAD_COACH to upsert on a plan owned by another coach", async () => {
      const date = dayDate(8);

      const result = await lmsPlanDayApi.upsert(headCoach.id, planId, {
        date,
        dayTypeId,
      });

      createdDayIds.push(result.day.id);

      expect(result.day.planId).toBe(planId);
      expect(result.day.dayTypeId).toBe(dayTypeId);
    });
  });

  describe("getById parent-chain enforcement", () => {
    it("rejects with NotFoundError when dayId belongs to a different plan", async () => {
      const day = await cleanupRaw.planDay.create({
        data: { planId, date: dayDate(5) },
      });

      createdDayIds.push(day.id);

      await expect(
        lmsPlanDayApi.getById(otherCoach.user.id, foreignPlanId, day.id),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    it("hard-deletes the day and cascades to child sessions", async () => {
      const day = await cleanupRaw.planDay.create({
        data: { planId, date: dayDate(6) },
      });
      const session = await cleanupRaw.planSession.create({
        data: { dayId: day.id, order: 0 },
      });

      createdSessionIds.push(session.id);

      await lmsPlanDayApi.delete(coach.user.id, planId, day.id);

      const remainingSessions = await cleanupRaw.planSession.findMany({
        where: { dayId: day.id },
      });

      expect(remainingSessions).toEqual([]);

      const remainingDay = await cleanupRaw.planDay.findUnique({ where: { id: day.id } });

      expect(remainingDay).toBeNull();
    });
  });
});
