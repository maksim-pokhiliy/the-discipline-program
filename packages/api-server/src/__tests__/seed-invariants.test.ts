import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ARCHETYPE_NAMES } from "@repo/contracts/lms/schema";

const ARCHIVED_PLAN_NAME = "2025 Open Prep";
const SEED_WEEK_START_ISO = "2025-01-06T00:00:00.000Z";

describe("Seed invariants — training-domain referential integrity", () => {
  const db = new PrismaClient();

  let seedWeekId: string | null = null;

  beforeAll(async () => {
    const plan = await db.trainingPlan.findFirst({
      where: { name: ARCHIVED_PLAN_NAME, deletedAt: null },
    });

    if (!plan) {
      return;
    }

    const week = await db.week.findFirst({
      where: { planId: plan.id, startDate: new Date(SEED_WEEK_START_ISO) },
    });

    seedWeekId = week?.id ?? null;
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("seeded the canonical Open Prep week (pre-condition for the rest)", () => {
    expect(seedWeekId).not.toBeNull();
  });

  it("T1: every Schema.alternatingGroupId references an existing AlternatingGroup in the same block", async () => {
    if (seedWeekId === null) {
      throw new Error("seed week missing; cannot validate invariant");
    }

    const members = await db.schema.findMany({
      where: {
        alternatingGroupId: { not: null },
        block: { session: { day: { weekId: seedWeekId } } },
      },
      select: { id: true, blockId: true, alternatingGroupId: true },
    });

    expect(members.length).toBeGreaterThan(0);

    for (const member of members) {
      expect(member.alternatingGroupId).not.toBeNull();

      const group = await db.alternatingGroup.findUnique({
        where: { id: member.alternatingGroupId as string },
        select: { id: true, blockId: true },
      });

      expect(group).not.toBeNull();
      expect(group?.blockId).toBe(member.blockId);
    }
  });

  it("T2: every BlockLabelAssignment.labelId references an existing Label", async () => {
    if (seedWeekId === null) {
      throw new Error("seed week missing; cannot validate invariant");
    }

    const assignments = await db.blockLabelAssignment.findMany({
      where: { block: { session: { day: { weekId: seedWeekId } } } },
      select: { id: true, labelId: true },
    });

    expect(assignments.length).toBeGreaterThan(0);

    const labelIds = new Set(assignments.map((a) => a.labelId));
    const existingLabels = await db.label.findMany({
      where: { id: { in: Array.from(labelIds) } },
      select: { id: true },
    });

    expect(existingLabels.length).toBe(labelIds.size);
  });

  it("T3: every atomic EXERCISE row references an existing Exercise (resolved via rowPayload.exercise.exerciseId)", async () => {
    if (seedWeekId === null) {
      throw new Error("seed week missing; cannot validate invariant");
    }

    const rows = await db.schemaRow.findMany({
      where: {
        rowKind: "EXERCISE",
        schema: { block: { session: { day: { weekId: seedWeekId } } } },
      },
      select: { id: true, rowPayload: true },
    });

    expect(rows.length).toBeGreaterThan(0);

    const referencedExerciseIds = new Set<string>();

    for (const row of rows) {
      const payload = row.rowPayload as { exercise?: { form?: string; exerciseId?: string } };
      const exercise = payload.exercise;

      if (exercise?.form === "atomic" && typeof exercise.exerciseId === "string") {
        referencedExerciseIds.add(exercise.exerciseId);
      }
    }

    expect(referencedExerciseIds.size).toBeGreaterThan(0);

    const existing = await db.exercise.findMany({
      where: { id: { in: Array.from(referencedExerciseIds) } },
      select: { id: true },
    });

    expect(existing.length).toBe(referencedExerciseIds.size);
  });

  it("T4: every AlternatingGroup has at least 2 member schemas in its block (alternatingGroupSchema.schemaIds.min(2) invariant)", async () => {
    if (seedWeekId === null) {
      throw new Error("seed week missing; cannot validate invariant");
    }

    const groups = await db.alternatingGroup.findMany({
      where: { block: { session: { day: { weekId: seedWeekId } } } },
      select: { id: true, blockId: true, schemas: { select: { id: true, blockId: true } } },
    });

    expect(groups.length).toBeGreaterThan(0);

    for (const group of groups) {
      expect(group.schemas.length).toBeGreaterThanOrEqual(2);

      for (const member of group.schemas) {
        expect(member.blockId).toBe(group.blockId);
      }
    }
  });

  it("T5: every super-set archetypeParams.pairs[].schemaRows references an existing SchemaRow (no placeholder leaks)", async () => {
    if (seedWeekId === null) {
      throw new Error("seed week missing; cannot validate invariant");
    }

    const superSetSchemas = await db.schema.findMany({
      where: {
        archetype: { name: "super-set" },
        block: { session: { day: { weekId: seedWeekId } } },
      },
      select: { id: true, archetypeParams: true },
    });

    expect(superSetSchemas.length).toBeGreaterThan(0);

    const referencedRowIds = new Set<string>();

    for (const schema of superSetSchemas) {
      const archetypeParams = schema.archetypeParams as {
        params?: { pairs?: { schemaRows?: string[] }[] };
      };

      for (const pair of archetypeParams.params?.pairs ?? []) {
        for (const rowId of pair.schemaRows ?? []) {
          referencedRowIds.add(rowId);
        }
      }
    }

    expect(referencedRowIds.size).toBeGreaterThan(0);

    const existing = await db.schemaRow.findMany({
      where: { id: { in: Array.from(referencedRowIds) } },
      select: { id: true },
    });

    expect(existing.length).toBe(referencedRowIds.size);
  });

  it("T6: every Archetype exposes a non-empty label (C0-001 + QA-001 invariant)", async () => {
    const archetypes = await db.archetype.findMany({
      select: { name: true, label: true },
    });

    expect(archetypes.length).toBe(ARCHETYPE_NAMES.length);

    for (const archetype of archetypes) {
      expect(archetype.label).toBeTruthy();
      expect(archetype.label.trim().length).toBeGreaterThan(0);
    }
  });
});
