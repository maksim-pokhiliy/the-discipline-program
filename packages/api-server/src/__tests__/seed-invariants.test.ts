import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const CANONICAL_PLAN_NAME = "CFG Quarter Build";

describe("Seed invariants — training-domain referential integrity", () => {
  const db = new PrismaClient();

  let seedPlanId: string | null = null;

  beforeAll(async () => {
    const plan = await db.trainingPlan.findFirst({
      where: { name: CANONICAL_PLAN_NAME, deletedAt: null },
    });

    seedPlanId = plan?.id ?? null;
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("seeded the canonical CFG Quarter Build plan (pre-condition for the rest)", () => {
    expect(seedPlanId).not.toBeNull();
  });

  it("T2: every BlockLabelAssignment.labelId references an existing Label", async () => {
    if (seedPlanId === null) {
      throw new Error("seed plan missing; cannot validate invariant");
    }

    const assignments = await db.blockLabelAssignment.findMany({
      where: { block: { session: { day: { week: { planId: seedPlanId } } } } },
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

  it("T3: every row references an existing Exercise (resolved via the SchemaRow.exerciseId column)", async () => {
    if (seedPlanId === null) {
      throw new Error("seed plan missing; cannot validate invariant");
    }

    const rows = await db.schemaRow.findMany({
      where: {
        schema: { block: { session: { day: { week: { planId: seedPlanId } } } } },
      },
      select: { id: true, exerciseId: true },
    });

    expect(rows.length).toBeGreaterThan(0);

    const referencedExerciseIds = new Set(rows.map((row) => row.exerciseId));

    expect(referencedExerciseIds.size).toBeGreaterThan(0);

    const existing = await db.exercise.findMany({
      where: { id: { in: Array.from(referencedExerciseIds) } },
      select: { id: true },
    });

    expect(existing.length).toBe(referencedExerciseIds.size);
  });

  it("T4: every RowModifierAssignment.modifierId references an existing Modifier", async () => {
    if (seedPlanId === null) {
      throw new Error("seed plan missing; cannot validate invariant");
    }

    const assignments = await db.rowModifierAssignment.findMany({
      where: { row: { schema: { block: { session: { day: { week: { planId: seedPlanId } } } } } } },
      select: { modifierId: true },
    });

    expect(assignments.length).toBeGreaterThan(0);

    const modifierIds = new Set(assignments.map((a) => a.modifierId));
    const existing = await db.modifier.findMany({
      where: { id: { in: Array.from(modifierIds) } },
      select: { id: true },
    });

    expect(existing.length).toBe(modifierIds.size);
  });

  it("T5: every RowGroup-member row's rowGroupId resolves to a RowGroup in the same schema", async () => {
    if (seedPlanId === null) {
      throw new Error("seed plan missing; cannot validate invariant");
    }

    const members = await db.schemaRow.findMany({
      where: {
        rowGroupId: { not: null },
        schema: { block: { session: { day: { week: { planId: seedPlanId } } } } },
      },
      select: { schemaId: true, rowGroup: { select: { schemaId: true } } },
    });

    expect(members.length).toBeGreaterThan(0);

    for (const member of members) {
      expect(member.rowGroup).not.toBeNull();
      expect(member.rowGroup?.schemaId).toBe(member.schemaId);
    }
  });
});
