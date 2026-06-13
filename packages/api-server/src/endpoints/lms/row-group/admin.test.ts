import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import { cleanupRaw, createTestCoach, createTestPlan } from "../../../test/helpers";

import { lmsRowGroupApi } from "./admin";

describe("lmsRowGroupApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;

  let activePlanId: string;
  let archivedPlanId: string;

  let exerciseId: string;

  let weekCounter = 0;

  const provisionSchema = async (options: { planId?: string } = {}) => {
    const planId = options.planId ?? activePlanId;

    weekCounter += 1;

    const startDate = new Date(Date.UTC(2026, 0, 1));

    startDate.setUTCDate(startDate.getUTCDate() + weekCounter * 7);

    const week = await cleanupRaw.week.create({ data: { planId, startDate } });
    const day = await cleanupRaw.day.create({
      data: { weekId: week.id, dayOfWeek: "WEDNESDAY" },
    });
    const session = await cleanupRaw.session.create({ data: { dayId: day.id, order: 10 } });
    const block = await cleanupRaw.block.create({ data: { sessionId: session.id, order: 10 } });
    const schema = await cleanupRaw.schema.create({ data: { blockId: block.id, order: 10 } });

    return {
      week,
      day,
      session,
      block,
      schema,
      cleanup: async () => {
        await cleanupRaw.schemaRow
          .deleteMany({ where: { schema: { blockId: block.id } } })
          .catch(() => {});
        await cleanupRaw.rowGroup
          .deleteMany({ where: { schema: { blockId: block.id } } })
          .catch(() => {});
        await cleanupRaw.schema.deleteMany({ where: { blockId: block.id } }).catch(() => {});
        await cleanupRaw.block.delete({ where: { id: block.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: session.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      },
    };
  };

  const addRow = async (schemaId: string, order: number) =>
    cleanupRaw.schemaRow.create({ data: { schemaId, order, exerciseId } });

  beforeAll(async () => {
    coach = await createTestCoach();
    otherCoach = await createTestCoach();

    const activePlan = await createTestPlan(coach.user.id, { status: "ACTIVE" });

    activePlanId = activePlan.id;

    const archivedPlan = await cleanupRaw.trainingPlan.create({
      data: {
        creatorId: coach.user.id,
        name: "RowGroup Test Archived Plan",
        status: "ARCHIVED",
      },
    });

    archivedPlanId = archivedPlan.id;

    const unique = crypto.randomUUID().slice(0, 8);
    const exercise = await cleanupRaw.exercise.create({
      data: {
        canonicalName: `RowGroup Test Exercise ${unique}`,
        canonicalNameLower: `rowgroup test exercise ${unique}`,
        primaryEquipment: "BARBELL",
        movementTypeTagPrimary: "SQUAT",
        canonicalCompoundType: "ATOMIC",
        placeholderFlag: false,
        defaultDemoUrls: [],
      },
    });

    exerciseId = exercise.id;
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
    await cleanupRaw.rowGroup
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

    await cleanupRaw.exercise.delete({ where: { id: exerciseId } }).catch(() => {});

    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: otherCoach.profile.id } }).catch(() => {});

    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: otherCoach.user.id } }).catch(() => {});
  });

  describe("create — wrap existing contiguous rows", () => {
    it("wraps a contiguous run, sets rowGroupId on members, and returns { group, members } (QA-#8, AC-2.4)", async () => {
      const ctx = await provisionSchema();
      const rowA = await addRow(ctx.schema.id, 10);
      const rowB = await addRow(ctx.schema.id, 20);

      try {
        const result = await lmsRowGroupApi.create(coach.user.id, activePlanId, {
          schemaId: ctx.schema.id,
          rowIds: [rowA.id, rowB.id],
          notes: ["OR"],
        });

        expect(result.group.schemaId).toBe(ctx.schema.id);
        expect(result.group.notes).toEqual(["OR"]);
        expect(result.members.map((m) => m.id)).toEqual([rowA.id, rowB.id]);
        expect(result.members.every((m) => m.rowGroupId === result.group.id)).toBe(true);

        const stored = await cleanupRaw.schemaRow.findMany({
          where: { schemaId: ctx.schema.id },
          orderBy: { order: "asc" },
          select: { id: true, rowGroupId: true },
        });

        expect(stored).toEqual([
          { id: rowA.id, rowGroupId: result.group.id },
          { id: rowB.id, rowGroupId: result.group.id },
        ]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("defaults notes to null when omitted", async () => {
      const ctx = await provisionSchema();
      const rowA = await addRow(ctx.schema.id, 10);
      const rowB = await addRow(ctx.schema.id, 20);

      try {
        const result = await lmsRowGroupApi.create(coach.user.id, activePlanId, {
          schemaId: ctx.schema.id,
          rowIds: [rowA.id, rowB.id],
        });

        expect(result.group.notes).toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects rowIds from another schema and applies no membership (QA-#8, AC-2.4)", async () => {
      const ctx = await provisionSchema();
      const other = await provisionSchema();
      const rowA = await addRow(ctx.schema.id, 10);
      const foreign = await addRow(other.schema.id, 10);

      try {
        await expect(
          lmsRowGroupApi.create(coach.user.id, activePlanId, {
            schemaId: ctx.schema.id,
            rowIds: [rowA.id, foreign.id],
          }),
        ).rejects.toThrow(BadRequestError);

        const storedA = await cleanupRaw.schemaRow.findUnique({ where: { id: rowA.id } });
        const storedForeign = await cleanupRaw.schemaRow.findUnique({ where: { id: foreign.id } });

        expect(storedA?.rowGroupId).toBeNull();
        expect(storedForeign?.rowGroupId).toBeNull();

        const groupCount = await cleanupRaw.rowGroup.count({ where: { schemaId: ctx.schema.id } });

        expect(groupCount).toBe(0);
      } finally {
        await ctx.cleanup();
        await other.cleanup();
      }
    });

    it("rejects a non-existent rowId and applies no membership (QA-#8)", async () => {
      const ctx = await provisionSchema();
      const rowA = await addRow(ctx.schema.id, 10);

      try {
        await expect(
          lmsRowGroupApi.create(coach.user.id, activePlanId, {
            schemaId: ctx.schema.id,
            rowIds: [rowA.id, "clz0000000000000000000000"],
          }),
        ).rejects.toThrow(BadRequestError);

        const storedA = await cleanupRaw.schemaRow.findUnique({ where: { id: rowA.id } });

        expect(storedA?.rowGroupId).toBeNull();

        const groupCount = await cleanupRaw.rowGroup.count({ where: { schemaId: ctx.schema.id } });

        expect(groupCount).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects a non-contiguous run and the contiguity throw rolls back the updateMany (QA-#8, AC-2.4)", async () => {
      const ctx = await provisionSchema();
      const rowFirst = await addRow(ctx.schema.id, 10);
      const rowMiddle = await addRow(ctx.schema.id, 20);
      const rowLast = await addRow(ctx.schema.id, 30);

      try {
        await expect(
          lmsRowGroupApi.create(coach.user.id, activePlanId, {
            schemaId: ctx.schema.id,
            rowIds: [rowFirst.id, rowLast.id],
          }),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.schemaRow.findMany({
          where: { schemaId: ctx.schema.id },
          orderBy: { order: "asc" },
          select: { id: true, rowGroupId: true },
        });

        expect(stored).toEqual([
          { id: rowFirst.id, rowGroupId: null },
          { id: rowMiddle.id, rowGroupId: null },
          { id: rowLast.id, rowGroupId: null },
        ]);

        const groupCount = await cleanupRaw.rowGroup.count({ where: { schemaId: ctx.schema.id } });

        expect(groupCount).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when caller does not own the schema's plan (QA-#14)", async () => {
      const ctx = await provisionSchema();
      const rowA = await addRow(ctx.schema.id, 10);
      const rowB = await addRow(ctx.schema.id, 20);

      try {
        await expect(
          lmsRowGroupApi.create(otherCoach.user.id, activePlanId, {
            schemaId: ctx.schema.id,
            rowIds: [rowA.id, rowB.id],
          }),
        ).rejects.toThrow(ForbiddenError);

        const groupCount = await cleanupRaw.rowGroup.count({ where: { schemaId: ctx.schema.id } });

        expect(groupCount).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when planId does not match the schema's plan (QA-#14)", async () => {
      const ctx = await provisionSchema();
      const otherPlan = await createTestPlan(coach.user.id, { status: "ACTIVE" });
      const rowA = await addRow(ctx.schema.id, 10);
      const rowB = await addRow(ctx.schema.id, 20);

      try {
        await expect(
          lmsRowGroupApi.create(coach.user.id, otherPlan.id, {
            schemaId: ctx.schema.id,
            rowIds: [rowA.id, rowB.id],
          }),
        ).rejects.toThrow(NotFoundError);
      } finally {
        await ctx.cleanup();
        await cleanupRaw.trainingPlan.delete({ where: { id: otherPlan.id } }).catch(() => {});
      }
    });

    it("rejects on an archived plan and persists nothing", async () => {
      const ctx = await provisionSchema({ planId: archivedPlanId });
      const rowA = await addRow(ctx.schema.id, 10);
      const rowB = await addRow(ctx.schema.id, 20);

      try {
        await expect(
          lmsRowGroupApi.create(coach.user.id, archivedPlanId, {
            schemaId: ctx.schema.id,
            rowIds: [rowA.id, rowB.id],
          }),
        ).rejects.toThrow(ForbiddenError);

        const groupCount = await cleanupRaw.rowGroup.count({ where: { schemaId: ctx.schema.id } });

        expect(groupCount).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("concurrent create wrapping OVERLAPPING rows — exactly one survivor claims the shared row, no double-membership (QA-#7)", async () => {
      const ctx = await provisionSchema();
      const rowA = await addRow(ctx.schema.id, 10);
      const rowShared = await addRow(ctx.schema.id, 20);
      const rowC = await addRow(ctx.schema.id, 30);

      try {
        const results = await Promise.allSettled([
          lmsRowGroupApi.create(coach.user.id, activePlanId, {
            schemaId: ctx.schema.id,
            rowIds: [rowA.id, rowShared.id],
          }),
          lmsRowGroupApi.create(coach.user.id, activePlanId, {
            schemaId: ctx.schema.id,
            rowIds: [rowShared.id, rowC.id],
          }),
        ]);

        const fulfilled = results.filter((r) => r.status === "fulfilled").length;

        expect(fulfilled).toBeGreaterThanOrEqual(1);

        const sharedRow = await cleanupRaw.schemaRow.findUnique({
          where: { id: rowShared.id },
          select: { rowGroupId: true },
        });
        const claimedGroupId = sharedRow?.rowGroupId ?? null;

        expect(claimedGroupId).not.toBeNull();

        const groups = await cleanupRaw.rowGroup.findMany({
          where: { schemaId: ctx.schema.id },
          select: { id: true },
        });
        const groupIds = new Set(groups.map((g) => g.id));

        expect(claimedGroupId !== null && groupIds.has(claimedGroupId)).toBe(true);

        const allRows = await cleanupRaw.schemaRow.findMany({
          where: { schemaId: ctx.schema.id },
          orderBy: { order: "asc" },
          select: { rowGroupId: true },
        });

        for (const group of groups) {
          const memberIndices = allRows
            .map((row, index) => ({ index, rowGroupId: row.rowGroupId }))
            .filter((row) => row.rowGroupId === group.id)
            .map((row) => row.index);
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

  describe("update — notes", () => {
    it("updates the notes list", async () => {
      const ctx = await provisionSchema();
      const rowA = await addRow(ctx.schema.id, 10);
      const rowB = await addRow(ctx.schema.id, 20);
      const created = await lmsRowGroupApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        rowIds: [rowA.id, rowB.id],
        notes: ["before"],
      });

      try {
        const updated = await lmsRowGroupApi.update(coach.user.id, created.group.id, {
          notes: ["after"],
        });

        expect(updated.notes).toEqual(["after"]);

        const stored = await cleanupRaw.rowGroup.findUnique({ where: { id: created.group.id } });

        expect(stored?.notes).toEqual(["after"]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("clears the notes by writing null", async () => {
      const ctx = await provisionSchema();
      const rowA = await addRow(ctx.schema.id, 10);
      const rowB = await addRow(ctx.schema.id, 20);
      const created = await lmsRowGroupApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        rowIds: [rowA.id, rowB.id],
        notes: ["before"],
      });

      try {
        const updated = await lmsRowGroupApi.update(coach.user.id, created.group.id, {
          notes: null,
        });

        expect(updated.notes).toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects a non-owner update and leaves notes intact (QA-#14)", async () => {
      const ctx = await provisionSchema();
      const rowA = await addRow(ctx.schema.id, 10);
      const rowB = await addRow(ctx.schema.id, 20);
      const created = await lmsRowGroupApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        rowIds: [rowA.id, rowB.id],
        notes: ["original"],
      });

      try {
        await expect(
          lmsRowGroupApi.update(otherCoach.user.id, created.group.id, { notes: ["tamper"] }),
        ).rejects.toThrow(ForbiddenError);

        const stored = await cleanupRaw.rowGroup.findUnique({ where: { id: created.group.id } });

        expect(stored?.notes).toEqual(["original"]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects an update on a non-existent group", async () => {
      await expect(
        lmsRowGroupApi.update(coach.user.id, "clz0000000000000000000000", { notes: ["x"] }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete — dissolve", () => {
    it("dissolves: members survive with rowGroupId=null and original order, the group is gone (QA-#9, AC-2.5)", async () => {
      const ctx = await provisionSchema();
      const rowA = await addRow(ctx.schema.id, 10);
      const rowB = await addRow(ctx.schema.id, 20);
      const created = await lmsRowGroupApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        rowIds: [rowA.id, rowB.id],
      });

      try {
        await lmsRowGroupApi.delete(coach.user.id, created.group.id);

        const groupAfter = await cleanupRaw.rowGroup.findUnique({
          where: { id: created.group.id },
        });

        expect(groupAfter).toBeNull();

        const survivors = await cleanupRaw.schemaRow.findMany({
          where: { id: { in: [rowA.id, rowB.id] } },
          orderBy: { order: "asc" },
          select: { id: true, rowGroupId: true, order: true },
        });

        expect(survivors).toEqual([
          { id: rowA.id, rowGroupId: null, order: 10 },
          { id: rowB.id, rowGroupId: null, order: 20 },
        ]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects a non-owner delete and leaves the group intact (QA-#14)", async () => {
      const ctx = await provisionSchema();
      const rowA = await addRow(ctx.schema.id, 10);
      const rowB = await addRow(ctx.schema.id, 20);
      const created = await lmsRowGroupApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        rowIds: [rowA.id, rowB.id],
      });

      try {
        await expect(lmsRowGroupApi.delete(otherCoach.user.id, created.group.id)).rejects.toThrow(
          ForbiddenError,
        );

        const stored = await cleanupRaw.rowGroup.findUnique({ where: { id: created.group.id } });

        expect(stored).not.toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects delete on a non-existent group", async () => {
      await expect(
        lmsRowGroupApi.delete(coach.user.id, "clz0000000000000000000000"),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
