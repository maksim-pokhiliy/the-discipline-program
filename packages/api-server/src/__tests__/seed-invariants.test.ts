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

  it("T3: every atomic EXERCISE row references an existing Exercise (resolved via rowPayload.exercise.exerciseId)", async () => {
    if (seedPlanId === null) {
      throw new Error("seed plan missing; cannot validate invariant");
    }

    const rows = await db.schemaRow.findMany({
      where: {
        rowKind: "EXERCISE",
        schema: { block: { session: { day: { week: { planId: seedPlanId } } } } },
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
});
