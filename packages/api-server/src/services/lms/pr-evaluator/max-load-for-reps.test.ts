import {
  type PersonalRecord as PrismaPersonalRecord,
  type SetLog as PrismaSetLog,
  Prisma,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { detectMaxLoadForReps } from "./max-load-for-reps";

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

const buildExistingPr = (value: number, fixedReps: number | undefined): PrismaPersonalRecord => ({
  id: "pr-id",
  userId: "user-id",
  exerciseId: "exercise-id",
  kind: "MAX_LOAD_FOR_REPS",
  value: new Prisma.Decimal(value),
  unit: "kg",
  context: fixedReps === undefined ? {} : { fixedReps },
  achievedAt: new Date("2026-04-01T12:00:00Z"),
  sourceSetLogId: null,
});

describe("detectMaxLoadForReps", () => {
  it("returns create with the candidate value when no prior PR exists", () => {
    const setLog = buildSetLog({ load: { kind: "BARBELL", kg: 100 }, reps: 5 });
    const decision = detectMaxLoadForReps(setLog, null);

    expect(decision).toEqual({
      kind: "create",
      value: new Prisma.Decimal(100),
      context: { fixedReps: 5 },
    });
  });

  it("returns update when candidate beats existing PR at same reps", () => {
    const setLog = buildSetLog({ load: { kind: "BARBELL", kg: 105 }, reps: 5 });
    const decision = detectMaxLoadForReps(setLog, buildExistingPr(100, 5));

    expect(decision.kind).toBe("update");

    if (decision.kind === "update") {
      expect(decision.value.equals(new Prisma.Decimal(105))).toBe(true);
      expect(decision.context.fixedReps).toBe(5);
    }
  });

  it("returns none when candidate equals existing PR value at same reps", () => {
    const setLog = buildSetLog({ load: { kind: "BARBELL", kg: 100 }, reps: 5 });
    const decision = detectMaxLoadForReps(setLog, buildExistingPr(100, 5));

    expect(decision).toEqual({ kind: "none" });
  });

  it("returns none when candidate is below existing PR at same reps", () => {
    const setLog = buildSetLog({ load: { kind: "BARBELL", kg: 90 }, reps: 5 });
    const decision = detectMaxLoadForReps(setLog, buildExistingPr(100, 5));

    expect(decision).toEqual({ kind: "none" });
  });

  it("treats different rep count as new slot and returns update", () => {
    const setLog = buildSetLog({ load: { kind: "BARBELL", kg: 80 }, reps: 8 });
    const decision = detectMaxLoadForReps(setLog, buildExistingPr(100, 5));

    expect(decision.kind).toBe("update");

    if (decision.kind === "update") {
      expect(decision.value.equals(new Prisma.Decimal(80))).toBe(true);
      expect(decision.context.fixedReps).toBe(8);
    }
  });

  it("returns none when reps are missing from actual", () => {
    const setLog = buildSetLog({ load: { kind: "BARBELL", kg: 100 } });
    const decision = detectMaxLoadForReps(setLog, null);

    expect(decision).toEqual({ kind: "none" });
  });

  it("returns none when load is missing from actual", () => {
    const setLog = buildSetLog({ reps: 5 });
    const decision = detectMaxLoadForReps(setLog, null);

    expect(decision).toEqual({ kind: "none" });
  });

  it("returns none for non-load LoadSpec kinds (NONE/BANDED)", () => {
    const setLogNone = buildSetLog({ load: { kind: "NONE" }, reps: 5 });

    expect(detectMaxLoadForReps(setLogNone, null)).toEqual({ kind: "none" });

    const setLogBanded = buildSetLog({ load: { kind: "BANDED", tension: "red" }, reps: 5 });

    expect(detectMaxLoadForReps(setLogBanded, null)).toEqual({ kind: "none" });
  });

  it("supports DOUBLE_DB load by using kgEach", () => {
    const setLog = buildSetLog({ load: { kind: "DOUBLE_DB", kgEach: 22.5 }, reps: 6 });
    const decision = detectMaxLoadForReps(setLog, null);

    expect(decision.kind).toBe("create");

    if (decision.kind === "create") {
      expect(decision.value.equals(new Prisma.Decimal(22.5))).toBe(true);
      expect(decision.context.fixedReps).toBe(6);
    }
  });

  it("returns create when existing PR row exists but context lacks fixedReps", () => {
    const setLog = buildSetLog({ load: { kind: "BARBELL", kg: 60 }, reps: 5 });
    const decision = detectMaxLoadForReps(setLog, buildExistingPr(100, undefined));

    expect(decision.kind).toBe("update");
  });
});
