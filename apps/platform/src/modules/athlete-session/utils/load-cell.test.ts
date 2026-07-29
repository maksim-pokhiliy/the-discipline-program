import { describe, expect, it } from "vitest";

import { type Load } from "@repo/contracts/lms/_shared";
import { OneRMRecordSource } from "@repo/contracts/lms/one-rm-record";
import {
  type ResolvedLoad,
  type ResolvedLoadSource,
  type RowView,
} from "@repo/contracts/lms/session-detail";

import { buildLoadCell } from "./load-cell";

const EXERCISE_ID = "clz000000000000000000ex01";
const LEVEL_AXIS_ID = "clz00000000000000000axs01";
const SCALE_AXIS_ID = "clz00000000000000000axs02";
const GENDER_AXIS_ID = "clz00000000000000000axs03";
const RECORDED_AT = "2026-07-12T10:00:00.000Z";
const LONG_AXIS_VALUE = "R".repeat(100);

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

const oneRmSource = (overrides: Partial<Extract<ResolvedLoadSource, { kind: "one_rm" }>> = {}) =>
  ({
    kind: "one_rm",
    exerciseId: EXERCISE_ID,
    percent: 80,
    baseKg: 120,
    recordedAt: RECORDED_AT,
    recordSource: OneRMRecordSource.MANUAL,
    ...overrides,
  }) satisfies ResolvedLoadSource;

const LEVEL_ONLY_LOAD: Load = {
  kind: "byProfile",
  axes: [{ axisId: LEVEL_AXIS_ID, label: "Level", values: ["RX", "Scaled"], binding: null }],
  cells: [
    { coords: ["RX"], kg: 24 },
    { coords: ["Scaled"], kg: 16 },
  ],
};

const GENDER_ONLY_LOAD: Load = {
  kind: "byProfile",
  axes: [
    { axisId: GENDER_AXIS_ID, label: "Gender", values: ["Male", "Female"], binding: "GENDER" },
  ],
  cells: [
    { coords: ["Male"], kg: 43 },
    { coords: ["Female"], kg: 30 },
  ],
};

const TWO_AXIS_LOAD: Load = {
  kind: "byProfile",
  axes: [
    { axisId: LEVEL_AXIS_ID, label: "Level", values: ["RX", "Scaled"], binding: null },
    { axisId: SCALE_AXIS_ID, label: "Scale", values: ["Male", "Female"], binding: null },
  ],
  cells: [
    { coords: ["RX", "Male"], kg: 24 },
    { coords: ["RX", "Female"], kg: 18 },
    { coords: ["Scaled", "Male"], kg: 16 },
    { coords: ["Scaled", "Female"], kg: 12 },
  ],
};

const MISSING_PROFILE_PICK: ResolvedLoad = {
  status: "unresolved",
  reason: "missing_profile_pick",
  prompt: "pick_profile",
  axisLabels: ["Level"],
};

const MISSING_GENDER: ResolvedLoad = {
  status: "unresolved",
  reason: "missing_profile_attribute",
  prompt: "set_profile_attribute",
  attribute: "gender",
  axisLabels: ["Gender"],
};

const missingOneRm = (): ResolvedLoad => ({
  status: "unresolved",
  reason: "missing_one_rm",
  prompt: "set_one_rm",
  exerciseId: EXERCISE_ID,
});

describe("buildLoadCell — no cell", () => {
  it("is empty when the row carries no resolved load", () => {
    expect(buildLoadCell(baseRow())).toEqual({ kind: "empty" });
  });

  it("is empty for a not_applicable load", () => {
    expect(buildLoadCell(baseRow({ resolvedLoad: { status: "not_applicable" } }))).toEqual({
      kind: "empty",
    });
  });
});

describe("buildLoadCell — bare values", () => {
  it("renders an authored absolute load as a bare value", () => {
    const cell = buildLoadCell(
      baseRow({
        load: { kind: "absolute", count: 1, kg: 40 },
        resolvedLoad: { status: "resolved", kg: 40, perHand: false },
      }),
    );

    expect(cell).toEqual({ kind: "bare", value: "40 kg" });
  });

  it("renders a per-hand absolute pair as a bare 2x value", () => {
    const cell = buildLoadCell(
      baseRow({
        load: { kind: "absolute", count: 2, kg: 24 },
        resolvedLoad: { status: "resolved", kg: 24, perHand: true },
      }),
    );

    expect(cell).toEqual({ kind: "bare", value: "2x24 kg" });
  });

  it("renders bodyweight as a bare label", () => {
    const cell = buildLoadCell(
      baseRow({ load: { kind: "bodyweight" }, resolvedLoad: { status: "bodyweight" } }),
    );

    expect(cell).toEqual({ kind: "bare", value: "Bodyweight" });
  });

  it("degrades a resolved arm with no source to a bare value (stale payload)", () => {
    const cell = buildLoadCell(
      baseRow({
        load: { kind: "percentage", value: 80, reference: { scope: "self" } },
        resolvedLoad: { status: "resolved", kg: 96, perHand: false },
      }),
    );

    expect(cell).toEqual({ kind: "bare", value: "96 kg" });
  });
});

describe("buildLoadCell — resolved chips", () => {
  it("names a single profile coordinate as the source", () => {
    const cell = buildLoadCell(
      baseRow({
        load: LEVEL_ONLY_LOAD,
        resolvedLoad: {
          status: "resolved",
          kg: 24,
          perHand: false,
          source: {
            kind: "profile",
            coords: [{ axisId: LEVEL_AXIS_ID, label: "Level", value: "RX", binding: null }],
          },
        },
      }),
    );

    expect(cell).toEqual({
      kind: "chip",
      value: "24 kg",
      source: "RX",
      isPrompt: false,
      target: { kind: "level" },
    });
  });

  it("joins two profile coordinates in authored order", () => {
    const cell = buildLoadCell(
      baseRow({
        load: TWO_AXIS_LOAD,
        resolvedLoad: {
          status: "resolved",
          kg: 18,
          perHand: false,
          source: {
            kind: "profile",
            coords: [
              { axisId: LEVEL_AXIS_ID, label: "Level", value: "RX", binding: null },
              { axisId: GENDER_AXIS_ID, label: "Gender", value: "Female", binding: "GENDER" },
            ],
          },
        },
      }),
    );

    expect(cell).toEqual({
      kind: "chip",
      value: "18 kg",
      source: "RX · Female",
      isPrompt: false,
      target: { kind: "level" },
    });
  });

  it("names the percentage and the base max as the source of a 1RM weight", () => {
    const cell = buildLoadCell(
      baseRow({
        load: { kind: "percentage", value: 80, reference: { scope: "self" } },
        resolvedLoad: { status: "resolved", kg: 96, perHand: false, source: oneRmSource() },
      }),
    );

    expect(cell).toEqual({
      kind: "chip",
      value: "96 kg",
      source: "80% of 120",
      isPrompt: false,
      target: { kind: "one_rm", exerciseId: EXERCISE_ID },
    });
  });

  it("renders an authored percentage range in the source and keeps the server's kg", () => {
    const withRange = buildLoadCell(
      baseRow({
        load: { kind: "percentage", value: 70, rangeMax: 80, reference: { scope: "self" } },
        resolvedLoad: {
          status: "resolved",
          kg: 84,
          perHand: false,
          source: oneRmSource({ percent: 70, percentMax: 80 }),
        },
      }),
    );
    const withoutRange = buildLoadCell(
      baseRow({
        load: { kind: "percentage", value: 70, reference: { scope: "self" } },
        resolvedLoad: {
          status: "resolved",
          kg: 84,
          perHand: false,
          source: oneRmSource({ percent: 70 }),
        },
      }),
    );

    expect(withRange).toEqual({
      kind: "chip",
      value: "84 kg",
      source: "70–80% of 120",
      isPrompt: false,
      target: { kind: "one_rm", exerciseId: EXERCISE_ID },
    });
    expect(withRange).toMatchObject({ value: withoutRange.kind === "chip" ? "84 kg" : "" });
    expect(withoutRange).toMatchObject({ source: "70% of 120" });
  });

  it("prints the server's kg verbatim, keeping one decimal", () => {
    const cell = buildLoadCell(
      baseRow({
        load: { kind: "percentage", value: 77, reference: { scope: "self" } },
        resolvedLoad: {
          status: "resolved",
          kg: 79.3,
          perHand: false,
          source: oneRmSource({ percent: 77, baseKg: 103 }),
        },
      }),
    );

    expect(cell).toMatchObject({ value: "79.3 kg" });
  });
});

describe("buildLoadCell — prompt chips", () => {
  it("prompts for the max and shows the authored percentage", () => {
    const cell = buildLoadCell(
      baseRow({
        load: { kind: "percentage", value: 70, reference: { scope: "self" } },
        resolvedLoad: missingOneRm(),
      }),
    );

    expect(cell).toEqual({
      kind: "chip",
      value: "70%",
      source: "Set your max",
      isPrompt: true,
      target: { kind: "one_rm", exerciseId: EXERCISE_ID },
    });
  });

  it("keeps the authored range in the prompt value", () => {
    const cell = buildLoadCell(
      baseRow({
        load: { kind: "percentage", value: 70, rangeMax: 80, reference: { scope: "self" } },
        resolvedLoad: missingOneRm(),
      }),
    );

    expect(cell).toMatchObject({ value: "70–80%", source: "Set your max" });
  });

  it("renders FULL coordinate values for a single unpicked axis", () => {
    const cell = buildLoadCell(
      baseRow({ load: LEVEL_ONLY_LOAD, resolvedLoad: MISSING_PROFILE_PICK }),
    );

    expect(cell).toEqual({
      kind: "chip",
      value: "RX: 24 / Scaled: 16 kg",
      source: "Pick your level",
      isPrompt: true,
      target: { kind: "level" },
    });
  });

  it("derives the prompt from the axis label for a single gender-bound axis", () => {
    const cell = buildLoadCell(baseRow({ load: GENDER_ONLY_LOAD, resolvedLoad: MISSING_GENDER }));

    expect(cell).toEqual({
      kind: "chip",
      value: "Male: 43 / Female: 30 kg",
      source: "Pick your gender",
      isPrompt: true,
      target: { kind: "level" },
    });
  });

  it("collapses two unpicked axes to the min–max range", () => {
    const cell = buildLoadCell(
      baseRow({
        load: TWO_AXIS_LOAD,
        resolvedLoad: { ...MISSING_PROFILE_PICK, axisLabels: ["Level", "Scale"] },
      }),
    );

    expect(cell).toEqual({
      kind: "chip",
      value: "12–24 kg",
      source: "Pick your level",
      isPrompt: true,
      target: { kind: "level" },
    });
  });

  it("carries a 100-character axis value through the formatter untruncated", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [
        {
          axisId: LEVEL_AXIS_ID,
          label: "Level",
          values: [LONG_AXIS_VALUE, "Scaled"],
          binding: null,
        },
      ],
      cells: [
        { coords: [LONG_AXIS_VALUE], kg: 24 },
        { coords: ["Scaled"], kg: 16 },
      ],
    };

    const cell = buildLoadCell(baseRow({ load, resolvedLoad: MISSING_PROFILE_PICK }));

    expect(cell).toMatchObject({ value: `${LONG_AXIS_VALUE}: 24 / Scaled: 16 kg` });
  });

  it("falls back to the server axis labels when the authored load is absent", () => {
    const cell = buildLoadCell(
      baseRow({ resolvedLoad: { ...MISSING_PROFILE_PICK, axisLabels: ["Level", "Scale"] } }),
    );

    expect(cell).toEqual({
      kind: "chip",
      value: "Level · Scale",
      source: "Pick your level",
      isPrompt: true,
      target: { kind: "level" },
    });
  });
});
