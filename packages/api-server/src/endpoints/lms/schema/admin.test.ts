import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { type Composition, deriveCompositionLabel } from "@repo/contracts/lms/composition";
import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import { cleanupRaw, createTestCoach, createTestPlan } from "../../../test/helpers";

import { lmsSchemaApi } from "./admin";

const LADDER_COMPOSITION: Composition = {
  repetition: { kind: "ladder", steps: [21, 15, 9] },
};

const INTERVAL_COMPOSITION: Composition = {
  repetition: { kind: "interval", workMin: 2, offMin: 1, count: 6 },
};

describe("lmsSchemaApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;
  let headCoach: Awaited<ReturnType<typeof createTestCoach>>;

  let activePlanId: string;
  let archivedPlanId: string;

  let weekCounter = 0;

  const provisionBlock = async (options: { planId?: string } = {}) => {
    const planId = options.planId ?? activePlanId;

    weekCounter += 1;

    const startDate = new Date(Date.UTC(2026, 0, 1));

    startDate.setUTCDate(startDate.getUTCDate() + weekCounter * 7);

    const week = await cleanupRaw.week.create({
      data: { planId, startDate },
    });
    const day = await cleanupRaw.day.create({
      data: { weekId: week.id, dayOfWeek: "WEDNESDAY" },
    });
    const session = await cleanupRaw.session.create({
      data: { dayId: day.id, order: 10 },
    });
    const block = await cleanupRaw.block.create({
      data: { sessionId: session.id, order: 10 },
    });

    return {
      week,
      day,
      session,
      block,
      cleanup: async () => {
        await cleanupRaw.schemaRow
          .deleteMany({ where: { schema: { blockId: block.id } } })
          .catch(() => {});
        await cleanupRaw.schema.deleteMany({ where: { blockId: block.id } }).catch(() => {});
        await cleanupRaw.schemaGroup.deleteMany({ where: { blockId: block.id } }).catch(() => {});
        await cleanupRaw.block.delete({ where: { id: block.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: session.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      },
    };
  };

  beforeAll(async () => {
    coach = await createTestCoach();
    otherCoach = await createTestCoach();
    headCoach = await createTestCoach();

    const preexisting = await cleanupRaw.user.findMany({
      where: { role: "HEAD_COACH" },
      select: { id: true },
    });

    for (const hc of preexisting) {
      await cleanupRaw.user.update({
        where: { id: hc.id },
        data: { role: "COACH" },
      });
    }

    await cleanupRaw.user.update({
      where: { id: headCoach.user.id },
      data: { role: "HEAD_COACH" },
    });

    const activePlan = await createTestPlan(coach.user.id, { status: "ACTIVE" });

    activePlanId = activePlan.id;

    const archivedPlan = await cleanupRaw.trainingPlan.create({
      data: {
        creatorId: coach.user.id,
        name: "Schema Test Archived Plan",
        status: "ARCHIVED",
      },
    });

    archivedPlanId = archivedPlan.id;
  });

  afterAll(async () => {
    await cleanupRaw.schemaRow
      .deleteMany({
        where: {
          schema: {
            block: {
              session: { day: { week: { planId: { in: [activePlanId, archivedPlanId] } } } },
            },
          },
        },
      })
      .catch(() => {});
    await cleanupRaw.schema
      .deleteMany({
        where: {
          block: { session: { day: { week: { planId: { in: [activePlanId, archivedPlanId] } } } } },
        },
      })
      .catch(() => {});
    await cleanupRaw.schemaGroup
      .deleteMany({
        where: {
          block: { session: { day: { week: { planId: { in: [activePlanId, archivedPlanId] } } } } },
        },
      })
      .catch(() => {});
    await cleanupRaw.block
      .deleteMany({
        where: { session: { day: { week: { planId: { in: [activePlanId, archivedPlanId] } } } } },
      })
      .catch(() => {});
    await cleanupRaw.session
      .deleteMany({ where: { day: { week: { planId: { in: [activePlanId, archivedPlanId] } } } } })
      .catch(() => {});
    await cleanupRaw.day
      .deleteMany({ where: { week: { planId: { in: [activePlanId, archivedPlanId] } } } })
      .catch(() => {});
    await cleanupRaw.week
      .deleteMany({ where: { planId: { in: [activePlanId, archivedPlanId] } } })
      .catch(() => {});

    await cleanupRaw.trainingPlan.delete({ where: { id: archivedPlanId } }).catch(() => {});
    await cleanupRaw.trainingPlan.delete({ where: { id: activePlanId } }).catch(() => {});

    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: otherCoach.profile.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: headCoach.profile.id } }).catch(() => {});

    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: otherCoach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: headCoach.user.id } }).catch(() => {});
  });

  describe("create", () => {
    it("rejects when caller does not own the parent block's plan", async () => {
      const ctx = await provisionBlock();

      try {
        await expect(
          lmsSchemaApi.create(otherCoach.user.id, activePlanId, { blockId: ctx.block.id }, {}),
        ).rejects.toThrow(ForbiddenError);

        const count = await cleanupRaw.schema.count({ where: { blockId: ctx.block.id } });

        expect(count).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("allows head-coach to create a Schema in another coach's plan", async () => {
      const ctx = await provisionBlock();

      try {
        const created = await lmsSchemaApi.create(
          headCoach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          {},
        );

        expect(created.blockId).toBe(ctx.block.id);
        expect(created.order).toBe(10);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects on an archived plan", async () => {
      const ctx = await provisionBlock({ planId: archivedPlanId });

      try {
        await expect(
          lmsSchemaApi.create(coach.user.id, archivedPlanId, { blockId: ctx.block.id }, {}),
        ).rejects.toThrow(ForbiddenError);

        const count = await cleanupRaw.schema.count({ where: { blockId: ctx.block.id } });

        expect(count).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when planId does not match the block's plan", async () => {
      const ctx = await provisionBlock();
      const otherPlan = await createTestPlan(coach.user.id, { status: "ACTIVE" });

      try {
        await expect(
          lmsSchemaApi.create(coach.user.id, otherPlan.id, { blockId: ctx.block.id }, {}),
        ).rejects.toThrow(NotFoundError);
      } finally {
        await ctx.cleanup();
        await cleanupRaw.trainingPlan.delete({ where: { id: otherPlan.id } }).catch(() => {});
      }
    });

    it("creates a block-level Schema with a null groupId and order 10", async () => {
      const ctx = await provisionBlock();

      try {
        const created = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          { header: "Squats block" },
        );

        expect(created.blockId).toBe(ctx.block.id);
        expect(created.groupId).toBeNull();
        expect(created.order).toBe(10);
        expect(created.header).toBe("Squats block");
        expect(created.intensity).toBeNull();
        expect(created.notes).toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("creates a block-level Schema with intensity and notes", async () => {
      const ctx = await provisionBlock();

      try {
        const created = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          {
            intensity: { rpe: { value: 7 } },
            notes: "outer block",
          },
        );

        expect(created.intensity).toEqual({ rpe: { value: 7 } });
        expect(created.notes).toBe("outer block");

        const stored = await cleanupRaw.schema.findUnique({ where: { id: created.id } });

        expect(stored?.intensity).toEqual({ rpe: { value: 7 } });
      } finally {
        await ctx.cleanup();
      }
    });

    it("writes a composition, derives the label, and stores the bundle (QA-007 / G3)", async () => {
      const ctx = await provisionBlock();

      try {
        const created = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          {
            composition: LADDER_COMPOSITION,
          },
        );

        expect(created.composition).toEqual(LADDER_COMPOSITION);
        expect(created.label).toEqual(deriveCompositionLabel(LADDER_COMPOSITION));

        const stored = await cleanupRaw.schema.findUnique({ where: { id: created.id } });

        expect(stored?.composition).toEqual(LADDER_COMPOSITION);
      } finally {
        await ctx.cleanup();
      }
    });

    it("stores SQL null composition and a null label when no composition is supplied (QA-007 / G1)", async () => {
      const ctx = await provisionBlock();

      try {
        const created = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          {},
        );

        expect(created.composition).toBeNull();
        expect(created.label).toBeNull();

        const stored = await cleanupRaw.schema.findUnique({ where: { id: created.id } });

        expect(stored?.composition).toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("assigns the next sparse order on a populated block", async () => {
      const ctx = await provisionBlock();

      try {
        const first = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          {},
        );
        const second = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          {},
        );
        const third = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          {},
        );

        expect(first.order).toBe(10);
        expect(second.order).toBe(20);
        expect(third.order).toBe(30);
      } finally {
        await ctx.cleanup();
      }
    });

    it("concurrent Schema.create on same block — at least one succeeds via P2034 retry", async () => {
      const ctx = await provisionBlock();

      try {
        const results = await Promise.allSettled([
          lmsSchemaApi.create(coach.user.id, activePlanId, { blockId: ctx.block.id }, {}),
          lmsSchemaApi.create(coach.user.id, activePlanId, { blockId: ctx.block.id }, {}),
        ]);

        const fulfilledCount = results.filter((r) => r.status === "fulfilled").length;

        expect(fulfilledCount).toBeGreaterThanOrEqual(1);

        const stored = await cleanupRaw.schema.findMany({
          where: { blockId: ctx.block.id },
          orderBy: { order: "asc" },
        });

        expect(stored).toHaveLength(fulfilledCount);

        if (fulfilledCount === 2) {
          expect(stored[0]?.order).toBe(10);
          expect(stored[1]?.order).toBe(20);
        }
      } finally {
        await ctx.cleanup();
      }
    });

    it("persists a leaf composition on create", async () => {
      const ctx = await provisionBlock();
      const LEAF_COUNT_COMPOSITION: Composition = {
        repetition: { kind: "count", count: 3 },
      };

      try {
        const created = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          { composition: LEAF_COUNT_COMPOSITION },
        );

        expect(created.composition).toEqual(LEAF_COUNT_COMPOSITION);

        const stored = await cleanupRaw.schema.findUnique({ where: { id: created.id } });

        expect(stored?.composition).toEqual(LEAF_COUNT_COMPOSITION);
      } finally {
        await ctx.cleanup();
      }
    });

    describe("create into a group", () => {
      const provisionGroup = async (blockId: string) => {
        const group = await cleanupRaw.schemaGroup.create({
          data: { blockId, label: "parallel ladders" },
        });
        const memberA = await cleanupRaw.schema.create({
          data: { blockId, groupId: group.id, order: 10 },
        });
        const memberB = await cleanupRaw.schema.create({
          data: { blockId, groupId: group.id, order: 20 },
        });

        return { group, memberA, memberB };
      };

      it("appends a new member at the group's tail and shifts later block orders, keeping contiguity", async () => {
        const ctx = await provisionBlock();
        const { group, memberA, memberB } = await provisionGroup(ctx.block.id);
        const trailing = await cleanupRaw.schema.create({
          data: { blockId: ctx.block.id, order: 30 },
        });
        const trailingB = await cleanupRaw.schema.create({
          data: { blockId: ctx.block.id, order: 40 },
        });

        try {
          const created = await lmsSchemaApi.create(
            coach.user.id,
            activePlanId,
            { blockId: ctx.block.id },
            { groupId: group.id, header: "Track C" },
          );

          expect(created.groupId).toBe(group.id);
          expect(created.order).toBe(30);

          const stored = await cleanupRaw.schema.findMany({
            where: { blockId: ctx.block.id },
            orderBy: { order: "asc" },
            select: { id: true, order: true, groupId: true },
          });

          expect(stored).toEqual([
            { id: memberA.id, order: 10, groupId: group.id },
            { id: memberB.id, order: 20, groupId: group.id },
            { id: created.id, order: 30, groupId: group.id },
            { id: trailing.id, order: 40, groupId: null },
            { id: trailingB.id, order: 50, groupId: null },
          ]);
        } finally {
          await ctx.cleanup();
        }
      });

      it("appends into a group whose run sits at the block tail without shifting anything", async () => {
        const ctx = await provisionBlock();
        const { group, memberA, memberB } = await provisionGroup(ctx.block.id);

        try {
          const created = await lmsSchemaApi.create(
            coach.user.id,
            activePlanId,
            { blockId: ctx.block.id },
            { groupId: group.id },
          );

          expect(created.groupId).toBe(group.id);
          expect(created.order).toBe(30);

          const stored = await cleanupRaw.schema.findMany({
            where: { blockId: ctx.block.id },
            orderBy: { order: "asc" },
            select: { id: true, order: true },
          });

          expect(stored.map((s) => s.id)).toEqual([memberA.id, memberB.id, created.id]);
          expect(stored.map((s) => s.order)).toEqual([10, 20, 30]);
        } finally {
          await ctx.cleanup();
        }
      });

      it("rejects create-into-group when the group belongs to a different block", async () => {
        const ctx = await provisionBlock();
        const otherCtx = await provisionBlock();
        const foreignGroup = await cleanupRaw.schemaGroup.create({
          data: { blockId: otherCtx.block.id, label: null },
        });

        try {
          await expect(
            lmsSchemaApi.create(
              coach.user.id,
              activePlanId,
              { blockId: ctx.block.id },
              { groupId: foreignGroup.id },
            ),
          ).rejects.toThrow(BadRequestError);

          const count = await cleanupRaw.schema.count({ where: { blockId: ctx.block.id } });

          expect(count).toBe(0);
        } finally {
          await ctx.cleanup();
          await otherCtx.cleanup();
        }
      });
    });
  });

  describe("update", () => {
    it("updates header, intensity, and notes via conditional spread", async () => {
      const ctx = await provisionBlock();
      const schema = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );

      try {
        const updated = await lmsSchemaApi.update(coach.user.id, schema.id, {
          header: "new header",
          intensity: { rpe: { value: 8 } },
          notes: "set 1",
        });

        expect(updated.header).toBe("new header");
        expect(updated.intensity).toEqual({ rpe: { value: 8 } });
        expect(updated.notes).toBe("set 1");

        const stored = await cleanupRaw.schema.findUnique({ where: { id: schema.id } });

        expect(stored?.header).toBe("new header");
        expect(stored?.intensity).toEqual({ rpe: { value: 8 } });
        expect(stored?.notes).toBe("set 1");
      } finally {
        await ctx.cleanup();
      }
    });

    it("clears intensity by writing JSON null on explicit null", async () => {
      const ctx = await provisionBlock();
      const schema = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {
          intensity: { rpe: { value: 7 } },
        },
      );

      try {
        const updated = await lmsSchemaApi.update(coach.user.id, schema.id, {
          intensity: null,
        });

        expect(updated.intensity).toBeNull();

        const stored = await cleanupRaw.schema.findUnique({ where: { id: schema.id } });

        expect(stored?.intensity).toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("mutates composition to a new bundle then clears it to null with a recomputed label (QA-007 / G3)", async () => {
      const ctx = await provisionBlock();
      const schema = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {
          composition: LADDER_COMPOSITION,
        },
      );

      try {
        const mutated = await lmsSchemaApi.update(coach.user.id, schema.id, {
          composition: INTERVAL_COMPOSITION,
        });

        expect(mutated.composition).toEqual(INTERVAL_COMPOSITION);
        expect(mutated.label).toEqual(deriveCompositionLabel(INTERVAL_COMPOSITION));

        const storedMutated = await cleanupRaw.schema.findUnique({ where: { id: schema.id } });

        expect(storedMutated?.composition).toEqual(INTERVAL_COMPOSITION);

        const cleared = await lmsSchemaApi.update(coach.user.id, schema.id, {
          composition: null,
        });

        expect(cleared.composition).toBeNull();
        expect(cleared.label).toBeNull();

        const storedCleared = await cleanupRaw.schema.findUnique({ where: { id: schema.id } });

        expect(storedCleared?.composition).toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects update with a structural field set (groupId/blockId)", async () => {
      const ctx = await provisionBlock();
      const schema = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );

      try {
        await expect(
          lmsSchemaApi.update(coach.user.id, schema.id, {
            groupId: "clz0000000000000000000000",
          }),
        ).rejects.toThrow(BadRequestError);

        await expect(
          lmsSchemaApi.update(coach.user.id, schema.id, {
            blockId: "clz0000000000000000000000",
          }),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.schema.findUnique({ where: { id: schema.id } });

        expect(stored?.groupId).toBeNull();
        expect(stored?.blockId).toBe(ctx.block.id);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects update with groupId set explicitly to null (membership is immutable via update)", async () => {
      const ctx = await provisionBlock();
      const schema = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );

      try {
        await expect(
          lmsSchemaApi.update(coach.user.id, schema.id, { groupId: null }),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.schema.findUnique({ where: { id: schema.id } });

        expect(stored?.groupId).toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects non-owner update", async () => {
      const ctx = await provisionBlock();
      const schema = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {
          notes: "original",
        },
      );

      try {
        await expect(
          lmsSchemaApi.update(otherCoach.user.id, schema.id, { notes: "tamper" }),
        ).rejects.toThrow(ForbiddenError);

        const stored = await cleanupRaw.schema.findUnique({ where: { id: schema.id } });

        expect(stored?.notes).toBe("original");
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe("delete", () => {
    it("removes a block-level Schema and its rows without touching siblings", async () => {
      const ctx = await provisionBlock();
      const target = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );
      const sibling = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );
      const row = await cleanupRaw.schemaRow.create({
        data: {
          schemaId: target.id,
          order: 10,
          rowKind: "PLACEHOLDER",
          rowPayload: {
            rowKind: "PLACEHOLDER",
            placeholder: { placeholderKind: "coach_choice_slot" },
          },
        },
      });

      try {
        await lmsSchemaApi.delete(coach.user.id, target.id);

        const targetAfter = await cleanupRaw.schema.findUnique({ where: { id: target.id } });
        const rowAfter = await cleanupRaw.schemaRow.findUnique({ where: { id: row.id } });
        const siblingAfter = await cleanupRaw.schema.findUnique({ where: { id: sibling.id } });

        expect(targetAfter).toBeNull();
        expect(rowAfter).toBeNull();
        expect(siblingAfter).not.toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("deletes the group when its last member is deleted (dissolution)", async () => {
      const ctx = await provisionBlock();
      const group = await cleanupRaw.schemaGroup.create({
        data: { blockId: ctx.block.id, label: null },
      });
      const onlyMember = await cleanupRaw.schema.create({
        data: { blockId: ctx.block.id, groupId: group.id, order: 10 },
      });

      try {
        await lmsSchemaApi.delete(coach.user.id, onlyMember.id);

        const memberAfter = await cleanupRaw.schema.findUnique({ where: { id: onlyMember.id } });
        const groupAfter = await cleanupRaw.schemaGroup.findUnique({ where: { id: group.id } });

        expect(memberAfter).toBeNull();
        expect(groupAfter).toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("keeps the group alive when a non-last member is deleted, surviving members retain groupId", async () => {
      const ctx = await provisionBlock();
      const group = await cleanupRaw.schemaGroup.create({
        data: { blockId: ctx.block.id, label: null },
      });
      const memberA = await cleanupRaw.schema.create({
        data: { blockId: ctx.block.id, groupId: group.id, order: 10 },
      });
      const memberB = await cleanupRaw.schema.create({
        data: { blockId: ctx.block.id, groupId: group.id, order: 20 },
      });

      try {
        await lmsSchemaApi.delete(coach.user.id, memberA.id);

        const memberAAfter = await cleanupRaw.schema.findUnique({ where: { id: memberA.id } });
        const memberBAfter = await cleanupRaw.schema.findUnique({ where: { id: memberB.id } });
        const groupAfter = await cleanupRaw.schemaGroup.findUnique({ where: { id: group.id } });

        expect(memberAAfter).toBeNull();
        expect(memberBAfter?.groupId).toBe(group.id);
        expect(groupAfter).not.toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects delete from a non-owner", async () => {
      const ctx = await provisionBlock();
      const schema = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );

      try {
        await expect(lmsSchemaApi.delete(otherCoach.user.id, schema.id)).rejects.toThrow(
          ForbiddenError,
        );

        const stored = await cleanupRaw.schema.findUnique({ where: { id: schema.id } });

        expect(stored).not.toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe("reorder", () => {
    it("renumbers block-level Schemas on the happy path", async () => {
      const ctx = await provisionBlock();
      const a = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );
      const b = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );
      const c = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );

      try {
        const returned = await lmsSchemaApi.reorder(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          { orderedIds: [c.id, a.id, b.id] },
        );

        expect(returned.map((s) => ({ id: s.id, order: s.order }))).toEqual([
          { id: c.id, order: 10 },
          { id: a.id, order: 20 },
          { id: b.id, order: 30 },
        ]);

        const stored = await cleanupRaw.schema.findMany({
          where: { blockId: ctx.block.id },
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

    it("accepts a reorder that keeps a group's members contiguous", async () => {
      const ctx = await provisionBlock();
      const group = await cleanupRaw.schemaGroup.create({
        data: { blockId: ctx.block.id, label: null },
      });
      const leading = await cleanupRaw.schema.create({
        data: { blockId: ctx.block.id, order: 10 },
      });
      const memberA = await cleanupRaw.schema.create({
        data: { blockId: ctx.block.id, groupId: group.id, order: 20 },
      });
      const memberB = await cleanupRaw.schema.create({
        data: { blockId: ctx.block.id, groupId: group.id, order: 30 },
      });

      try {
        const returned = await lmsSchemaApi.reorder(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          { orderedIds: [memberA.id, memberB.id, leading.id] },
        );

        expect(returned.map((s) => s.id)).toEqual([memberA.id, memberB.id, leading.id]);

        const stored = await cleanupRaw.schema.findMany({
          where: { blockId: ctx.block.id },
          orderBy: { order: "asc" },
          select: { id: true, order: true, groupId: true },
        });

        expect(stored).toEqual([
          { id: memberA.id, order: 10, groupId: group.id },
          { id: memberB.id, order: 20, groupId: group.id },
          { id: leading.id, order: 30, groupId: null },
        ]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects a reorder that splits a group's members and leaves orders untouched", async () => {
      const ctx = await provisionBlock();
      const group = await cleanupRaw.schemaGroup.create({
        data: { blockId: ctx.block.id, label: null },
      });
      const memberA = await cleanupRaw.schema.create({
        data: { blockId: ctx.block.id, groupId: group.id, order: 10 },
      });
      const memberB = await cleanupRaw.schema.create({
        data: { blockId: ctx.block.id, groupId: group.id, order: 20 },
      });
      const plain = await cleanupRaw.schema.create({
        data: { blockId: ctx.block.id, order: 30 },
      });

      try {
        await expect(
          lmsSchemaApi.reorder(
            coach.user.id,
            activePlanId,
            { blockId: ctx.block.id },
            { orderedIds: [memberA.id, plain.id, memberB.id] },
          ),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.schema.findMany({
          where: { blockId: ctx.block.id },
          orderBy: { order: "asc" },
          select: { id: true, order: true },
        });

        expect(stored).toEqual([
          { id: memberA.id, order: 10 },
          { id: memberB.id, order: 20 },
          { id: plain.id, order: 30 },
        ]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when orderedIds is a subset of the block's schemas", async () => {
      const ctx = await provisionBlock();
      const a = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );
      const b = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );

      await lmsSchemaApi.create(coach.user.id, activePlanId, { blockId: ctx.block.id }, {});

      try {
        await expect(
          lmsSchemaApi.reorder(
            coach.user.id,
            activePlanId,
            { blockId: ctx.block.id },
            { orderedIds: [a.id, b.id] },
          ),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.schema.findMany({
          where: { blockId: ctx.block.id },
          orderBy: { order: "asc" },
          select: { order: true },
        });

        expect(stored.map((s) => s.order)).toEqual([10, 20, 30]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects ids that belong to a different block", async () => {
      const ctx = await provisionBlock();
      const otherCtx = await provisionBlock();
      const local = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );
      const foreign = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: otherCtx.block.id },
        {},
      );

      try {
        await expect(
          lmsSchemaApi.reorder(
            coach.user.id,
            activePlanId,
            { blockId: ctx.block.id },
            { orderedIds: [local.id, foreign.id] },
          ),
        ).rejects.toThrow(BadRequestError);

        const storedLocal = await cleanupRaw.schema.findUnique({ where: { id: local.id } });
        const storedForeign = await cleanupRaw.schema.findUnique({ where: { id: foreign.id } });

        expect(storedLocal?.order).toBe(10);
        expect(storedForeign?.order).toBe(10);
      } finally {
        await ctx.cleanup();
        await otherCtx.cleanup();
      }
    });

    it("rejects when orderedIds references a non-existent schema", async () => {
      const ctx = await provisionBlock();
      const a = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );

      try {
        await expect(
          lmsSchemaApi.reorder(
            coach.user.id,
            activePlanId,
            { blockId: ctx.block.id },
            { orderedIds: [a.id, "clz0000000000000000000000"] },
          ),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.schema.findUnique({ where: { id: a.id } });

        expect(stored?.order).toBe(10);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects duplicate ids in orderedIds at the server boundary (QA-Must-Test-37)", async () => {
      const ctx = await provisionBlock();
      const a = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );
      const b = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );
      const c = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );

      try {
        await expect(
          lmsSchemaApi.reorder(
            coach.user.id,
            activePlanId,
            { blockId: ctx.block.id },
            { orderedIds: [a.id, a.id, b.id] },
          ),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.schema.findMany({
          where: { blockId: ctx.block.id },
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

    it("two-pass UPDATE handles a full reverse without collision", async () => {
      const ctx = await provisionBlock();
      const created: { id: string }[] = [];

      for (let i = 0; i < 5; i += 1) {
        const s = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          {},
        );

        created.push({ id: s.id });
      }

      const reversed = [...created].reverse().map((s) => s.id);

      try {
        const returned = await lmsSchemaApi.reorder(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          { orderedIds: reversed },
        );

        expect(returned.map((s) => s.order)).toEqual([10, 20, 30, 40, 50]);
        expect(returned.map((s) => s.id)).toEqual(reversed);

        const stored = await cleanupRaw.schema.findMany({
          where: { blockId: ctx.block.id },
          orderBy: { order: "asc" },
          select: { id: true, order: true },
        });

        expect(stored).toEqual(reversed.map((id, i) => ({ id, order: (i + 1) * 10 })));
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe("cross-cutting", () => {
    it("rejects two block-level schemas sharing an order (full unique schemas_block_order, ex-DR-W2-8)", async () => {
      const ctx = await provisionBlock();

      try {
        await cleanupRaw.schema.create({
          data: { blockId: ctx.block.id, order: 10 },
        });

        await expect(
          cleanupRaw.schema.create({ data: { blockId: ctx.block.id, order: 10 } }),
        ).rejects.toMatchObject({ code: "P2002" });

        const stored = await cleanupRaw.schema.count({ where: { blockId: ctx.block.id } });

        expect(stored).toBe(1);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects a member sharing an order with an ungrouped schema (the unique spans the whole block)", async () => {
      const ctx = await provisionBlock();
      const group = await cleanupRaw.schemaGroup.create({
        data: { blockId: ctx.block.id, label: null },
      });

      try {
        const member = await cleanupRaw.schema.create({
          data: { blockId: ctx.block.id, groupId: group.id, order: 10 },
        });

        expect(member.groupId).toBe(group.id);

        await expect(
          cleanupRaw.schema.create({ data: { blockId: ctx.block.id, order: 10 } }),
        ).rejects.toMatchObject({ code: "P2002" });
      } finally {
        await ctx.cleanup();
      }
    });
  });
});
