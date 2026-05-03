import {
  type PersonalRecord as PrismaPersonalRecord,
  type SetLog as PrismaSetLog,
  Prisma,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { detectMaxRepsTotal } from "./max-reps-total";

const buildSetLog = (actual: unknown, id = "setlog-id"): PrismaSetLog => ({
  id,
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
  kind: "MAX_REPS_TOTAL",
  value: new Prisma.Decimal(value),
  unit: "reps",
  context: {},
  achievedAt: new Date("2026-04-01T12:00:00Z"),
  sourceSetLogId: null,
});

describe("detectMaxRepsTotal", () => {
  it("returns create with summed reps across sibling sets when no prior PR exists", () => {
    const sets = [
      buildSetLog({ reps: 10 }, "s1"),
      buildSetLog({ reps: 8 }, "s2"),
      buildSetLog({ reps: 7 }, "s3"),
    ];
    const decision = detectMaxRepsTotal(sets, null);

    expect(decision).toEqual({
      kind: "create",
      value: new Prisma.Decimal(25),
      context: { totalReps: 25 },
    });
  });

  it("returns update when total beats existing PR", () => {
    const sets = [buildSetLog({ reps: 15 }, "s1"), buildSetLog({ reps: 12 }, "s2")];
    const decision = detectMaxRepsTotal(sets, buildExistingPr(25));

    expect(decision.kind).toBe("update");

    if (decision.kind === "update") {
      expect(decision.value.equals(new Prisma.Decimal(27))).toBe(true);
      expect(decision.context.totalReps).toBe(27);
    }
  });

  it("returns none when total equals existing PR", () => {
    const sets = [buildSetLog({ reps: 10 }, "s1"), buildSetLog({ reps: 15 }, "s2")];

    expect(detectMaxRepsTotal(sets, buildExistingPr(25))).toEqual({ kind: "none" });
  });

  it("returns none when total is below existing PR", () => {
    const sets = [buildSetLog({ reps: 8 }, "s1"), buildSetLog({ reps: 7 }, "s2")];

    expect(detectMaxRepsTotal(sets, buildExistingPr(25))).toEqual({ kind: "none" });
  });

  it("skips sets with null reps when summing", () => {
    const sets = [
      buildSetLog({ reps: 10 }, "s1"),
      buildSetLog({ load: { kind: "BARBELL", kg: 100 } }, "s2"),
      buildSetLog({ reps: 8 }, "s3"),
    ];
    const decision = detectMaxRepsTotal(sets, null);

    expect(decision.kind).toBe("create");

    if (decision.kind === "create") {
      expect(decision.value.equals(new Prisma.Decimal(18))).toBe(true);
    }
  });

  it("returns none when all sets have null reps", () => {
    const sets = [
      buildSetLog({ load: { kind: "BARBELL", kg: 100 } }, "s1"),
      buildSetLog({ durationSec: 60 }, "s2"),
    ];

    expect(detectMaxRepsTotal(sets, null)).toEqual({ kind: "none" });
  });

  it("returns none for empty sibling set list", () => {
    expect(detectMaxRepsTotal([], null)).toEqual({ kind: "none" });
  });
});
