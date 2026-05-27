import { type PrismaClient as PrismaClientType, Prisma, PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ARCHETYPE_NAMES } from "@repo/contracts/lms/schema";

import { tallyCoverage } from "../../prisma/seed/canonical-plan";

import {
  buildPlanScopes,
  expectArchetypeNamesAllReferenced,
  expectArchetypeRefsResolveToRows,
  expectWeeksAreMondayMonotonic,
  extractParallelPyramidRefs,
  extractSuperSetRowRefs,
  type PlanScopes,
} from "./_seed-coverage-helpers";

const DEMO_PLAN_TITLE = "Maks Pooh — Discipline 2025–2026";
const ARCHIVED_PLAN_NAME = "2025 Open Prep";
const EXPECTED_WEEK_COUNT = 34;
const EXPECTED_PHASE_7_DAYS = 6;
const EXPECTED_PHASE_7_THURSDAY_BLOCKS = 2;
const EXPECTED_LABEL_MIN = 21;
const EXPECTED_EXERCISE_MIN = 180;
const EXPECTED_ACTIVE_PLANS = 3;
const EXPECTED_CONNECTOR_TOTAL = 19;
const EXPECTED_THEN_MIN = 15;
const EXPECTED_DOTS_MIN = 2;
const EXPECTED_N_ROUNDS_MIN = 2;
const ARCHIVED_WEEK_START_ISO = "2025-01-06T00:00:00.000Z";
const CONNECTOR_FORMS = ["then", "then_dots", "then_n_rounds"] as const;

describe("Seed coverage — canonical Demo Plan", () => {
  const db: PrismaClientType = new PrismaClient();

  let demoPlanId: string;
  let scopes: PlanScopes;

  beforeAll(async () => {
    const plan = await db.trainingPlan.findFirst({
      where: { name: DEMO_PLAN_TITLE, deletedAt: null },
      select: { id: true },
    });

    if (plan === null) {
      throw new Error(`Demo Plan "${DEMO_PLAN_TITLE}" not seeded — run db:reset && db:seed first`);
    }

    demoPlanId = plan.id;
    scopes = buildPlanScopes(demoPlanId);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("MT-1: Demo Plan present, ACTIVE, owned by a coach user", async () => {
    const plan = await db.trainingPlan.findUniqueOrThrow({
      where: { id: demoPlanId },
      select: { name: true, status: true, creator: { select: { role: true } } },
    });

    expect(plan.name).toBe(DEMO_PLAN_TITLE);
    expect(plan.status).toBe("ACTIVE");
    expect(plan.creator.role).toBe("COACH");
  });

  it("MT-2: catalog size meets canonical floor (≥180 exercises post-dedupe, ≥21 labels)", async () => {
    const [exercises, labels] = await Promise.all([db.exercise.count(), db.label.count()]);

    expect(exercises).toBeGreaterThanOrEqual(EXPECTED_EXERCISE_MIN);
    expect(labels).toBeGreaterThanOrEqual(EXPECTED_LABEL_MIN);
  });

  it("MT-3: exactly 3 ACTIVE plans (Competitor + Foundations + Demo)", async () => {
    const count = await db.trainingPlan.count({ where: { status: "ACTIVE", deletedAt: null } });

    expect(count).toBe(EXPECTED_ACTIVE_PLANS);
  });

  it("MT-4/MT-5: 34 weeks; monotonic startDates on UTC Mondays with 7-day gaps", async () => {
    const weeks = await db.week.findMany({
      where: { planId: demoPlanId },
      orderBy: { startDate: "asc" },
      select: { startDate: true },
    });

    expect(weeks.length).toBe(EXPECTED_WEEK_COUNT);
    expectWeeksAreMondayMonotonic(weeks);
  });

  it("MT-6/MT-7: Phase 7 week is last; 6 distinct days × 1 session each", async () => {
    const [phase7, last] = await Promise.all([
      db.week.findFirst({
        where: { planId: demoPlanId, notes: { contains: "Phase 7" } },
        select: { id: true },
      }),
      db.week.findFirst({
        where: { planId: demoPlanId },
        orderBy: { startDate: "desc" },
        select: { id: true },
      }),
    ]);

    expect(phase7?.id).toBe(last?.id);

    const days = await db.day.findMany({
      where: { week: { planId: demoPlanId, notes: { contains: "Phase 7" } } },
      select: { dayOfWeek: true, sessions: { select: { id: true } } },
    });

    expect(days.length).toBe(EXPECTED_PHASE_7_DAYS);
    expect(new Set(days.map((d) => d.dayOfWeek)).size).toBe(EXPECTED_PHASE_7_DAYS);

    for (const day of days) {
      expect(day.sessions.length).toBe(1);
    }
  });

  it("MT-8/MT-25: alt-groups under Demo Plan are well-formed (≥2 members, ≥1 pair-group)", async () => {
    const groups = await db.alternatingGroup.findMany({
      where: { block: scopes.blockScope },
      select: { blockId: true, schemas: { select: { id: true, blockId: true } } },
    });

    expect(groups.length).toBeGreaterThanOrEqual(1);

    for (const group of groups) {
      expect(group.schemas.length).toBeGreaterThanOrEqual(2);

      for (const member of group.schemas) {
        expect(member.blockId).toBe(group.blockId);
      }
    }

    expect(groups.filter((g) => g.schemas.length === 2).length).toBeGreaterThanOrEqual(1);
  });

  it("MT-9: super-set archetypeParams.params.pairs[].schemaRows resolve to real SchemaRow ids", async () => {
    await expectArchetypeRefsResolveToRows(
      db,
      scopes.schemaScope,
      "super-set",
      extractSuperSetRowRefs,
    );
  });

  it("MT-10: parallel-pyramids pairedWithInnerRowId values resolve to real SchemaRow ids", async () => {
    await expectArchetypeRefsResolveToRows(
      db,
      scopes.schemaScope,
      "parallel-pyramids",
      extractParallelPyramidRefs,
    );
  });

  it("MT-11/MT-26: trailingConnector populated for ≥19 schemas with the expected form mix", async () => {
    const formCount = async (form: string): Promise<number> =>
      db.schema.count({
        where: { ...scopes.schemaScope, trailingConnector: { path: ["form"], equals: form } },
      });

    const [total, thenCount, thenDots, thenRounds] = await Promise.all([
      db.schema.count({
        where: { ...scopes.schemaScope, trailingConnector: { not: Prisma.AnyNull } },
      }),
      formCount("then"),
      formCount("then_dots"),
      formCount("then_n_rounds"),
    ]);

    expect(total).toBeGreaterThanOrEqual(EXPECTED_CONNECTOR_TOTAL);
    expect(thenCount).toBeGreaterThanOrEqual(EXPECTED_THEN_MIN);
    expect(thenDots).toBeGreaterThanOrEqual(EXPECTED_DOTS_MIN);
    expect(thenRounds).toBeGreaterThanOrEqual(EXPECTED_N_ROUNDS_MIN);
  });

  it("MT-12: no Schema.notes carries a leftover 'connector:' substring", async () => {
    const leaked = await db.schema.findMany({
      where: { ...scopes.schemaScope, notes: { contains: "connector:" } },
      select: { id: true },
    });

    expect(leaked).toEqual([]);
  });

  it("MT-13/MT-20: 34 Archetype rows seeded; every name referenced by ≥1 Demo Plan schema", async () => {
    await expectArchetypeNamesAllReferenced(db, scopes.schemaScope, ARCHETYPE_NAMES);
  });

  it("MT-14: schemas + rows under Demo Plan exist (FK integrity smoke check)", async () => {
    const [schemaCount, rowCount] = await Promise.all([
      db.schema.count({ where: scopes.schemaScope }),
      db.schemaRow.count({ where: { schema: scopes.schemaScope } }),
    ]);

    expect(schemaCount).toBeGreaterThan(0);
    expect(rowCount).toBeGreaterThan(0);
  });

  it("MT-15..18: rest-day, active-day, empty-block, implicit-block coverage cells filled", async () => {
    const [restDay, activeDay, emptyBlocks, implicitBlocks] = await Promise.all([
      db.day.count({
        where: { ...scopes.dayScope, label: { rest: true }, sessions: { none: {} } },
      }),
      db.day.count({ where: { ...scopes.dayScope, labelId: null } }),
      db.block.count({ where: { ...scopes.blockScope, schemas: { none: {} } } }),
      db.block.count({ where: { ...scopes.blockScope, labelAssignments: { none: {} } } }),
    ]);

    expect(restDay).toBeGreaterThanOrEqual(1);
    expect(activeDay).toBeGreaterThanOrEqual(1);
    expect(emptyBlocks).toBeGreaterThanOrEqual(1);
    expect(implicitBlocks).toBeGreaterThanOrEqual(1);
  });

  it("MT-19: at least one Session has freezeLoadsAtCreation=true", async () => {
    const frozen = await db.session.count({
      where: { day: scopes.dayScope, freezeLoadsAtCreation: true },
    });

    expect(frozen).toBeGreaterThanOrEqual(1);
  });

  it("MT-21: tallyCoverage hits every cell at least the required count (umbrella)", async () => {
    const report = await tallyCoverage(db, demoPlanId);

    if (report.missing.length > 0) {
      const summary = report.missing
        .map((c) => `  [${c.category}] ${c.id} (need ${c.required}, source ${c.sourceRef})`)
        .join("\n");

      throw new Error(
        `Coverage gaps: ${report.missing.length}/${report.total} cells underfilled.\n${summary}`,
      );
    }

    expect(report.satisfied).toBe(report.total);
  });

  it("MT-22: catalog has zero canonicalNameLower collisions post-dedupe", async () => {
    const grouped = await db.exercise.groupBy({
      by: ["canonicalNameLower"],
      _count: { _all: true },
    });

    expect(grouped.filter((g) => g._count._all > 1)).toEqual([]);
  });

  it("MT-23: at least one Exercise carries placeholderFlag=true", async () => {
    const count = await db.exercise.count({ where: { placeholderFlag: true } });

    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("MT-24: Phase 7 THURSDAY cluster has exactly 2 Blocks under one Session", async () => {
    const blocks = await db.block.count({
      where: {
        session: {
          day: {
            dayOfWeek: "THURSDAY",
            week: { planId: demoPlanId, notes: { contains: "Phase 7" } },
          },
        },
      },
    });

    expect(blocks).toBe(EXPECTED_PHASE_7_THURSDAY_BLOCKS);
  });

  it("MT-27: archived '2025 Open Prep' parity preserved (status, 1 week, 2025-01-06 startDate)", async () => {
    const archived = await db.trainingPlan.findFirstOrThrow({
      where: { name: ARCHIVED_PLAN_NAME, deletedAt: null },
      select: { id: true, status: true },
    });

    expect(archived.status).toBe("ARCHIVED");

    const weeks = await db.week.findMany({
      where: { planId: archived.id },
      select: { startDate: true },
    });

    expect(weeks.length).toBe(1);
    expect(weeks[0]?.startDate.toISOString()).toBe(ARCHIVED_WEEK_START_ISO);
  });

  it("MT-28: every sub-schema parentSchemaId resolves and shares the parent's blockId", async () => {
    const subSchemas = await db.schema.findMany({
      where: { ...scopes.schemaScope, parentSchemaId: { not: null } },
      select: { blockId: true, parentSchema: { select: { blockId: true } } },
    });

    expect(subSchemas.length).toBeGreaterThan(0);

    for (const sub of subSchemas) {
      expect(sub.parentSchema).not.toBeNull();
      expect(sub.parentSchema?.blockId).toBe(sub.blockId);
    }
  });

  it("MT-29: every non-null trailingConnector resolves to a canonical form name", async () => {
    const orPredicates = CONNECTOR_FORMS.map((form) => ({
      trailingConnector: { path: ["form"], equals: form },
    }));

    const [withConnector, validForm] = await Promise.all([
      db.schema.count({
        where: { ...scopes.schemaScope, trailingConnector: { not: Prisma.AnyNull } },
      }),
      db.schema.count({ where: { ...scopes.schemaScope, OR: orPredicates } }),
    ]);

    expect(validForm).toBe(withConnector);
  });
});
