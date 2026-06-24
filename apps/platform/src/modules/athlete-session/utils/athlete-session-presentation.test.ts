import { describe, expect, it } from "vitest";

import { type Load, type Result, RESULT_TYPES } from "@repo/contracts/lms/_shared";
import {
  type BlockView,
  type ResolvedLoad,
  type RowView,
  type SchemaCardView,
  type SessionHeaderView,
} from "@repo/contracts/lms/session-detail";
import { theme } from "@repo/mui";

import {
  buildLoadLine,
  buildRowSubLine,
  buildVolume,
  collectBenchmarkSchemas,
  formatCompletedDate,
  formatSessionDate,
  resolveCardDecoration,
  resolveLoadCell,
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

describe("resolveLoadCell", () => {
  it("returns empty when there is no resolved load", () => {
    expect(resolveLoadCell(null, null)).toEqual({ state: "empty" });
  });

  it("renders a single absolute load with the at-notation", () => {
    const resolved: ResolvedLoad = { status: "resolved", kg: 40, perHand: false };
    const load: Load = { kind: "absolute", count: 1, kg: 40 };

    expect(resolveLoadCell(resolved, load)).toEqual({ state: "resolved", value: "40 kg" });
  });

  it("renders a paired absolute load with the 2x at-notation", () => {
    const resolved: ResolvedLoad = { status: "resolved", kg: 24, perHand: true };
    const load: Load = { kind: "absolute", count: 2, kg: 24 };

    expect(resolveLoadCell(resolved, load)).toEqual({ state: "resolved", value: "2x24 kg" });
  });

  it("renders a resolved percentage load as kg with the at-notation, no percent", () => {
    const resolved: ResolvedLoad = { status: "resolved", kg: 80, perHand: false };
    const load: Load = { kind: "percentage", value: 80, reference: { scope: "self" } };

    expect(resolveLoadCell(resolved, load)).toEqual({ state: "resolved", value: "80 kg" });
  });

  it("renders the bodyweight label for a bodyweight load", () => {
    const resolved: ResolvedLoad = { status: "bodyweight" };

    expect(resolveLoadCell(resolved, { kind: "bodyweight" })).toEqual({ state: "bodyweight" });
  });

  it("renders no load line for a not_applicable load", () => {
    const resolved: ResolvedLoad = { status: "not_applicable" };

    expect(resolveLoadCell(resolved, null)).toEqual({ state: "empty" });
  });

  it("renders the set-1RM prompt with the percentage hint for missing_one_rm", () => {
    const resolved: ResolvedLoad = {
      status: "unresolved",
      reason: "missing_one_rm",
      prompt: "set_one_rm",
      exerciseId: "clz000000000000000000ex01",
    };
    const load: Load = { kind: "percentage", value: 80, reference: { scope: "self" } };

    expect(resolveLoadCell(resolved, load)).toEqual({
      state: "missing_one_rm",
      exerciseId: "clz000000000000000000ex01",
      hint: "80% of 1RM",
    });
  });

  it("surfaces the kg spread and axes for a missing_profile_pick", () => {
    const resolved: ResolvedLoad = {
      status: "unresolved",
      reason: "missing_profile_pick",
      prompt: "pick_profile",
      axisLabels: ["Level", "Scale"],
    };
    const load: Load = {
      kind: "byProfile",
      axes: [
        {
          axisId: "clz00000000000000000axs01",
          label: "Level",
          values: ["RX", "Scaled"],
          binding: null,
        },
        {
          axisId: "clz00000000000000000axs02",
          label: "Scale",
          values: ["M", "F"],
          binding: null,
        },
      ],
      cells: [
        { coords: ["RX", "M"], kg: 60 },
        { coords: ["RX", "F"], kg: 42 },
        { coords: ["Scaled", "M"], kg: 45 },
        { coords: ["Scaled", "F"], kg: 30 },
      ],
    };

    expect(resolveLoadCell(resolved, load)).toEqual({
      state: "missing_profile_pick",
      spread: "RX M:60 F:42 / Scaled M:45 F:30",
      axisLabels: ["Level", "Scale"],
    });
  });

  it("surfaces the spread and a gender steer for a missing_profile_attribute (bound axis, no inline pick)", () => {
    const resolved: ResolvedLoad = {
      status: "unresolved",
      reason: "missing_profile_attribute",
      prompt: "set_profile_attribute",
      attribute: "gender",
      axisLabels: ["Gender"],
    };
    const load: Load = {
      kind: "byProfile",
      axes: [
        {
          axisId: "cgender000000000000000000",
          label: "Gender",
          values: ["Male", "Female"],
          binding: "GENDER",
        },
      ],
      cells: [
        { coords: ["Male"], kg: 43 },
        { coords: ["Female"], kg: 30 },
      ],
    };

    expect(resolveLoadCell(resolved, load)).toEqual({
      state: "missing_profile_attribute",
      spread: "Male:43 / Female:30",
      attribute: "gender",
    });
  });

  it("falls back to the server axisLabels when the raw load is not byProfile", () => {
    const resolved: ResolvedLoad = {
      status: "unresolved",
      reason: "missing_profile_pick",
      prompt: "pick_profile",
      axisLabels: ["Level", "Scale"],
    };

    expect(resolveLoadCell(resolved, null)).toEqual({
      state: "missing_profile_pick",
      spread: "Level · Scale",
      axisLabels: ["Level", "Scale"],
    });
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

describe("buildLoadLine", () => {
  it("renders an absolute load as a bare token with the at-flag and no prompt", () => {
    const resolved: ResolvedLoad = { status: "resolved", kg: 24, perHand: true };
    const load: Load = { kind: "absolute", count: 2, kg: 24 };

    expect(buildLoadLine(resolved, load)).toEqual({
      loadStr: "2x24 kg",
      showAt: true,
      prompt: null,
    });
  });

  it("renders bodyweight as a label with the at-flag and no prompt", () => {
    expect(buildLoadLine({ status: "bodyweight" }, { kind: "bodyweight" })).toEqual({
      loadStr: "Bodyweight",
      showAt: true,
      prompt: null,
    });
  });

  it("renders the percentage token with a Set 1RM prompt when 1RM is missing", () => {
    const resolved: ResolvedLoad = {
      status: "unresolved",
      reason: "missing_one_rm",
      prompt: "set_one_rm",
      exerciseId: "clz000000000000000000ex01",
    };
    const load: Load = { kind: "percentage", value: 75, reference: { scope: "self" } };

    expect(buildLoadLine(resolved, load)).toEqual({
      loadStr: "75% of 1RM",
      showAt: true,
      prompt: { kind: "one_rm", exerciseId: "clz000000000000000000ex01", label: "Set 1RM" },
    });
  });

  it("renders the profile spread with a Pick-your-axis prompt and no at-flag", () => {
    const resolved: ResolvedLoad = {
      status: "unresolved",
      reason: "missing_profile_pick",
      prompt: "pick_profile",
      axisLabels: ["Level"],
    };
    const load: Load = {
      kind: "byProfile",
      axes: [
        {
          axisId: "clz00000000000000000axs01",
          label: "Level",
          values: ["RX", "Scaled"],
          binding: null,
        },
      ],
      cells: [
        { coords: ["RX"], kg: 43 },
        { coords: ["Scaled"], kg: 30 },
      ],
    };

    expect(buildLoadLine(resolved, load)).toEqual({
      loadStr: "RX:43 / Scaled:30",
      showAt: false,
      prompt: { kind: "profile", label: "Pick your Level" },
    });
  });

  it("renders the gender spread with a set-your-sex prompt for missing_profile_attribute", () => {
    const resolved: ResolvedLoad = {
      status: "unresolved",
      reason: "missing_profile_attribute",
      prompt: "set_profile_attribute",
      attribute: "gender",
      axisLabels: ["Gender"],
    };
    const load: Load = {
      kind: "byProfile",
      axes: [
        {
          axisId: "cgender000000000000000000",
          label: "Gender",
          values: ["Male", "Female"],
          binding: "GENDER",
        },
      ],
      cells: [
        { coords: ["Male"], kg: 43 },
        { coords: ["Female"], kg: 30 },
      ],
    };

    expect(buildLoadLine(resolved, load)).toEqual({
      loadStr: "Male:43 / Female:30",
      showAt: false,
      prompt: { kind: "profile_attribute", label: "Set your sex" },
    });
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
