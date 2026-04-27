import {
  type PersonalRecord as PrismaPersonalRecord,
  type SetLog as PrismaSetLog,
  Prisma,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { detectBestTimeForX } from "./best-time-for-x";

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
  kind: "BEST_TIME_FOR_X",
  value: new Prisma.Decimal(value),
  unit: "sec",
  context: {},
  achievedAt: new Date("2026-04-01T12:00:00Z"),
  sourceSetLogId: null,
});

describe("detectBestTimeForX", () => {
  it("returns create when no prior PR exists", () => {
    const setLog = buildSetLog({ durationSec: 180, reps: 21, distanceM: undefined });
    const decision = detectBestTimeForX(setLog, null);

    expect(decision).toEqual({
      kind: "create",
      value: new Prisma.Decimal(180),
      context: { targetReps: 21, targetDistanceM: undefined },
    });
  });

  it("returns update when candidate time is lower than existing PR (lower is better)", () => {
    const setLog = buildSetLog({ durationSec: 170 });
    const decision = detectBestTimeForX(setLog, buildExistingPr(180));

    expect(decision.kind).toBe("update");

    if (decision.kind === "update") {
      expect(decision.value.equals(new Prisma.Decimal(170))).toBe(true);
    }
  });

  it("returns none when candidate time equals existing PR", () => {
    const setLog = buildSetLog({ durationSec: 180 });

    expect(detectBestTimeForX(setLog, buildExistingPr(180))).toEqual({ kind: "none" });
  });

  it("returns none when candidate time is greater than existing PR", () => {
    const setLog = buildSetLog({ durationSec: 200 });

    expect(detectBestTimeForX(setLog, buildExistingPr(180))).toEqual({ kind: "none" });
  });

  it("returns none when durationSec is null", () => {
    const setLog = buildSetLog({ reps: 21 });

    expect(detectBestTimeForX(setLog, null)).toEqual({ kind: "none" });
  });

  it("returns none when actual is malformed", () => {
    const setLog = buildSetLog(null);

    expect(detectBestTimeForX(setLog, null)).toEqual({ kind: "none" });
  });

  it("includes targetDistanceM in context when present", () => {
    const setLog = buildSetLog({ durationSec: 240, distanceM: 400 });
    const decision = detectBestTimeForX(setLog, null);

    if (decision.kind === "create") {
      expect(decision.context.targetDistanceM).toBe(400);
    }
  });
});
