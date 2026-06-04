import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { type Composition, deriveCompositionLabel } from "@repo/contracts/lms/composition";
import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import { cleanupRaw, createTestCoach, createTestPlan } from "../../../test/helpers";

import { lmsSchemaApi } from "./admin";

const ATOMIC_PARAMS = {
  archetype: "n-rounds" as const,
  params: { countForm: "exact" as const, count: 5 },
};

const LADDER_COMPOSITION: Composition = {
  repetition: { kind: "ladder", steps: [21, 15, 9] },
  arrangement: { kind: "ordered" },
};

const INTERVAL_COMPOSITION: Composition = {
  repetition: { kind: "interval", workMin: 2, offMin: 1, count: 6 },
  scoring: { kind: "max_in_remaining", condition: { appliesToRounds: [2, 3] } },
};

const MARKER_PAYLOAD = { rowKind: "INNER_LADDER_MARKER" as const, steps: [21, 15, 9] };

const SECOND_ATOMIC_PARAMS = {
  archetype: "amrap-flat" as const,
  params: { durationMin: 20 },
};

const HEADERLESS_PARAMS = {
  archetype: "single-line-bare" as const,
  params: {},
};

const NESTED_PARAMS = {
  archetype: "nested-rounds-over-rounds" as const,
  params: { outerCount: 3 },
};

const ALTERNATING_SETS_PARAMS = (setEnumeration: number[]) => ({
  archetype: "alternating-sets" as const,
  params: { setEnumeration },
});

describe("lmsSchemaApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;
  let headCoach: Awaited<ReturnType<typeof createTestCoach>>;

  let activePlanId: string;
  let archivedPlanId: string;

  let atomicArchetypeId: string;
  let secondAtomicArchetypeId: string;
  let headerlessArchetypeId: string;
  let nestedArchetypeId: string;
  let alternatingSetsArchetypeId: string;

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
        await cleanupRaw.alternatingGroup
          .deleteMany({ where: { blockId: block.id } })
          .catch(() => {});
        await cleanupRaw.schema.deleteMany({ where: { blockId: block.id } }).catch(() => {});
        await cleanupRaw.block.delete({ where: { id: block.id } }).catch(() => {});
        await cleanupRaw.session.delete({ where: { id: session.id } }).catch(() => {});
        await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
        await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
      },
    };
  };

  const createAlternatingSetsSchema = async (options: {
    blockId: string;
    alternatingGroupId?: string;
    setEnumeration?: number[];
  }) => {
    orderCounter += 1;

    return cleanupRaw.schema.create({
      data: {
        blockId: options.blockId,
        alternatingGroupId: options.alternatingGroupId ?? null,
        order: orderCounter,
        kind: "ATOMIC",
        archetypeId: alternatingSetsArchetypeId,
        archetypeParams: ALTERNATING_SETS_PARAMS(options.setEnumeration ?? [1, 3, 5]),
      },
    });
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

    const atomic = await cleanupRaw.archetype.findUniqueOrThrow({
      where: { name: "n-rounds" },
      select: { id: true },
    });

    atomicArchetypeId = atomic.id;

    const secondAtomic = await cleanupRaw.archetype.findUniqueOrThrow({
      where: { name: "amrap-flat" },
      select: { id: true },
    });

    secondAtomicArchetypeId = secondAtomic.id;

    const headerless = await cleanupRaw.archetype.findUniqueOrThrow({
      where: { name: "single-line-bare" },
      select: { id: true },
    });

    headerlessArchetypeId = headerless.id;

    const nested = await cleanupRaw.archetype.findUniqueOrThrow({
      where: { name: "nested-rounds-over-rounds" },
      select: { id: true },
    });

    nestedArchetypeId = nested.id;

    const alternatingSets = await cleanupRaw.archetype.findUniqueOrThrow({
      where: { name: "alternating-sets" },
      select: { id: true },
    });

    alternatingSetsArchetypeId = alternatingSets.id;
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
          lmsSchemaApi.create(
            otherCoach.user.id,
            activePlanId,
            { blockId: ctx.block.id },
            {
              kind: "ATOMIC",
              archetypeId: atomicArchetypeId,
              archetypeParams: ATOMIC_PARAMS,
            },
          ),
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
          {
            kind: "ATOMIC",
            archetypeId: atomicArchetypeId,
            archetypeParams: ATOMIC_PARAMS,
          },
        );

        expect(created.blockId).toBe(ctx.block.id);
        expect(created.order).toBe(10);
        expect(created.kind).toBe("ATOMIC");
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects on an archived plan", async () => {
      const ctx = await provisionBlock({ planId: archivedPlanId });

      try {
        await expect(
          lmsSchemaApi.create(
            coach.user.id,
            archivedPlanId,
            { blockId: ctx.block.id },
            {
              kind: "ATOMIC",
              archetypeId: atomicArchetypeId,
              archetypeParams: ATOMIC_PARAMS,
            },
          ),
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
          lmsSchemaApi.create(
            coach.user.id,
            otherPlan.id,
            { blockId: ctx.block.id },
            {
              kind: "ATOMIC",
              archetypeId: atomicArchetypeId,
              archetypeParams: ATOMIC_PARAMS,
            },
          ),
        ).rejects.toThrow(NotFoundError);
      } finally {
        await ctx.cleanup();
        await cleanupRaw.trainingPlan.delete({ where: { id: otherPlan.id } }).catch(() => {});
      }
    });

    it("creates a top-level Schema with kind ATOMIC and order 10", async () => {
      const ctx = await provisionBlock();

      try {
        const created = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          {
            kind: "ATOMIC",
            archetypeId: atomicArchetypeId,
            header: "Squats block",
            archetypeParams: ATOMIC_PARAMS,
          },
        );

        expect(created.blockId).toBe(ctx.block.id);
        expect(created.parentSchemaId).toBeNull();
        expect(created.order).toBe(10);
        expect(created.kind).toBe("ATOMIC");
        expect(created.archetypeId).toBe(atomicArchetypeId);
        expect(created.header).toBe("Squats block");
        expect(created.archetypeParams).toEqual(ATOMIC_PARAMS);
        expect(created.intensity).toBeNull();
        expect(created.trailingConnector).toBeNull();
        expect(created.notes).toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("creates a top-level Schema with kind NESTED, intensity, and trailingConnector", async () => {
      const ctx = await provisionBlock();

      try {
        const created = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          {
            kind: "NESTED",
            archetypeId: nestedArchetypeId,
            archetypeParams: NESTED_PARAMS,
            intensity: { rpe: { value: 7 } },
            trailingConnector: { form: "then_n_rounds", roundsCount: 3 },
            notes: "outer block",
          },
        );

        expect(created.kind).toBe("NESTED");
        expect(created.intensity).toEqual({ rpe: { value: 7 } });
        expect(created.trailingConnector).toEqual({ form: "then_n_rounds", roundsCount: 3 });
        expect(created.notes).toBe("outer block");

        const stored = await cleanupRaw.schema.findUnique({ where: { id: created.id } });

        expect(stored?.intensity).toEqual({ rpe: { value: 7 } });
        expect(stored?.trailingConnector).toEqual({ form: "then_n_rounds", roundsCount: 3 });
      } finally {
        await ctx.cleanup();
      }
    });

    it("dual-writes a composition + required archetype, derives the label, and stores the bundle (QA-007 / G3)", async () => {
      const ctx = await provisionBlock();

      try {
        const created = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          {
            kind: "ATOMIC",
            archetypeId: atomicArchetypeId,
            archetypeParams: ATOMIC_PARAMS,
            composition: LADDER_COMPOSITION,
          },
        );

        expect(created.composition).toEqual(LADDER_COMPOSITION);
        expect(created.label).toEqual(deriveCompositionLabel(LADDER_COMPOSITION));
        expect(created.archetypeParams).toEqual(ATOMIC_PARAMS);

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
          { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
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
          { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
        );
        const second = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
        );
        const third = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
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
          lmsSchemaApi.create(
            coach.user.id,
            activePlanId,
            { blockId: ctx.block.id },
            { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
          ),
          lmsSchemaApi.create(
            coach.user.id,
            activePlanId,
            { blockId: ctx.block.id },
            {
              kind: "ATOMIC",
              archetypeId: secondAtomicArchetypeId,
              archetypeParams: SECOND_ATOMIC_PARAMS,
            },
          ),
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

    it("rejects when archetypeId does not exist", async () => {
      const ctx = await provisionBlock();

      try {
        await expect(
          lmsSchemaApi.create(
            coach.user.id,
            activePlanId,
            { blockId: ctx.block.id },
            {
              kind: "ATOMIC",
              archetypeId: "clz0000000000000000000000",
              archetypeParams: ATOMIC_PARAMS,
            },
          ),
        ).rejects.toThrow(NotFoundError);

        const count = await cleanupRaw.schema.count({ where: { blockId: ctx.block.id } });

        expect(count).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when archetype.kind does not match data.kind", async () => {
      const ctx = await provisionBlock();

      try {
        await expect(
          lmsSchemaApi.create(
            coach.user.id,
            activePlanId,
            { blockId: ctx.block.id },
            {
              kind: "NESTED",
              archetypeId: atomicArchetypeId,
              archetypeParams: ATOMIC_PARAMS,
            },
          ),
        ).rejects.toThrow(BadRequestError);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects when archetypeParams.archetype literal does not match Archetype name", async () => {
      const ctx = await provisionBlock();

      try {
        await expect(
          lmsSchemaApi.create(
            coach.user.id,
            activePlanId,
            { blockId: ctx.block.id },
            {
              kind: "ATOMIC",
              archetypeId: atomicArchetypeId,
              archetypeParams: SECOND_ATOMIC_PARAMS,
            },
          ),
        ).rejects.toThrow(BadRequestError);
      } finally {
        await ctx.cleanup();
      }
    });

    it("creates a sub-schema with kind ATOMIC under a NESTED parent", async () => {
      const ctx = await provisionBlock();

      try {
        const parent = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          { kind: "NESTED", archetypeId: nestedArchetypeId, archetypeParams: NESTED_PARAMS },
        );

        const sub = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { parentSchemaId: parent.id },
          { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
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

    it("rejects sub-schema creation when parent.kind is not NESTED", async () => {
      const ctx = await provisionBlock();

      try {
        const parent = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
        );

        await expect(
          lmsSchemaApi.create(
            coach.user.id,
            activePlanId,
            { parentSchemaId: parent.id },
            { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
          ),
        ).rejects.toThrow(BadRequestError);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects sub-schema when data.kind is outside ATOMIC/HEADERLESS", async () => {
      const ctx = await provisionBlock();

      try {
        const parent = await lmsSchemaApi.create(
          coach.user.id,
          activePlanId,
          { blockId: ctx.block.id },
          { kind: "NESTED", archetypeId: nestedArchetypeId, archetypeParams: NESTED_PARAMS },
        );

        await expect(
          lmsSchemaApi.create(
            coach.user.id,
            activePlanId,
            { parentSchemaId: parent.id },
            { kind: "NESTED", archetypeId: nestedArchetypeId, archetypeParams: NESTED_PARAMS },
          ),
        ).rejects.toThrow(BadRequestError);
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
            { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
          ),
        ).rejects.toThrow(NotFoundError);
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe("update", () => {
    it("updates header, intensity, trailingConnector, and notes via conditional spread", async () => {
      const ctx = await provisionBlock();
      const schema = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
      );

      try {
        const updated = await lmsSchemaApi.update(coach.user.id, schema.id, {
          header: "new header",
          intensity: { rpe: { value: 8 } },
          trailingConnector: { form: "then" },
          notes: "set 1",
        });

        expect(updated.header).toBe("new header");
        expect(updated.intensity).toEqual({ rpe: { value: 8 } });
        expect(updated.trailingConnector).toEqual({ form: "then" });
        expect(updated.notes).toBe("set 1");
        expect(updated.archetypeParams).toEqual(ATOMIC_PARAMS);

        const stored = await cleanupRaw.schema.findUnique({ where: { id: schema.id } });

        expect(stored?.header).toBe("new header");
        expect(stored?.intensity).toEqual({ rpe: { value: 8 } });
        expect(stored?.trailingConnector).toEqual({ form: "then" });
        expect(stored?.notes).toBe("set 1");
      } finally {
        await ctx.cleanup();
      }
    });

    it("clears intensity and trailingConnector by writing JSON null on explicit null", async () => {
      const ctx = await provisionBlock();
      const schema = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        {
          kind: "ATOMIC",
          archetypeId: atomicArchetypeId,
          archetypeParams: ATOMIC_PARAMS,
          intensity: { rpe: { value: 7 } },
          trailingConnector: { form: "then" },
        },
      );

      try {
        const updated = await lmsSchemaApi.update(coach.user.id, schema.id, {
          intensity: null,
          trailingConnector: null,
        });

        expect(updated.intensity).toBeNull();
        expect(updated.trailingConnector).toBeNull();

        const stored = await cleanupRaw.schema.findUnique({ where: { id: schema.id } });

        expect(stored?.intensity).toBeNull();
        expect(stored?.trailingConnector).toBeNull();
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
          kind: "ATOMIC",
          archetypeId: atomicArchetypeId,
          archetypeParams: ATOMIC_PARAMS,
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
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
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

    it("updates archetypeParams within the same variant", async () => {
      const ctx = await provisionBlock();
      const schema = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
      );

      try {
        const updated = await lmsSchemaApi.update(coach.user.id, schema.id, {
          archetypeParams: {
            archetype: "n-rounds",
            params: { countForm: "exact", count: 7 },
          },
        });

        expect(updated.archetypeParams).toEqual({
          archetype: "n-rounds",
          params: { countForm: "exact", count: 7 },
        });
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects archetypeParams update with a different variant literal", async () => {
      const ctx = await provisionBlock();
      const schema = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
      );

      try {
        await expect(
          lmsSchemaApi.update(coach.user.id, schema.id, {
            archetypeParams: SECOND_ATOMIC_PARAMS,
          }),
        ).rejects.toThrow(BadRequestError);

        const stored = await cleanupRaw.schema.findUnique({ where: { id: schema.id } });

        expect(stored?.archetypeParams).toEqual(ATOMIC_PARAMS);
      } finally {
        await ctx.cleanup();
      }
    });

    it("rejects update with any structural field set (kind/archetypeId/parentSchemaId/blockId)", async () => {
      const ctx = await provisionBlock();
      const schema = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
      );

      try {
        await expect(
          lmsSchemaApi.update(coach.user.id, schema.id, { kind: "HEADERLESS" }),
        ).rejects.toThrow(BadRequestError);

        await expect(
          lmsSchemaApi.update(coach.user.id, schema.id, {
            archetypeId: headerlessArchetypeId,
          }),
        ).rejects.toThrow(BadRequestError);

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

        expect(stored?.kind).toBe("ATOMIC");
        expect(stored?.archetypeId).toBe(atomicArchetypeId);
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
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
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
          kind: "ATOMIC",
          archetypeId: atomicArchetypeId,
          archetypeParams: ATOMIC_PARAMS,
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
    it("removes the Schema and cascades sub-schemas and rows", async () => {
      const ctx = await provisionBlock();
      const parent = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        { kind: "NESTED", archetypeId: nestedArchetypeId, archetypeParams: NESTED_PARAMS },
      );
      const sub = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { parentSchemaId: parent.id },
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
      );
      const sibling = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
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
        { kind: "NESTED", archetypeId: nestedArchetypeId, archetypeParams: NESTED_PARAMS },
      );
      const subA = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { parentSchemaId: parent.id },
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
      );
      const subB = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { parentSchemaId: parent.id },
        {
          kind: "HEADERLESS",
          archetypeId: headerlessArchetypeId,
          archetypeParams: HEADERLESS_PARAMS,
        },
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
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
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

    it("dissolves nothing when deleting an ungrouped schema", async () => {
      const ctx = await provisionBlock();
      const schema = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
      );

      try {
        await lmsSchemaApi.delete(coach.user.id, schema.id);

        const stored = await cleanupRaw.schema.findUnique({ where: { id: schema.id } });
        const groupCount = await cleanupRaw.alternatingGroup.count({
          where: { blockId: ctx.block.id },
        });

        expect(stored).toBeNull();
        expect(groupCount).toBe(0);
      } finally {
        await ctx.cleanup();
      }
    });

    it("keeps the alternating group alive when deleting one member of a 3-member group", async () => {
      const ctx = await provisionBlock();
      const group = await cleanupRaw.alternatingGroup.create({
        data: { blockId: ctx.block.id, relationKind: "ALTERNATING_SETS" },
      });
      const memberA = await createAlternatingSetsSchema({
        blockId: ctx.block.id,
        alternatingGroupId: group.id,
        setEnumeration: [1, 4],
      });
      const memberB = await createAlternatingSetsSchema({
        blockId: ctx.block.id,
        alternatingGroupId: group.id,
        setEnumeration: [2, 5],
      });
      const memberC = await createAlternatingSetsSchema({
        blockId: ctx.block.id,
        alternatingGroupId: group.id,
        setEnumeration: [3, 6],
      });

      try {
        await lmsSchemaApi.delete(coach.user.id, memberA.id);

        const memberAAfter = await cleanupRaw.schema.findUnique({ where: { id: memberA.id } });

        expect(memberAAfter).toBeNull();

        const groupAfter = await cleanupRaw.alternatingGroup.findUnique({
          where: { id: group.id },
        });

        expect(groupAfter).not.toBeNull();

        const survivingMembers = await cleanupRaw.schema.findMany({
          where: { alternatingGroupId: group.id },
          orderBy: { order: "asc" },
          select: { id: true, alternatingGroupId: true },
        });

        expect(survivingMembers).toEqual([
          { id: memberB.id, alternatingGroupId: group.id },
          { id: memberC.id, alternatingGroupId: group.id },
        ]);
      } finally {
        await ctx.cleanup();
      }
    });

    it("dissolves the alternating group when deleting one member of a 2-member group", async () => {
      const ctx = await provisionBlock();
      const group = await cleanupRaw.alternatingGroup.create({
        data: { blockId: ctx.block.id, relationKind: "ALTERNATING_SETS" },
      });
      const memberA = await createAlternatingSetsSchema({
        blockId: ctx.block.id,
        alternatingGroupId: group.id,
        setEnumeration: [1, 3, 5],
      });
      const memberB = await createAlternatingSetsSchema({
        blockId: ctx.block.id,
        alternatingGroupId: group.id,
        setEnumeration: [2, 4, 6],
      });

      try {
        await lmsSchemaApi.delete(coach.user.id, memberA.id);

        const memberAAfter = await cleanupRaw.schema.findUnique({ where: { id: memberA.id } });
        const groupAfter = await cleanupRaw.alternatingGroup.findUnique({
          where: { id: group.id },
        });
        const memberBAfter = await cleanupRaw.schema.findUnique({ where: { id: memberB.id } });

        expect(memberAAfter).toBeNull();
        expect(groupAfter).toBeNull();
        expect(memberBAfter).not.toBeNull();
        expect(memberBAfter?.alternatingGroupId).toBeNull();
      } finally {
        await ctx.cleanup();
      }
    });

    it("dissolves a degenerate 1-member orphan group when deleting its sole member", async () => {
      const ctx = await provisionBlock();
      const orphanGroup = await cleanupRaw.alternatingGroup.create({
        data: { blockId: ctx.block.id, relationKind: "ALTERNATING_SETS" },
      });
      const soleMember = await createAlternatingSetsSchema({
        blockId: ctx.block.id,
        alternatingGroupId: orphanGroup.id,
      });

      try {
        await lmsSchemaApi.delete(coach.user.id, soleMember.id);

        const memberAfter = await cleanupRaw.schema.findUnique({ where: { id: soleMember.id } });
        const groupAfter = await cleanupRaw.alternatingGroup.findUnique({
          where: { id: orphanGroup.id },
        });

        expect(memberAfter).toBeNull();
        expect(groupAfter).toBeNull();
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
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
      );
      const b = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
      );
      const c = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
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
        { kind: "NESTED", archetypeId: nestedArchetypeId, archetypeParams: NESTED_PARAMS },
      );
      const a = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { parentSchemaId: parent.id },
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
      );
      const b = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { parentSchemaId: parent.id },
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
      );
      const c = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { parentSchemaId: parent.id },
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
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
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
      );
      const b = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
      );

      await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
      );

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
        { kind: "NESTED", archetypeId: nestedArchetypeId, archetypeParams: NESTED_PARAMS },
      );
      const sub = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { parentSchemaId: top.id },
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
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
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
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
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
      );
      const b = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
      );
      const c = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
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
          { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
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
        { kind: "NESTED", archetypeId: nestedArchetypeId, archetypeParams: NESTED_PARAMS },
      );
      const top2 = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { blockId: ctx.block.id },
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
      );
      const sub1 = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { parentSchemaId: nested.id },
        { kind: "ATOMIC", archetypeId: atomicArchetypeId, archetypeParams: ATOMIC_PARAMS },
      );
      const sub2 = await lmsSchemaApi.create(
        coach.user.id,
        activePlanId,
        { parentSchemaId: nested.id },
        {
          kind: "HEADERLESS",
          archetypeId: headerlessArchetypeId,
          archetypeParams: HEADERLESS_PARAMS,
        },
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
          kind: "NESTED",
          archetypeId: nestedArchetypeId,
          archetypeParams: NESTED_PARAMS,
        },
      });

      try {
        await cleanupRaw.schema.create({
          data: {
            blockId: ctx.block.id,
            parentSchemaId: parent.id,
            order: 10,
            kind: "ATOMIC",
            archetypeId: atomicArchetypeId,
            archetypeParams: ATOMIC_PARAMS,
          },
        });

        await expect(
          cleanupRaw.schema.create({
            data: {
              blockId: ctx.block.id,
              parentSchemaId: parent.id,
              order: 10,
              kind: "ATOMIC",
              archetypeId: atomicArchetypeId,
              archetypeParams: ATOMIC_PARAMS,
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
            kind: "ATOMIC",
            archetypeId: atomicArchetypeId,
            archetypeParams: ATOMIC_PARAMS,
          },
        });

        await expect(
          cleanupRaw.schema.create({
            data: {
              blockId: ctx.block.id,
              order: 10,
              kind: "ATOMIC",
              archetypeId: atomicArchetypeId,
              archetypeParams: ATOMIC_PARAMS,
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
          kind: "NESTED",
          archetypeId: nestedArchetypeId,
          archetypeParams: NESTED_PARAMS,
        },
      });
      const parentB = await cleanupRaw.schema.create({
        data: {
          blockId: ctx.block.id,
          order: 20,
          kind: "NESTED",
          archetypeId: nestedArchetypeId,
          archetypeParams: NESTED_PARAMS,
        },
      });

      try {
        const subA = await cleanupRaw.schema.create({
          data: {
            blockId: ctx.block.id,
            parentSchemaId: parentA.id,
            order: 10,
            kind: "ATOMIC",
            archetypeId: atomicArchetypeId,
            archetypeParams: ATOMIC_PARAMS,
          },
        });
        const subB = await cleanupRaw.schema.create({
          data: {
            blockId: ctx.block.id,
            parentSchemaId: parentB.id,
            order: 10,
            kind: "ATOMIC",
            archetypeId: atomicArchetypeId,
            archetypeParams: ATOMIC_PARAMS,
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
