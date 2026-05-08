import { describe, expect, it } from "vitest";

import { type SchemeParams } from "@repo/contracts/lms/_domain";
import { type SchemeType } from "@repo/contracts/lms/scheme-type";

import { formatSchemeSummary } from "./scheme-summary";

const buildSchemeType = (name: string, archetypeKind: SchemeType["archetypeKind"]): SchemeType => ({
  id: "ckxw5p7gp0000q1mnzv5cuq0a",
  name,
  archetypeKind,
  defaultParams: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
});

describe("formatSchemeSummary", () => {
  it("returns the bare scheme name for the NONE archetype", () => {
    const schemeType = buildSchemeType("For Time", "NONE");
    const params: SchemeParams = { kind: "NONE" };

    expect(formatSchemeSummary(schemeType, params)).toBe("For Time");
  });

  it("uses the singular set label when SETS_REPS has exactly one set", () => {
    const schemeType = buildSchemeType("Sets × Reps", "SETS_REPS");
    const params: SchemeParams = { kind: "SETS_REPS", sets: 1 };

    expect(formatSchemeSummary(schemeType, params)).toBe("Sets × Reps • 1 set");
  });

  it("renders SETS_REPS with the plural set label for multi-set blocks", () => {
    const schemeType = buildSchemeType("Sets × Reps", "SETS_REPS");
    const params: SchemeParams = { kind: "SETS_REPS", sets: 5 };

    expect(formatSchemeSummary(schemeType, params)).toBe("Sets × Reps • 5 sets");
  });

  it("renders SETS_REPS with a larger set count", () => {
    const schemeType = buildSchemeType("Sets × Reps", "SETS_REPS");
    const params: SchemeParams = { kind: "SETS_REPS", sets: 12 };

    expect(formatSchemeSummary(schemeType, params)).toBe("Sets × Reps • 12 sets");
  });

  it("ignores progression on SETS_REPS in the one-line block summary", () => {
    const schemeType = buildSchemeType("Sets × Reps", "SETS_REPS");
    const params: SchemeParams = {
      kind: "SETS_REPS",
      sets: 5,
      progression: [
        { round: 1, reps: [5] },
        { round: 2, reps: [3] },
        { round: 3, reps: [1] },
      ],
    };

    expect(formatSchemeSummary(schemeType, params)).toBe("Sets × Reps • 5 sets");
  });

  it("returns the bare scheme name for COUNT_UP without a cap", () => {
    const schemeType = buildSchemeType("AMRAP", "COUNT_UP");
    const params: SchemeParams = { kind: "COUNT_UP" };

    expect(formatSchemeSummary(schemeType, params)).toBe("AMRAP");
  });

  it("appends the cap as MM:SS for COUNT_UP when a cap is present", () => {
    const schemeType = buildSchemeType("AMRAP", "COUNT_UP");
    const params: SchemeParams = { kind: "COUNT_UP", cap: 720 };

    expect(formatSchemeSummary(schemeType, params)).toBe("AMRAP • cap 12:00");
  });

  it("pads cap seconds to two digits for COUNT_UP", () => {
    const schemeType = buildSchemeType("AMRAP", "COUNT_UP");
    const params: SchemeParams = { kind: "COUNT_UP", cap: 605 };

    expect(formatSchemeSummary(schemeType, params)).toBe("AMRAP • cap 10:05");
  });

  it("formats the duration as MM:SS for COUNT_DOWN", () => {
    const schemeType = buildSchemeType("For Time", "COUNT_DOWN");
    const params: SchemeParams = { kind: "COUNT_DOWN", durationSec: 600 };

    expect(formatSchemeSummary(schemeType, params)).toBe("For Time • 10:00");
  });

  it("uses the singular slot label when INTERVAL_LOOP has exactly one slot", () => {
    const schemeType = buildSchemeType("Tabata", "INTERVAL_LOOP");
    const params: SchemeParams = {
      kind: "INTERVAL_LOOP",
      sets: 3,
      slots: [{ durationSec: 30, action: "WORK" }],
    };

    expect(formatSchemeSummary(schemeType, params)).toBe("Tabata • 3 × 1 slot");
  });

  it("uses the plural slot label when INTERVAL_LOOP has multiple slots", () => {
    const schemeType = buildSchemeType("Intervals", "INTERVAL_LOOP");
    const params: SchemeParams = {
      kind: "INTERVAL_LOOP",
      sets: 4,
      slots: [
        { durationSec: 60, action: "WORK" },
        { durationSec: 30, action: "REST" },
      ],
    };

    expect(formatSchemeSummary(schemeType, params)).toBe("Intervals • 4 × 2 slots");
  });

  it("renders the total minutes and pluralized slot count for EMOM_LOOP", () => {
    const schemeType = buildSchemeType("EMOM", "EMOM_LOOP");
    const params: SchemeParams = {
      kind: "EMOM_LOOP",
      totalMinutes: 12,
      slots: [
        { minutes: [0], action: { kind: "ENTRY", entryRefIndex: 0 } },
        { minutes: [1], action: { kind: "ENTRY", entryRefIndex: 1 } },
        { minutes: [2], action: { kind: "ENTRY", entryRefIndex: 2 } },
        { minutes: [3], action: { kind: "REST" } },
      ],
    };

    expect(formatSchemeSummary(schemeType, params)).toBe("EMOM • 12 min • 4 slots");
  });

  it("uses the singular slot label when EMOM_LOOP has exactly one slot", () => {
    const schemeType = buildSchemeType("EMOM", "EMOM_LOOP");
    const params: SchemeParams = {
      kind: "EMOM_LOOP",
      totalMinutes: 10,
      slots: [{ minutes: [0], action: { kind: "REST" } }],
    };

    expect(formatSchemeSummary(schemeType, params)).toBe("EMOM • 10 min • 1 slot");
  });

  it("renders the segment count with plural label for TIME_BOXED with multiple segments", () => {
    const schemeType = buildSchemeType("Time-Boxed", "TIME_BOXED");
    const params: SchemeParams = {
      kind: "TIME_BOXED",
      segments: [
        { startSec: 0, endSec: 300, innerArchetypeKind: "NONE", innerParams: { kind: "NONE" } },
        { startSec: 300, endSec: 600, innerArchetypeKind: "NONE", innerParams: { kind: "NONE" } },
      ],
    };

    expect(formatSchemeSummary(schemeType, params)).toBe("Time-Boxed • 2 segments");
  });

  it("uses the singular segment label when TIME_BOXED has exactly one segment", () => {
    const schemeType = buildSchemeType("Time-Boxed", "TIME_BOXED");
    const params: SchemeParams = {
      kind: "TIME_BOXED",
      segments: [
        { startSec: 0, endSec: 600, innerArchetypeKind: "NONE", innerParams: { kind: "NONE" } },
      ],
    };

    expect(formatSchemeSummary(schemeType, params)).toBe("Time-Boxed • 1 segment");
  });

  it("renders an ascending LADDER with its sequence and direction label", () => {
    const schemeType = buildSchemeType("Ladder", "LADDER");
    const params: SchemeParams = { kind: "LADDER", sequence: [3, 5, 7], direction: "ASC" };

    expect(formatSchemeSummary(schemeType, params)).toBe("Ladder • 3-5-7 (Ascending)");
  });

  it("renders a descending LADDER with its sequence and direction label", () => {
    const schemeType = buildSchemeType("Ladder", "LADDER");
    const params: SchemeParams = { kind: "LADDER", sequence: [21, 15, 9], direction: "DESC" };

    expect(formatSchemeSummary(schemeType, params)).toBe("Ladder • 21-15-9 (Descending)");
  });

  it("renders a pyramid LADDER with its sequence and direction label", () => {
    const schemeType = buildSchemeType("Ladder", "LADDER");
    const params: SchemeParams = {
      kind: "LADDER",
      sequence: [1, 2, 3, 2, 1],
      direction: "PYRAMID",
    };

    expect(formatSchemeSummary(schemeType, params)).toBe("Ladder • 1-2-3-2-1 (Pyramid)");
  });

  it("renders a single-distance DISTANCE with the unit label", () => {
    const schemeType = buildSchemeType("Distance", "DISTANCE");
    const params: SchemeParams = { kind: "DISTANCE", unit: "KM", distanceMin: 5 };

    expect(formatSchemeSummary(schemeType, params)).toBe("Distance • 5 Kilometers (KM)");
  });

  it("renders a ranged DISTANCE using the min-max format with the unit label", () => {
    const schemeType = buildSchemeType("Distance", "DISTANCE");
    const params: SchemeParams = {
      kind: "DISTANCE",
      unit: "M",
      distanceMin: 400,
      distanceMax: 800,
    };

    expect(formatSchemeSummary(schemeType, params)).toBe("Distance • 400-800 Meters (M)");
  });

  it("ignores capSec on DISTANCE because the helper does not render it", () => {
    const schemeType = buildSchemeType("Distance", "DISTANCE");
    const params: SchemeParams = {
      kind: "DISTANCE",
      unit: "MI",
      distanceMin: 1,
      capSec: 540,
    };

    expect(formatSchemeSummary(schemeType, params)).toBe("Distance • 1 Miles (MI)");
  });
});
