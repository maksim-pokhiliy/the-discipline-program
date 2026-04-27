import {
  type PersonalRecord as PrismaPersonalRecord,
  type SetLog as PrismaSetLog,
  Prisma,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { detectMaxDistanceInT } from "./max-distance-in-t";

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
  kind: "MAX_DISTANCE_IN_T",
  value: new Prisma.Decimal(value),
  unit: "m",
  context: {},
  achievedAt: new Date("2026-04-01T12:00:00Z"),
  sourceSetLogId: null,
});

describe("detectMaxDistanceInT", () => {
  it("returns create when no prior PR exists", () => {
    const setLog = buildSetLog({ distanceM: 500, durationSec: 120 });
    const decision = detectMaxDistanceInT(setLog, null);

    expect(decision).toEqual({
      kind: "create",
      value: new Prisma.Decimal(500),
      context: { timeSec: 120 },
    });
  });

  it("returns update when candidate distance beats existing PR", () => {
    const setLog = buildSetLog({ distanceM: 600, durationSec: 120 });
    const decision = detectMaxDistanceInT(setLog, buildExistingPr(500));

    expect(decision.kind).toBe("update");

    if (decision.kind === "update") {
      expect(decision.value.equals(new Prisma.Decimal(600))).toBe(true);
      expect(decision.context.timeSec).toBe(120);
    }
  });

  it("returns none when candidate distance equals existing PR", () => {
    const setLog = buildSetLog({ distanceM: 500, durationSec: 120 });

    expect(detectMaxDistanceInT(setLog, buildExistingPr(500))).toEqual({ kind: "none" });
  });

  it("returns none when candidate distance is below existing PR", () => {
    const setLog = buildSetLog({ distanceM: 400, durationSec: 120 });

    expect(detectMaxDistanceInT(setLog, buildExistingPr(500))).toEqual({ kind: "none" });
  });

  it("returns none when distanceM is null", () => {
    const setLog = buildSetLog({ durationSec: 120 });

    expect(detectMaxDistanceInT(setLog, null)).toEqual({ kind: "none" });
  });

  it("returns none when actual is malformed", () => {
    const setLog = buildSetLog(null);

    expect(detectMaxDistanceInT(setLog, null)).toEqual({ kind: "none" });
  });

  it("stores timeSec as undefined when durationSec is absent", () => {
    const setLog = buildSetLog({ distanceM: 300 });
    const decision = detectMaxDistanceInT(setLog, null);

    if (decision.kind === "create") {
      expect(decision.context.timeSec).toBeUndefined();
    }
  });
});
