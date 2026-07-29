import { describe, expect, it } from "vitest";

import { Gender } from "@repo/contracts/coaching/athlete-profile";
import { OneRMRecordSource } from "@repo/contracts/lms/one-rm-record";
import { type ResolvedLoad, type RowView } from "@repo/contracts/lms/session-detail";

import { type LevelAxis } from "@app/lib/level-switch";

import {
  buildLevelPatch,
  buildLevelReceipt,
  buildMaxReceipt,
  coordinatesOf,
  exerciseOf,
  type LevelDraft,
  levelAxesOf,
  parseOneRm,
  shortenReceiptCoordinate,
} from "./weight-sheet-model";
import { RECEIPT_COORD_MAX_CHARS } from "./weight-sheet.constants";

const LEVEL_AXIS_ID = "clz00000000000000000axs01";
const GENDER_AXIS_ID = "clz00000000000000000axs02";
const UNRELATED_AXIS_ID = "clz00000000000000000axs03";
const EXERCISE_ID = "clz000000000000000000ex01";

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

const draft = (overrides: Partial<LevelDraft> = {}): LevelDraft => ({
  selections: {},
  gender: null,
  ...overrides,
});

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

describe("coordinatesOf", () => {
  it("reads the gender coordinate from the draft's gender, not from the selections", () => {
    const coordinates = coordinatesOf([LEVEL_AXIS, GENDER_AXIS], draft({ gender: Gender.FEMALE }));

    expect(coordinates).toEqual({ [GENDER_AXIS_ID]: "Female" });
  });

  it("drops a selection whose value the coach has since renamed away", () => {
    const coordinates = coordinatesOf(
      [LEVEL_AXIS],
      draft({ selections: { [LEVEL_AXIS_ID]: "Intermediate" } }),
    );

    expect(coordinates).toEqual({});
  });
});

describe("buildLevelPatch", () => {
  it("routes gender to its own field and merges picks over the saved map", () => {
    const patch = buildLevelPatch(
      [LEVEL_AXIS, GENDER_AXIS],
      { [LEVEL_AXIS_ID]: "Scaled", [GENDER_AXIS_ID]: "Female" },
      { [UNRELATED_AXIS_ID]: "Beginner" },
    );

    expect(patch).toEqual({
      profileSelections: { [UNRELATED_AXIS_ID]: "Beginner", [LEVEL_AXIS_ID]: "Scaled" },
      gender: Gender.FEMALE,
    });
  });

  it("omits the gender field when the row has no bound axis", () => {
    const patch = buildLevelPatch([LEVEL_AXIS], { [LEVEL_AXIS_ID]: "RX" }, {});

    expect(patch).toEqual({ profileSelections: { [LEVEL_AXIS_ID]: "RX" } });
  });

  it("refuses an incomplete draft and a grid with no axes", () => {
    expect(buildLevelPatch([LEVEL_AXIS, GENDER_AXIS], { [LEVEL_AXIS_ID]: "RX" }, {})).toBeNull();
    expect(buildLevelPatch([], {}, {})).toBeNull();
  });

  it("refuses a gender coordinate the coordinate map does not know", () => {
    const unknownGenderAxis: LevelAxis = { ...GENDER_AXIS, values: ["Other"] };

    expect(buildLevelPatch([unknownGenderAxis], { [GENDER_AXIS_ID]: "Other" }, {})).toBeNull();
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
