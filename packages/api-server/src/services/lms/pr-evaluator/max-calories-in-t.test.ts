import {
  type PersonalRecord as PrismaPersonalRecord,
  type SetLog as PrismaSetLog,
  Prisma,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { detectMaxCaloriesInT } from "./max-calories-in-t";

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
  kind: "MAX_CALORIES_IN_T",
  value: new Prisma.Decimal(value),
  unit: "cal",
  context: {},
  achievedAt: new Date("2026-04-01T12:00:00Z"),
  sourceSetLogId: null,
});

describe("detectMaxCaloriesInT", () => {
  it("returns create when no prior PR exists", () => {
    const setLog = buildSetLog({ calories: 50, durationSec: 120 });
    const decision = detectMaxCaloriesInT(setLog, null);

    expect(decision).toEqual({
      kind: "create",
      value: new Prisma.Decimal(50),
      context: { timeSec: 120 },
    });
  });

  it("returns update when candidate calories beats existing PR", () => {
    const setLog = buildSetLog({ calories: 65, durationSec: 120 });
    const decision = detectMaxCaloriesInT(setLog, buildExistingPr(50));

    expect(decision.kind).toBe("update");

    if (decision.kind === "update") {
      expect(decision.value.equals(new Prisma.Decimal(65))).toBe(true);
      expect(decision.context.timeSec).toBe(120);
    }
  });

  it("returns none when candidate calories equals existing PR", () => {
    const setLog = buildSetLog({ calories: 50, durationSec: 120 });

    expect(detectMaxCaloriesInT(setLog, buildExistingPr(50))).toEqual({ kind: "none" });
  });

  it("returns none when candidate calories is below existing PR", () => {
    const setLog = buildSetLog({ calories: 40, durationSec: 120 });

    expect(detectMaxCaloriesInT(setLog, buildExistingPr(50))).toEqual({ kind: "none" });
  });

  it("returns none when calories is null", () => {
    const setLog = buildSetLog({ durationSec: 120 });

    expect(detectMaxCaloriesInT(setLog, null)).toEqual({ kind: "none" });
  });

  it("returns none when actual is malformed", () => {
    const setLog = buildSetLog(null);

    expect(detectMaxCaloriesInT(setLog, null)).toEqual({ kind: "none" });
  });

  it("stores timeSec as undefined when durationSec is absent", () => {
    const setLog = buildSetLog({ calories: 30 });
    const decision = detectMaxCaloriesInT(setLog, null);

    if (decision.kind === "create") {
      expect(decision.context.timeSec).toBeUndefined();
    }
  });
});
