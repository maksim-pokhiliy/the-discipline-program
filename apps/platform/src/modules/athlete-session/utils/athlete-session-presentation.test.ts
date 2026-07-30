import { describe, expect, it } from "vitest";

import { type Result, RESULT_TYPES } from "@repo/contracts/lms/_shared";
import {
  type BlockView,
  type RowView,
  type SchemaCardView,
  type SessionHeaderView,
} from "@repo/contracts/lms/session-detail";
import { theme } from "@repo/mui";

import {
  buildRowSubLine,
  buildVolume,
  collectBenchmarkSchemas,
  collectRowViews,
  formatCompletedDate,
  formatSessionDate,
  resolveCardDecoration,
} from "./athlete-session-presentation";
import { buildResult, resultToDraft } from "./result-form-config";

const baseRow = (overrides: Partial<RowView> = {}): RowView => ({
  rowId: "clz0000000000000000000row1",
  movement: "Back Squat",
  media: null,
  sets: null,
  reps: null,
  load: null,
  resolvedLoad: null,
  intensity: null,
  tempo: null,
  side: null,
  rest: null,
  modifiers: [],
  notes: null,
  ...overrides,
});

const baseHeader = (overrides: Partial<SessionHeaderView> = {}): SessionHeaderView => ({
  sessionId: "clz000000000000000000sess1",
  planTitle: "Performance RX",
  position: "Week 3 · Day 4 · Performance RX",
  title: "Heavy Back Squat",
  dayOfWeek: "THURSDAY",
  dayOfMonth: 18,
  summary: "6 blocks · 1 benchmark",
  done: false,
  completedAt: null,
  ...overrides,
});

describe("resolveCardDecoration", () => {
  it("borders a benchmark card with the success tint", () => {
    const decoration = resolveCardDecoration(true, theme);

    expect(decoration.borderColor).not.toBe(theme.palette.divider);
  });

  it("borders an ordinary card with the divider color", () => {
    const decoration = resolveCardDecoration(false, theme);

    expect(decoration.borderColor).toBe(theme.palette.divider);
  });
});

describe("buildVolume", () => {
  it("joins sets and reps with the times separator and the reps label", () => {
    expect(buildVolume(baseRow({ sets: 5, reps: { kind: "count", value: 3 } }))).toBe("5 × 3 reps");
  });

  it("omits the sets prefix when there are no sets", () => {
    expect(buildVolume(baseRow({ sets: null, reps: { kind: "count", value: 5 } }))).toBe("5 reps");
  });

  it("keeps the unit for a unit-bound rep notation", () => {
    expect(
      buildVolume(baseRow({ sets: 4, reps: { kind: "unit_bound", unit: "cal", value: 100 } })),
    ).toBe("4 × 100 cal");
  });

  it("is empty when there are no sets or reps", () => {
    expect(buildVolume(baseRow())).toBe("");
  });
});

describe("buildRowSubLine", () => {
  it("joins tempo, side, intensity and uppercased modifiers with the dot separator", () => {
    const row = baseRow({
      tempo: { eccentric: 3, pauseBottom: 0, concentric: "X", pauseTop: 1 },
      side: { kind: "each_leg" },
      intensity: { effortPercent: { value: 70 } },
      modifiers: ["tempo", "paused"],
    });

    expect(buildRowSubLine(row)).toBe("3-0-X-1  ·  each leg  ·  70% effort  ·  TEMPO, PAUSED");
  });

  it("returns an empty string when no sub-line dimension is present", () => {
    expect(buildRowSubLine(baseRow())).toBe("");
  });

  it("omits absent dimensions", () => {
    const row = baseRow({ intensity: { rpe: { value: 8 } } });

    expect(buildRowSubLine(row)).toBe("RPE 8");
  });
});

describe("date formatters", () => {
  it("renders the session date as weekday plus day-of-month from the enum (tz-stable)", () => {
    expect(formatSessionDate(baseHeader())).toBe("Thursday 18");
  });

  it("renders the same parts regardless of how the header is constructed", () => {
    const sunday = baseHeader({ dayOfWeek: "SUNDAY", dayOfMonth: 1 });

    expect(formatSessionDate(sunday)).toBe("Sunday 1");
  });

  it("renders the completed date in UTC", () => {
    expect(formatCompletedDate(new Date("2026-06-18T12:00:00.000Z"))).toBe("Logged June 18");
  });
});

const baseSchemaCard = (overrides: Partial<SchemaCardView> = {}): SchemaCardView => ({
  schemaId: "clz000000000000000000sch1",
  header: "Cindy",
  composition: { repetition: { kind: "timeCap", cap: { min: 20, unit: "min" } } },
  label: { kind: "timeCap", family: "TIME_BOUNDED" },
  isBenchmark: false,
  resultType: null,
  intensity: null,
  existingResult: null,
  items: [],
  ...overrides,
});

const blockOf = (schema: SchemaCardView): BlockView => ({
  blockId: "clz0000000000000000000blk1",
  label: "Metcon",
  intensity: null,
  note: null,
  items: [{ kind: "schema", schema }],
});

describe("collectBenchmarkSchemas", () => {
  it("carries the schema's existingResult onto the benchmark entry (Must-Test 22)", () => {
    const existingResult: Result = { type: "rounds_reps", rounds: 18, reps: 7 };
    const schema = baseSchemaCard({
      isBenchmark: true,
      resultType: "rounds_reps",
      existingResult,
    });

    const benchmarks = collectBenchmarkSchemas([blockOf(schema)]);

    expect(benchmarks).toHaveLength(1);
    expect(benchmarks[0]?.existingResult).toEqual(existingResult);
    expect(benchmarks[0]?.resultType).toBe("rounds_reps");
  });

  it("excludes a non-benchmark schema (Must-Test 22)", () => {
    const benchmark = baseSchemaCard({
      schemaId: "clz000000000000000000schB",
      isBenchmark: true,
      resultType: "load",
      existingResult: { type: "load", kg: 100 },
    });
    const plain = baseSchemaCard({ schemaId: "clz000000000000000000schP", isBenchmark: false });

    const benchmarks = collectBenchmarkSchemas([blockOf(benchmark), blockOf(plain)]);

    expect(benchmarks.map((entry) => entry.schemaId)).toEqual(["clz000000000000000000schB"]);
  });
});

describe("collectRowViews", () => {
  it("collects grouped members alongside plain rows, in authored order", () => {
    const plain = baseRow({ rowId: "clz0000000000000000000rowA" });
    const memberOne = baseRow({ rowId: "clz0000000000000000000rowB" });
    const memberTwo = baseRow({ rowId: "clz0000000000000000000rowC" });
    const schema = baseSchemaCard({
      items: [
        { kind: "row", row: plain },
        { kind: "group", label: "Superset", members: [memberOne, memberTwo] },
      ],
    });

    expect(collectRowViews([blockOf(schema)]).map((row) => row.rowId)).toEqual([
      "clz0000000000000000000rowA",
      "clz0000000000000000000rowB",
      "clz0000000000000000000rowC",
    ]);
  });

  it("reaches rows inside a parallel group's tracks", () => {
    const tracked = baseRow({ rowId: "clz0000000000000000000rowT" });
    const schema = baseSchemaCard({ items: [{ kind: "row", row: tracked }] });
    const block: BlockView = {
      blockId: "clz0000000000000000000blk2",
      label: "Strength",
      intensity: null,
      note: null,
      items: [{ kind: "parallel-group", trackCount: 1, tracks: [{ header: "A", schema }] }],
    };

    expect(collectRowViews([block]).map((row) => row.rowId)).toEqual([
      "clz0000000000000000000rowT",
    ]);
  });
});

describe("resultToDraft ↔ buildResult round-trip (Must-Test 23)", () => {
  const ROUND_TRIP_CASES: Record<Result["type"], Result> = {
    time: { type: "time", seconds: 754 },
    rounds_reps: { type: "rounds_reps", rounds: 18, reps: 7 },
    load: { type: "load", kg: 142.5 },
    max_reps: { type: "max_reps", reps: 31 },
    distance: { type: "distance", value: 1500, unit: "km" },
    calories: { type: "calories", value: 80 },
  };

  it("covers every result type", () => {
    expect(Object.keys(ROUND_TRIP_CASES).sort()).toEqual([...RESULT_TYPES].sort());
  });

  for (const result of Object.values(ROUND_TRIP_CASES)) {
    it(`is lossless for a ${result.type} result`, () => {
      expect(buildResult(result.type, resultToDraft(result))).toEqual(result);
    });
  }

  it("splits a sub-minute time into zero minutes and the seconds remainder", () => {
    const draft = resultToDraft({ type: "time", seconds: 45 });

    expect(draft).toEqual({ minutes: "0", seconds: "45" });
    expect(buildResult("time", draft)).toEqual({ type: "time", seconds: 45 });
  });
});
