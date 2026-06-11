import { type PrismaClient as PrismaClientType, Prisma, PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { COVERAGE_CELLS, tallyCoverage } from "../../prisma/seed/plan-emit";
import { lmsWeekApi } from "../endpoints/lms/week/admin";

import {
  buildPlanScopes,
  collectExerciseRefs,
  expectWeeksAreMondayMonotonic,
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
const EXPECTED_COMPOSITION_MIN = 5;
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
const COMPOSITION_REPETITION_KINDS = ["count", "ladder", "timeCap", "cadence", "interval"] as const;
const MULTI_MEMBER_GROUP_MIN = 2;
const EXPECTED_STRUCTURAL_PARALLEL_COUNT = 4;
const EXPECTED_SCHEMA_GROUP_MIN = 5;

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

  it("composition.present counts every schema; composition is required post-pivot so none are DbNull (QA-006)", async () => {
    const [allSchemas, withComposition, absentComposition] = await Promise.all([
      db.schema.count({ where: scopes.schemaScope }),
      db.schema.count({
        where: { ...scopes.schemaScope, composition: { not: Prisma.AnyNull } },
      }),
      db.schema.count({ where: { ...scopes.schemaScope, composition: { equals: Prisma.DbNull } } }),
    ]);

    expect(withComposition).toBeGreaterThanOrEqual(EXPECTED_COMPOSITION_MIN);
    expect(absentComposition).toBe(0);
    expect(withComposition + absentComposition).toBe(allSchemas);

    const report = await tallyCoverage(db, demoPlanId);
    const compositionCell = report.cells.find((c) => c.cell.id === "composition.present");

    expect(compositionCell?.count).toBe(withComposition);
    expect(compositionCell?.satisfied).toBe(true);
    expect(report.total).toBe(COVERAGE_CELLS.length);
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

  it("structural parallel: the ≥2-member SchemaGroup count is pinned and the cells mirror it (DR-W2-1)", async () => {
    const groups = await db.schemaGroup.findMany({
      where: { block: scopes.blockScope },
      select: { _count: { select: { members: true } } },
    });

    expect(groups.length).toBeGreaterThanOrEqual(EXPECTED_SCHEMA_GROUP_MIN);

    const multiMemberGroupCount = groups.filter(
      (group) => group._count.members >= MULTI_MEMBER_GROUP_MIN,
    ).length;

    expect(multiMemberGroupCount).toBe(EXPECTED_STRUCTURAL_PARALLEL_COUNT);

    const report = await tallyCoverage(db, demoPlanId);
    const structuralCell = report.cells.find((c) => c.cell.id === "structural.parallel");
    const multiMemberCell = report.cells.find((c) => c.cell.id === "entity.multiMemberGroup");
    const groupPresenceCell = report.cells.find((c) => c.cell.id === "entity.schemaGroup");

    expect(structuralCell?.count).toBe(multiMemberGroupCount);
    expect(structuralCell?.satisfied).toBe(true);
    expect(multiMemberCell?.count).toBe(multiMemberGroupCount);
    expect(multiMemberCell?.satisfied).toBe(true);
    expect(groupPresenceCell?.count).toBe(groups.length);
    expect(groupPresenceCell?.satisfied).toBe(true);
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
      ...COMPOSITION_REPETITION_KINDS.map((k) => `repetition.kind.${k}`),
      "structural.parallel",
      "entity.schemaGroup",
      "entity.groupMember",
      "entity.multiMemberGroup",
      "rest.present",
      "mediaReference.present",
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

  it("§2: every group member is a flat block-level schema whose groupId resolves to a group in the same block (DR-W2-1)", async () => {
    const members = await db.schema.findMany({
      where: { ...scopes.schemaScope, NOT: { groupId: null } },
      select: { blockId: true, group: { select: { blockId: true } } },
    });

    expect(members.length).toBeGreaterThan(0);

    for (const member of members) {
      expect(member.group).not.toBeNull();
      expect(member.group?.blockId).toBe(member.blockId);
    }
  });

  it("§2: every SchemaGroup has at least one member and is owned by a block in the plan (DR-W2-1)", async () => {
    const groups = await db.schemaGroup.findMany({
      where: { block: scopes.blockScope },
      select: { blockId: true, _count: { select: { members: true } } },
    });

    expect(groups.length).toBeGreaterThanOrEqual(EXPECTED_SCHEMA_GROUP_MIN);

    for (const group of groups) {
      expect(group.blockId).not.toBe("");
      expect(group._count.members).toBeGreaterThanOrEqual(1);
    }
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
