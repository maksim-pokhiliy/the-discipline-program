import { describe, expect, it } from "vitest";

import { type Load } from "@repo/contracts/lms/_shared";

import { type AthleteLoadContext } from "./athlete-records.types";
import { resolveLoad } from "./resolve-load";

const ROW_EXERCISE_ID = "row-exercise-1";
const OTHER_EXERCISE_ID = "other-exercise-1";

const makeCtx = (overrides: Partial<AthleteLoadContext> = {}): AthleteLoadContext => ({
  bodyweightKg: null,
  currentOneRMByExercise: new Map(),
  profileSelections: {},
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

  it("resolves bodyweight to the athlete's weight when known", () => {
    const load: Load = { kind: "bodyweight" };

    expect(resolveLoad(load, makeCtx({ bodyweightKg: 72 }), ROW_EXERCISE_ID)).toEqual({
      status: "resolved",
      kg: 72,
      perHand: false,
    });
  });

  it("returns not_applicable for bodyweight when the weight is unknown", () => {
    const load: Load = { kind: "bodyweight" };

    expect(resolveLoad(load, makeCtx(), ROW_EXERCISE_ID)).toEqual({ status: "not_applicable" });
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

  it("resolves a byProfile load to the cell matching the remembered pick", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [{ name: "level", values: ["rx", "scaled"] }],
      cells: [
        { coords: ["rx"], kg: 60 },
        { coords: ["scaled"], kg: 40 },
      ],
    };
    const ctx = makeCtx({ profileSelections: { level: "scaled" } });

    expect(resolveLoad(load, ctx, ROW_EXERCISE_ID)).toEqual({
      status: "resolved",
      kg: 40,
      perHand: false,
    });
  });

  it("returns missing_profile_pick when an axis has no remembered pick", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [{ name: "level", values: ["rx", "scaled"] }],
      cells: [
        { coords: ["rx"], kg: 60 },
        { coords: ["scaled"], kg: 40 },
      ],
    };

    expect(resolveLoad(load, makeCtx(), ROW_EXERCISE_ID)).toEqual({
      status: "unresolved",
      reason: "missing_profile_pick",
      prompt: "pick_profile",
      axisNames: ["level"],
    });
  });

  it("returns missing_profile_pick when the remembered pick is not a valid axis value", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [{ name: "level", values: ["rx", "scaled"] }],
      cells: [
        { coords: ["rx"], kg: 60 },
        { coords: ["scaled"], kg: 40 },
      ],
    };
    const ctx = makeCtx({ profileSelections: { level: "intermediate" } });

    expect(resolveLoad(load, ctx, ROW_EXERCISE_ID)).toEqual({
      status: "unresolved",
      reason: "missing_profile_pick",
      prompt: "pick_profile",
      axisNames: ["level"],
    });
  });

  it("returns missing_profile_pick when valid picks match no cell (QA-007)", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [{ name: "level", values: ["rx", "scaled"] }],
      cells: [{ coords: ["rx"], kg: 60 }],
    };
    const ctx = makeCtx({ profileSelections: { level: "scaled" } });

    expect(resolveLoad(load, ctx, ROW_EXERCISE_ID)).toEqual({
      status: "unresolved",
      reason: "missing_profile_pick",
      prompt: "pick_profile",
      axisNames: ["level"],
    });
  });

  it("resolves a two-axis byProfile load by positional coords", () => {
    const load: Load = {
      kind: "byProfile",
      axes: [
        { name: "level", values: ["rx", "scaled"] },
        { name: "gender", values: ["m", "f"] },
      ],
      cells: [
        { coords: ["rx", "m"], kg: 70 },
        { coords: ["rx", "f"], kg: 50 },
        { coords: ["scaled", "m"], kg: 55 },
        { coords: ["scaled", "f"], kg: 35 },
      ],
    };
    const ctx = makeCtx({ profileSelections: { level: "rx", gender: "f" } });

    expect(resolveLoad(load, ctx, ROW_EXERCISE_ID)).toEqual({
      status: "resolved",
      kg: 50,
      perHand: false,
    });
  });
});
