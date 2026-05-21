import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { reorderSchemaRowsSchema } from "@repo/contracts/lms/schema-row";
import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import { cleanupRaw, createTestCoach, createTestPlan } from "../../../test/helpers";

import { lmsSchemaRowApi } from "./admin";

const ATOMIC_PARAMS = {
  archetype: "n-rounds" as const,
  params: { countForm: "exact" as const, count: 5 },
};

const NESTED_PARAMS = {
  archetype: "nested-rounds-over-rounds" as const,
  params: { outerCount: 3 },
};

describe("lmsSchemaRowApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;

  let activePlanId: string;
  let archivedPlanId: string;

  let atomicArchetypeId: string;
  let nestedArchetypeId: string;

  let exerciseAId: string;
  let exerciseBId: string;

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

  const provisionSchema = async (
    options: {
      planId?: string;
      kind?: "ATOMIC" | "HEADERLESS" | "NESTED" | "NAMED" | "COMPOSITE";
      archetypeId?: string;
      archetypeParams?: typeof ATOMIC_PARAMS | typeof NESTED_PARAMS;
    } = {},
  ) => {
    const blockCtx = await provisionBlock({ planId: options.planId });
    const kind = options.kind ?? "ATOMIC";
    const archetypeId = options.archetypeId ?? atomicArchetypeId;
    const archetypeParams = options.archetypeParams ?? ATOMIC_PARAMS;

    const schema = await cleanupRaw.schema.create({
      data: {
        blockId: blockCtx.block.id,
        parentSchemaId: null,
        order: 10,
        kind,
        archetypeId,
        archetypeParams,
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

    const atomic = await cleanupRaw.archetype.findUniqueOrThrow({
      where: { name: "n-rounds" },
      select: { id: true },
    });

    atomicArchetypeId = atomic.id;

    const nested = await cleanupRaw.archetype.findUniqueOrThrow({
      where: { name: "nested-rounds-over-rounds" },
      select: { id: true },
    });

    nestedArchetypeId = nested.id;

    const uniqueA = crypto.randomUUID().slice(0, 8);
    const uniqueB = crypto.randomUUID().slice(0, 8);

    const exerciseA = await cleanupRaw.exercise.create({
      data: {
        canonicalName: `SchemaRow Test Exercise A ${uniqueA}`,
        canonicalNameLower: `schemarow test exercise a ${uniqueA}`,
        primaryEquipment: "BARBELL",
        movementTypeTagPrimary: "SQUAT",
        canonicalCompoundType: "ATOMIC",
        placeholderFlag: false,
        defaultDemoUrls: [],
      },
    });

    exerciseAId = exerciseA.id;

    const exerciseB = await cleanupRaw.exercise.create({
      data: {
        canonicalName: `SchemaRow Test Exercise B ${uniqueB}`,
        canonicalNameLower: `schemarow test exercise b ${uniqueB}`,
        primaryEquipment: "DUMBBELL",
        movementTypeTagPrimary: "PRESS",
        canonicalCompoundType: "ATOMIC",
        placeholderFlag: false,
        defaultDemoUrls: [],
      },
    });

    exerciseBId = exerciseB.id;
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

    await cleanupRaw.exercise.delete({ where: { id: exerciseAId } }).catch(() => {});
    await cleanupRaw.exercise.delete({ where: { id: exerciseBId } }).catch(() => {});

    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: otherCoach.profile.id } }).catch(() => {});

    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: otherCoach.user.id } }).catch(() => {});
  });

  describe("create", () => {
    it("creates an EXERCISE row with parsed exercise payload", async () => {
      const ctx = await provisionSchema();

      try {
        const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
          schemaId: ctx.schema.id,
          rowKind: "EXERCISE",
          rowPayload: {
            rowKind: "EXERCISE",
            exercise: { form: "atomic", exerciseId: exerciseAId },
          },
        });

        expect(created.schemaId).toBe(ctx.schema.id);
        expect(created.order).toBe(10);
        expect(created.rowKind).toBe("EXERCISE");
        expect(created.rowPayload).toEqual({
          rowKind: "EXERCISE",
          exercise: { form: "atomic", exerciseId: exerciseAId },
        });
        expect(created.load).toBeNull();
        expect(created.position).toBeNull();
        expect(created.notes).toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("creates a REST row with raw + parsed payload", async () => {
      const ctx = await provisionSchema();

      try {
        const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
          schemaId: ctx.schema.id,
          rowKind: "REST",
          rowPayload: {
            rowKind: "REST",
            raw: "Rest 60s",
            parsed: {
              duration: { value: 60, unit: "sec" },
              scope: "between_sets",
              qualifier: "fixed",
            },
          },
        });

        expect(created.rowKind).toBe("REST");
        expect(created.rowPayload).toMatchObject({
          rowKind: "REST",
          raw: "Rest 60s",
        });
      } finally {
        await ctx.cleanup();
      }
    });

    it("creates a FOOTNOTE row with marker + target + content compound", async () => {
      const ctx = await provisionSchema();

      try {
        const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
          schemaId: ctx.schema.id,
          rowKind: "FOOTNOTE",
          rowPayload: {
            rowKind: "FOOTNOTE",
            marker: "*",
            target: "each_round",
            content: {
              elements: [
                { exerciseId: exerciseAId, reps: { kind: "count", value: 5 } },
                { exerciseId: exerciseBId, reps: { kind: "count", value: 3 } },
              ],
            },
          },
        });

        expect(created.rowKind).toBe("FOOTNOTE");
        expect(created.rowPayload).toMatchObject({
          rowKind: "FOOTNOTE",
          marker: "*",
          target: "each_round",
        });
      } finally {
        await ctx.cleanup();
      }
    });

    it("creates a STANDALONE_LOAD row with load + scope", async () => {
      const ctx = await provisionSchema();

      try {
        const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
          schemaId: ctx.schema.id,
          rowKind: "STANDALONE_LOAD",
          rowPayload: {
            rowKind: "STANDALONE_LOAD",
            load: { kind: "absolute", weight: { variant: "single", valueKg: 60 } },
            scope: "applies_to_all_preceding_rows",
          },
        });

        expect(created.rowKind).toBe("STANDALONE_LOAD");
        expect(created.rowPayload).toMatchObject({
          rowKind: "STANDALONE_LOAD",
          scope: "applies_to_all_preceding_rows",
        });
      } finally {
        await ctx.cleanup();
      }
    });

    it("creates a STANDALONE_URL row with url + wrapped + appliesTo", async () => {
      const ctx = await provisionSchema();

      try {
        const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
          schemaId: ctx.schema.id,
          rowKind: "STANDALONE_URL",
          rowPayload: {
            rowKind: "STANDALONE_URL",
            url: "https://example.com/demo.mp4",
            wrapped: false,
            appliesTo: "whole_schema",
          },
        });

        expect(created.rowKind).toBe("STANDALONE_URL");
        expect(created.rowPayload).toEqual({
          rowKind: "STANDALONE_URL",
          url: "https://example.com/demo.mp4",
          wrapped: false,
          appliesTo: "whole_schema",
        });
      } finally {
        await ctx.cleanup();
      }
    });

    it("creates a PLACEHOLDER row with placeholder payload", async () => {
      const ctx = await provisionSchema();

      try {
        const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
          schemaId: ctx.schema.id,
          rowKind: "PLACEHOLDER",
          rowPayload: {
            rowKind: "PLACEHOLDER",
            placeholder: {
              placeholderKind: "coach_choice_slot",
              text: "Coach pick",
            },
          },
        });

        expect(created.rowKind).toBe("PLACEHOLDER");
        expect(created.rowPayload).toMatchObject({
          rowKind: "PLACEHOLDER",
          placeholder: { placeholderKind: "coach_choice_slot", text: "Coach pick" },
        });
      } finally {
        await ctx.cleanup();
      }
    });

    it("creates an INNER_LADDER_MARKER row with steps array", async () => {
      const ctx = await provisionSchema();

      try {
        const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
          schemaId: ctx.schema.id,
          rowKind: "INNER_LADDER_MARKER",
          rowPayload: {
            rowKind: "INNER_LADDER_MARKER",
            steps: [1, 3, 5, 7, 9],
          },
        });

        expect(created.rowKind).toBe("INNER_LADDER_MARKER");
        expect(created.rowPayload).toEqual({
          rowKind: "INNER_LADDER_MARKER",
          steps: [1, 3, 5, 7, 9],
        });
      } finally {
        await ctx.cleanup();
      }
    });

    it("creates a REP_DEFINITION row with equality compound", async () => {
      const ctx = await provisionSchema();

      try {
        const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
          schemaId: ctx.schema.id,
          rowKind: "REP_DEFINITION",
          rowPayload: {
            rowKind: "REP_DEFINITION",
            equality: {
              form: "inline_equality",
              totalReps: 30,
              composition: [
                { exerciseId: exerciseAId, count: 20 },
                { exerciseId: exerciseBId, count: 10 },
              ],
            },
          },
        });

        expect(created.rowKind).toBe("REP_DEFINITION");
        expect(created.rowPayload).toMatchObject({
          rowKind: "REP_DEFINITION",
          equality: { form: "inline_equality", totalReps: 30 },
        });
      } finally {
        await ctx.cleanup();
      }
    });

    it("creates a REST_SLOT row with empty payload", async () => {
      const ctx = await provisionSchema();

      try {
        const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
          schemaId: ctx.schema.id,
          rowKind: "REST_SLOT",
          rowPayload: { rowKind: "REST_SLOT" },
        });

        expect(created.rowKind).toBe("REST_SLOT");
        expect(created.rowPayload).toEqual({ rowKind: "REST_SLOT" });
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when parent schema is NESTED", async () => {
      const ctx = await provisionSchema({
        kind: "NESTED",
        archetypeId: nestedArchetypeId,
        archetypeParams: NESTED_PARAMS,
      });

      try {
        await expect(
          lmsSchemaRowApi.create(coach.user.id, activePlanId, {
            schemaId: ctx.schema.id,
            rowKind: "EXERCISE",
            rowPayload: {
              rowKind: "EXERCISE",
              exercise: { form: "atomic", exerciseId: exerciseAId },
            },
          }),
        ).rejects.toThrow(BadRequestError);

        const count = await cleanupRaw.schemaRow.count({ where: { schemaId: ctx.schema.id } });

        expect(count).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when rowKind does not match rowPayload.rowKind", async () => {
      const ctx = await provisionSchema();

      try {
        await expect(
          lmsSchemaRowApi.create(coach.user.id, activePlanId, {
            schemaId: ctx.schema.id,
            rowKind: "EXERCISE",
            rowPayload: { rowKind: "REST_SLOT" },
          }),
        ).rejects.toThrow(BadRequestError);

        const count = await cleanupRaw.schemaRow.count({ where: { schemaId: ctx.schema.id } });

        expect(count).toBe(0);
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
            rowKind: "REST_SLOT",
            rowPayload: { rowKind: "REST_SLOT" },
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
            rowKind: "REST_SLOT",
            rowPayload: { rowKind: "REST_SLOT" },
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
          rowKind: "REST_SLOT",
          rowPayload: { rowKind: "REST_SLOT" },
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("update", () => {
    it("updates notes only, leaving rowPayload and other fields untouched", async () => {
      const ctx = await provisionSchema();
      const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        rowKind: "REST",
        rowPayload: {
          rowKind: "REST",
          raw: "Rest 60s",
          parsed: { duration: { value: 60, unit: "sec" }, scope: "between_sets" },
        },
      });

      try {
        const updated = await lmsSchemaRowApi.update(coach.user.id, created.id, {
          notes: "fresh notes",
        });

        expect(updated.notes).toBe("fresh notes");
        expect(updated.rowKind).toBe("REST");
        expect(updated.rowPayload).toEqual(created.rowPayload);
      } finally {
        await ctx.cleanup();
      }
    });

    it("updates rowPayload within the same rowKind variant", async () => {
      const ctx = await provisionSchema();
      const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        rowKind: "REST",
        rowPayload: {
          rowKind: "REST",
          raw: "Rest 60s",
          parsed: { duration: { value: 60, unit: "sec" }, scope: "between_sets" },
        },
      });

      try {
        const updated = await lmsSchemaRowApi.update(coach.user.id, created.id, {
          rowPayload: {
            rowKind: "REST",
            raw: "Rest 120s",
            parsed: { duration: { value: 120, unit: "sec" }, scope: "between_rounds" },
          },
        });

        expect(updated.rowPayload).toMatchObject({
          rowKind: "REST",
          raw: "Rest 120s",
        });
      } finally {
        await ctx.cleanup();
      }
    });

    it("updates flat scalar (load) from null to populated", async () => {
      const ctx = await provisionSchema();
      const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        rowKind: "EXERCISE",
        rowPayload: {
          rowKind: "EXERCISE",
          exercise: { form: "atomic", exerciseId: exerciseAId },
        },
      });

      try {
        const updated = await lmsSchemaRowApi.update(coach.user.id, created.id, {
          load: { kind: "absolute", weight: { variant: "single", valueKg: 80 } },
        });

        expect(updated.load).toEqual({
          kind: "absolute",
          weight: { variant: "single", valueKg: 80 },
        });
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects update with rowKind set (structural)", async () => {
      const ctx = await provisionSchema();
      const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        rowKind: "REST_SLOT",
        rowPayload: { rowKind: "REST_SLOT" },
      });

      try {
        await expect(
          lmsSchemaRowApi.update(coach.user.id, created.id, { rowKind: "EXERCISE" }),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.schemaRow.findUnique({ where: { id: created.id } });

        expect(stored?.rowKind).toBe("REST_SLOT");
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects update with schemaId set (structural)", async () => {
      const ctx = await provisionSchema();
      const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        rowKind: "REST_SLOT",
        rowPayload: { rowKind: "REST_SLOT" },
      });

      try {
        await expect(
          lmsSchemaRowApi.update(coach.user.id, created.id, {
            schemaId: "clz0000000000000000000000",
          }),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.schemaRow.findUnique({ where: { id: created.id } });

        expect(stored?.schemaId).toBe(ctx.schema.id);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects rowPayload update with mismatched variant against stored rowKind", async () => {
      const ctx = await provisionSchema();
      const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        rowKind: "REST_SLOT",
        rowPayload: { rowKind: "REST_SLOT" },
      });

      try {
        await expect(
          lmsSchemaRowApi.update(coach.user.id, created.id, {
            rowPayload: {
              rowKind: "EXERCISE",
              exercise: { form: "atomic", exerciseId: exerciseAId },
            },
          }),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.schemaRow.findUnique({ where: { id: created.id } });

        expect(stored?.rowKind).toBe("REST_SLOT");
        expect(stored?.rowPayload).toEqual({ rowKind: "REST_SLOT" });
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
        rowKind: "REST_SLOT",
        rowPayload: { rowKind: "REST_SLOT" },
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
        rowKind: "REST_SLOT",
        rowPayload: { rowKind: "REST_SLOT" },
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
        rowKind: "REST_SLOT",
        rowPayload: { rowKind: "REST_SLOT" },
      });
      const b = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        rowKind: "REST_SLOT",
        rowPayload: { rowKind: "REST_SLOT" },
      });
      const c = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        rowKind: "REST_SLOT",
        rowPayload: { rowKind: "REST_SLOT" },
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
        rowKind: "REST_SLOT",
        rowPayload: { rowKind: "REST_SLOT" },
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
        rowKind: "REST_SLOT",
        rowPayload: { rowKind: "REST_SLOT" },
      });
      const foreign = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctxB.schema.id,
        rowKind: "REST_SLOT",
        rowPayload: { rowKind: "REST_SLOT" },
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
        rowKind: "REST_SLOT",
        rowPayload: { rowKind: "REST_SLOT" },
      });
      const b = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        rowKind: "REST_SLOT",
        rowPayload: { rowKind: "REST_SLOT" },
      });

      await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        rowKind: "REST_SLOT",
        rowPayload: { rowKind: "REST_SLOT" },
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
  });

  describe("cross-cutting", () => {
    it("concurrent create on same schemaId — at least one succeeds via P2034 retry", async () => {
      const ctx = await provisionSchema();

      try {
        const results = await Promise.allSettled([
          lmsSchemaRowApi.create(coach.user.id, activePlanId, {
            schemaId: ctx.schema.id,
            rowKind: "REST_SLOT",
            rowPayload: { rowKind: "REST_SLOT" },
          }),
          lmsSchemaRowApi.create(coach.user.id, activePlanId, {
            schemaId: ctx.schema.id,
            rowKind: "REST_SLOT",
            rowPayload: { rowKind: "REST_SLOT" },
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
            rowKind: "REST_SLOT",
            rowPayload: { rowKind: "REST_SLOT" },
          },
        });

        await expect(
          cleanupRaw.schemaRow.create({
            data: {
              schemaId: ctx.schema.id,
              order: 10,
              rowKind: "REST_SLOT",
              rowPayload: { rowKind: "REST_SLOT" },
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

    it("updates position enum independent of rowPayload variant", async () => {
      const ctx = await provisionSchema();
      const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        rowKind: "EXERCISE",
        rowPayload: {
          rowKind: "EXERCISE",
          exercise: { form: "atomic", exerciseId: exerciseAId },
        },
      });

      try {
        const updated = await lmsSchemaRowApi.update(coach.user.id, created.id, {
          position: "NEUTRAL_GRIP",
        });

        expect(updated.position).toBe("NEUTRAL_GRIP");
        expect(updated.rowKind).toBe("EXERCISE");
        expect(updated.rowPayload).toEqual(created.rowPayload);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects delete when SchemaRow has PerformedExerciseInstance back-relation (P2003)", async () => {
      const ctx = await provisionSchema();
      const created = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
        schemaId: ctx.schema.id,
        rowKind: "EXERCISE",
        rowPayload: {
          rowKind: "EXERCISE",
          exercise: { form: "atomic", exerciseId: exerciseAId },
        },
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
          actualLoad: { kind: "absolute", weight: { variant: "single", valueKg: 80 } },
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

    it("preserves order assignment across mixed-kind row creation", async () => {
      const ctx = await provisionSchema();

      try {
        const first = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
          schemaId: ctx.schema.id,
          rowKind: "EXERCISE",
          rowPayload: {
            rowKind: "EXERCISE",
            exercise: { form: "atomic", exerciseId: exerciseAId },
          },
        });
        const second = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
          schemaId: ctx.schema.id,
          rowKind: "REST_SLOT",
          rowPayload: { rowKind: "REST_SLOT" },
        });
        const third = await lmsSchemaRowApi.create(coach.user.id, activePlanId, {
          schemaId: ctx.schema.id,
          rowKind: "FOOTNOTE",
          rowPayload: {
            rowKind: "FOOTNOTE",
            marker: "**",
            target: "each_set",
            content: {
              elements: [
                { exerciseId: exerciseAId, reps: { kind: "count", value: 5 } },
                { exerciseId: exerciseBId, reps: { kind: "count", value: 3 } },
              ],
            },
          },
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
