import {
  type PersonalRecord as PrismaPersonalRecord,
  type SetLog as PrismaSetLog,
  Prisma,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { detectMaxRepsUnbroken } from "./max-reps-unbroken";

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
  kind: "MAX_REPS_UNBROKEN",
  value: new Prisma.Decimal(value),
  unit: "reps",
  context: {},
  achievedAt: new Date("2026-04-01T12:00:00Z"),
  sourceSetLogId: null,
});

describe("detectMaxRepsUnbroken", () => {
  it("returns create when no prior PR exists", () => {
    const setLog = buildSetLog({ reps: 25 });
    const decision = detectMaxRepsUnbroken(setLog, null, 0);

    expect(decision).toEqual({
      kind: "create",
      value: new Prisma.Decimal(25),
      context: { setIndex: 0 },
    });
  });

  it("returns update when candidate reps beats existing PR", () => {
    const setLog = buildSetLog({ reps: 30 });
    const decision = detectMaxRepsUnbroken(setLog, buildExistingPr(25), 2);

    expect(decision.kind).toBe("update");

    if (decision.kind === "update") {
      expect(decision.value.equals(new Prisma.Decimal(30))).toBe(true);
      expect(decision.context.setIndex).toBe(2);
    }
  });

  it("returns none when candidate reps equals existing PR", () => {
    const setLog = buildSetLog({ reps: 25 });

    expect(detectMaxRepsUnbroken(setLog, buildExistingPr(25), 0)).toEqual({ kind: "none" });
  });

  it("returns none when candidate reps is below existing PR", () => {
    const setLog = buildSetLog({ reps: 20 });

    expect(detectMaxRepsUnbroken(setLog, buildExistingPr(25), 0)).toEqual({ kind: "none" });
  });

  it("returns none when reps is null", () => {
    const setLog = buildSetLog({ load: { kind: "BARBELL", kg: 100 } });

    expect(detectMaxRepsUnbroken(setLog, null, 0)).toEqual({ kind: "none" });
  });

  it("returns none when reps is zero", () => {
    const setLog = buildSetLog({ reps: 0 });

    expect(detectMaxRepsUnbroken(setLog, null, 0)).toEqual({ kind: "none" });
  });

  it("stores correct setIndex in context", () => {
    const setLog = buildSetLog({ reps: 10 });
    const decision = detectMaxRepsUnbroken(setLog, null, 3);

    if (decision.kind === "create") {
      expect(decision.context.setIndex).toBe(3);
    }
  });
});
