import { type PrismaClient as PrismaClientType, Prisma, PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ARCHETYPE_NAMES } from "@repo/contracts/lms/schema";

import { COVERAGE_CELLS, tallyCoverage } from "../../prisma/seed/plan-emit";
import { lmsWeekApi } from "../endpoints/lms/week/admin";

import {
  buildPlanScopes,
  collectExerciseRefs,
  expectArchetypeNamesAllReferenced,
  expectArchetypeRefsResolveToRows,
  expectWeeksAreMondayMonotonic,
  extractParallelPyramidRefs,
  extractSuperSetRowRefs,
  type PlanScopes,
} from "./_seed-coverage-helpers";

const DEMO_PLAN_TITLE = "CFG Quarter Build";
const ARCHIVED_PLAN_NAME = "2025 Open Prep";
const EXPECTED_WEEK_COUNT = 4;
const EXPECTED_PHASE_7_DAYS = 6;
const EXPECTED_PHASE_7_THURSDAY_BLOCKS = 2;
const EXPECTED_LABEL_MIN = 20;
const EXPECTED_EXERCISE_MIN = 149;
const EXPECTED_ACTIVE_PLANS = 3;
const EXPECTED_CONNECTOR_TOTAL = 3;
const EXPECTED_CONNECTOR_FORM_MIN = 1;
const EXPECTED_COMPOSITION_MIN = 5;
const CONNECTOR_FORMS = ["then", "then_dots", "then_n_rounds"] as const;
const ALL_POSITIONS = [
  "NEUTRAL_GRIP",
  "FROM_SOFA",
  "FROM_BOX",
  "FROM_BOX_OR_SOFA",
  "FROM_SOFA_BOX",
  "WITHOUT_BENCH",
  "WITHOUT_JUMP",
  "HOLD_FARM_CARRY",
  "HAND_ON_DB",
  "HANDS_ON_DB",
  "HAND_ON_DB_NEUTRAL_GRIP",
] as const;
const STAGED_PROGRAM_KINDS = ["drop_set", "wave", "cluster"] as const;
const MEDIA_POSITIONS = ["inline", "standalone_row", "bare"] as const;
const MEDIA_APPLIES_TO = ["previous_row", "current_row", "whole_schema", "drop_stage"] as const;

describe("Seed coverage — synthetic canonical Demo Plan", () => {
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

  it("Demo Plan present, ACTIVE, owned by a coach user", async () => {
    const plan = await db.trainingPlan.findUniqueOrThrow({
      where: { id: demoPlanId },
      select: { name: true, status: true, creator: { select: { role: true } } },
    });

    expect(plan.name).toBe(DEMO_PLAN_TITLE);
    expect(plan.status).toBe("ACTIVE");
    expect(plan.creator.role).toBe("COACH");
  });

  it("catalog meets the matrix §1 floor (≥149 exercises, ≥20 labels)", async () => {
    const [exercises, labels] = await Promise.all([db.exercise.count(), db.label.count()]);

    expect(exercises).toBeGreaterThanOrEqual(EXPECTED_EXERCISE_MIN);
    expect(labels).toBeGreaterThanOrEqual(EXPECTED_LABEL_MIN);
  });

  it("exactly 3 ACTIVE plans (Competitor + Foundations + Demo)", async () => {
    const count = await db.trainingPlan.count({ where: { status: "ACTIVE", deletedAt: null } });

    expect(count).toBe(EXPECTED_ACTIVE_PLANS);
  });

  it("4 weeks; monotonic startDates on UTC Mondays with 7-day gaps", async () => {
    const weeks = await db.week.findMany({
      where: { planId: demoPlanId },
      orderBy: { startDate: "asc" },
      select: { startDate: true },
    });

    expect(weeks.length).toBe(EXPECTED_WEEK_COUNT);
    expectWeeksAreMondayMonotonic(weeks);
  });

  it("§24/§X9: Phase 7 week is last; 6 distinct days × 1 session each", async () => {
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

  it("§3/§2: alt-groups under Demo Plan are well-formed (≥2 members, ≥1 pair-group, exactly one group on the shared-ref block)", async () => {
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

  it("back-patch (QA-10): super-set archetypeParams.params.pairs[].schemaRows resolve to real SchemaRow ids", async () => {
    await expectArchetypeRefsResolveToRows(
      db,
      scopes.schemaScope,
      "super-set",
      extractSuperSetRowRefs,
    );
  });

  it("back-patch (QA-10): parallel-pyramids pairedWithInnerRowId values resolve to real SchemaRow ids", async () => {
    await expectArchetypeRefsResolveToRows(
      db,
      scopes.schemaScope,
      "parallel-pyramids",
      extractParallelPyramidRefs,
    );
  });

  it("§15: trailingConnector populated with all 3 forms, none leaked into Schema.notes", async () => {
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
    expect(thenCount).toBeGreaterThanOrEqual(EXPECTED_CONNECTOR_FORM_MIN);
    expect(thenDots).toBeGreaterThanOrEqual(EXPECTED_CONNECTOR_FORM_MIN);
    expect(thenRounds).toBeGreaterThanOrEqual(EXPECTED_CONNECTOR_FORM_MIN);
  });

  it("composition.present counts only non-null composition rows, excluding absent (DbNull) rows (QA-006)", async () => {
    const [allSchemas, withComposition, absentComposition] = await Promise.all([
      db.schema.count({ where: scopes.schemaScope }),
      db.schema.count({
        where: { ...scopes.schemaScope, composition: { not: Prisma.AnyNull } },
      }),
      db.schema.count({ where: { ...scopes.schemaScope, composition: { equals: Prisma.DbNull } } }),
    ]);

    expect(withComposition).toBeGreaterThanOrEqual(EXPECTED_COMPOSITION_MIN);
    expect(absentComposition).toBeGreaterThan(0);
    expect(withComposition + absentComposition).toBe(allSchemas);

    const report = await tallyCoverage(db, demoPlanId);
    const compositionCell = report.cells.find((c) => c.cell.id === "composition.present");

    expect(compositionCell?.count).toBe(withComposition);
    expect(compositionCell?.satisfied).toBe(true);
    expect(report.total).toBe(COVERAGE_CELLS.length);
  });

  it("§25: no Schema.notes carries a leftover 'connector:' substring", async () => {
    const leaked = await db.schema.findMany({
      where: { ...scopes.schemaScope, notes: { contains: "connector:" } },
      select: { id: true },
    });

    expect(leaked).toEqual([]);
  });

  it("§3: 34 Archetype rows seeded; every name referenced by ≥1 Demo Plan schema", async () => {
    await expectArchetypeNamesAllReferenced(db, scopes.schemaScope, ARCHETYPE_NAMES);
  });

  it("schemas + rows under Demo Plan exist (FK integrity smoke check)", async () => {
    const [schemaCount, rowCount] = await Promise.all([
      db.schema.count({ where: scopes.schemaScope }),
      db.schemaRow.count({ where: { schema: scopes.schemaScope } }),
    ]);

    expect(schemaCount).toBeGreaterThan(0);
    expect(rowCount).toBeGreaterThan(0);
  });

  it("G5: every Demo Plan week reads through getByPlanAndDate without a collision 500, and ≥5 schemas carry composition", async () => {
    const plan = await db.trainingPlan.findUniqueOrThrow({
      where: { id: demoPlanId },
      select: { creatorId: true, weeks: { select: { startDate: true } } },
    });

    expect(plan.weeks.length).toBeGreaterThan(0);

    for (const week of plan.weeks) {
      const startDateParam = week.startDate.toISOString().slice(0, 10);

      await expect(
        lmsWeekApi.getByPlanAndDate(plan.creatorId, demoPlanId, startDateParam),
      ).resolves.toBeDefined();
    }

    const withComposition = await db.schema.count({
      where: { ...scopes.schemaScope, composition: { not: Prisma.AnyNull } },
    });

    expect(withComposition).toBeGreaterThanOrEqual(EXPECTED_COMPOSITION_MIN);
  });

  it("§2: rest-day, active-day, empty-block, implicit-block cells filled", async () => {
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

  it("§2: at least one Session has freezeLoadsAtCreation=true", async () => {
    const frozen = await db.session.count({
      where: { day: scopes.dayScope, freezeLoadsAtCreation: true },
    });

    expect(frozen).toBeGreaterThanOrEqual(1);
  });

  it("every coverage-matrix cell is hit at least Required count — 100% gate (QA-1, MT-21)", async () => {
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
    expect(report.total).toBe(COVERAGE_CELLS.length);
  });

  it("§1/§16/§17/§19: the matrix categories most prone to silent gaps are present in COVERAGE_CELLS", () => {
    const cellIds = new Set(COVERAGE_CELLS.map((c) => c.id));
    const requiredCellIds = [
      "catalog.exercise",
      "catalog.label",
      ...ALL_POSITIONS.map((p) => `position.${p}`),
      ...STAGED_PROGRAM_KINDS.map((k) => `stagedProgram.${k}`),
      ...MEDIA_POSITIONS.map((p) => `mediaReference.position.${p}`),
      ...MEDIA_APPLIES_TO.map((a) => `mediaReference.appliesTo.${a}`),
    ];

    const missing = requiredCellIds.filter((id) => !cellIds.has(id));

    expect(missing).toEqual([]);
  });

  it("catalog has zero canonicalNameLower collisions", async () => {
    const grouped = await db.exercise.groupBy({
      by: ["canonicalNameLower"],
      _count: { _all: true },
    });

    expect(grouped.filter((g) => g._count._all > 1)).toEqual([]);
  });

  it("§5/§6.1: at least one Exercise carries placeholderFlag=true", async () => {
    const count = await db.exercise.count({ where: { placeholderFlag: true } });

    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("§24: Phase 7 THURSDAY super-set has exactly 2 Blocks under one Session", async () => {
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

  it("archived '2025 Open Prep' present and empty (ARCHIVED, no weeks)", async () => {
    const archived = await db.trainingPlan.findFirstOrThrow({
      where: { name: ARCHIVED_PLAN_NAME, deletedAt: null },
      select: { id: true, status: true },
    });

    expect(archived.status).toBe("ARCHIVED");

    const weekCount = await db.week.count({ where: { planId: archived.id } });

    expect(weekCount).toBe(0);
  });

  it("§2: every sub-schema parentSchemaId resolves and shares the parent's blockId", async () => {
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

  it("§15: every non-null trailingConnector resolves to a canonical form name", async () => {
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

describe("Exercise-ref resolution — DB side (QA-001 regression)", () => {
  const db: PrismaClientType = new PrismaClient();

  let scopes: PlanScopes;

  beforeAll(async () => {
    const plan = await db.trainingPlan.findFirst({
      where: { name: DEMO_PLAN_TITLE, deletedAt: null },
      select: { id: true },
    });

    if (plan === null) {
      throw new Error(`Demo Plan "${DEMO_PLAN_TITLE}" not seeded — run db:reset && db:seed first`);
    }

    scopes = buildPlanScopes(plan.id);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("every rowPayload exercise ref resolves to a real Exercise.id (QA-2, the Plan Editor render contract)", async () => {
    const rows = await db.schemaRow.findMany({
      where: { schema: scopes.schemaScope },
      select: { rowPayload: true },
    });

    expect(rows.length).toBeGreaterThan(0);

    const referenced = new Set<string>();

    for (const row of rows) {
      collectExerciseRefs(row.rowPayload, referenced);
    }

    expect(referenced.size).toBeGreaterThan(0);

    const existing = await db.exercise.findMany({
      where: { id: { in: [...referenced] } },
      select: { id: true },
    });

    expect(existing.length).toBe(referenced.size);
  });

  it("a sampled atomic EXERCISE row resolves its exerciseId via findUnique (proves emit wrote the deterministic id)", async () => {
    const atomicRow = await db.schemaRow.findFirst({
      where: {
        schema: scopes.schemaScope,
        rowKind: "EXERCISE",
        rowPayload: { path: ["exercise", "form"], equals: "atomic" },
      },
      select: { rowPayload: true },
    });

    expect(atomicRow).not.toBeNull();

    const refs = new Set<string>();

    collectExerciseRefs(atomicRow?.rowPayload, refs);

    expect(refs.size).toBeGreaterThanOrEqual(1);

    for (const ref of refs) {
      const exercise = await db.exercise.findUnique({ where: { id: ref }, select: { id: true } });

      expect(exercise).not.toBeNull();
    }
  });
});
