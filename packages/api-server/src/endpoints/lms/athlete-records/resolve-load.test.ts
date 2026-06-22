import { describe, expect, it } from "vitest";

import { type Load } from "@repo/contracts/lms/_shared";

import { type AthleteLoadContext } from "./athlete-records.types";
import { resolveLoad } from "./resolve-load";

const ROW_EXERCISE_ID = "row-exercise-1";
const OTHER_EXERCISE_ID = "other-exercise-1";
const LEVEL_AXIS_ID = "clz0000000000000000axis01";
const SCALE_AXIS_ID = "clz0000000000000000axis02";

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
    const ctx = makeCtx({ currentOneRMByExercise: new Map([[ROW_EXERCISE_ID, 100]]) });

    expect(resolveLoad(load, ctx, ROW_EXERCISE_ID)).toEqual({
      status: "resolved",
      kg: 80,
      perHand: false,
    });
  });

  it("resolves an other-exercise percentage against the target's current 1RM", () => {
    const load: Load = {
      kind: "percentage",
      value: 50,
      reference: { scope: "other_exercise", targetExerciseId: OTHER_EXERCISE_ID },
    };
    const ctx = makeCtx({ currentOneRMByExercise: new Map([[OTHER_EXERCISE_ID, 90]]) });

    expect(resolveLoad(load, ctx, ROW_EXERCISE_ID)).toEqual({
      status: "resolved",
      kg: 45,
      perHand: false,
    });
  });

  it("rounds a percentage result to one decimal place", () => {
    const load: Load = { kind: "percentage", value: 33, reference: { scope: "self" } };
    const ctx = makeCtx({ currentOneRMByExercise: new Map([[ROW_EXERCISE_ID, 100]]) });

    expect(resolveLoad(load, ctx, ROW_EXERCISE_ID)).toEqual({
      status: "resolved",
      kg: 33,
      perHand: false,
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

  it("resolves a catalog byProfile load to the cell matching the remembered pick", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [{ kind: "catalog", axisId: LEVEL_AXIS_ID, label: "Level", values: ["rx", "scaled"] }],
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
    });
  });

  it("returns missing_profile_pick with the axis label when a catalog axis has no pick", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [{ kind: "catalog", axisId: LEVEL_AXIS_ID, label: "Level", values: ["rx", "scaled"] }],
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

  it("returns missing_profile_pick when the remembered catalog pick is not a valid value", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [{ kind: "catalog", axisId: LEVEL_AXIS_ID, label: "Level", values: ["rx", "scaled"] }],
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

  it("returns missing_profile_pick when valid catalog picks match no cell (QA-007)", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [{ kind: "catalog", axisId: LEVEL_AXIS_ID, label: "Level", values: ["rx", "scaled"] }],
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

  it("steers to the gender attribute when an all-human load resolves but no cell matches", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [{ kind: "human", attribute: "gender" }],
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

  it("ignores a stale name-keyed catalog selection and asks for a pick (TEST-001)", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [{ kind: "catalog", axisId: LEVEL_AXIS_ID, label: "Level", values: ["rx", "scaled"] }],
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

  it("resolves a human gender axis from the typed gender column with no manual pick", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [{ kind: "human", attribute: "gender" }],
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
    });
  });

  it("returns missing_profile_attribute when a human gender axis has a null gender column", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [{ kind: "human", attribute: "gender" }],
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

  it("resolves a mixed catalog + human load from the pick and the gender column", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [
        { kind: "catalog", axisId: LEVEL_AXIS_ID, label: "Level", values: ["rx", "scaled"] },
        { kind: "human", attribute: "gender" },
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
    });
  });

  it("surfaces the catalog pick first when a mixed load has both unpicked catalog and null gender", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [
        { kind: "catalog", axisId: LEVEL_AXIS_ID, label: "Level", values: ["rx", "scaled"] },
        { kind: "human", attribute: "gender" },
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

  it("returns missing_profile_attribute when a mixed load has the catalog picked but null gender", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [
        { kind: "catalog", axisId: LEVEL_AXIS_ID, label: "Level", values: ["rx", "scaled"] },
        { kind: "human", attribute: "gender" },
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

  it("resolves a two-axis catalog byProfile load by positional coords", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [
        { kind: "catalog", axisId: LEVEL_AXIS_ID, label: "Level", values: ["rx", "scaled"] },
        { kind: "catalog", axisId: SCALE_AXIS_ID, label: "Tier", values: ["a", "b"] },
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
    });
  });
});
