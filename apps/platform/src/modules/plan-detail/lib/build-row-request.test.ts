import { describe, expect, it } from "vitest";

import { buildRowRequest } from "./build-row-request";
import type { RowFormState, RowRequestMode } from "./row-form-state.types";

const SCHEMA_ID = "clp9z8x7w0000abcd1234sch1";
const EXERCISE_ID = "clp9z8x7w0000abcd1234ex001";
const MODIFIER_ID = "clp9z8x7w0000abcd12mod0001";
const CREATE: RowRequestMode = { kind: "create", schemaId: SCHEMA_ID };
const EDIT: RowRequestMode = { kind: "edit" };

const emptyState = (): RowFormState => ({
  exerciseId: null,
  sets: null,
  reps: null,
  load: null,
  side: null,
  tempoInput: "",
  modifierIds: [],
  notes: [],
  intensity: null,
  rest: null,
});

const fullState = (): RowFormState => ({
  exerciseId: EXERCISE_ID,
  sets: 3,
  reps: { kind: "range", min: 8, max: 12 },
  load: { kind: "absolute", count: 2, kg: 60 },
  side: { kind: "each_leg", countPerLimb: 10 },
  tempoInput: "3-1-X-0",
  modifierIds: [MODIFIER_ID],
  notes: ["from sofa", "  keep tight  "],
  intensity: { rpe: { value: 8 } },
  rest: { duration: { value: 90, unit: "sec" }, scope: "between_sets" },
});

describe("buildRowRequest create (QA-004)", () => {
  it("assembles a full valid create request from the form state", () => {
    const result = buildRowRequest(fullState(), CREATE);

    expect(result).toStrictEqual({
      ok: true,
      data: {
        schemaId: SCHEMA_ID,
        exerciseId: EXERCISE_ID,
        sets: 3,
        reps: { kind: "range", min: 8, max: 12 },
        load: { kind: "absolute", count: 2, kg: 60 },
        side: { kind: "each_leg", countPerLimb: 10 },
        tempo: { eccentric: 3, pauseBottom: 1, concentric: "X", pauseTop: 0 },
        modifierIds: [MODIFIER_ID],
        notes: ["from sofa", "keep tight"],
        intensity: { rpe: { value: 8 } },
        rest: { duration: { value: 90, unit: "sec" }, scope: "between_sets" },
      },
    });
  });

  it("omits empty optionals and nulls the empty notes list", () => {
    const state: RowFormState = { ...emptyState(), exerciseId: EXERCISE_ID };

    const result = buildRowRequest(state, CREATE);

    expect(result).toStrictEqual({
      ok: true,
      data: {
        schemaId: SCHEMA_ID,
        exerciseId: EXERCISE_ID,
        sets: null,
        load: null,
        reps: null,
        side: null,
        tempo: null,
        modifierIds: [],
        notes: null,
        intensity: null,
        rest: null,
      },
    });
  });

  it("rejects a create with no exercise picked with the coach message", () => {
    const result = buildRowRequest(emptyState(), CREATE);

    expect(result).toStrictEqual({ ok: false, error: "Pick an exercise", field: "exerciseId" });
  });
});

describe("buildRowRequest edit (QA-004)", () => {
  it("builds a partial update without schemaId or exerciseId", () => {
    const state: RowFormState = { ...emptyState(), sets: 5 };

    const result = buildRowRequest(state, EDIT);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data).not.toHaveProperty("schemaId");
      expect(result.data).not.toHaveProperty("exerciseId");
      expect(result.data).toMatchObject({ sets: 5 });
    }
  });

  it("accepts an all-null edit payload (clear every leaf field)", () => {
    const result = buildRowRequest(emptyState(), EDIT);

    expect(result).toStrictEqual({
      ok: true,
      data: {
        sets: null,
        load: null,
        reps: null,
        side: null,
        tempo: null,
        modifierIds: [],
        notes: null,
        intensity: null,
        rest: null,
      },
    });
  });
});

describe("buildRowRequest invalid discriminants surface coach prose (QA-001, QA-002, QA-003)", () => {
  it("rejects an untouched absolute load (kg = 0)", () => {
    const state: RowFormState = {
      ...emptyState(),
      exerciseId: EXERCISE_ID,
      load: { kind: "absolute", count: 1, kg: 0 },
    };

    expect(buildRowRequest(state, CREATE)).toStrictEqual({
      ok: false,
      error: "Enter a weight greater than 0.",
      field: "load",
    });
  });

  it("rejects a byProfile axis with an empty name with the coach message", () => {
    const state: RowFormState = {
      ...emptyState(),
      exerciseId: EXERCISE_ID,
      load: {
        kind: "byProfile",
        axes: [{ name: "", values: ["RX"] }],
        cells: [{ coords: ["RX"], kg: 50 }],
      },
    };

    expect(buildRowRequest(state, CREATE)).toStrictEqual({
      ok: false,
      error: "Name each axis (for example level or sex).",
      field: "load",
    });
  });

  it("rejects a byProfile that misses a cartesian cell with the coach message", () => {
    const state: RowFormState = {
      ...emptyState(),
      exerciseId: EXERCISE_ID,
      load: {
        kind: "byProfile",
        axes: [
          { name: "level", values: ["RX", "SC"] },
          { name: "sex", values: ["♂", "♀"] },
        ],
        cells: [
          { coords: ["RX", "♂"], kg: 9 },
          { coords: ["RX", "♀"], kg: 6 },
          { coords: ["SC", "♂"], kg: 6 },
        ],
      },
    };

    expect(buildRowRequest(state, CREATE)).toStrictEqual({
      ok: false,
      error: "Fill in a weight for every combination of axis values.",
      field: "load",
    });
  });

  it("rejects a percentage whose rangeMax is not above the value", () => {
    const state: RowFormState = {
      ...emptyState(),
      exerciseId: EXERCISE_ID,
      load: { kind: "percentage", value: 80, rangeMax: 70, reference: { scope: "self" } },
    };

    expect(buildRowRequest(state, CREATE)).toStrictEqual({
      ok: false,
      error: "Max % must be higher than the %.",
      field: "load",
    });
  });

  it("rejects a percentage other-exercise reference with no target", () => {
    const state: RowFormState = {
      ...emptyState(),
      exerciseId: EXERCISE_ID,
      load: {
        kind: "percentage",
        value: 80,
        reference: { scope: "other_exercise", targetExerciseId: "" },
      },
    };

    expect(buildRowRequest(state, CREATE)).toStrictEqual({
      ok: false,
      error: "Pick the reference exercise.",
      field: "load",
    });
  });

  it("rejects a reps range whose min is not below the max", () => {
    const state: RowFormState = {
      ...emptyState(),
      exerciseId: EXERCISE_ID,
      reps: { kind: "range", min: 12, max: 8 },
    };

    expect(buildRowRequest(state, CREATE)).toStrictEqual({
      ok: false,
      error: "The min reps must be lower than the max.",
      field: "reps",
    });
  });

  it("rejects a unit-bound reps with neither value nor range", () => {
    const state: RowFormState = {
      ...emptyState(),
      exerciseId: EXERCISE_ID,
      reps: { kind: "unit_bound", unit: "sec" },
    };

    expect(buildRowRequest(state, CREATE)).toStrictEqual({
      ok: false,
      error: "Enter a time or distance value.",
      field: "reps",
    });
  });

  it("stores a non-4-digit tempo as a free string", () => {
    const state: RowFormState = {
      ...emptyState(),
      exerciseId: EXERCISE_ID,
      tempoInput: "slow tempo",
    };

    const result = buildRowRequest(state, CREATE);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data).toMatchObject({ tempo: "slow tempo" });
    }
  });

  it("rejects an over-long free tempo with coach prose (QA-A-01)", () => {
    const state: RowFormState = {
      ...emptyState(),
      exerciseId: EXERCISE_ID,
      tempoInput: "x".repeat(81),
    };

    expect(buildRowRequest(state, CREATE)).toStrictEqual({
      ok: false,
      error: "Shorten the tempo to a 4-digit code like 3-1-X-0 or a brief note.",
      field: "tempo",
    });
  });
});
