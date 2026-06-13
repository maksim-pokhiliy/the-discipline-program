import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import { cleanupRaw, createTestCoach, createTestPlan } from "../../../test/helpers";
import { retryOnP2034 } from "../../../utils";

import { lmsBlockApi } from "./admin";

describe("lmsBlockApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;

  let activePlanId: string;
  let archivedPlanId: string;
  let blockLabelA: string;
  let blockLabelB: string;
  let blockLabelC: string;
  let sessionOnlyLabelId: string;
  let dayOnlyLabelId: string;

  let weekCounter = 0;

  const provisionSession = async (options: { planId?: string } = {}) => {
    const planId = options.planId ?? activePlanId;

    weekCounter += 1;

    const startDate = new Date(Date.UTC(2026, 0, 1));

    startDate.setUTCDate(startDate.getUTCDate() + weekCounter * 7);

    const week = await cleanupRaw.week.create({
      data: { planId, startDate },
    });
    const day = await cleanupRaw.day.create({
      data: { weekId: week.id, dayOfWeek: "TUESDAY" },
    });
    const session = await cleanupRaw.session.create({
      data: { dayId: day.id, order: 10 },
    });

    return {
      week,
      day,
      session,
      cleanup: async () => {
        await cleanupRaw.block.deleteMany({ where: { sessionId: session.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: session.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      },
    };
  };

  beforeAll(async () => {
    coach = await createTestCoach();
    otherCoach = await createTestCoach();

    const activePlan = await createTestPlan(coach.user.id, { status: "ACTIVE" });

    activePlanId = activePlan.id;

    const archivedPlan = await cleanupRaw.trainingPlan.create({
      data: {
        creatorId: coach.user.id,
        name: "Block Test Archived Plan",
        status: "ARCHIVED",
      },
    });

    archivedPlanId = archivedPlan.id;

    const suffix = crypto.randomUUID().slice(0, 8);

    const blockA = await cleanupRaw.label.create({
      data: {
        name: `Block Label A ${suffix}`,
        nameLower: `block label a ${suffix}`,
        applicableLevels: ["BLOCK"],
        notes: null,
      },
    });

    blockLabelA = blockA.id;

    const blockB = await cleanupRaw.label.create({
      data: {
        name: `Block Label B ${suffix}`,
        nameLower: `block label b ${suffix}`,
        applicableLevels: ["BLOCK"],
        notes: null,
      },
    });

    blockLabelB = blockB.id;

    const blockC = await cleanupRaw.label.create({
      data: {
        name: `Block Label C ${suffix}`,
        nameLower: `block label c ${suffix}`,
        applicableLevels: ["BLOCK"],
        notes: null,
      },
    });

    blockLabelC = blockC.id;

    const sessionLabel = await cleanupRaw.label.create({
      data: {
        name: `Session Only Label ${suffix}`,
        nameLower: `session only label ${suffix}`,
        applicableLevels: ["SESSION"],
        notes: null,
      },
    });

    sessionOnlyLabelId = sessionLabel.id;

    const dayLabel = await cleanupRaw.label.create({
      data: {
        name: `Day Only Label ${suffix}`,
        nameLower: `day only label ${suffix}`,
        applicableLevels: ["DAY"],
        notes: null,
      },
    });

    dayOnlyLabelId = dayLabel.id;
  });

  afterAll(async () => {
    await cleanupRaw.block
      .deleteMany({
        where: { session: { day: { week: { planId: { in: [activePlanId, archivedPlanId] } } } } },
      })
      .catch(() => {});
    await cleanupRaw.session
      .deleteMany({
        where: { day: { week: { planId: { in: [activePlanId, archivedPlanId] } } } },
      })
      .catch(() => {});
    await cleanupRaw.day
      .deleteMany({ where: { week: { planId: { in: [activePlanId, archivedPlanId] } } } })
      .catch(() => {});
    await cleanupRaw.week
      .deleteMany({ where: { planId: { in: [activePlanId, archivedPlanId] } } })
      .catch(() => {});

    await cleanupRaw.label.delete({ where: { id: blockLabelA } }).catch(() => {});
    await cleanupRaw.label.delete({ where: { id: blockLabelB } }).catch(() => {});
    await cleanupRaw.label.delete({ where: { id: blockLabelC } }).catch(() => {});
    await cleanupRaw.label.delete({ where: { id: sessionOnlyLabelId } }).catch(() => {});
    await cleanupRaw.label.delete({ where: { id: dayOnlyLabelId } }).catch(() => {});

    await cleanupRaw.trainingPlan.delete({ where: { id: archivedPlanId } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: activePlanId } }).catch(() => {});

    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: otherCoach.profile.id } }).catch(() => {});

    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: otherCoach.user.id } }).catch(() => {});
  });

  describe("create", () => {
    it("rejects when caller does not own the parent session's plan", async () => {
      const ctx = await provisionSession();

      try {
        await expect(
          lmsBlockApi.create(otherCoach.user.id, activePlanId, ctx.session.id, {}),
        ).rejects.toThrow(ForbiddenError);

        const blockCount = await cleanupRaw.block.count({ where: { sessionId: ctx.session.id } });

        expect(blockCount).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects on an archived plan", async () => {
      const ctx = await provisionSession({ planId: archivedPlanId });

      try {
        await expect(
          lmsBlockApi.create(coach.user.id, archivedPlanId, ctx.session.id, {}),
        ).rejects.toThrow(ForbiddenError);

        const blockCount = await cleanupRaw.block.count({ where: { sessionId: ctx.session.id } });

        expect(blockCount).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("creates an empty Block with order 10 and null notes/labels", async () => {
      const ctx = await provisionSession();

      try {
        const block = await lmsBlockApi.create(coach.user.id, activePlanId, ctx.session.id, {});

        expect(block.sessionId).toBe(ctx.session.id);
        expect(block.order).toBe(10);
        expect(block.notes).toBeNull();
        expect(block.labels).toEqual([]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("creates a Block with labelIds[3] in submitted order with sparse 10/20/30 assignment orders", async () => {
      const ctx = await provisionSession();

      try {
        const block = await lmsBlockApi.create(coach.user.id, activePlanId, ctx.session.id, {
          labelIds: [blockLabelA, blockLabelB, blockLabelC],
        });

        expect(block.labels.map((l) => l.id)).toEqual([blockLabelA, blockLabelB, blockLabelC]);

        const assignments = await cleanupRaw.blockLabelAssignment.findMany({
          where: { blockId: block.id },
          orderBy: { order: "asc" },
          select: { labelId: true, order: true },
        });

        expect(assignments).toEqual([
          { labelId: blockLabelA, order: 10 },
          { labelId: blockLabelB, order: 20 },
          { labelId: blockLabelC, order: 30 },
        ]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("assigns the next sparse order on a populated session", async () => {
      const ctx = await provisionSession();
      const first = await cleanupRaw.block.create({
        data: { sessionId: ctx.session.id, order: 10 },
      });
      const second = await cleanupRaw.block.create({
        data: { sessionId: ctx.session.id, order: 20 },
      });

      try {
        const third = await lmsBlockApi.create(coach.user.id, activePlanId, ctx.session.id, {});

        expect(third.order).toBe(30);
        expect(third.sessionId).toBe(ctx.session.id);

        const stored = await cleanupRaw.block.findMany({
          where: { sessionId: ctx.session.id },
          orderBy: { order: "asc" },
          select: { id: true, order: true },
        });

        expect(stored).toEqual([
          { id: first.id, order: 10 },
          { id: second.id, order: 20 },
          { id: third.id, order: 30 },
        ]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects a labelId whose applicableLevels does not include BLOCK", async () => {
      const ctx = await provisionSession();

      try {
        await expect(
          lmsBlockApi.create(coach.user.id, activePlanId, ctx.session.id, {
            labelIds: [sessionOnlyLabelId],
          }),
        ).rejects.toThrow(BadRequestError);

        const blockCount = await cleanupRaw.block.count({ where: { sessionId: ctx.session.id } });

        expect(blockCount).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects a non-existent labelId without creating any side-effect", async () => {
      const ctx = await provisionSession();

      try {
        await expect(
          lmsBlockApi.create(coach.user.id, activePlanId, ctx.session.id, {
            labelIds: ["clz0000000000000000000000"],
          }),
        ).rejects.toThrow(NotFoundError);

        const blockCount = await cleanupRaw.block.count({ where: { sessionId: ctx.session.id } });

        expect(blockCount).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when planId does not match the session's plan", async () => {
      const ctx = await provisionSession();
      const otherActivePlan = await createTestPlan(coach.user.id, { status: "ACTIVE" });

      try {
        await expect(
          lmsBlockApi.create(coach.user.id, otherActivePlan.id, ctx.session.id, {}),
        ).rejects.toThrow(NotFoundError);

        const blockCount = await cleanupRaw.block.count({ where: { sessionId: ctx.session.id } });

        expect(blockCount).toBe(0);
      } finally {
        await ctx.cleanup();
        await cleanupRaw.trainingPlan.delete({ where: { id: otherActivePlan.id } }).catch(() => {});
      }
    });

    it("concurrent Block.create on the same session — at least one succeeds via P2034 retry", async () => {
      const ctx = await provisionSession();

      try {
        const [first, second] = await Promise.allSettled([
          lmsBlockApi.create(coach.user.id, activePlanId, ctx.session.id, {
            notes: ["first concurrent"],
          }),
          lmsBlockApi.create(coach.user.id, activePlanId, ctx.session.id, {
            notes: ["second concurrent"],
          }),
        ]);

        expect(first.status === "fulfilled" || second.status === "fulfilled").toBe(true);

        const fulfilledCount = [first, second].filter((r) => r.status === "fulfilled").length;
        const stored = await cleanupRaw.block.findMany({
          where: { sessionId: ctx.session.id },
          orderBy: { order: "asc" },
        });

        expect(stored).toHaveLength(fulfilledCount);

        if (fulfilledCount === 2) {
          expect(stored[0]?.order).toBe(10);
          expect(stored[1]?.order).toBe(20);
          expect(new Set(stored.map((s) => s.id)).size).toBe(2);
        }
      } finally {
        await ctx.cleanup();
      }
    });

    it("enforces composite uniqueness on (sessionId, order) via P2002", async () => {
      const ctx = await provisionSession();

      try {
        await cleanupRaw.block.create({
          data: { sessionId: ctx.session.id, order: 10 },
        });

        await expect(
          cleanupRaw.block.create({
            data: { sessionId: ctx.session.id, order: 10 },
          }),
        ).rejects.toMatchObject({
          code: "P2002",
        });

        const stored = await cleanupRaw.block.count({ where: { sessionId: ctx.session.id } });

        expect(stored).toBe(1);
      } finally {
        await ctx.cleanup();
      }
    });

    it("does not retry P2002 collision under retryOnP2034 wrap", async () => {
      const ctx = await provisionSession();

      await cleanupRaw.block.create({
        data: { sessionId: ctx.session.id, order: 10 },
      });

      try {
        let attempts = 0;

        await expect(
          retryOnP2034(() => {
            attempts += 1;

            return cleanupRaw.block.create({
              data: { sessionId: ctx.session.id, order: 10 },
            });
          }),
        ).rejects.toMatchObject({
          code: "P2002",
        });

        expect(attempts).toBe(1);
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe("update", () => {
    it("updates notes via conditional spread", async () => {
      const ctx = await provisionSession();
      const block = await cleanupRaw.block.create({
        data: { sessionId: ctx.session.id, order: 10 },
      });

      try {
        const updated = await lmsBlockApi.update(coach.user.id, block.id, {
          notes: ["hard set"],
        });

        expect(updated.notes).toEqual(["hard set"]);

        const stored = await cleanupRaw.block.findUnique({ where: { id: block.id } });

        expect(stored?.notes).toEqual(["hard set"]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("silently ignores labelIds in the payload (OQ-b1 invariant)", async () => {
      const ctx = await provisionSession();
      const block = await cleanupRaw.block.create({
        data: { sessionId: ctx.session.id, order: 10 },
      });

      await cleanupRaw.blockLabelAssignment.createMany({
        data: [
          { blockId: block.id, labelId: blockLabelA, order: 10 },
          { blockId: block.id, labelId: blockLabelB, order: 20 },
        ],
      });

      try {
        const updated = await lmsBlockApi.update(coach.user.id, block.id, {
          labelIds: [blockLabelC],
        });

        expect(updated.labels.map((l) => l.id)).toEqual([blockLabelA, blockLabelB]);

        const assignments = await cleanupRaw.blockLabelAssignment.findMany({
          where: { blockId: block.id },
          orderBy: { order: "asc" },
          select: { labelId: true, order: true },
        });

        expect(assignments).toEqual([
          { labelId: blockLabelA, order: 10 },
          { labelId: blockLabelB, order: 20 },
        ]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects non-owner update", async () => {
      const ctx = await provisionSession();
      const block = await cleanupRaw.block.create({
        data: { sessionId: ctx.session.id, order: 10, notes: ["original"] },
      });

      try {
        await expect(
          lmsBlockApi.update(otherCoach.user.id, block.id, { notes: ["tamper"] }),
        ).rejects.toThrow(ForbiddenError);

        const stored = await cleanupRaw.block.findUnique({ where: { id: block.id } });

        expect(stored?.notes).toEqual(["original"]);
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe("delete", () => {
    it("removes the Block and cascades labelAssignments + schemas", async () => {
      const ctx = await provisionSession();
      const block = await cleanupRaw.block.create({
        data: { sessionId: ctx.session.id, order: 10 },
      });

      await cleanupRaw.blockLabelAssignment.createMany({
        data: [
          { blockId: block.id, labelId: blockLabelA, order: 10 },
          { blockId: block.id, labelId: blockLabelB, order: 20 },
        ],
      });

      await cleanupRaw.schema.create({
        data: {
          blockId: block.id,
          order: 10,
        },
      });

      try {
        await lmsBlockApi.delete(coach.user.id, block.id);

        const blockAfter = await cleanupRaw.block.findUnique({ where: { id: block.id } });

        expect(blockAfter).toBeNull();

        const assignmentsAfter = await cleanupRaw.blockLabelAssignment.findMany({
          where: { blockId: block.id },
        });

        expect(assignmentsAfter).toEqual([]);

        const schemasAfter = await cleanupRaw.schema.findMany({
          where: { blockId: block.id },
        });

        expect(schemasAfter).toEqual([]);
      } finally {
        await cleanupRaw.schema.deleteMany({ where: { blockId: block.id } }).catch(() => {});
        await ctx.cleanup();
      }
    });

    it("rejects when caller does not own the block", async () => {
      const ctx = await provisionSession();
      const block = await cleanupRaw.block.create({
        data: { sessionId: ctx.session.id, order: 10 },
      });

      try {
        await expect(lmsBlockApi.delete(otherCoach.user.id, block.id)).rejects.toThrow(
          ForbiddenError,
        );

        const stored = await cleanupRaw.block.findUnique({ where: { id: block.id } });

        expect(stored).not.toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe("reorder", () => {
    it("renumbers blocks on the happy path", async () => {
      const ctx = await provisionSession();
      const a = await cleanupRaw.block.create({ data: { sessionId: ctx.session.id, order: 10 } });
      const b = await cleanupRaw.block.create({ data: { sessionId: ctx.session.id, order: 20 } });
      const c = await cleanupRaw.block.create({ data: { sessionId: ctx.session.id, order: 30 } });

      try {
        const returned = await lmsBlockApi.reorder(coach.user.id, activePlanId, ctx.session.id, {
          orderedIds: [c.id, a.id, b.id],
        });

        expect(returned.map((blk) => ({ id: blk.id, order: blk.order }))).toEqual([
          { id: c.id, order: 10 },
          { id: a.id, order: 20 },
          { id: b.id, order: 30 },
        ]);

        const stored = await cleanupRaw.block.findMany({
          where: { sessionId: ctx.session.id },
          orderBy: { order: "asc" },
          select: { id: true, order: true },
        });

        expect(stored).toEqual([
          { id: c.id, order: 10 },
          { id: a.id, order: 20 },
          { id: b.id, order: 30 },
        ]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when orderedIds is a subset of the target session's blocks", async () => {
      const ctx = await provisionSession();
      const a = await cleanupRaw.block.create({ data: { sessionId: ctx.session.id, order: 10 } });
      const b = await cleanupRaw.block.create({ data: { sessionId: ctx.session.id, order: 20 } });
      const c = await cleanupRaw.block.create({ data: { sessionId: ctx.session.id, order: 30 } });

      try {
        await expect(
          lmsBlockApi.reorder(coach.user.id, activePlanId, ctx.session.id, {
            orderedIds: [a.id, b.id],
          }),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.block.findMany({
          where: { sessionId: ctx.session.id },
          orderBy: { order: "asc" },
          select: { id: true, order: true },
        });

        expect(stored).toEqual([
          { id: a.id, order: 10 },
          { id: b.id, order: 20 },
          { id: c.id, order: 30 },
        ]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects ids that belong to a different session", async () => {
      const ctxA = await provisionSession();
      const ctxB = await provisionSession();
      const blockA = await cleanupRaw.block.create({
        data: { sessionId: ctxA.session.id, order: 10 },
      });
      const blockB = await cleanupRaw.block.create({
        data: { sessionId: ctxB.session.id, order: 10 },
      });

      try {
        await expect(
          lmsBlockApi.reorder(coach.user.id, activePlanId, ctxA.session.id, {
            orderedIds: [blockA.id, blockB.id],
          }),
        ).rejects.toThrow(BadRequestError);

        const storedA = await cleanupRaw.block.findUnique({ where: { id: blockA.id } });
        const storedB = await cleanupRaw.block.findUnique({ where: { id: blockB.id } });

        expect(storedA?.order).toBe(10);
        expect(storedB?.order).toBe(10);
      } finally {
        await ctxA.cleanup();
        await ctxB.cleanup();
      }
    });

    it("rejects when orderedIds references a non-existent block", async () => {
      const ctx = await provisionSession();
      const a = await cleanupRaw.block.create({ data: { sessionId: ctx.session.id, order: 10 } });

      try {
        await expect(
          lmsBlockApi.reorder(coach.user.id, activePlanId, ctx.session.id, {
            orderedIds: [a.id, "clz0000000000000000000000"],
          }),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.block.findUnique({ where: { id: a.id } });

        expect(stored?.order).toBe(10);
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe("assignLabels", () => {
    it("assigns labels with sequential sparse order 10/20/30", async () => {
      const ctx = await provisionSession();
      const block = await cleanupRaw.block.create({
        data: { sessionId: ctx.session.id, order: 10 },
      });

      try {
        const returned = await lmsBlockApi.assignLabels(coach.user.id, block.id, {
          labelIds: [blockLabelA, blockLabelB, blockLabelC],
        });

        expect(returned.labels.map((l) => l.id)).toEqual([blockLabelA, blockLabelB, blockLabelC]);

        const assignments = await cleanupRaw.blockLabelAssignment.findMany({
          where: { blockId: block.id },
          orderBy: { order: "asc" },
          select: { labelId: true, order: true },
        });

        expect(assignments).toEqual([
          { labelId: blockLabelA, order: 10 },
          { labelId: blockLabelB, order: 20 },
          { labelId: blockLabelC, order: 30 },
        ]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("wipes all labels with empty array and issues zero inserts (D-7 invariant)", async () => {
      const ctx = await provisionSession();
      const block = await cleanupRaw.block.create({
        data: { sessionId: ctx.session.id, order: 10 },
      });

      await cleanupRaw.blockLabelAssignment.createMany({
        data: [
          { blockId: block.id, labelId: blockLabelA, order: 10 },
          { blockId: block.id, labelId: blockLabelB, order: 20 },
          { blockId: block.id, labelId: blockLabelC, order: 30 },
        ],
      });

      const before = await cleanupRaw.blockLabelAssignment.count({
        where: { blockId: block.id },
      });

      expect(before).toBe(3);

      try {
        const returned = await lmsBlockApi.assignLabels(coach.user.id, block.id, {
          labelIds: [],
        });

        expect(returned.labels).toEqual([]);

        const after = await cleanupRaw.blockLabelAssignment.count({
          where: { blockId: block.id },
        });

        expect(after).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("replaces the label set atomically as delete-all-then-insert (OQ-c1)", async () => {
      const ctx = await provisionSession();
      const block = await cleanupRaw.block.create({
        data: { sessionId: ctx.session.id, order: 10 },
      });

      await cleanupRaw.blockLabelAssignment.createMany({
        data: [
          { blockId: block.id, labelId: blockLabelA, order: 10 },
          { blockId: block.id, labelId: blockLabelB, order: 20 },
          { blockId: block.id, labelId: blockLabelC, order: 30 },
        ],
      });

      try {
        const returned = await lmsBlockApi.assignLabels(coach.user.id, block.id, {
          labelIds: [blockLabelA, blockLabelB],
        });

        expect(returned.labels.map((l) => l.id)).toEqual([blockLabelA, blockLabelB]);

        const assignments = await cleanupRaw.blockLabelAssignment.findMany({
          where: { blockId: block.id },
          orderBy: { order: "asc" },
          select: { labelId: true, order: true },
        });

        expect(assignments).toEqual([
          { labelId: blockLabelA, order: 10 },
          { labelId: blockLabelB, order: 20 },
        ]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects a labelId whose applicableLevels does not include BLOCK", async () => {
      const ctx = await provisionSession();
      const block = await cleanupRaw.block.create({
        data: { sessionId: ctx.session.id, order: 10 },
      });

      await cleanupRaw.blockLabelAssignment.createMany({
        data: [{ blockId: block.id, labelId: blockLabelA, order: 10 }],
      });

      try {
        await expect(
          lmsBlockApi.assignLabels(coach.user.id, block.id, {
            labelIds: [dayOnlyLabelId],
          }),
        ).rejects.toThrow(BadRequestError);

        const assignments = await cleanupRaw.blockLabelAssignment.findMany({
          where: { blockId: block.id },
          select: { labelId: true },
        });

        expect(assignments).toEqual([{ labelId: blockLabelA }]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when labelIds references a non-existent label", async () => {
      const ctx = await provisionSession();
      const block = await cleanupRaw.block.create({
        data: { sessionId: ctx.session.id, order: 10 },
      });

      await cleanupRaw.blockLabelAssignment.createMany({
        data: [{ blockId: block.id, labelId: blockLabelA, order: 10 }],
      });

      try {
        await expect(
          lmsBlockApi.assignLabels(coach.user.id, block.id, {
            labelIds: ["clz0000000000000000000000"],
          }),
        ).rejects.toThrow(NotFoundError);

        const assignments = await cleanupRaw.blockLabelAssignment.findMany({
          where: { blockId: block.id },
          select: { labelId: true },
        });

        expect(assignments).toEqual([{ labelId: blockLabelA }]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("concurrent assignLabels on the same block — at least one succeeds and stored state matches a winner", async () => {
      const ctx = await provisionSession();
      const block = await cleanupRaw.block.create({
        data: { sessionId: ctx.session.id, order: 10 },
      });

      try {
        const [first, second] = await Promise.allSettled([
          lmsBlockApi.assignLabels(coach.user.id, block.id, {
            labelIds: [blockLabelA, blockLabelB],
          }),
          lmsBlockApi.assignLabels(coach.user.id, block.id, {
            labelIds: [blockLabelC],
          }),
        ]);

        const fulfilled = [first, second].filter(
          (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof lmsBlockApi.assignLabels>>> =>
            r.status === "fulfilled",
        );

        expect(fulfilled.length).toBeGreaterThanOrEqual(1);

        const stored = await cleanupRaw.blockLabelAssignment.findMany({
          where: { blockId: block.id },
          orderBy: { order: "asc" },
          select: { labelId: true },
        });

        const storedKey = JSON.stringify(stored);
        const fulfilledKeys = fulfilled.map((r) =>
          JSON.stringify(r.value.labels.map((l) => ({ labelId: l.id }))),
        );

        expect(fulfilledKeys).toContain(storedKey);
      } finally {
        await ctx.cleanup();
      }
    });
  });
});
