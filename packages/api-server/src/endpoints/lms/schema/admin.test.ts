import { Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { type Composition, deriveCompositionLabel } from "@repo/contracts/lms/composition";
import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import { assertComposeTreeValid, buildSchemaWithBody } from "../../../mappers/lms";
import { cleanupRaw, createTestCoach, createTestPlan } from "../../../test/helpers";

import { lmsSchemaApi } from "./admin";

const LADDER_COMPOSITION: Composition = {
  repetition: { kind: "ladder", steps: [21, 15, 9] },
  arrangement: { kind: "ordered" },
};

const INTERVAL_COMPOSITION: Composition = {
  repetition: { kind: "interval", workMin: 2, offMin: 1, count: 6 },
  scoring: { kind: "max_in_remaining", condition: { appliesToRounds: [2, 3] } },
};

const MARKER_PAYLOAD = { rowKind: "INNER_LADDER_MARKER" as const, steps: [21, 15, 9] };

describe("lmsSchemaApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;
  let headCoach: Awaited<ReturnType<typeof createTestCoach>>;

  let activePlanId: string;
  let archivedPlanId: string;

  let orderCounter = 0;

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

    it("creates a top-level Schema and assigns order 10", async () => {
      const ctx = await provisionBlock();

      try {
        const created = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          { header: "Squats block" },
        );

        expect(created.blockId).toBe(ctx.block.id);
        expect(created.parentSchemaId).toBeNull();
        expect(created.order).toBe(10);
        expect(created.header).toBe("Squats block");
        expect(created.intensity).toBeNull();
        expect(created.notes).toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("creates a top-level Schema with intensity and notes", async () => {
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

    it("dual-writes a composition, derives the label, and stores the bundle (QA-007 / G3)", async () => {
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

    it("creates a sub-schema under a parent", async () => {
      const ctx = await provisionBlock();

      try {
        const parent = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          {},
        );

        const sub = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { parentSchemaId: parent.id },
          {},
        );

        expect(sub.parentSchemaId).toBe(parent.id);
        expect(sub.blockId).toBe(parent.blockId);
        expect(sub.order).toBe(10);

        const stored = await cleanupRaw.schema.findUnique({ where: { id: sub.id } });

        expect(stored?.blockId).toBe(ctx.block.id);
        expect(stored?.parentSchemaId).toBe(parent.id);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects sub-schema when parentSchemaId does not exist", async () => {
      const ctx = await provisionBlock();

      try {
        await expect(
          lmsSchemaApi.create(
            coach.user.id,
            activePlanId,
            { parentSchemaId: "clz0000000000000000000000" },
            {},
          ),
        ).rejects.toThrow(NotFoundError);
      } finally {
        await ctx.cleanup();
      }
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

    it("rejects a composition update that introduces a ladder over a marker-holding body with 400", async () => {
      const ctx = await provisionBlock();
      const schema = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );

      await cleanupRaw.schemaRow.create({
        data: {
          schemaId: schema.id,
          order: 10,
          rowKind: "INNER_LADDER_MARKER",
          rowPayload: MARKER_PAYLOAD,
        },
      });

      try {
        await expect(
          lmsSchemaApi.update(coach.user.id, schema.id, { composition: LADDER_COMPOSITION }),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.schema.findUnique({ where: { id: schema.id } });

        expect(stored?.composition).toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects update with a structural field set (parentSchemaId/blockId)", async () => {
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
            parentSchemaId: "clz0000000000000000000000",
          }),
        ).rejects.toThrow(BadRequestError);

        await expect(
          lmsSchemaApi.update(coach.user.id, schema.id, {
            blockId: "clz0000000000000000000000",
          }),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.schema.findUnique({ where: { id: schema.id } });

        expect(stored?.parentSchemaId).toBeNull();
        expect(stored?.blockId).toBe(ctx.block.id);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects update with parentSchemaId set explicitly to null (QA-Must-Test-36)", async () => {
      const ctx = await provisionBlock();
      const schema = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );

      try {
        await expect(
          lmsSchemaApi.update(coach.user.id, schema.id, { parentSchemaId: null }),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.schema.findUnique({ where: { id: schema.id } });

        expect(stored?.parentSchemaId).toBeNull();
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

    describe("QA-004 arrangement ref existence/scope", () => {
      const BENIGN_COMPOSITION: Composition = {
        repetition: { kind: "count", count: 3 },
      };

      const createComposeSchema = async (options: {
        blockId: string;
        parentSchemaId?: string;
        composition?: Composition;
      }) => {
        orderCounter += 1;

        return cleanupRaw.schema.create({
          data: {
            blockId: options.blockId,
            parentSchemaId: options.parentSchemaId ?? null,
            order: orderCounter,
            composition: options.composition ?? Prisma.JsonNull,
          },
        });
      };

      const createRestSlotRow = async (schemaId: string) => {
        orderCounter += 1;

        return cleanupRaw.schemaRow.create({
          data: {
            schemaId,
            order: orderCounter,
            rowKind: "REST_SLOT",
            rowPayload: { rowKind: "REST_SLOT" },
          },
        });
      };

      it("rejects a parallel update whose childSchemaId points outside this schema's children with 400", async () => {
        const ctx = await provisionBlock();
        const parent = await createComposeSchema({
          blockId: ctx.block.id,
          composition: BENIGN_COMPOSITION,
        });
        const trackA = await createComposeSchema({
          blockId: ctx.block.id,
          parentSchemaId: parent.id,
        });
        const foreign = await createComposeSchema({ blockId: ctx.block.id });

        try {
          await expect(
            lmsSchemaApi.update(coach.user.id, parent.id, {
              composition: {
                arrangement: {
                  kind: "parallel",
                  interleaveOrder: "round_by_round",
                  tracks: [{ childSchemaId: trackA.id }, { childSchemaId: foreign.id }],
                },
              },
            }),
          ).rejects.toThrow(BadRequestError);

          const stored = await cleanupRaw.schema.findUnique({ where: { id: parent.id } });

          expect(stored?.composition).toEqual(BENIGN_COMPOSITION);
        } finally {
          await ctx.cleanup();
        }
      });

      it("rejects a superset update whose rowId points at a different schema's row with 400", async () => {
        const ctx = await provisionBlock();
        const target = await createComposeSchema({
          blockId: ctx.block.id,
          composition: BENIGN_COMPOSITION,
        });
        const ownRow = await createRestSlotRow(target.id);
        const foreign = await createComposeSchema({ blockId: ctx.block.id });
        const foreignRow = await createRestSlotRow(foreign.id);

        try {
          await expect(
            lmsSchemaApi.update(coach.user.id, target.id, {
              composition: {
                arrangement: {
                  kind: "superset",
                  pairs: [{ label: "pair", rowIds: [ownRow.id, foreignRow.id] }],
                },
              },
            }),
          ).rejects.toThrow(BadRequestError);

          const stored = await cleanupRaw.schema.findUnique({ where: { id: target.id } });

          expect(stored?.composition).toEqual(BENIGN_COMPOSITION);
        } finally {
          await ctx.cleanup();
        }
      });

      it("rejects a parallel update whose pairedWithRowId points at a non-grandchild row with 400", async () => {
        const ctx = await provisionBlock();
        const parent = await createComposeSchema({
          blockId: ctx.block.id,
          composition: BENIGN_COMPOSITION,
        });
        const trackA = await createComposeSchema({
          blockId: ctx.block.id,
          parentSchemaId: parent.id,
        });
        const trackB = await createComposeSchema({
          blockId: ctx.block.id,
          parentSchemaId: parent.id,
        });
        const directRow = await createRestSlotRow(parent.id);

        try {
          await expect(
            lmsSchemaApi.update(coach.user.id, parent.id, {
              composition: {
                arrangement: {
                  kind: "parallel",
                  interleaveOrder: "round_by_round",
                  tracks: [
                    { childSchemaId: trackA.id },
                    { childSchemaId: trackB.id, pairedWithRowId: directRow.id },
                  ],
                },
              },
            }),
          ).rejects.toThrow(BadRequestError);

          const stored = await cleanupRaw.schema.findUnique({ where: { id: parent.id } });

          expect(stored?.composition).toEqual(BENIGN_COMPOSITION);
        } finally {
          await ctx.cleanup();
        }
      });

      it("accepts a parallel update over a real nested tree and stores the arrangement", async () => {
        const ctx = await provisionBlock();
        const parent = await createComposeSchema({ blockId: ctx.block.id });
        const trackA = await createComposeSchema({
          blockId: ctx.block.id,
          parentSchemaId: parent.id,
        });
        const trackB = await createComposeSchema({
          blockId: ctx.block.id,
          parentSchemaId: parent.id,
        });
        const trackARow = await createRestSlotRow(trackA.id);

        const arrangement: Composition["arrangement"] = {
          kind: "parallel",
          interleaveOrder: "round_by_round",
          tracks: [
            { childSchemaId: trackA.id },
            { childSchemaId: trackB.id, pairedWithRowId: trackARow.id },
          ],
        };

        try {
          const updated = await lmsSchemaApi.update(coach.user.id, parent.id, {
            composition: { arrangement },
          });

          expect(updated.composition?.arrangement).toEqual(arrangement);

          const stored = await cleanupRaw.schema.findUnique({ where: { id: parent.id } });

          expect(stored?.composition).toEqual({ arrangement });
        } finally {
          await ctx.cleanup();
        }
      });

      it("accepts a superset update over a schema with two own rows and stores the arrangement", async () => {
        const ctx = await provisionBlock();
        const target = await createComposeSchema({ blockId: ctx.block.id });
        const rowOne = await createRestSlotRow(target.id);
        const rowTwo = await createRestSlotRow(target.id);

        const arrangement: Composition["arrangement"] = {
          kind: "superset",
          pairs: [{ label: "biceps / triceps", rowIds: [rowOne.id, rowTwo.id] }],
        };

        try {
          const updated = await lmsSchemaApi.update(coach.user.id, target.id, {
            composition: { arrangement },
          });

          expect(updated.composition?.arrangement).toEqual(arrangement);

          const stored = await cleanupRaw.schema.findUnique({ where: { id: target.id } });

          expect(stored?.composition).toEqual({ arrangement });
        } finally {
          await ctx.cleanup();
        }
      });

      it("reads a persisted valid parallel tree back through assertComposeTreeValid unchanged", async () => {
        const ctx = await provisionBlock();
        const parent = await createComposeSchema({ blockId: ctx.block.id });
        const trackA = await createComposeSchema({
          blockId: ctx.block.id,
          parentSchemaId: parent.id,
        });
        const trackB = await createComposeSchema({
          blockId: ctx.block.id,
          parentSchemaId: parent.id,
        });
        const trackARow = await createRestSlotRow(trackA.id);

        const arrangement: Composition["arrangement"] = {
          kind: "parallel",
          interleaveOrder: "round_by_round",
          tracks: [
            { childSchemaId: trackA.id },
            { childSchemaId: trackB.id, pairedWithRowId: trackARow.id },
          ],
        };

        try {
          await lmsSchemaApi.update(coach.user.id, parent.id, { composition: { arrangement } });

          const reloaded = await cleanupRaw.schema.findUnique({
            where: { id: parent.id },
            include: {
              rows: { orderBy: { order: "asc" } },
              subSchemas: {
                orderBy: { order: "asc" },
                include: { rows: { orderBy: { order: "asc" } } },
              },
            },
          });

          if (reloaded === null) {
            throw new Error("expected reloaded schema");
          }

          expect(() => assertComposeTreeValid(buildSchemaWithBody(reloaded))).not.toThrow();
        } finally {
          await ctx.cleanup();
        }
      });
    });
  });

  describe("delete", () => {
    it("removes the Schema and cascades sub-schemas and rows", async () => {
      const ctx = await provisionBlock();
      const parent = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );
      const sub = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { parentSchemaId: parent.id },
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
          schemaId: sub.id,
          order: 10,
          rowKind: "PLACEHOLDER",
          rowPayload: {},
        },
      });

      try {
        await lmsSchemaApi.delete(coach.user.id, parent.id);

        const parentAfter = await cleanupRaw.schema.findUnique({ where: { id: parent.id } });
        const subAfter = await cleanupRaw.schema.findUnique({ where: { id: sub.id } });
        const rowAfter = await cleanupRaw.schemaRow.findUnique({ where: { id: row.id } });

        expect(parentAfter).toBeNull();
        expect(subAfter).toBeNull();
        expect(rowAfter).toBeNull();

        const siblingAfter = await cleanupRaw.schema.findUnique({ where: { id: sibling.id } });

        expect(siblingAfter).not.toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("removes a sub-schema without affecting parent or siblings", async () => {
      const ctx = await provisionBlock();
      const parent = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );
      const subA = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { parentSchemaId: parent.id },
        {},
      );
      const subB = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { parentSchemaId: parent.id },
        {},
      );

      try {
        await lmsSchemaApi.delete(coach.user.id, subA.id);

        const subAAfter = await cleanupRaw.schema.findUnique({ where: { id: subA.id } });
        const parentAfter = await cleanupRaw.schema.findUnique({ where: { id: parent.id } });
        const subBAfter = await cleanupRaw.schema.findUnique({ where: { id: subB.id } });

        expect(subAAfter).toBeNull();
        expect(parentAfter).not.toBeNull();
        expect(subBAfter).not.toBeNull();
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
    it("renumbers top-level Schemas on the happy path", async () => {
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
          where: { blockId: ctx.block.id, parentSchemaId: null },
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

    it("renumbers sub-schemas under the same parent", async () => {
      const ctx = await provisionBlock();
      const parent = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );
      const a = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { parentSchemaId: parent.id },
        {},
      );
      const b = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { parentSchemaId: parent.id },
        {},
      );
      const c = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { parentSchemaId: parent.id },
        {},
      );

      try {
        const returned = await lmsSchemaApi.reorder(
          coach.user.id,
          activePlanId,
          { parentSchemaId: parent.id },
          { orderedIds: [c.id, a.id, b.id] },
        );

        expect(returned.map((s) => ({ id: s.id, order: s.order }))).toEqual([
          { id: c.id, order: 10 },
          { id: a.id, order: 20 },
          { id: b.id, order: 30 },
        ]);

        const stored = await cleanupRaw.schema.findMany({
          where: { parentSchemaId: parent.id },
          orderBy: { order: "asc" },
          select: { id: true, order: true },
        });

        expect(stored).toEqual([
          { id: c.id, order: 10 },
          { id: a.id, order: 20 },
          { id: b.id, order: 30 },
        ]);

        const parentRow = await cleanupRaw.schema.findUnique({ where: { id: parent.id } });

        expect(parentRow?.order).toBe(10);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when orderedIds is a subset of the target scope's schemas", async () => {
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
          where: { blockId: ctx.block.id, parentSchemaId: null },
          orderBy: { order: "asc" },
          select: { order: true },
        });

        expect(stored.map((s) => s.order)).toEqual([10, 20, 30]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects ids that belong to a different scope (top-level scope with sub-schema id)", async () => {
      const ctx = await provisionBlock();
      const top = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );
      const sub = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { parentSchemaId: top.id },
        {},
      );

      try {
        await expect(
          lmsSchemaApi.reorder(
            coach.user.id,
            activePlanId,
            { blockId: ctx.block.id },
            { orderedIds: [top.id, sub.id] },
          ),
        ).rejects.toThrow(BadRequestError);

        const storedTop = await cleanupRaw.schema.findUnique({ where: { id: top.id } });
        const storedSub = await cleanupRaw.schema.findUnique({ where: { id: sub.id } });

        expect(storedTop?.order).toBe(10);
        expect(storedSub?.order).toBe(10);
      } finally {
        await ctx.cleanup();
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
          where: { blockId: ctx.block.id, parentSchemaId: null },
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
          where: { blockId: ctx.block.id, parentSchemaId: null },
          orderBy: { order: "asc" },
          select: { id: true, order: true },
        });

        expect(stored).toEqual(reversed.map((id, i) => ({ id, order: (i + 1) * 10 })));
      } finally {
        await ctx.cleanup();
      }
    });

    it("top-level reorder does not touch sub-schemas under any top-level NESTED schema", async () => {
      const ctx = await provisionBlock();
      const nested = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );
      const top2 = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {},
      );
      const sub1 = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { parentSchemaId: nested.id },
        {},
      );
      const sub2 = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { parentSchemaId: nested.id },
        {},
      );

      try {
        await lmsSchemaApi.reorder(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          { orderedIds: [top2.id, nested.id] },
        );

        const sub1After = await cleanupRaw.schema.findUnique({ where: { id: sub1.id } });
        const sub2After = await cleanupRaw.schema.findUnique({ where: { id: sub2.id } });

        expect(sub1After?.order).toBe(10);
        expect(sub2After?.order).toBe(20);

        const topAfter = await cleanupRaw.schema.findMany({
          where: { blockId: ctx.block.id, parentSchemaId: null },
          orderBy: { order: "asc" },
          select: { id: true, order: true },
        });

        expect(topAfter).toEqual([
          { id: top2.id, order: 10 },
          { id: nested.id, order: 20 },
        ]);
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe("cross-cutting", () => {
    it("enforces sub-schema composite uniqueness on (parentSchemaId, order) via P2002", async () => {
      const ctx = await provisionBlock();
      const parent = await cleanupRaw.schema.create({
        data: {
          blockId: ctx.block.id,
          order: 10,
        },
      });

      try {
        await cleanupRaw.schema.create({
          data: {
            blockId: ctx.block.id,
            parentSchemaId: parent.id,
            order: 10,
          },
        });

        await expect(
          cleanupRaw.schema.create({
            data: {
              blockId: ctx.block.id,
              parentSchemaId: parent.id,
              order: 10,
            },
          }),
        ).rejects.toMatchObject({ code: "P2002" });

        const stored = await cleanupRaw.schema.count({ where: { parentSchemaId: parent.id } });

        expect(stored).toBe(1);
      } finally {
        await ctx.cleanup();
      }
    });

    it("enforces top-level composite uniqueness on (blockId, order) where parentSchemaId is null via P2002", async () => {
      const ctx = await provisionBlock();

      try {
        await cleanupRaw.schema.create({
          data: {
            blockId: ctx.block.id,
            order: 10,
          },
        });

        await expect(
          cleanupRaw.schema.create({
            data: {
              blockId: ctx.block.id,
              order: 10,
            },
          }),
        ).rejects.toMatchObject({ code: "P2002" });

        const stored = await cleanupRaw.schema.count({
          where: { blockId: ctx.block.id, parentSchemaId: null },
        });

        expect(stored).toBe(1);
      } finally {
        await ctx.cleanup();
      }
    });

    it("allows two sub-schemas of different parents in one block to share an order", async () => {
      const ctx = await provisionBlock();
      const parentA = await cleanupRaw.schema.create({
        data: {
          blockId: ctx.block.id,
          order: 10,
        },
      });
      const parentB = await cleanupRaw.schema.create({
        data: {
          blockId: ctx.block.id,
          order: 20,
        },
      });

      try {
        const subA = await cleanupRaw.schema.create({
          data: {
            blockId: ctx.block.id,
            parentSchemaId: parentA.id,
            order: 10,
          },
        });
        const subB = await cleanupRaw.schema.create({
          data: {
            blockId: ctx.block.id,
            parentSchemaId: parentB.id,
            order: 10,
          },
        });

        expect(subA.order).toBe(10);
        expect(subB.order).toBe(10);
        expect(subA.parentSchemaId).toBe(parentA.id);
        expect(subB.parentSchemaId).toBe(parentB.id);

        const stored = await cleanupRaw.schema.count({
          where: { blockId: ctx.block.id, parentSchemaId: { not: null } },
        });

        expect(stored).toBe(2);
      } finally {
        await ctx.cleanup();
      }
    });
  });
});
