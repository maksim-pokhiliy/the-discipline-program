import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import { cleanupRaw, createTestCoach, createTestPlan } from "../../../test/helpers";

import { lmsSchemaGroupApi } from "./admin";

describe("lmsSchemaGroupApi", () => {
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
      addSchema: async (order: number) =>
        cleanupRaw.schema.create({ data: { blockId: block.id, order } }),
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
        name: "SchemaGroup Test Archived Plan",
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

  describe("create — wrap existing contiguous schemas", () => {
    it("wraps a contiguous run, sets groupId on members, and returns { group, members }", async () => {
      const ctx = await provisionBlock();
      const schemaA = await ctx.addSchema(10);
      const schemaB = await ctx.addSchema(20);

      try {
        const result = await lmsSchemaGroupApi.create(coach.user.id, activePlanId, {
          blockId: ctx.block.id,
          schemaIds: [schemaA.id, schemaB.id],
          notes: ["parallel ladders"],
          interleaveOrder: "track_by_track",
        });

        expect(result.group.blockId).toBe(ctx.block.id);
        expect(result.group.notes).toEqual(["parallel ladders"]);
        expect(result.group.interleaveOrder).toBe("track_by_track");

        expect(result.members.map((m) => m.schema.id)).toEqual([schemaA.id, schemaB.id]);
        expect(result.members.map((m) => m.schema.order)).toEqual([10, 20]);
        expect(result.members.every((m) => m.schema.groupId === result.group.id)).toBe(true);

        const stored = await cleanupRaw.schema.findMany({
          where: { blockId: ctx.block.id },
          orderBy: { order: "asc" },
          select: { id: true, groupId: true },
        });

        expect(stored).toEqual([
          { id: schemaA.id, groupId: result.group.id },
          { id: schemaB.id, groupId: result.group.id },
        ]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("defaults interleaveOrder to round_by_round and notes to null when omitted", async () => {
      const ctx = await provisionBlock();
      const schemaA = await ctx.addSchema(10);
      const schemaB = await ctx.addSchema(20);

      try {
        const result = await lmsSchemaGroupApi.create(coach.user.id, activePlanId, {
          blockId: ctx.block.id,
          schemaIds: [schemaA.id, schemaB.id],
        });

        expect(result.group.notes).toBeNull();
        expect(result.group.interleaveOrder).toBe("round_by_round");
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects schemaIds already in a group and applies no new membership (W4R-001-SERVER)", async () => {
      const ctx = await provisionBlock();
      const schemaA = await ctx.addSchema(10);
      const schemaB = await ctx.addSchema(20);
      const schemaC = await ctx.addSchema(30);

      try {
        const existing = await lmsSchemaGroupApi.create(coach.user.id, activePlanId, {
          blockId: ctx.block.id,
          schemaIds: [schemaA.id, schemaB.id],
        });

        await expect(
          lmsSchemaGroupApi.create(coach.user.id, activePlanId, {
            blockId: ctx.block.id,
            schemaIds: [schemaB.id, schemaC.id],
          }),
        ).rejects.toThrow(BadRequestError);

        const storedB = await cleanupRaw.schema.findUnique({ where: { id: schemaB.id } });
        const storedC = await cleanupRaw.schema.findUnique({ where: { id: schemaC.id } });

        expect(storedB?.groupId).toBe(existing.group.id);
        expect(storedC?.groupId).toBeNull();

        const groupCount = await cleanupRaw.schemaGroup.count({ where: { blockId: ctx.block.id } });

        expect(groupCount).toBe(1);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects schemaIds from another block and applies no membership", async () => {
      const ctx = await provisionBlock();
      const other = await provisionBlock();
      const schemaA = await ctx.addSchema(10);
      const foreign = await other.addSchema(10);

      try {
        await expect(
          lmsSchemaGroupApi.create(coach.user.id, activePlanId, {
            blockId: ctx.block.id,
            schemaIds: [schemaA.id, foreign.id],
          }),
        ).rejects.toThrow(BadRequestError);

        const storedA = await cleanupRaw.schema.findUnique({ where: { id: schemaA.id } });
        const storedForeign = await cleanupRaw.schema.findUnique({ where: { id: foreign.id } });

        expect(storedA?.groupId).toBeNull();
        expect(storedForeign?.groupId).toBeNull();

        const groupCount = await cleanupRaw.schemaGroup.count({ where: { blockId: ctx.block.id } });

        expect(groupCount).toBe(0);
      } finally {
        await ctx.cleanup();
        await other.cleanup();
      }
    });

    it("rejects a non-existent schemaId and applies no membership", async () => {
      const ctx = await provisionBlock();
      const schemaA = await ctx.addSchema(10);

      try {
        await expect(
          lmsSchemaGroupApi.create(coach.user.id, activePlanId, {
            blockId: ctx.block.id,
            schemaIds: [schemaA.id, "clz0000000000000000000000"],
          }),
        ).rejects.toThrow(BadRequestError);

        const storedA = await cleanupRaw.schema.findUnique({ where: { id: schemaA.id } });

        expect(storedA?.groupId).toBeNull();

        const groupCount = await cleanupRaw.schemaGroup.count({ where: { blockId: ctx.block.id } });

        expect(groupCount).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects a non-contiguous selection and the contiguity throw rolls back the updateMany", async () => {
      const ctx = await provisionBlock();
      const schemaFirst = await ctx.addSchema(10);
      const schemaMiddle = await ctx.addSchema(20);
      const schemaLast = await ctx.addSchema(30);

      try {
        await expect(
          lmsSchemaGroupApi.create(coach.user.id, activePlanId, {
            blockId: ctx.block.id,
            schemaIds: [schemaFirst.id, schemaLast.id],
          }),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.schema.findMany({
          where: { blockId: ctx.block.id },
          orderBy: { order: "asc" },
          select: { id: true, groupId: true },
        });

        expect(stored).toEqual([
          { id: schemaFirst.id, groupId: null },
          { id: schemaMiddle.id, groupId: null },
          { id: schemaLast.id, groupId: null },
        ]);

        const groupCount = await cleanupRaw.schemaGroup.count({ where: { blockId: ctx.block.id } });

        expect(groupCount).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when caller does not own the plan and persists nothing", async () => {
      const ctx = await provisionBlock();
      const schemaA = await ctx.addSchema(10);
      const schemaB = await ctx.addSchema(20);

      try {
        await expect(
          lmsSchemaGroupApi.create(otherCoach.user.id, activePlanId, {
            blockId: ctx.block.id,
            schemaIds: [schemaA.id, schemaB.id],
          }),
        ).rejects.toThrow(ForbiddenError);

        const groupCount = await cleanupRaw.schemaGroup.count({ where: { blockId: ctx.block.id } });

        expect(groupCount).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when planId does not match the block's plan", async () => {
      const ctx = await provisionBlock();
      const otherPlan = await createTestPlan(coach.user.id, { status: "ACTIVE" });
      const schemaA = await ctx.addSchema(10);
      const schemaB = await ctx.addSchema(20);

      try {
        await expect(
          lmsSchemaGroupApi.create(coach.user.id, otherPlan.id, {
            blockId: ctx.block.id,
            schemaIds: [schemaA.id, schemaB.id],
          }),
        ).rejects.toThrow(NotFoundError);
      } finally {
        await ctx.cleanup();
        await cleanupRaw.trainingPlan.delete({ where: { id: otherPlan.id } }).catch(() => {});
      }
    });

    it("rejects on an archived plan and persists nothing", async () => {
      const ctx = await provisionBlock({ planId: archivedPlanId });
      const schemaA = await ctx.addSchema(10);
      const schemaB = await ctx.addSchema(20);

      try {
        await expect(
          lmsSchemaGroupApi.create(coach.user.id, archivedPlanId, {
            blockId: ctx.block.id,
            schemaIds: [schemaA.id, schemaB.id],
          }),
        ).rejects.toThrow(ForbiddenError);

        const groupCount = await cleanupRaw.schemaGroup.count({ where: { blockId: ctx.block.id } });

        expect(groupCount).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("concurrent create wrapping OVERLAPPING schemas — exactly one survivor claims the shared schema (QA-Must-5)", async () => {
      const ctx = await provisionBlock();
      const schemaA = await ctx.addSchema(10);
      const schemaShared = await ctx.addSchema(20);
      const schemaC = await ctx.addSchema(30);

      try {
        const results = await Promise.allSettled([
          lmsSchemaGroupApi.create(coach.user.id, activePlanId, {
            blockId: ctx.block.id,
            schemaIds: [schemaA.id, schemaShared.id],
          }),
          lmsSchemaGroupApi.create(coach.user.id, activePlanId, {
            blockId: ctx.block.id,
            schemaIds: [schemaShared.id, schemaC.id],
          }),
        ]);

        const fulfilled = results.filter((r) => r.status === "fulfilled").length;

        expect(fulfilled).toBeGreaterThanOrEqual(1);

        const sharedSchema = await cleanupRaw.schema.findUnique({
          where: { id: schemaShared.id },
          select: { groupId: true },
        });
        const claimedGroupId = sharedSchema?.groupId ?? null;

        expect(claimedGroupId).not.toBeNull();

        const groups = await cleanupRaw.schemaGroup.findMany({
          where: { blockId: ctx.block.id },
          select: { id: true },
        });
        const groupIds = new Set(groups.map((g) => g.id));

        expect(claimedGroupId !== null && groupIds.has(claimedGroupId)).toBe(true);

        const allSchemas = await cleanupRaw.schema.findMany({
          where: { blockId: ctx.block.id },
          orderBy: { order: "asc" },
          select: { groupId: true },
        });

        for (const group of groups) {
          const memberIndices = allSchemas
            .map((schema, index) => ({ index, groupId: schema.groupId }))
            .filter((schema) => schema.groupId === group.id)
            .map((schema) => schema.index);
          const span =
            memberIndices.length === 0
              ? 0
              : (memberIndices[memberIndices.length - 1] ?? 0) - (memberIndices[0] ?? 0) + 1;

          expect(span).toBe(memberIndices.length);
        }
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe("update", () => {
    const wrapTwo = async (ctx: Awaited<ReturnType<typeof provisionBlock>>, notes?: string[]) => {
      const schemaA = await ctx.addSchema(10);
      const schemaB = await ctx.addSchema(20);

      return lmsSchemaGroupApi.create(coach.user.id, activePlanId, {
        blockId: ctx.block.id,
        schemaIds: [schemaA.id, schemaB.id],
        ...(notes !== undefined && { notes }),
      });
    };

    it("updates the notes and interleaveOrder", async () => {
      const ctx = await provisionBlock();
      const created = await wrapTwo(ctx, ["before"]);

      try {
        const updated = await lmsSchemaGroupApi.update(coach.user.id, created.group.id, {
          notes: ["after"],
          interleaveOrder: "track_by_track",
        });

        expect(updated.notes).toEqual(["after"]);
        expect(updated.interleaveOrder).toBe("track_by_track");

        const stored = await cleanupRaw.schemaGroup.findUnique({ where: { id: created.group.id } });

        expect(stored?.notes).toEqual(["after"]);
        expect(stored?.interleaveOrder).toBe("track_by_track");
      } finally {
        await ctx.cleanup();
      }
    });

    it("clears the notes by writing null", async () => {
      const ctx = await provisionBlock();
      const created = await wrapTwo(ctx, ["before"]);

      try {
        const updated = await lmsSchemaGroupApi.update(coach.user.id, created.group.id, {
          notes: null,
        });

        expect(updated.notes).toBeNull();

        const stored = await cleanupRaw.schemaGroup.findUnique({ where: { id: created.group.id } });

        expect(stored?.notes).toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects a non-owner update", async () => {
      const ctx = await provisionBlock();
      const created = await wrapTwo(ctx, ["original"]);

      try {
        await expect(
          lmsSchemaGroupApi.update(otherCoach.user.id, created.group.id, { notes: ["tamper"] }),
        ).rejects.toThrow(ForbiddenError);

        const stored = await cleanupRaw.schemaGroup.findUnique({ where: { id: created.group.id } });

        expect(stored?.notes).toEqual(["original"]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects update on a non-existent group", async () => {
      await expect(
        lmsSchemaGroupApi.update(coach.user.id, "clz0000000000000000000000", { notes: ["x"] }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    const wrapTwo = async (ctx: Awaited<ReturnType<typeof provisionBlock>>) => {
      const schemaA = await ctx.addSchema(10);
      const schemaB = await ctx.addSchema(20);

      return lmsSchemaGroupApi.create(coach.user.id, activePlanId, {
        blockId: ctx.block.id,
        schemaIds: [schemaA.id, schemaB.id],
      });
    };

    it("deletes the group row and frees its members in place via SetNull (no member deletion)", async () => {
      const ctx = await provisionBlock();
      const created = await wrapTwo(ctx);
      const memberIds = created.members.map((m) => m.schema.id);

      try {
        await lmsSchemaGroupApi.delete(coach.user.id, created.group.id);

        const groupAfter = await cleanupRaw.schemaGroup.findUnique({
          where: { id: created.group.id },
        });

        expect(groupAfter).toBeNull();

        const survivors = await cleanupRaw.schema.findMany({
          where: { id: { in: memberIds } },
          orderBy: { order: "asc" },
          select: { id: true, blockId: true, groupId: true },
        });

        expect(survivors).toHaveLength(2);
        expect(survivors.every((s) => s.groupId === null)).toBe(true);
        expect(survivors.every((s) => s.blockId === ctx.block.id)).toBe(true);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects a non-owner delete and leaves the group intact", async () => {
      const ctx = await provisionBlock();
      const created = await wrapTwo(ctx);

      try {
        await expect(
          lmsSchemaGroupApi.delete(otherCoach.user.id, created.group.id),
        ).rejects.toThrow(ForbiddenError);

        const stored = await cleanupRaw.schemaGroup.findUnique({ where: { id: created.group.id } });

        expect(stored).not.toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects delete on a non-existent group", async () => {
      await expect(
        lmsSchemaGroupApi.delete(coach.user.id, "clz0000000000000000000000"),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
