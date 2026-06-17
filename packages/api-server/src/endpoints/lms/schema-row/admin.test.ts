import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { reorderSchemaRowsSchema } from "@repo/contracts/lms/schema-row";
import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import { cleanupRaw, createTestCoach, createTestPlan } from "../../../test/helpers";

import { lmsSchemaRowApi } from "./admin";

describe("lmsSchemaRowApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;

  let activePlanId: string;
  let archivedPlanId: string;

  let exerciseAId: string;
  let exerciseBId: string;

  let modifierAId: string;
  let modifierBId: string;

  let weekCounter = 0;

  const provisionBlock = async (options: { planId?: string | undefined } = {}) => {
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
        await cleanupRaw.performedExerciseInstance
          .deleteMany({ where: { plannedSchemaRow: { schema: { blockId: block.id } } } })
          .catch(() => {});
        await cleanupRaw.performedSession
          .deleteMany({ where: { sessionId: session.id } })
          .catch(() => {});
        await cleanupRaw.schemaRow
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

  const provisionSchema = async (options: { planId?: string } = {}) => {
    const blockCtx = await provisionBlock({ planId: options.planId });

    const schema = await cleanupRaw.schema.create({
      data: {
        blockId: blockCtx.block.id,
        order: 10,
      },
    });

    return {
      ...blockCtx,
      schema,
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
        name: "SchemaRow Test Archived Plan",
        status: "ARCHIVED",
      },
    });

    archivedPlanId = archivedPlan.id;

    const uniqueA = crypto.randomUUID().slice(0, 8);
    const uniqueB = crypto.randomUUID().slice(0, 8);

    const exerciseA = await cleanupRaw.exercise.create({
      data: {
        canonicalName: `SchemaRow Test Exercise A ${uniqueA}`,
        canonicalNameLower: `schemarow test exercise a ${uniqueA}`,
        nature: "CONCRETE",
        defaultDemoUrls: [],
      },
    });

    exerciseAId = exerciseA.id;

    const exerciseB = await cleanupRaw.exercise.create({
      data: {
        canonicalName: `SchemaRow Test Exercise B ${uniqueB}`,
        canonicalNameLower: `schemarow test exercise b ${uniqueB}`,
        nature: "CONCRETE",
        defaultDemoUrls: [],
      },
    });

    exerciseBId = exerciseB.id;

    const modifierA = await cleanupRaw.modifier.create({
      data: {
        name: `SchemaRow Modifier A ${uniqueA}`,
        nameLower: `schemarow modifier a ${uniqueA}`,
      },
    });

    modifierAId = modifierA.id;

    const modifierB = await cleanupRaw.modifier.create({
      data: {
        name: `SchemaRow Modifier B ${uniqueB}`,
        nameLower: `schemarow modifier b ${uniqueB}`,
      },
    });

    modifierBId = modifierB.id;
  });

  afterAll(async () => {
    await cleanupRaw.performedExerciseInstance
      .deleteMany({
        where: {
          plannedSchemaRow: {
            schema: {
              block: {
                session: { day: { week: { planId: { in: [activePlanId, archivedPlanId] } } } },
              },
            },
          },
        },
      })
      .catch(() => {});
    await cleanupRaw.performedSession
      .deleteMany({
        where: {
          session: { day: { week: { planId: { in: [activePlanId, archivedPlanId] } } } },
        },
      })
      .catch(() => {});
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

    await cleanupRaw.modifier.delete({ where: { id: modifierAId } }).catch(() => {});
    await cleanupRaw.modifier.delete({ where: { id: modifierBId } }).catch(() => {});

    await cleanupRaw.exercise.delete({ where: { id: exerciseAId } }).catch(() => {});
    await cleanupRaw.exercise.delete({ where: { id: exerciseBId } }).catch(() => {});

    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: otherCoach.profile.id } }).catch(() => {});

    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: otherCoach.user.id } }).catch(() => {});
  });

  describe("create", () => {
    it("creates an exercise row with the exerciseId promoted to a column", async () => {
      const ctx = await provisionSchema();

      try {
        const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
          schemaId: ctx.schema.id,
          exerciseId: exerciseAId,
        });

        expect(created.schemaId).toBe(ctx.schema.id);
        expect(created.order).toBe(10);
        expect(created.exerciseId).toBe(exerciseAId);
        expect(created.sets).toBeNull();
        expect(created.rowGroupId).toBeNull();
        expect(created.load).toBeNull();
        expect(created.modifiers).toEqual([]);
        expect(created.notes).toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("persists sets, notes, and an ordered modifier set", async () => {
      const ctx = await provisionSchema();

      try {
        const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
          schemaId: ctx.schema.id,
          exerciseId: exerciseAId,
          sets: 3,
          notes: ["tempo controlled"],
          modifierIds: [modifierBId, modifierAId],
        });

        expect(created.sets).toBe(3);
        expect(created.notes).toEqual(["tempo controlled"]);
        expect(created.modifiers.map((m) => m.id)).toEqual([modifierBId, modifierAId]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("persists a row intensity value object", async () => {
      const ctx = await provisionSchema();

      try {
        const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
          schemaId: ctx.schema.id,
          exerciseId: exerciseAId,
          intensity: { rpe: { value: 8 } },
        });

        expect(created.intensity).toEqual({ rpe: { value: 8 } });

        const stored = await cleanupRaw.schemaRow.findUnique({ where: { id: created.id } });

        expect(stored?.intensity).toEqual({ rpe: { value: 8 } });
      } finally {
        await ctx.cleanup();
      }
    });

    it("persists a row rest value object", async () => {
      const ctx = await provisionSchema();

      try {
        const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
          schemaId: ctx.schema.id,
          exerciseId: exerciseAId,
          rest: { duration: { value: 120, unit: "sec" }, scope: "between_sets" },
        });

        expect(created.rest).toEqual({
          duration: { value: 120, unit: "sec" },
          scope: "between_sets",
        });

        const stored = await cleanupRaw.schemaRow.findUnique({ where: { id: created.id } });

        expect(stored?.rest).toEqual({
          duration: { value: 120, unit: "sec" },
          scope: "between_sets",
        });
      } finally {
        await ctx.cleanup();
      }
    });

    it("leaves intensity and rest null when neither is supplied", async () => {
      const ctx = await provisionSchema();

      try {
        const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
          schemaId: ctx.schema.id,
          exerciseId: exerciseAId,
        });

        expect(created.intensity).toBeNull();
        expect(created.rest).toBeNull();

        const stored = await cleanupRaw.schemaRow.findUnique({ where: { id: created.id } });

        expect(stored?.intensity).toBeNull();
        expect(stored?.rest).toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when caller does not own the parent schema's plan", async () => {
      const ctx = await provisionSchema();

      try {
        await expect(
          lmsSchemaRowApi.create(otherCoach.user.id, activePlanId, {
            schemaId: ctx.schema.id,
            exerciseId: exerciseAId,
          }),
        ).rejects.toThrow(ForbiddenError);

        const count = await cleanupRaw.schemaRow.count({ where: { schemaId: ctx.schema.id } });

        expect(count).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when plan is ARCHIVED", async () => {
      const ctx = await provisionSchema({ planId: archivedPlanId });

      try {
        await expect(
          lmsSchemaRowApi.create(coach.user.id, archivedPlanId, {
            schemaId: ctx.schema.id,
            exerciseId: exerciseAId,
          }),
        ).rejects.toThrow(ForbiddenError);

        const count = await cleanupRaw.schemaRow.count({ where: { schemaId: ctx.schema.id } });

        expect(count).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when parent schema does not exist", async () => {
      await expect(
        lmsSchemaRowApi.create(coach.user.id, activePlanId, {
          schemaId: "clz0000000000000000000000",
          exerciseId: exerciseAId,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("rejects a non-existent modifierId on create (P2003) and persists no row (atomicity, QA-#11)", async () => {
      const ctx = await provisionSchema();

      try {
        await expect(
          lmsSchemaRowApi.create(coach.user.id, activePlanId, {
            schemaId: ctx.schema.id,
            exerciseId: exerciseAId,
            modifierIds: ["clz0000000000000000000000"],
          }),
        ).rejects.toThrow(BadRequestError);

        const rowCount = await cleanupRaw.schemaRow.count({ where: { schemaId: ctx.schema.id } });

        expect(rowCount).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects a dangling exerciseId on create (P2003) with the FK message and persists no row (QA-001)", async () => {
      const ctx = await provisionSchema();

      try {
        const error = await lmsSchemaRowApi
          .create(coach.user.id, activePlanId, {
            schemaId: ctx.schema.id,
            exerciseId: "clz0000000000000000000000",
          })
          .catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(BadRequestError);
        expect(error).toMatchObject({
          message: "Referenced exercise or modifier does not exist",
        });

        const rowCount = await cleanupRaw.schemaRow.count({ where: { schemaId: ctx.schema.id } });

        expect(rowCount).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    describe("flat write-guard fetch", () => {
      it("creates a row on a flat ladder schema — the guard validates the single flat container", async () => {
        const blockCtx = await provisionBlock();
        const schema = await cleanupRaw.schema.create({
          data: {
            blockId: blockCtx.block.id,
            order: 10,
            composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } },
          },
        });

        try {
          const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
            schemaId: schema.id,
            exerciseId: exerciseAId,
          });

          expect(created.schemaId).toBe(schema.id);

          const count = await cleanupRaw.schemaRow.count({ where: { schemaId: schema.id } });

          expect(count).toBe(1);
        } finally {
          await blockCtx.cleanup();
        }
      });

      it("creates a row on a group-member schema independent of its sibling members (flat guard, no subtree)", async () => {
        const blockCtx = await provisionBlock();
        const group = await cleanupRaw.schemaGroup.create({
          data: { blockId: blockCtx.block.id },
        });
        const memberA = await cleanupRaw.schema.create({
          data: {
            blockId: blockCtx.block.id,
            groupId: group.id,
            order: 10,
            composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } },
          },
        });

        await cleanupRaw.schema.create({
          data: {
            blockId: blockCtx.block.id,
            groupId: group.id,
            order: 20,
            composition: { repetition: { kind: "ladder", steps: [9, 15, 21] } },
          },
        });

        try {
          const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
            schemaId: memberA.id,
            exerciseId: exerciseAId,
          });

          expect(created.schemaId).toBe(memberA.id);

          const count = await cleanupRaw.schemaRow.count({ where: { schemaId: memberA.id } });

          expect(count).toBe(1);
        } finally {
          await blockCtx.cleanup();
        }
      });
    });
  });

  describe("update", () => {
    it("updates notes only, leaving other fields untouched", async () => {
      const ctx = await provisionSchema();
      const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        exerciseId: exerciseAId,
      });

      try {
        const updated = await lmsSchemaRowApi.update(coach.user.id, created.id, {
          notes: ["fresh notes"],
        });

        expect(updated.notes).toEqual(["fresh notes"]);
        expect(updated.exerciseId).toBe(exerciseAId);
      } finally {
        await ctx.cleanup();
      }
    });

    it("replaces the modifier set when modifierIds is provided", async () => {
      const ctx = await provisionSchema();
      const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        exerciseId: exerciseAId,
        modifierIds: [modifierAId],
      });

      try {
        const updated = await lmsSchemaRowApi.update(coach.user.id, created.id, {
          modifierIds: [modifierBId],
        });

        expect(updated.modifiers.map((m) => m.id)).toEqual([modifierBId]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("clears every assignment when modifierIds is [] (set-replace semantics, QA-#11)", async () => {
      const ctx = await provisionSchema();
      const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        exerciseId: exerciseAId,
        modifierIds: [modifierAId, modifierBId],
      });

      try {
        const updated = await lmsSchemaRowApi.update(coach.user.id, created.id, {
          modifierIds: [],
        });

        expect(updated.modifiers).toEqual([]);

        const assignmentCount = await cleanupRaw.rowModifierAssignment.count({
          where: { rowId: created.id },
        });

        expect(assignmentCount).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("leaves the existing assignment set untouched when modifierIds is omitted (QA-#11)", async () => {
      const ctx = await provisionSchema();
      const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        exerciseId: exerciseAId,
        modifierIds: [modifierAId],
      });

      try {
        const updated = await lmsSchemaRowApi.update(coach.user.id, created.id, { sets: 4 });

        expect(updated.modifiers.map((m) => m.id)).toEqual([modifierAId]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects a non-existent modifierId (P2003) and rolls back the assignment clear AND the column write (atomicity, QA-#11)", async () => {
      const ctx = await provisionSchema();
      const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        exerciseId: exerciseAId,
        sets: 3,
        modifierIds: [modifierAId],
      });

      try {
        await expect(
          lmsSchemaRowApi.update(coach.user.id, created.id, {
            sets: 9,
            modifierIds: ["clz0000000000000000000000"],
          }),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.schemaRow.findUnique({ where: { id: created.id } });

        expect(stored?.sets).toBe(3);

        const assignments = await cleanupRaw.rowModifierAssignment.findMany({
          where: { rowId: created.id },
          select: { modifierId: true },
        });

        expect(assignments.map((a) => a.modifierId)).toEqual([modifierAId]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("updates flat scalar (load) from null to populated", async () => {
      const ctx = await provisionSchema();
      const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        exerciseId: exerciseAId,
      });

      try {
        const updated = await lmsSchemaRowApi.update(coach.user.id, created.id, {
          load: { kind: "absolute", count: 1, kg: 80 },
        });

        expect(updated.load).toEqual({ kind: "absolute", count: 1, kg: 80 });
      } finally {
        await ctx.cleanup();
      }
    });

    it("updates intensity from null to populated", async () => {
      const ctx = await provisionSchema();
      const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        exerciseId: exerciseAId,
      });

      try {
        const updated = await lmsSchemaRowApi.update(coach.user.id, created.id, {
          intensity: { effortPercent: { value: 75 } },
        });

        expect(updated.intensity).toEqual({ effortPercent: { value: 75 } });

        const stored = await cleanupRaw.schemaRow.findUnique({ where: { id: created.id } });

        expect(stored?.intensity).toEqual({ effortPercent: { value: 75 } });
      } finally {
        await ctx.cleanup();
      }
    });

    it("updates rest while leaving an existing intensity untouched (conditional spread)", async () => {
      const ctx = await provisionSchema();
      const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        exerciseId: exerciseAId,
        intensity: { rpe: { value: 8 } },
      });

      try {
        const updated = await lmsSchemaRowApi.update(coach.user.id, created.id, {
          rest: { duration: { value: 90, unit: "sec" }, scope: "between_sets" },
        });

        expect(updated.rest).toEqual({
          duration: { value: 90, unit: "sec" },
          scope: "between_sets",
        });
        expect(updated.intensity).toEqual({ rpe: { value: 8 } });

        const stored = await cleanupRaw.schemaRow.findUnique({ where: { id: created.id } });

        expect(stored?.rest).toEqual({
          duration: { value: 90, unit: "sec" },
          scope: "between_sets",
        });
        expect(stored?.intensity).toEqual({ rpe: { value: 8 } });
      } finally {
        await ctx.cleanup();
      }
    });

    it("clears intensity and rest by writing JSON null on explicit null", async () => {
      const ctx = await provisionSchema();
      const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        exerciseId: exerciseAId,
        intensity: { rpe: { value: 8 } },
        rest: { duration: { value: 120, unit: "sec" }, scope: "between_sets" },
      });

      try {
        const updated = await lmsSchemaRowApi.update(coach.user.id, created.id, {
          intensity: null,
          rest: null,
        });

        expect(updated.intensity).toBeNull();
        expect(updated.rest).toBeNull();

        const stored = await cleanupRaw.schemaRow.findUnique({ where: { id: created.id } });

        expect(stored?.intensity).toBeNull();
        expect(stored?.rest).toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("updates sets independently", async () => {
      const ctx = await provisionSchema();
      const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        exerciseId: exerciseAId,
      });

      try {
        const updated = await lmsSchemaRowApi.update(coach.user.id, created.id, { sets: 5 });

        expect(updated.sets).toBe(5);
        expect(updated.exerciseId).toBe(exerciseAId);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects update from a non-owner", async () => {
      const ctx = await provisionSchema();
      const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        exerciseId: exerciseAId,
      });

      try {
        await expect(
          lmsSchemaRowApi.update(otherCoach.user.id, created.id, { sets: 2 }),
        ).rejects.toThrow(ForbiddenError);

        const stored = await cleanupRaw.schemaRow.findUnique({ where: { id: created.id } });

        expect(stored?.sets).toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe("delete", () => {
    it("removes the owned SchemaRow", async () => {
      const ctx = await provisionSchema();
      const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        exerciseId: exerciseAId,
      });

      try {
        await lmsSchemaRowApi.delete(coach.user.id, created.id);

        const after = await cleanupRaw.schemaRow.findUnique({ where: { id: created.id } });

        expect(after).toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects delete from non-owner", async () => {
      const ctx = await provisionSchema();
      const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        exerciseId: exerciseAId,
      });

      try {
        await expect(lmsSchemaRowApi.delete(otherCoach.user.id, created.id)).rejects.toThrow(
          ForbiddenError,
        );

        const stored = await cleanupRaw.schemaRow.findUnique({ where: { id: created.id } });

        expect(stored).not.toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe("reorder", () => {
    it("renumbers three rows on the happy path", async () => {
      const ctx = await provisionSchema();
      const a = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        exerciseId: exerciseAId,
      });
      const b = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        exerciseId: exerciseAId,
      });
      const c = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        exerciseId: exerciseAId,
      });

      try {
        const returned = await lmsSchemaRowApi.reorder(coach.user.id, activePlanId, ctx.schema.id, {
          orderedIds: [c.id, a.id, b.id],
        });

        expect(returned.map((r) => ({ id: r.id, order: r.order }))).toEqual([
          { id: c.id, order: 10 },
          { id: a.id, order: 20 },
          { id: b.id, order: 30 },
        ]);

        const stored = await cleanupRaw.schemaRow.findMany({
          where: { schemaId: ctx.schema.id },
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

    it("rejects when orderedIds references a non-existent row", async () => {
      const ctx = await provisionSchema();
      const a = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        exerciseId: exerciseAId,
      });

      try {
        await expect(
          lmsSchemaRowApi.reorder(coach.user.id, activePlanId, ctx.schema.id, {
            orderedIds: [a.id, "clz0000000000000000000000"],
          }),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.schemaRow.findUnique({ where: { id: a.id } });

        expect(stored?.order).toBe(10);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when orderedIds contains a row from a different schema", async () => {
      const ctxA = await provisionSchema();
      const ctxB = await provisionSchema();
      const a = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctxA.schema.id,
        exerciseId: exerciseAId,
      });
      const foreign = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctxB.schema.id,
        exerciseId: exerciseAId,
      });

      try {
        await expect(
          lmsSchemaRowApi.reorder(coach.user.id, activePlanId, ctxA.schema.id, {
            orderedIds: [a.id, foreign.id],
          }),
        ).rejects.toThrow(BadRequestError);

        const storedA = await cleanupRaw.schemaRow.findUnique({ where: { id: a.id } });
        const storedForeign = await cleanupRaw.schemaRow.findUnique({ where: { id: foreign.id } });

        expect(storedA?.order).toBe(10);
        expect(storedForeign?.order).toBe(10);
      } finally {
        await ctxA.cleanup();
        await ctxB.cleanup();
      }
    });

    it("rejects when orderedIds is a subset of the target schema's rows", async () => {
      const ctx = await provisionSchema();
      const a = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        exerciseId: exerciseAId,
      });
      const b = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        exerciseId: exerciseAId,
      });

      await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        exerciseId: exerciseAId,
      });

      try {
        await expect(
          lmsSchemaRowApi.reorder(coach.user.id, activePlanId, ctx.schema.id, {
            orderedIds: [a.id, b.id],
          }),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.schemaRow.findMany({
          where: { schemaId: ctx.schema.id },
          orderBy: { order: "asc" },
          select: { order: true },
        });

        expect(stored.map((r) => r.order)).toEqual([10, 20, 30]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects duplicate ids in orderedIds at the contract boundary", () => {
      expect(() =>
        reorderSchemaRowsSchema.parse({
          orderedIds: ["clz0000000000000000000001", "clz0000000000000000000001"],
        }),
      ).toThrow();
    });

    it("rejects a reorder that splits a row-group's contiguous run (DR-W4E-ROWREORDER-CONTIG-SERVER)", async () => {
      const ctx = await provisionSchema();
      const group = await cleanupRaw.rowGroup.create({ data: { schemaId: ctx.schema.id } });
      const g1 = await cleanupRaw.schemaRow.create({
        data: { schemaId: ctx.schema.id, order: 10, exerciseId: exerciseAId, rowGroupId: group.id },
      });
      const g2 = await cleanupRaw.schemaRow.create({
        data: { schemaId: ctx.schema.id, order: 20, exerciseId: exerciseAId, rowGroupId: group.id },
      });
      const g3 = await cleanupRaw.schemaRow.create({
        data: { schemaId: ctx.schema.id, order: 30, exerciseId: exerciseAId, rowGroupId: group.id },
      });
      const standalone = await cleanupRaw.schemaRow.create({
        data: { schemaId: ctx.schema.id, order: 40, exerciseId: exerciseAId },
      });

      try {
        await expect(
          lmsSchemaRowApi.reorder(coach.user.id, activePlanId, ctx.schema.id, {
            orderedIds: [g1.id, standalone.id, g2.id, g3.id],
          }),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.schemaRow.findMany({
          where: { schemaId: ctx.schema.id },
          orderBy: { order: "asc" },
          select: { id: true, order: true },
        });

        expect(stored).toEqual([
          { id: g1.id, order: 10 },
          { id: g2.id, order: 20 },
          { id: g3.id, order: 30 },
          { id: standalone.id, order: 40 },
        ]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("allows a within-group reorder that keeps the run contiguous", async () => {
      const ctx = await provisionSchema();
      const group = await cleanupRaw.rowGroup.create({ data: { schemaId: ctx.schema.id } });
      const g1 = await cleanupRaw.schemaRow.create({
        data: { schemaId: ctx.schema.id, order: 10, exerciseId: exerciseAId, rowGroupId: group.id },
      });
      const g2 = await cleanupRaw.schemaRow.create({
        data: { schemaId: ctx.schema.id, order: 20, exerciseId: exerciseAId, rowGroupId: group.id },
      });
      const g3 = await cleanupRaw.schemaRow.create({
        data: { schemaId: ctx.schema.id, order: 30, exerciseId: exerciseAId, rowGroupId: group.id },
      });
      const standalone = await cleanupRaw.schemaRow.create({
        data: { schemaId: ctx.schema.id, order: 40, exerciseId: exerciseAId },
      });

      try {
        const returned = await lmsSchemaRowApi.reorder(coach.user.id, activePlanId, ctx.schema.id, {
          orderedIds: [g3.id, g1.id, g2.id, standalone.id],
        });

        expect(returned.map((r) => ({ id: r.id, order: r.order }))).toEqual([
          { id: g3.id, order: 10 },
          { id: g1.id, order: 20 },
          { id: g2.id, order: 30 },
          { id: standalone.id, order: 40 },
        ]);
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe("cross-cutting", () => {
    it("concurrent create on same schemaId — at least one succeeds via P2034 retry", async () => {
      const ctx = await provisionSchema();

      try {
        const results = await Promise.allSettled([
          lmsSchemaRowApi.create(coach.user.id, activePlanId, {
            schemaId: ctx.schema.id,
            exerciseId: exerciseAId,
          }),
          lmsSchemaRowApi.create(coach.user.id, activePlanId, {
            schemaId: ctx.schema.id,
            exerciseId: exerciseAId,
          }),
        ]);

        const fulfilledCount = results.filter((r) => r.status === "fulfilled").length;

        expect(fulfilledCount).toBeGreaterThanOrEqual(1);

        const stored = await cleanupRaw.schemaRow.findMany({
          where: { schemaId: ctx.schema.id },
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

    it("enforces composite uniqueness on (schemaId, order) via P2002", async () => {
      const ctx = await provisionSchema();

      try {
        await cleanupRaw.schemaRow.create({
          data: {
            schemaId: ctx.schema.id,
            order: 10,
            exerciseId: exerciseAId,
          },
        });

        await expect(
          cleanupRaw.schemaRow.create({
            data: {
              schemaId: ctx.schema.id,
              order: 10,
              exerciseId: exerciseAId,
            },
          }),
        ).rejects.toMatchObject({
          code: "P2002",
        });

        const stored = await cleanupRaw.schemaRow.count({ where: { schemaId: ctx.schema.id } });

        expect(stored).toBe(1);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects delete when SchemaRow has PerformedExerciseInstance back-relation (P2003)", async () => {
      const ctx = await provisionSchema();
      const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        exerciseId: exerciseAId,
      });

      const performedSession = await cleanupRaw.performedSession.create({
        data: {
          sessionId: ctx.session.id,
          userId: coach.user.id,
          startedAt: new Date(),
        },
      });

      const performedInstance = await cleanupRaw.performedExerciseInstance.create({
        data: {
          performedSessionId: performedSession.id,
          plannedSchemaRowId: created.id,
          actualLoad: { kind: "absolute", count: 1, kg: 80 },
          actualReps: { kind: "count", value: 5 },
        },
      });

      try {
        await expect(lmsSchemaRowApi.delete(coach.user.id, created.id)).rejects.toThrow(
          BadRequestError,
        );

        const stored = await cleanupRaw.schemaRow.findUnique({ where: { id: created.id } });

        expect(stored).not.toBeNull();
      } finally {
        await cleanupRaw.performedExerciseInstance
          .delete({ where: { id: performedInstance.id } })
          .catch(() => {});
        await cleanupRaw.performedSession
          .delete({ where: { id: performedSession.id } })
          .catch(() => {});
        await ctx.cleanup();
      }
    });

    it("preserves order assignment across successive row creation", async () => {
      const ctx = await provisionSchema();

      try {
        const first = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
          schemaId: ctx.schema.id,
          exerciseId: exerciseAId,
        });
        const second = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
          schemaId: ctx.schema.id,
          exerciseId: exerciseBId,
        });
        const third = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
          schemaId: ctx.schema.id,
          exerciseId: exerciseAId,
        });

        expect(first.order).toBe(10);
        expect(second.order).toBe(20);
        expect(third.order).toBe(30);
      } finally {
        await ctx.cleanup();
      }
    });
  });
});
