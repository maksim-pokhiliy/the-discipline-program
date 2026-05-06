import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ConflictError, ForbiddenError, NotFoundError } from "@repo/errors";

import { cleanupRaw, createTestCoach } from "../../../../test/helpers";

import { lmsPlanSessionApi } from "./admin";

const baseSessionData = (overrides: Partial<{ order: number; label: string }> = {}) => ({
  order: 0,
  ...overrides,
});

describe("lmsPlanSessionApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;

  let activePlanId: string;
  let archivedPlanId: string;
  let otherPlanId: string;

  let activeDayId: string;
  let archivedDayId: string;
  let otherDayId: string;

  beforeAll(async () => {
    coach = await createTestCoach();
    otherCoach = await createTestCoach();

    const activePlan = await cleanupRaw.trainingPlan.create({
      data: { creatorId: coach.user.id, name: "Active Plan", status: "ACTIVE" },
    });

    activePlanId = activePlan.id;

    const archivedPlan = await cleanupRaw.trainingPlan.create({
      data: { creatorId: coach.user.id, name: "Archived Plan", status: "ARCHIVED" },
    });

    archivedPlanId = archivedPlan.id;

    const otherPlan = await cleanupRaw.trainingPlan.create({
      data: { creatorId: otherCoach.user.id, name: "Other Coach Plan", status: "ACTIVE" },
    });

    otherPlanId = otherPlan.id;

    const activeDay = await cleanupRaw.planDay.create({
      data: { planId: activePlanId, date: new Date("2026-01-01") },
    });

    activeDayId = activeDay.id;

    const archivedDay = await cleanupRaw.planDay.create({
      data: { planId: archivedPlanId, date: new Date("2026-01-02") },
    });

    archivedDayId = archivedDay.id;

    const otherDay = await cleanupRaw.planDay.create({
      data: { planId: otherPlanId, date: new Date("2026-01-03") },
    });

    otherDayId = otherDay.id;
  });

  afterAll(async () => {
    await cleanupRaw.trainingPlan.delete({ where: { id: activePlanId } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: archivedPlanId } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: otherPlanId } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: otherCoach.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: otherCoach.user.id } }).catch(() => {});
  });

  describe("listByDay", () => {
    it("rejects when caller does not own the plan", async () => {
      await expect(
        lmsPlanSessionApi.listByDay(otherCoach.user.id, activePlanId, activeDayId),
      ).rejects.toThrow(ForbiddenError);
    });

    it("returns sessions ordered by order ASC", async () => {
      const second = await cleanupRaw.planSession.create({
        data: { dayId: activeDayId, order: 2, label: "second" },
      });
      const first = await cleanupRaw.planSession.create({
        data: { dayId: activeDayId, order: 1, label: "first" },
      });

      try {
        const sessions = await lmsPlanSessionApi.listByDay(
          coach.user.id,
          activePlanId,
          activeDayId,
        );
        const ours = sessions.filter((s) => s.id === first.id || s.id === second.id);

        expect(ours.map((s) => s.id)).toEqual([first.id, second.id]);
      } finally {
        await cleanupRaw.planSession.delete({ where: { id: first.id } }).catch(() => {});
        await cleanupRaw.planSession.delete({ where: { id: second.id } }).catch(() => {});
      }
    });
  });

  describe("create", () => {
    it("rejects mutation on ARCHIVED plan with ForbiddenError", async () => {
      await expect(
        lmsPlanSessionApi.create(coach.user.id, archivedPlanId, archivedDayId, baseSessionData()),
      ).rejects.toThrow(ForbiddenError);
    });

    it("rejects when dayId belongs to a different plan with NotFoundError", async () => {
      await expect(
        lmsPlanSessionApi.create(coach.user.id, activePlanId, otherDayId, baseSessionData()),
      ).rejects.toThrow(NotFoundError);
    });

    it("creates a session with order and optional label", async () => {
      const created = await lmsPlanSessionApi.create(
        coach.user.id,
        activePlanId,
        activeDayId,
        baseSessionData({ order: 0, label: "warmup" }),
      );

      try {
        expect(created.id).toBeDefined();
        expect(created.dayId).toBe(activeDayId);
        expect(created.order).toBe(0);
        expect(created.label).toBe("warmup");
        expect(created.createdAt).toBeInstanceOf(Date);
      } finally {
        await cleanupRaw.planSession.delete({ where: { id: created.id } }).catch(() => {});
      }
    });

    it("creates a session without label (label nullable in result)", async () => {
      const created = await lmsPlanSessionApi.create(
        coach.user.id,
        activePlanId,
        activeDayId,
        baseSessionData({ order: 5 }),
      );

      try {
        expect(created.order).toBe(5);
        expect(created.label).toBeNull();
      } finally {
        await cleanupRaw.planSession.delete({ where: { id: created.id } }).catch(() => {});
      }
    });

    it("rejects with ConflictError on duplicate (dayId, order)", async () => {
      const first = await lmsPlanSessionApi.create(
        coach.user.id,
        activePlanId,
        activeDayId,
        baseSessionData({ order: 42 }),
      );

      try {
        await expect(
          lmsPlanSessionApi.create(
            coach.user.id,
            activePlanId,
            activeDayId,
            baseSessionData({ order: 42 }),
          ),
        ).rejects.toThrow(ConflictError);
      } finally {
        await cleanupRaw.planSession.delete({ where: { id: first.id } }).catch(() => {});
      }
    });
  });

  describe("getById and delete (parent-chain)", () => {
    it("rejects sessionId from a different plan with NotFoundError on getById", async () => {
      const otherSession = await cleanupRaw.planSession.create({
        data: { dayId: otherDayId, order: 0 },
      });

      try {
        await expect(
          lmsPlanSessionApi.getById(coach.user.id, activePlanId, otherSession.id),
        ).rejects.toThrow(NotFoundError);
      } finally {
        await cleanupRaw.planSession.delete({ where: { id: otherSession.id } }).catch(() => {});
      }
    });

    it("rejects update with NotFoundError when sessionId belongs to a different plan (cross-plan smuggle)", async () => {
      const otherSession = await cleanupRaw.planSession.create({
        data: { dayId: otherDayId, order: 0, label: "foreign" },
      });

      try {
        await expect(
          lmsPlanSessionApi.update(coach.user.id, activePlanId, otherSession.id, {
            label: "smuggled",
          }),
        ).rejects.toThrow(NotFoundError);

        const unchanged = await cleanupRaw.planSession.findUnique({
          where: { id: otherSession.id },
        });

        expect(unchanged?.label).toBe("foreign");
      } finally {
        await cleanupRaw.planSession.delete({ where: { id: otherSession.id } }).catch(() => {});
      }
    });

    it("rejects delete with NotFoundError when sessionId belongs to a different plan (cross-plan smuggle)", async () => {
      const otherSession = await cleanupRaw.planSession.create({
        data: { dayId: otherDayId, order: 0 },
      });

      try {
        await expect(
          lmsPlanSessionApi.delete(coach.user.id, activePlanId, otherSession.id),
        ).rejects.toThrow(NotFoundError);

        const survived = await cleanupRaw.planSession.findUnique({
          where: { id: otherSession.id },
        });

        expect(survived).not.toBeNull();
      } finally {
        await cleanupRaw.planSession.delete({ where: { id: otherSession.id } }).catch(() => {});
      }
    });

    it("hard-deletes session and cascades to child blocks", async () => {
      const session = await cleanupRaw.planSession.create({
        data: { dayId: activeDayId, order: 9 },
      });
      const schemeType = await cleanupRaw.schemeType.create({
        data: { name: `cascade-scheme-${crypto.randomUUID().slice(0, 8)}`, archetypeKind: "NONE" },
      });
      const block = await cleanupRaw.planBlock.create({
        data: {
          sessionId: session.id,
          order: 0,
          schemeTypeId: schemeType.id,
          schemeParams: { kind: "NONE" },
        },
      });

      try {
        await lmsPlanSessionApi.delete(coach.user.id, activePlanId, session.id);

        const sessionAfter = await cleanupRaw.planSession.findUnique({
          where: { id: session.id },
        });
        const blockAfter = await cleanupRaw.planBlock.findUnique({ where: { id: block.id } });

        expect(sessionAfter).toBeNull();
        expect(blockAfter).toBeNull();
      } finally {
        await cleanupRaw.planBlock.delete({ where: { id: block.id } }).catch(() => {});
        await cleanupRaw.planSession.delete({ where: { id: session.id } }).catch(() => {});
        await cleanupRaw.schemeType.delete({ where: { id: schemeType.id } }).catch(() => {});
      }
    });
  });

  describe("update", () => {
    it("updates label and order", async () => {
      const session = await cleanupRaw.planSession.create({
        data: { dayId: activeDayId, order: 0, label: "before" },
      });

      try {
        const updated = await lmsPlanSessionApi.update(coach.user.id, activePlanId, session.id, {
          order: 7,
          label: "after",
        });

        expect(updated.id).toBe(session.id);
        expect(updated.order).toBe(7);
        expect(updated.label).toBe("after");
      } finally {
        await cleanupRaw.planSession.delete({ where: { id: session.id } }).catch(() => {});
      }
    });
  });
});
