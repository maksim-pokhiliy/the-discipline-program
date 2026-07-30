import { describe, expect, it } from "vitest";

import { type Load } from "@repo/contracts/lms/_shared";
import { OneRMRecordSource } from "@repo/contracts/lms/one-rm-record";

import { type AthleteLoadContext, type AthleteOneRMBase } from "./athlete-records.types";
import { resolveLoad } from "./resolve-load";

const ROW_EXERCISE_ID = "row-exercise-1";
const OTHER_EXERCISE_ID = "other-exercise-1";
const LEVEL_AXIS_ID = "clz0000000000000000axis01";
const SCALE_AXIS_ID = "clz0000000000000000axis02";
const GENDER_AXIS_ID = "cgender000000000000000000";
const RECORDED_AT = new Date("2026-07-12T10:00:00.000Z");
const RECORDED_AT_ISO = "2026-07-12T10:00:00.000Z";

const oneRMBase = (
  valueKg: number,
  source: OneRMRecordSource = OneRMRecordSource.MANUAL,
): AthleteOneRMBase => ({ valueKg, recordedAt: RECORDED_AT, source });

const makeCtx = (overrides: Partial<AthleteLoadContext> = {}): AthleteLoadContext => ({
  bodyweightKg: null,
  currentOneRMByExercise: new Map(),
  profileSelections: {},
  gender: null,
  ...overrides,
});

describe("resolveLoad", () => {
  it("resolves an absolute single-implement load to its kg", () => {
    const load: Load = { kind: "absolute", count: 1, kg: 40 };

    expect(resolveLoad(load, makeCtx(), ROW_EXERCISE_ID)).toEqual({
      status: "resolved",
      kg: 40,
      perHand: false,
    });
  });

  it("flags perHand for an absolute double-implement load", () => {
    const load: Load = { kind: "absolute", count: 2, kg: 16 };

    expect(resolveLoad(load, makeCtx(), ROW_EXERCISE_ID)).toEqual({
      status: "resolved",
      kg: 16,
      perHand: true,
    });
  });

  it("resolves bodyweight to the bodyweight status, never a kg number, when weight is known", () => {
    const load: Load = { kind: "bodyweight" };

    expect(resolveLoad(load, makeCtx({ bodyweightKg: 72 }), ROW_EXERCISE_ID)).toEqual({
      status: "bodyweight",
    });
  });

  it("resolves bodyweight to the bodyweight status even when weight is unknown", () => {
    const load: Load = { kind: "bodyweight" };

    expect(resolveLoad(load, makeCtx(), ROW_EXERCISE_ID)).toEqual({ status: "bodyweight" });
  });

  it("resolves a self-referenced percentage against the row's current 1RM", () => {
    const load: Load = { kind: "percentage", value: 80, reference: { scope: "self" } };
    const ctx = makeCtx({
      currentOneRMByExercise: new Map([[ROW_EXERCISE_ID, oneRMBase(100)]]),
    });

    expect(resolveLoad(load, ctx, ROW_EXERCISE_ID)).toEqual({
      status: "resolved",
      kg: 80,
      perHand: false,
      source: {
        kind: "one_rm",
        exerciseId: ROW_EXERCISE_ID,
        percent: 80,
        baseKg: 100,
        recordedAt: RECORDED_AT_ISO,
        recordSource: OneRMRecordSource.MANUAL,
      },
    });
  });

  it("resolves an other-exercise percentage against the target's current 1RM", () => {
    const load: Load = {
      kind: "percentage",
      value: 50,
      reference: { scope: "other_exercise", targetExerciseId: OTHER_EXERCISE_ID },
    };
    const ctx = makeCtx({
      currentOneRMByExercise: new Map([[OTHER_EXERCISE_ID, oneRMBase(90)]]),
    });

    expect(resolveLoad(load, ctx, ROW_EXERCISE_ID)).toEqual({
      status: "resolved",
      kg: 45,
      perHand: false,
      source: {
        kind: "one_rm",
        exerciseId: OTHER_EXERCISE_ID,
        percent: 50,
        baseKg: 90,
        recordedAt: RECORDED_AT_ISO,
        recordSource: OneRMRecordSource.MANUAL,
      },
    });
  });

  it("rounds a percentage result to one decimal place", () => {
    const load: Load = { kind: "percentage", value: 33, reference: { scope: "self" } };
    const ctx = makeCtx({
      currentOneRMByExercise: new Map([[ROW_EXERCISE_ID, oneRMBase(100)]]),
    });

    expect(resolveLoad(load, ctx, ROW_EXERCISE_ID)).toEqual({
      status: "resolved",
      kg: 33,
      perHand: false,
      source: {
        kind: "one_rm",
        exerciseId: ROW_EXERCISE_ID,
        percent: 33,
        baseKg: 100,
        recordedAt: RECORDED_AT_ISO,
        recordSource: OneRMRecordSource.MANUAL,
      },
    });
  });

  it("returns missing_one_rm for a percentage with no current 1RM", () => {
    const load: Load = { kind: "percentage", value: 80, reference: { scope: "self" } };

    expect(resolveLoad(load, makeCtx(), ROW_EXERCISE_ID)).toEqual({
      status: "unresolved",
      reason: "missing_one_rm",
      prompt: "set_one_rm",
      exerciseId: ROW_EXERCISE_ID,
    });
  });

  it("returns missing_one_rm naming the target exercise for an other-exercise percentage", () => {
    const load: Load = {
      kind: "percentage",
      value: 80,
      reference: { scope: "other_exercise", targetExerciseId: OTHER_EXERCISE_ID },
    };

    expect(resolveLoad(load, makeCtx(), ROW_EXERCISE_ID)).toEqual({
      status: "unresolved",
      reason: "missing_one_rm",
      prompt: "set_one_rm",
      exerciseId: OTHER_EXERCISE_ID,
    });
  });

  it("resolves a plain byProfile load to the cell matching the remembered pick", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [{ axisId: LEVEL_AXIS_ID, label: "Level", values: ["rx", "scaled"], binding: null }],
      cells: [
        { coords: ["rx"], kg: 60 },
        { coords: ["scaled"], kg: 40 },
      ],
    };
    const ctx = makeCtx({ profileSelections: { [LEVEL_AXIS_ID]: "scaled" } });

    expect(resolveLoad(load, ctx, ROW_EXERCISE_ID)).toEqual({
      status: "resolved",
      kg: 40,
      perHand: false,
      source: {
        kind: "profile",
        coords: [{ axisId: LEVEL_AXIS_ID, label: "Level", value: "scaled", binding: null }],
      },
    });
  });

  it("returns missing_profile_pick with the axis label when a plain axis has no pick", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [{ axisId: LEVEL_AXIS_ID, label: "Level", values: ["rx", "scaled"], binding: null }],
      cells: [
        { coords: ["rx"], kg: 60 },
        { coords: ["scaled"], kg: 40 },
      ],
    };

    expect(resolveLoad(load, makeCtx(), ROW_EXERCISE_ID)).toEqual({
      status: "unresolved",
      reason: "missing_profile_pick",
      prompt: "pick_profile",
      axisLabels: ["Level"],
    });
  });

  it("returns missing_profile_pick when the remembered plain pick is not a valid value", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [{ axisId: LEVEL_AXIS_ID, label: "Level", values: ["rx", "scaled"], binding: null }],
      cells: [
        { coords: ["rx"], kg: 60 },
        { coords: ["scaled"], kg: 40 },
      ],
    };
    const ctx = makeCtx({ profileSelections: { [LEVEL_AXIS_ID]: "intermediate" } });

    expect(resolveLoad(load, ctx, ROW_EXERCISE_ID)).toEqual({
      status: "unresolved",
      reason: "missing_profile_pick",
      prompt: "pick_profile",
      axisLabels: ["Level"],
    });
  });

  it("returns missing_profile_pick when valid plain picks match no cell (QA-007)", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [{ axisId: LEVEL_AXIS_ID, label: "Level", values: ["rx", "scaled"], binding: null }],
      cells: [{ coords: ["rx"], kg: 60 }],
    };
    const ctx = makeCtx({ profileSelections: { [LEVEL_AXIS_ID]: "scaled" } });

    expect(resolveLoad(load, ctx, ROW_EXERCISE_ID)).toEqual({
      status: "unresolved",
      reason: "missing_profile_pick",
      prompt: "pick_profile",
      axisLabels: ["Level"],
    });
  });

  it("steers to the gender attribute when an all-bound load resolves but no cell matches", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [
        {
          axisId: GENDER_AXIS_ID,
          label: "Gender",
          values: ["Male", "Female"],
          binding: "GENDER",
        },
      ],
      cells: [{ coords: ["Male"], kg: 70 }],
    };
    const ctx = makeCtx({ gender: "FEMALE" });

    expect(resolveLoad(load, ctx, ROW_EXERCISE_ID)).toEqual({
      status: "unresolved",
      reason: "missing_profile_attribute",
      prompt: "set_profile_attribute",
      attribute: "gender",
      axisLabels: ["Gender"],
    });
  });

  it("ignores a stale name-keyed plain selection and asks for a pick (TEST-001)", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [{ axisId: LEVEL_AXIS_ID, label: "Level", values: ["rx", "scaled"], binding: null }],
      cells: [
        { coords: ["rx"], kg: 60 },
        { coords: ["scaled"], kg: 40 },
      ],
    };
    const ctx = makeCtx({ profileSelections: { level: "rx" } });

    expect(resolveLoad(load, ctx, ROW_EXERCISE_ID)).toEqual({
      status: "unresolved",
      reason: "missing_profile_pick",
      prompt: "pick_profile",
      axisLabels: ["Level"],
    });
  });

  it("resolves a gender-bound axis from the typed gender column with no manual pick", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [
        {
          axisId: GENDER_AXIS_ID,
          label: "Gender",
          values: ["Male", "Female"],
          binding: "GENDER",
        },
      ],
      cells: [
        { coords: ["Male"], kg: 70 },
        { coords: ["Female"], kg: 50 },
      ],
    };
    const ctx = makeCtx({ gender: "FEMALE" });

    expect(resolveLoad(load, ctx, ROW_EXERCISE_ID)).toEqual({
      status: "resolved",
      kg: 50,
      perHand: false,
      source: {
        kind: "profile",
        coords: [{ axisId: GENDER_AXIS_ID, label: "Gender", value: "Female", binding: "GENDER" }],
      },
    });
  });

  it("resolves a gender-bound axis for MALE without reading profileSelections", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [
        {
          axisId: GENDER_AXIS_ID,
          label: "Gender",
          values: ["Male", "Female"],
          binding: "GENDER",
        },
      ],
      cells: [
        { coords: ["Male"], kg: 70 },
        { coords: ["Female"], kg: 50 },
      ],
    };
    const ctx = makeCtx({ gender: "MALE", profileSelections: {} });

    expect(resolveLoad(load, ctx, ROW_EXERCISE_ID)).toEqual({
      status: "resolved",
      kg: 70,
      perHand: false,
      source: {
        kind: "profile",
        coords: [{ axisId: GENDER_AXIS_ID, label: "Gender", value: "Male", binding: "GENDER" }],
      },
    });
  });

  it("returns missing_profile_attribute when a gender-bound axis has a null gender column", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [
        {
          axisId: GENDER_AXIS_ID,
          label: "Gender",
          values: ["Male", "Female"],
          binding: "GENDER",
        },
      ],
      cells: [
        { coords: ["Male"], kg: 70 },
        { coords: ["Female"], kg: 50 },
      ],
    };

    expect(resolveLoad(load, makeCtx({ gender: null }), ROW_EXERCISE_ID)).toEqual({
      status: "unresolved",
      reason: "missing_profile_attribute",
      prompt: "set_profile_attribute",
      attribute: "gender",
      axisLabels: ["Gender"],
    });
  });

  it("resolves a mixed plain + gender-bound load from the pick and the gender column", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [
        { axisId: LEVEL_AXIS_ID, label: "Level", values: ["rx", "scaled"], binding: null },
        {
          axisId: GENDER_AXIS_ID,
          label: "Gender",
          values: ["Male", "Female"],
          binding: "GENDER",
        },
      ],
      cells: [
        { coords: ["rx", "Male"], kg: 70 },
        { coords: ["rx", "Female"], kg: 50 },
        { coords: ["scaled", "Male"], kg: 55 },
        { coords: ["scaled", "Female"], kg: 35 },
      ],
    };
    const ctx = makeCtx({ profileSelections: { [LEVEL_AXIS_ID]: "rx" }, gender: "FEMALE" });

    expect(resolveLoad(load, ctx, ROW_EXERCISE_ID)).toEqual({
      status: "resolved",
      kg: 50,
      perHand: false,
      source: {
        kind: "profile",
        coords: [
          { axisId: LEVEL_AXIS_ID, label: "Level", value: "rx", binding: null },
          { axisId: GENDER_AXIS_ID, label: "Gender", value: "Female", binding: "GENDER" },
        ],
      },
    });
  });

  it("surfaces the pick first when a mixed load has both an unpicked plain axis and null gender", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [
        { axisId: LEVEL_AXIS_ID, label: "Level", values: ["rx", "scaled"], binding: null },
        {
          axisId: GENDER_AXIS_ID,
          label: "Gender",
          values: ["Male", "Female"],
          binding: "GENDER",
        },
      ],
      cells: [
        { coords: ["rx", "Male"], kg: 70 },
        { coords: ["rx", "Female"], kg: 50 },
        { coords: ["scaled", "Male"], kg: 55 },
        { coords: ["scaled", "Female"], kg: 35 },
      ],
    };

    expect(resolveLoad(load, makeCtx({ gender: null }), ROW_EXERCISE_ID)).toEqual({
      status: "unresolved",
      reason: "missing_profile_pick",
      prompt: "pick_profile",
      axisLabels: ["Level"],
    });
  });

  it("returns missing_profile_attribute when a mixed load has the plain axis picked but null gender", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [
        { axisId: LEVEL_AXIS_ID, label: "Level", values: ["rx", "scaled"], binding: null },
        {
          axisId: GENDER_AXIS_ID,
          label: "Gender",
          values: ["Male", "Female"],
          binding: "GENDER",
        },
      ],
      cells: [
        { coords: ["rx", "Male"], kg: 70 },
        { coords: ["rx", "Female"], kg: 50 },
        { coords: ["scaled", "Male"], kg: 55 },
        { coords: ["scaled", "Female"], kg: 35 },
      ],
    };
    const ctx = makeCtx({ profileSelections: { [LEVEL_AXIS_ID]: "rx" }, gender: null });

    expect(resolveLoad(load, ctx, ROW_EXERCISE_ID)).toEqual({
      status: "unresolved",
      reason: "missing_profile_attribute",
      prompt: "set_profile_attribute",
      attribute: "gender",
      axisLabels: ["Gender"],
    });
  });

  it("resolves a two-axis plain byProfile load by positional coords", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [
        { axisId: LEVEL_AXIS_ID, label: "Level", values: ["rx", "scaled"], binding: null },
        { axisId: SCALE_AXIS_ID, label: "Tier", values: ["a", "b"], binding: null },
      ],
      cells: [
        { coords: ["rx", "a"], kg: 70 },
        { coords: ["rx", "b"], kg: 50 },
        { coords: ["scaled", "a"], kg: 55 },
        { coords: ["scaled", "b"], kg: 35 },
      ],
    };
    const ctx = makeCtx({
      profileSelections: { [LEVEL_AXIS_ID]: "rx", [SCALE_AXIS_ID]: "b" },
    });

    expect(resolveLoad(load, ctx, ROW_EXERCISE_ID)).toEqual({
      status: "resolved",
      kg: 50,
      perHand: false,
      source: {
        kind: "profile",
        coords: [
          { axisId: LEVEL_AXIS_ID, label: "Level", value: "rx", binding: null },
          { axisId: SCALE_AXIS_ID, label: "Tier", value: "b", binding: null },
        ],
      },
    });
  });
});

describe("resolveLoad — weight provenance", () => {
  it("leaves an authored absolute bare, with no source key at all (D-A)", () => {
    const single: Load = { kind: "absolute", count: 1, kg: 40 };
    const pair: Load = { kind: "absolute", count: 2, kg: 24 };

    expect(resolveLoad(single, makeCtx(), ROW_EXERCISE_ID)).not.toHaveProperty("source");
    expect(resolveLoad(pair, makeCtx(), ROW_EXERCISE_ID)).not.toHaveProperty("source");
  });

  it("orders the profile coords by load.axes, gender first when the grid was authored that way", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [
        {
          axisId: GENDER_AXIS_ID,
          label: "Gender",
          values: ["Male", "Female"],
          binding: "GENDER",
        },
        { axisId: LEVEL_AXIS_ID, label: "Level", values: ["rx", "scaled"], binding: null },
      ],
      cells: [
        { coords: ["Male", "rx"], kg: 70 },
        { coords: ["Male", "scaled"], kg: 55 },
        { coords: ["Female", "rx"], kg: 50 },
        { coords: ["Female", "scaled"], kg: 35 },
      ],
    };
    const ctx = makeCtx({ profileSelections: { [LEVEL_AXIS_ID]: "rx" }, gender: "MALE" });

    expect(resolveLoad(load, ctx, ROW_EXERCISE_ID)).toEqual({
      status: "resolved",
      kg: 70,
      perHand: false,
      source: {
        kind: "profile",
        coords: [
          { axisId: GENDER_AXIS_ID, label: "Gender", value: "Male", binding: "GENDER" },
          { axisId: LEVEL_AXIS_ID, label: "Level", value: "rx", binding: null },
        ],
      },
    });
  });

  it("emits percentMax for a ranged percentage and resolves the identical kg as the unranged row (D-G)", () => {
    const ranged: Load = {
      kind: "percentage",
      value: 70,
      rangeMax: 80,
      reference: { scope: "self" },
    };
    const flat: Load = { kind: "percentage", value: 70, reference: { scope: "self" } };
    const ctx = makeCtx({
      currentOneRMByExercise: new Map([[ROW_EXERCISE_ID, oneRMBase(120)]]),
    });

    const rangedResult = resolveLoad(ranged, ctx, ROW_EXERCISE_ID);
    const flatResult = resolveLoad(flat, ctx, ROW_EXERCISE_ID);

    expect(rangedResult).toEqual({
      status: "resolved",
      kg: 84,
      perHand: false,
      source: {
        kind: "one_rm",
        exerciseId: ROW_EXERCISE_ID,
        percent: 70,
        percentMax: 80,
        baseKg: 120,
        recordedAt: RECORDED_AT_ISO,
        recordSource: OneRMRecordSource.MANUAL,
      },
    });
    expect(flatResult).not.toHaveProperty("source.percentMax");
    expect(flatResult).toMatchObject({ status: "resolved", kg: 84 });
  });

  it("names the exact record that produced the number, source and instant included", () => {
    const load: Load = { kind: "percentage", value: 90, reference: { scope: "self" } };
    const ctx = makeCtx({
      currentOneRMByExercise: new Map([
        [ROW_EXERCISE_ID, oneRMBase(102.5, OneRMRecordSource.TESTED)],
      ]),
    });

    expect(resolveLoad(load, ctx, ROW_EXERCISE_ID)).toEqual({
      status: "resolved",
      kg: 92.3,
      perHand: false,
      source: {
        kind: "one_rm",
        exerciseId: ROW_EXERCISE_ID,
        percent: 90,
        baseKg: 102.5,
        recordedAt: RECORDED_AT_ISO,
        recordSource: OneRMRecordSource.TESTED,
      },
    });
  });
});
