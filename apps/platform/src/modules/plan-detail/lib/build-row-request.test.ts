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
  mediaUrl: "",
  mediaLabel: "",
  notes: [],
});

const fullState = (): RowFormState => ({
  exerciseId: EXERCISE_ID,
  sets: 3,
  reps: { kind: "range", min: 8, max: 12 },
  load: { kind: "absolute", count: 2, kg: 60 },
  side: { kind: "each_leg", countPerLimb: 10 },
  tempoInput: "3-1-X-0",
  modifierIds: [MODIFIER_ID],
  mediaUrl: "https://example.com/demo",
  mediaLabel: "demo",
  notes: ["from sofa", "  keep tight  "],
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
        media: { url: "https://example.com/demo", label: "demo" },
        modifierIds: [MODIFIER_ID],
        notes: ["from sofa", "keep tight"],
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
        media: null,
        modifierIds: [],
        notes: null,
      },
    });
  });

  it("drops a demo label that has no URL", () => {
    const state: RowFormState = {
      ...emptyState(),
      exerciseId: EXERCISE_ID,
      mediaUrl: "",
      mediaLabel: "orphan label",
    };

    const result = buildRowRequest(state, CREATE);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.media).toBeNull();
    }
  });

  it("rejects a create with no exercise picked with the coach message", () => {
    const result = buildRowRequest(emptyState(), CREATE);

    expect(result).toStrictEqual({ ok: false, error: "Pick an exercise" });
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
        media: null,
        modifierIds: [],
        notes: null,
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
    });
  });

  it("rejects a byProfile entry with an empty label", () => {
    const state: RowFormState = {
      ...emptyState(),
      exerciseId: EXERCISE_ID,
      load: { kind: "byProfile", entries: [{ label: "", kg: 50 }] },
    };

    expect(buildRowRequest(state, CREATE)).toStrictEqual({
      ok: false,
      error: "Add a label for each profile weight.",
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
    });
  });

  it("rejects an invalid tempo string before parsing the rest", () => {
    const state: RowFormState = {
      ...emptyState(),
      exerciseId: EXERCISE_ID,
      tempoInput: "3-1",
    };

    expect(buildRowRequest(state, CREATE)).toStrictEqual({
      ok: false,
      error: "Tempo must be 4 positions, each 0–60 or X, e.g. 3-1-X-0",
    });
  });
});
