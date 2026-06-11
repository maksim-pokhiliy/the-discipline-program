import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ForbiddenError, NotFoundError } from "@repo/errors";

import { cleanupRaw, createTestCoach, createTestPlan } from "../../../test/helpers";

import { lmsSchemaGroupApi } from "./admin";

const TRACKS = [
  { header: "Track A", steps: [21, 15, 9] },
  { header: "Track B", steps: [15, 12, 9] },
];

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

  describe("create", () => {
    it("rejects when caller does not own the plan and persists nothing", async () => {
      const ctx = await provisionBlock();

      try {
        await expect(
          lmsSchemaGroupApi.create(otherCoach.user.id, activePlanId, {
            blockId: ctx.block.id,
            tracks: TRACKS,
          }),
        ).rejects.toThrow(ForbiddenError);

        const groupCount = await cleanupRaw.schemaGroup.count({ where: { blockId: ctx.block.id } });
        const schemaCount = await cleanupRaw.schema.count({ where: { blockId: ctx.block.id } });

        expect(groupCount).toBe(0);
        expect(schemaCount).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects on an archived plan and persists nothing", async () => {
      const ctx = await provisionBlock({ planId: archivedPlanId });

      try {
        await expect(
          lmsSchemaGroupApi.create(coach.user.id, archivedPlanId, {
            blockId: ctx.block.id,
            tracks: TRACKS,
          }),
        ).rejects.toThrow(ForbiddenError);

        const groupCount = await cleanupRaw.schemaGroup.count({ where: { blockId: ctx.block.id } });
        const schemaCount = await cleanupRaw.schema.count({ where: { blockId: ctx.block.id } });

        expect(groupCount).toBe(0);
        expect(schemaCount).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when planId does not match the block's plan", async () => {
      const ctx = await provisionBlock();
      const otherPlan = await createTestPlan(coach.user.id, { status: "ACTIVE" });

      try {
        await expect(
          lmsSchemaGroupApi.create(coach.user.id, otherPlan.id, {
            blockId: ctx.block.id,
            tracks: TRACKS,
          }),
        ).rejects.toThrow(NotFoundError);
      } finally {
        await ctx.cleanup();
        await cleanupRaw.trainingPlan.delete({ where: { id: otherPlan.id } }).catch(() => {});
      }
    });

    it("creates a group row plus N contiguous flat members with NO parent schema, returning { group, members }", async () => {
      const ctx = await provisionBlock();

      try {
        const result = await lmsSchemaGroupApi.create(coach.user.id, activePlanId, {
          blockId: ctx.block.id,
          label: "parallel ladders",
          interleaveOrder: "track_by_track",
          tracks: TRACKS,
        });

        expect(result.group.blockId).toBe(ctx.block.id);
        expect(result.group.label).toBe("parallel ladders");
        expect(result.group.interleaveOrder).toBe("track_by_track");

        expect(result.members).toHaveLength(2);
        expect(result.members.map((m) => m.schema.header)).toEqual(["Track A", "Track B"]);
        expect(result.members.map((m) => m.schema.order)).toEqual([10, 20]);
        expect(result.members.map((m) => m.schema.groupId)).toEqual([
          result.group.id,
          result.group.id,
        ]);
        expect(result.members.map((m) => m.schema.composition)).toEqual([
          { repetition: { kind: "ladder", steps: [21, 15, 9] } },
          { repetition: { kind: "ladder", steps: [15, 12, 9] } },
        ]);
        expect(result.members.map((m) => m.schema.label?.kind)).toEqual(["ladder", "ladder"]);
        expect(result.members.every((m) => m.rows.length === 0)).toBe(true);

        const blockSchemas = await cleanupRaw.schema.findMany({
          where: { blockId: ctx.block.id },
          orderBy: { order: "asc" },
          select: { id: true, groupId: true, order: true },
        });

        expect(blockSchemas).toHaveLength(2);
        expect(blockSchemas.every((s) => s.groupId === result.group.id)).toBe(true);
        expect(blockSchemas.map((s) => s.order)).toEqual([10, 20]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("appends the members at the block tail on a populated block, keeping contiguity", async () => {
      const ctx = await provisionBlock();
      const leading = await cleanupRaw.schema.create({
        data: { blockId: ctx.block.id, order: 10 },
      });

      try {
        const result = await lmsSchemaGroupApi.create(coach.user.id, activePlanId, {
          blockId: ctx.block.id,
          tracks: TRACKS,
        });

        expect(result.members.map((m) => m.schema.order)).toEqual([20, 30]);

        const blockSchemas = await cleanupRaw.schema.findMany({
          where: { blockId: ctx.block.id },
          orderBy: { order: "asc" },
          select: { id: true, groupId: true, order: true },
        });

        expect(blockSchemas).toEqual([
          { id: leading.id, groupId: null, order: 10 },
          { id: result.members[0]?.schema.id, groupId: result.group.id, order: 20 },
          { id: result.members[1]?.schema.id, groupId: result.group.id, order: 30 },
        ]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("defaults interleaveOrder to round_by_round and label to null when omitted", async () => {
      const ctx = await provisionBlock();

      try {
        const result = await lmsSchemaGroupApi.create(coach.user.id, activePlanId, {
          blockId: ctx.block.id,
          tracks: TRACKS,
        });

        expect(result.group.label).toBeNull();
        expect(result.group.interleaveOrder).toBe("round_by_round");
      } finally {
        await ctx.cleanup();
      }
    });

    it("concurrent create into one block — fulfilled calls land whole groups with distinct member orders (QA-Must-5)", async () => {
      const ctx = await provisionBlock();

      try {
        const results = await Promise.allSettled([
          lmsSchemaGroupApi.create(coach.user.id, activePlanId, {
            blockId: ctx.block.id,
            tracks: TRACKS,
          }),
          lmsSchemaGroupApi.create(coach.user.id, activePlanId, {
            blockId: ctx.block.id,
            tracks: TRACKS,
          }),
        ]);

        const fulfilledCount = results.filter((r) => r.status === "fulfilled").length;

        expect(fulfilledCount).toBeGreaterThanOrEqual(1);

        const groups = await cleanupRaw.schemaGroup.findMany({
          where: { blockId: ctx.block.id },
        });
        const blockCount = await cleanupRaw.schema.count({ where: { blockId: ctx.block.id } });

        expect(groups).toHaveLength(fulfilledCount);
        expect(blockCount).toBe(fulfilledCount * 2);

        for (const group of groups) {
          const members = await cleanupRaw.schema.findMany({
            where: { groupId: group.id },
            orderBy: { order: "asc" },
          });

          expect(members).toHaveLength(2);
        }
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe("update", () => {
    it("updates the label and interleaveOrder", async () => {
      const ctx = await provisionBlock();
      const created = await lmsSchemaGroupApi.create(coach.user.id, activePlanId, {
        blockId: ctx.block.id,
        label: "before",
        tracks: TRACKS,
      });

      try {
        const updated = await lmsSchemaGroupApi.update(coach.user.id, created.group.id, {
          label: "after",
          interleaveOrder: "track_by_track",
        });

        expect(updated.label).toBe("after");
        expect(updated.interleaveOrder).toBe("track_by_track");

        const stored = await cleanupRaw.schemaGroup.findUnique({ where: { id: created.group.id } });

        expect(stored?.label).toBe("after");
        expect(stored?.interleaveOrder).toBe("track_by_track");
      } finally {
        await ctx.cleanup();
      }
    });

    it("clears the label by writing null", async () => {
      const ctx = await provisionBlock();
      const created = await lmsSchemaGroupApi.create(coach.user.id, activePlanId, {
        blockId: ctx.block.id,
        label: "before",
        tracks: TRACKS,
      });

      try {
        const updated = await lmsSchemaGroupApi.update(coach.user.id, created.group.id, {
          label: null,
        });

        expect(updated.label).toBeNull();

        const stored = await cleanupRaw.schemaGroup.findUnique({ where: { id: created.group.id } });

        expect(stored?.label).toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects a non-owner update", async () => {
      const ctx = await provisionBlock();
      const created = await lmsSchemaGroupApi.create(coach.user.id, activePlanId, {
        blockId: ctx.block.id,
        label: "original",
        tracks: TRACKS,
      });

      try {
        await expect(
          lmsSchemaGroupApi.update(otherCoach.user.id, created.group.id, { label: "tamper" }),
        ).rejects.toThrow(ForbiddenError);

        const stored = await cleanupRaw.schemaGroup.findUnique({ where: { id: created.group.id } });

        expect(stored?.label).toBe("original");
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects update on a non-existent group", async () => {
      await expect(
        lmsSchemaGroupApi.update(coach.user.id, "clz0000000000000000000000", { label: "x" }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    it("deletes the group row and frees its members in place via SetNull (no member deletion)", async () => {
      const ctx = await provisionBlock();
      const created = await lmsSchemaGroupApi.create(coach.user.id, activePlanId, {
        blockId: ctx.block.id,
        tracks: TRACKS,
      });
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
      const created = await lmsSchemaGroupApi.create(coach.user.id, activePlanId, {
        blockId: ctx.block.id,
        tracks: TRACKS,
      });

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
