import {
  type PersonalRecord as PrismaPersonalRecord,
  type SetLog as PrismaSetLog,
  Prisma,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { detectOneRepMax } from "./one-rep-max";

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
  kind: "ONE_REP_MAX",
  value: new Prisma.Decimal(value),
  unit: "kg",
  context: {},
  achievedAt: new Date("2026-04-01T12:00:00Z"),
  sourceSetLogId: null,
});

describe("detectOneRepMax", () => {
  it("returns create using epley formula when no prior PR exists", () => {
    const setLog = buildSetLog({ load: { kind: "BARBELL", kg: 100 }, reps: 5 });
    const decision = detectOneRepMax(setLog, null);

    expect(decision.kind).toBe("create");

    if (decision.kind === "create") {
      expect(decision.value.toNumber()).toBeCloseTo(100 * (1 + 5 / 30), 5);
      expect(decision.context).toEqual({ load: 100, reps: 5, formula: "epley" });
    }
  });

  it("uses raw load when reps === 1", () => {
    const setLog = buildSetLog({ load: { kind: "BARBELL", kg: 140 }, reps: 1 });
    const decision = detectOneRepMax(setLog, null);

    expect(decision.kind).toBe("create");

    if (decision.kind === "create") {
      expect(decision.value.toNumber()).toBe(140);
    }
  });

  it("returns update when computed 1RM beats existing PR", () => {
    const setLog = buildSetLog({ load: { kind: "BARBELL", kg: 100 }, reps: 5 });
    const decision = detectOneRepMax(setLog, buildExistingPr(110));

    expect(decision.kind).toBe("update");

    if (decision.kind === "update") {
      expect(decision.value.toNumber()).toBeCloseTo(116.67, 1);
    }
  });

  it("returns none when computed 1RM does not exceed existing PR", () => {
    const setLog = buildSetLog({ load: { kind: "BARBELL", kg: 80 }, reps: 5 });
    const decision = detectOneRepMax(setLog, buildExistingPr(120));

    expect(decision).toEqual({ kind: "none" });
  });

  it("returns none when computed 1RM equals existing PR", () => {
    const kg = 100;
    const reps = 5;
    const computed = kg * (1 + reps / 30);
    const setLog = buildSetLog({ load: { kind: "BARBELL", kg }, reps });
    const decision = detectOneRepMax(setLog, buildExistingPr(computed));

    expect(decision).toEqual({ kind: "none" });
  });

  it("returns none when reps are missing", () => {
    const setLog = buildSetLog({ load: { kind: "BARBELL", kg: 100 } });

    expect(detectOneRepMax(setLog, null)).toEqual({ kind: "none" });
  });

  it("returns none when load is missing", () => {
    const setLog = buildSetLog({ reps: 5 });

    expect(detectOneRepMax(setLog, null)).toEqual({ kind: "none" });
  });

  it("returns none for non-kg load kinds (NONE)", () => {
    const setLog = buildSetLog({ load: { kind: "NONE" }, reps: 5 });

    expect(detectOneRepMax(setLog, null)).toEqual({ kind: "none" });
  });

  it("supports DOUBLE_DB load using kgEach", () => {
    const setLog = buildSetLog({ load: { kind: "DOUBLE_DB", kgEach: 30 }, reps: 3 });
    const decision = detectOneRepMax(setLog, null);

    expect(decision.kind).toBe("create");

    if (decision.kind === "create") {
      expect(decision.value.toNumber()).toBeCloseTo(30 * (1 + 3 / 30), 5);
    }
  });
});
