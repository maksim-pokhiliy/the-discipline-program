import {
  type PersonalRecord as PrismaPersonalRecord,
  type SetLog as PrismaSetLog,
  Prisma,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { detectNRepMax } from "./n-rep-max";

const buildSetLog = (actual: unknown): PrismaSetLog => ({
  id: "setlog-id",
  exerciseLogId: "exercise-log-id",
  order: 0,
  prescribed: {} as Prisma.JsonValue,
  actual: actual as Prisma.JsonValue,
  failed: false,
  notes: null,
  completedAt: new Date("2026-04-26T12:00:00Z"),
});

const buildExistingPr = (value: number): PrismaPersonalRecord => ({
  id: "pr-id",
  userId: "user-id",
  exerciseId: "exercise-id",
  kind: "N_REP_MAX",
  value: new Prisma.Decimal(value),
  unit: "kg",
  context: {},
  achievedAt: new Date("2026-04-01T12:00:00Z"),
  sourceSetLogId: null,
});

describe("detectNRepMax", () => {
  it("returns create with raw load when no prior PR exists", () => {
    const setLog = buildSetLog({ load: { kind: "BARBELL", kg: 120 }, reps: 3 });
    const decision = detectNRepMax(setLog, null);

    expect(decision).toEqual({
      kind: "create",
      value: new Prisma.Decimal(120),
      context: { targetReps: 3 },
    });
  });

  it("returns update when candidate load beats existing PR", () => {
    const setLog = buildSetLog({ load: { kind: "BARBELL", kg: 130 }, reps: 3 });
    const decision = detectNRepMax(setLog, buildExistingPr(120));

    expect(decision.kind).toBe("update");

    if (decision.kind === "update") {
      expect(decision.value.equals(new Prisma.Decimal(130))).toBe(true);
      expect(decision.context.targetReps).toBe(3);
    }
  });

  it("returns none when candidate load equals existing PR", () => {
    const setLog = buildSetLog({ load: { kind: "BARBELL", kg: 120 }, reps: 3 });

    expect(detectNRepMax(setLog, buildExistingPr(120))).toEqual({ kind: "none" });
  });

  it("returns none when candidate load is below existing PR", () => {
    const setLog = buildSetLog({ load: { kind: "BARBELL", kg: 100 }, reps: 3 });

    expect(detectNRepMax(setLog, buildExistingPr(120))).toEqual({ kind: "none" });
  });

  it("returns none when load is null", () => {
    const setLog = buildSetLog({ reps: 3 });

    expect(detectNRepMax(setLog, null)).toEqual({ kind: "none" });
  });

  it("returns none when reps is null", () => {
    const setLog = buildSetLog({ load: { kind: "BARBELL", kg: 100 } });

    expect(detectNRepMax(setLog, null)).toEqual({ kind: "none" });
  });

  it("returns none when reps is zero", () => {
    const setLog = buildSetLog({ load: { kind: "BARBELL", kg: 100 }, reps: 0 });

    expect(detectNRepMax(setLog, null)).toEqual({ kind: "none" });
  });

  it("returns none for non-kg load kinds (BANDED)", () => {
    const setLog = buildSetLog({ load: { kind: "BANDED", tension: "red" }, reps: 5 });

    expect(detectNRepMax(setLog, null)).toEqual({ kind: "none" });
  });
});
