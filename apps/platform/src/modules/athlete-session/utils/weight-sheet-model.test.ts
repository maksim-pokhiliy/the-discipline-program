import { describe, expect, it } from "vitest";

import { Gender } from "@repo/contracts/coaching/athlete-profile";
import { type Load, ONE_RM_MAX_KG } from "@repo/contracts/lms/_shared";
import { OneRMRecordSource } from "@repo/contracts/lms/one-rm-record";
import { type ResolvedLoad, type RowView } from "@repo/contracts/lms/session-detail";

import { type LevelAxis } from "@app/lib/level-switch";

import {
  boundAxisIdsOf,
  buildLevelPatch,
  buildLevelReceipt,
  buildMaxReceipt,
  changingRowIds,
  coordinatesOf,
  currentKgOf,
  exerciseOf,
  kgForState,
  type LevelState,
  levelAxesOf,
  mergeLevelState,
  parseOneRm,
  rowIdsSharingAxes,
  shortenReceiptCoordinate,
} from "./weight-sheet-model";
import { RECEIPT_COORD_MAX_CHARS } from "./weight-sheet.constants";

const LEVEL_AXIS_ID = "clz00000000000000000axs01";
const GENDER_AXIS_ID = "clz00000000000000000axs02";
const UNRELATED_AXIS_ID = "clz00000000000000000axs03";
const TIER_AXIS_ID = "clz00000000000000000axs04";
const EXERCISE_ID = "clz000000000000000000ex01";

const LEVEL_ROW_ID = "clz0000000000000000000row1";
const GENDER_ROW_ID = "clz0000000000000000000row2";
const TIER_ROW_ID = "clz0000000000000000000row3";

const LEVEL_AXIS: LevelAxis = {
  id: LEVEL_AXIS_ID,
  label: "Level",
  values: ["RX", "Scaled"],
  binding: null,
};

const GENDER_AXIS: LevelAxis = {
  id: GENDER_AXIS_ID,
  label: "Gender",
  values: ["Male", "Female"],
  binding: "GENDER",
};

const TIER_AXIS: LevelAxis = {
  id: TIER_AXIS_ID,
  label: "Barbell tier",
  values: ["Heavy", "Light"],
  binding: null,
};

const NO_BOUND_AXES: ReadonlySet<string> = new Set<string>();

const state = (overrides: Partial<LevelState> = {}): LevelState => ({
  selections: {},
  gender: null,
  ...overrides,
});

const baseRow = (overrides: Partial<RowView> = {}): RowView => ({
  rowId: LEVEL_ROW_ID,
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

const byProfileLoad = (axes: LevelAxis[]): Load => ({
  kind: "byProfile",
  axes: axes.map((axis) => ({
    axisId: axis.id,
    label: axis.label,
    values: axis.values,
    binding: axis.binding,
  })),
  cells: [],
});

const LEVEL_AND_GENDER_ROW = baseRow({
  rowId: LEVEL_ROW_ID,
  load: byProfileLoad([LEVEL_AXIS, GENDER_AXIS]),
});

const GENDER_ONLY_ROW = baseRow({
  rowId: GENDER_ROW_ID,
  load: byProfileLoad([GENDER_AXIS]),
});

const TIER_ONLY_ROW = baseRow({
  rowId: TIER_ROW_ID,
  load: byProfileLoad([TIER_AXIS]),
});

const gridLoad = (axis: LevelAxis, kgByValue: Record<string, number>): Load => ({
  kind: "byProfile",
  axes: [{ axisId: axis.id, label: axis.label, values: axis.values, binding: axis.binding }],
  cells: axis.values.map((value) => ({ coords: [value], kg: kgByValue[value] ?? 0 })),
});

const LEVEL_GRID_ROW = baseRow({
  rowId: LEVEL_ROW_ID,
  load: gridLoad(LEVEL_AXIS, { RX: 40, Scaled: 30 }),
  resolvedLoad: {
    status: "unresolved",
    reason: "missing_profile_pick",
    prompt: "pick_profile",
    axisLabels: ["Level"],
  },
});

const ALREADY_SCALED_ROW = baseRow({
  rowId: GENDER_ROW_ID,
  load: gridLoad(LEVEL_AXIS, { RX: 40, Scaled: 30 }),
  resolvedLoad: {
    status: "resolved",
    kg: 30,
    perHand: false,
    source: {
      kind: "profile",
      coords: [{ axisId: LEVEL_AXIS_ID, label: "Level", value: "Scaled", binding: null }],
    },
  },
});

const GENDER_GRID_ROW = baseRow({
  rowId: GENDER_ROW_ID,
  load: gridLoad(GENDER_AXIS, { Male: 20, Female: 14 }),
});

const TIER_GRID_ROW = baseRow({
  rowId: TIER_ROW_ID,
  load: gridLoad(TIER_AXIS, { Heavy: 60, Light: 45 }),
});

describe("parseOneRm", () => {
  it("accepts a trimmed positive number", () => {
    expect(parseOneRm(" 125.5 ")).toBe(125.5);
  });

  it("rejects zero, negatives and non-numbers", () => {
    expect(parseOneRm("0")).toBeNull();
    expect(parseOneRm("-10")).toBeNull();
    expect(parseOneRm("heavy")).toBeNull();
    expect(parseOneRm("")).toBeNull();
  });

  it("rejects what the server's kg bounds reject — over the cap and past two decimals", () => {
    expect(parseOneRm(String(ONE_RM_MAX_KG))).toBe(ONE_RM_MAX_KG);
    expect(parseOneRm("102.55")).toBe(102.55);
    expect(parseOneRm("102.555")).toBeNull();
    expect(parseOneRm(String(ONE_RM_MAX_KG + 1))).toBeNull();
    expect(parseOneRm("Infinity")).toBeNull();
  });
});

describe("shortenReceiptCoordinate", () => {
  it("leaves a coordinate at the ratified cap untouched", () => {
    const value = "R".repeat(RECEIPT_COORD_MAX_CHARS);

    expect(shortenReceiptCoordinate(value)).toBe(value);
  });

  it("truncates a longer coordinate at the cap and marks the cut", () => {
    const shortened = shortenReceiptCoordinate("R".repeat(RECEIPT_COORD_MAX_CHARS + 6));

    expect(shortened).toBe(`${"R".repeat(RECEIPT_COORD_MAX_CHARS)}…`);
  });
});

describe("levelAxesOf", () => {
  it("adapts an authored byProfile grid to level axes", () => {
    const row = baseRow({
      load: {
        kind: "byProfile",
        axes: [{ axisId: LEVEL_AXIS_ID, label: "Level", values: ["RX", "Scaled"], binding: null }],
        cells: [
          { coords: ["RX"], kg: 40 },
          { coords: ["Scaled"], kg: 30 },
        ],
      },
    });

    expect(levelAxesOf(row)).toEqual([LEVEL_AXIS]);
  });

  it("is empty for a row with no profile grid", () => {
    expect(levelAxesOf(null)).toEqual([]);
    expect(levelAxesOf(baseRow({ load: { kind: "bodyweight" } }))).toEqual([]);
  });
});

describe("boundAxisIdsOf", () => {
  it("collects every bound axis the session's grids are keyed on", () => {
    const bound = boundAxisIdsOf([LEVEL_AND_GENDER_ROW, TIER_ONLY_ROW, baseRow()]);

    expect([...bound]).toEqual([GENDER_AXIS_ID]);
  });
});

describe("rowIdsSharingAxes", () => {
  it("keeps only the rows keyed on an axis that was applied", () => {
    const rows = [LEVEL_AND_GENDER_ROW, GENDER_ONLY_ROW, TIER_ONLY_ROW, baseRow({ rowId: "x" })];

    expect(rowIdsSharingAxes(rows, [TIER_AXIS])).toEqual([TIER_ROW_ID]);
    expect(rowIdsSharingAxes(rows, [LEVEL_AXIS, GENDER_AXIS])).toEqual([
      LEVEL_ROW_ID,
      GENDER_ROW_ID,
    ]);
  });

  it("has no rows to touch when no axis was applied", () => {
    expect(rowIdsSharingAxes([LEVEL_AND_GENDER_ROW], [])).toEqual([]);
  });
});

describe("mergeLevelState", () => {
  it("lays the sheet's picks over the athlete's live profile", () => {
    const merged = mergeLevelState(
      state({ selections: { [UNRELATED_AXIS_ID]: "Beginner" }, gender: Gender.MALE }),
      state({ selections: { [LEVEL_AXIS_ID]: "Scaled" }, gender: Gender.FEMALE }),
    );

    expect(merged).toEqual({
      selections: { [UNRELATED_AXIS_ID]: "Beginner", [LEVEL_AXIS_ID]: "Scaled" },
      gender: Gender.FEMALE,
    });
  });

  it("falls back to the profile for anything the sheet has not touched", () => {
    const merged = mergeLevelState(
      state({ selections: { [LEVEL_AXIS_ID]: "RX" }, gender: Gender.MALE }),
      state(),
    );

    expect(merged).toEqual({ selections: { [LEVEL_AXIS_ID]: "RX" }, gender: Gender.MALE });
  });

  it("carries the draft alone while the profile is unknown", () => {
    expect(mergeLevelState(null, state({ selections: { [LEVEL_AXIS_ID]: "RX" } }))).toEqual({
      selections: { [LEVEL_AXIS_ID]: "RX" },
      gender: null,
    });
  });
});

describe("coordinatesOf", () => {
  it("reads the gender coordinate from the gender field, not from the selections", () => {
    const coordinates = coordinatesOf([LEVEL_AXIS, GENDER_AXIS], state({ gender: Gender.FEMALE }));

    expect(coordinates).toEqual({ [GENDER_AXIS_ID]: "Female" });
  });

  it("drops a selection whose value the coach has since renamed away", () => {
    const coordinates = coordinatesOf(
      [LEVEL_AXIS],
      state({ selections: { [LEVEL_AXIS_ID]: "Intermediate" } }),
    );

    expect(coordinates).toEqual({});
  });
});

describe("buildLevelPatch", () => {
  it("routes gender to its own field and merges picks over the saved map", () => {
    const patch = buildLevelPatch({
      axes: [LEVEL_AXIS, GENDER_AXIS],
      coordinates: { [LEVEL_AXIS_ID]: "Scaled", [GENDER_AXIS_ID]: "Female" },
      saved: state({ selections: { [UNRELATED_AXIS_ID]: "Beginner" } }),
      boundAxisIds: NO_BOUND_AXES,
    });

    expect(patch).toEqual({
      profileSelections: { [UNRELATED_AXIS_ID]: "Beginner", [LEVEL_AXIS_ID]: "Scaled" },
      gender: Gender.FEMALE,
    });
  });

  it("omits the gender field when the row has no bound axis", () => {
    const patch = buildLevelPatch({
      axes: [LEVEL_AXIS],
      coordinates: { [LEVEL_AXIS_ID]: "RX" },
      saved: state(),
      boundAxisIds: NO_BOUND_AXES,
    });

    expect(patch).toEqual({ profileSelections: { [LEVEL_AXIS_ID]: "RX" } });
  });

  it("never rewrites the selections map for a gender-only row", () => {
    const patch = buildLevelPatch({
      axes: [GENDER_AXIS],
      coordinates: { [GENDER_AXIS_ID]: "Female" },
      saved: state({ selections: { [UNRELATED_AXIS_ID]: "Beginner" } }),
      boundAxisIds: NO_BOUND_AXES,
    });

    expect(patch).toEqual({ gender: Gender.FEMALE });
  });

  it("refuses to build a patch while the athlete's profile is unknown", () => {
    const patch = buildLevelPatch({
      axes: [LEVEL_AXIS],
      coordinates: { [LEVEL_AXIS_ID]: "RX" },
      saved: null,
      boundAxisIds: NO_BOUND_AXES,
    });

    expect(patch).toBeNull();
  });

  it("strips a bound-axis key out of the base it echoes back", () => {
    const patch = buildLevelPatch({
      axes: [LEVEL_AXIS],
      coordinates: { [LEVEL_AXIS_ID]: "RX" },
      saved: state({
        selections: {
          [UNRELATED_AXIS_ID]: "Beginner",
          [GENDER_AXIS_ID]: "Female",
          [TIER_AXIS_ID]: "Heavy",
        },
      }),
      boundAxisIds: new Set([GENDER_AXIS_ID]),
    });

    expect(patch).toEqual({
      profileSelections: {
        [UNRELATED_AXIS_ID]: "Beginner",
        [TIER_AXIS_ID]: "Heavy",
        [LEVEL_AXIS_ID]: "RX",
      },
    });
  });

  it("strips the row's own bound axis even when the session set is empty", () => {
    const patch = buildLevelPatch({
      axes: [LEVEL_AXIS, GENDER_AXIS],
      coordinates: { [LEVEL_AXIS_ID]: "RX", [GENDER_AXIS_ID]: "Female" },
      saved: state({ selections: { [GENDER_AXIS_ID]: "Male" } }),
      boundAxisIds: NO_BOUND_AXES,
    });

    expect(patch).toEqual({
      profileSelections: { [LEVEL_AXIS_ID]: "RX" },
      gender: Gender.FEMALE,
    });
  });

  it("refuses an incomplete draft and a grid with no axes", () => {
    expect(
      buildLevelPatch({
        axes: [LEVEL_AXIS, GENDER_AXIS],
        coordinates: { [LEVEL_AXIS_ID]: "RX" },
        saved: state(),
        boundAxisIds: NO_BOUND_AXES,
      }),
    ).toBeNull();

    expect(
      buildLevelPatch({
        axes: [],
        coordinates: {},
        saved: state(),
        boundAxisIds: NO_BOUND_AXES,
      }),
    ).toBeNull();
  });

  it("refuses a gender coordinate the coordinate map does not know", () => {
    const unknownGenderAxis: LevelAxis = { ...GENDER_AXIS, values: ["Other"] };

    expect(
      buildLevelPatch({
        axes: [unknownGenderAxis],
        coordinates: { [GENDER_AXIS_ID]: "Other" },
        saved: state(),
        boundAxisIds: NO_BOUND_AXES,
      }),
    ).toBeNull();
  });
});

describe("kgForState", () => {
  it("resolves the row's own grid against the athlete's coordinates", () => {
    expect(kgForState(LEVEL_GRID_ROW, state({ selections: { [LEVEL_AXIS_ID]: "RX" } }))).toBe(40);
    expect(kgForState(LEVEL_GRID_ROW, state({ selections: { [LEVEL_AXIS_ID]: "Scaled" } }))).toBe(
      30,
    );
  });

  it("reads a bound axis off the typed gender field, not off the selections map", () => {
    expect(kgForState(GENDER_GRID_ROW, state({ gender: Gender.FEMALE }))).toBe(14);
    expect(kgForState(GENDER_GRID_ROW, state({ selections: { [GENDER_AXIS_ID]: "Female" } }))).toBe(
      null,
    );
  });

  it("has no number for a coordinate set the grid does not cover, or for no grid at all", () => {
    expect(kgForState(LEVEL_GRID_ROW, state())).toBeNull();
    expect(kgForState(TIER_GRID_ROW, state({ selections: { [LEVEL_AXIS_ID]: "RX" } }))).toBeNull();
    expect(kgForState(baseRow(), state())).toBeNull();
  });
});

describe("currentKgOf", () => {
  it("reads the number the server already resolved", () => {
    expect(
      currentKgOf(baseRow({ resolvedLoad: { status: "resolved", kg: 30, perHand: false } })),
    ).toBe(30);
  });

  it("has no number for an unresolved, bodyweight or absent arm", () => {
    expect(currentKgOf(LEVEL_GRID_ROW)).toBeNull();
    expect(currentKgOf(baseRow({ resolvedLoad: { status: "bodyweight" } }))).toBeNull();
    expect(currentKgOf(baseRow())).toBeNull();
  });
});

describe("changingRowIds", () => {
  it("keeps only the rows whose number actually moves", () => {
    const rows = [LEVEL_GRID_ROW, ALREADY_SCALED_ROW, TIER_GRID_ROW];

    expect(changingRowIds(rows, state({ selections: { [LEVEL_AXIS_ID]: "Scaled" } }))).toEqual([
      LEVEL_ROW_ID,
    ]);
  });

  it("counts a row that had no number at all as moving", () => {
    expect(
      changingRowIds([LEVEL_GRID_ROW], state({ selections: { [LEVEL_AXIS_ID]: "RX" } })),
    ).toEqual([LEVEL_ROW_ID]);
  });

  it("is empty when the applied coordinates leave every number where it was", () => {
    expect(
      changingRowIds([ALREADY_SCALED_ROW], state({ selections: { [LEVEL_AXIS_ID]: "Scaled" } })),
    ).toEqual([]);
  });
});

describe("receipts", () => {
  it("switches to the singular when exactly one weight moved", () => {
    expect(buildLevelReceipt(["RX"], 1)).toBe("RX applied · 1 weight updated");
  });

  it("joins the coordinates and counts the weights", () => {
    expect(buildLevelReceipt(["Scaled", "Female"], 3)).toBe(
      "Scaled · Female applied · 3 weights updated",
    );
  });

  it("claims no count when the applied level moved nothing on this screen", () => {
    expect(buildLevelReceipt(["Scaled", "Female"], 0)).toBe("Scaled · Female applied");
  });

  it("names the movement and the saved value", () => {
    expect(buildMaxReceipt("Back Squat", 125)).toBe("Back Squat 1RM · 125 kg saved");
  });
});

describe("exerciseOf", () => {
  it("reads the exercise from a resolved 1RM source", () => {
    const resolvedLoad: ResolvedLoad = {
      status: "resolved",
      kg: 96,
      perHand: false,
      source: {
        kind: "one_rm",
        exerciseId: EXERCISE_ID,
        percent: 80,
        baseKg: 120,
        recordedAt: "2026-07-12T10:00:00.000Z",
        recordSource: OneRMRecordSource.MANUAL,
      },
    };

    expect(exerciseOf(baseRow({ resolvedLoad }))).toBe(EXERCISE_ID);
  });

  it("reads the exercise from the missing_one_rm prompt", () => {
    const resolvedLoad: ResolvedLoad = {
      status: "unresolved",
      reason: "missing_one_rm",
      prompt: "set_one_rm",
      exerciseId: EXERCISE_ID,
    };

    expect(exerciseOf(baseRow({ resolvedLoad }))).toBe(EXERCISE_ID);
  });

  it("has no exercise for profile, bodyweight, not_applicable or absent arms", () => {
    const profileSource: ResolvedLoad = {
      status: "resolved",
      kg: 24,
      perHand: false,
      source: {
        kind: "profile",
        coords: [{ axisId: LEVEL_AXIS_ID, label: "Level", value: "RX", binding: null }],
      },
    };

    expect(exerciseOf(baseRow({ resolvedLoad: profileSource }))).toBeNull();
    expect(exerciseOf(baseRow({ resolvedLoad: { status: "bodyweight" } }))).toBeNull();
    expect(exerciseOf(baseRow({ resolvedLoad: { status: "not_applicable" } }))).toBeNull();
    expect(exerciseOf(baseRow())).toBeNull();
  });
});
