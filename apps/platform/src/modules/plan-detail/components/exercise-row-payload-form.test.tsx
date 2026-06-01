import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import type { Exercise } from "@repo/contracts/lms/exercise";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import type { RowEditorMode } from "./row-editor-types";

const exercisesState: { data: Exercise[]; isLoading: boolean } = { data: [], isLoading: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useExercises: () => ({ data: exercisesState.data, isLoading: exercisesState.isLoading }),
  };
});

const { ExerciseRowPayloadForm, exerciseDefaultValue, toExerciseValue } = await import(
  "./exercise-row-payload-form"
);

const NOW = new Date("2026-01-06T00:00:00.000Z");
const EXERCISE_ID = "ckxw5p7gp0000q1mnzv5cuq01";

const baseRow = {
  id: "ckxw5p7gp0000q1mnzv5cuq0c",
  schemaId: "ckxw5p7gp0000q1mnzv5cuq0b",
  order: 1,
  load: null,
  reps: null,
  side: null,
  tempo: null,
  position: null,
  sequence: null,
  intensity: null,
  media: null,
  compoundRep: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
} as const;

const makeEditMode = (row: SchemaRow): RowEditorMode => ({ kind: "edit", row });

const onChange: Mock = vi.fn();

afterEach(() => {
  exercisesState.data = [];
  exercisesState.isLoading = false;
  onChange.mockReset();
});

describe("ExerciseRowPayloadForm seeded-defaults smoke", () => {
  it("renders the seeded defaults without calling onChange on mount", () => {
    render(<ExerciseRowPayloadForm value={exerciseDefaultValue} onChange={onChange} />);

    expect(screen.getByRole("button", { name: "% of ref", pressed: true })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("search by name, family, or modality…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ add intensity override" })).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("toExerciseValue create mode", () => {
  it("returns the exercise default value", () => {
    const result = toExerciseValue({
      kind: "create",
      schemaId: baseRow.schemaId,
      rowKind: "EXERCISE",
    });

    expect(result).toEqual(exerciseDefaultValue);
  });
});

describe("toExerciseValue edit round-trip", () => {
  it("maps a fully populated EXERCISE row including Intensity to ShellIntensityForm", () => {
    const row: SchemaRow = {
      ...baseRow,
      rowKind: "EXERCISE",
      rowPayload: { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EXERCISE_ID } },
      reps: { kind: "range", min: 6, max: 8 },
      load: { kind: "percentage", value: 75, reference: { scope: "self" } },
      side: { kind: "each_leg", countPerLimb: 10 },
      tempo: { slowEccentric: { durationSec: 4 } },
      position: "NEUTRAL_GRIP",
      intensity: { rpe: { value: 8 }, effortPercent: { value: 80 } },
      notes: "drive the knees out",
    };

    const result = toExerciseValue(makeEditMode(row));

    expect(result).toEqual({
      exercise: { form: "atomic", exerciseId: EXERCISE_ID },
      reps: { kind: "range", min: 6, max: 8 },
      load: { kind: "percentage", value: 75, reference: { scope: "self" } },
      side: { kind: "each_leg", countPerLimb: 10 },
      tempo: { slowEccentric: { durationSec: 4 } },
      position: "NEUTRAL_GRIP",
      intensity: { rpe: { value: 8 }, effortPercent: { value: 80 } },
      notes: "drive the knees out",
    });
  });

  it("preserves a non-atomic exercise form verbatim on edit (QA-MT11, QA-005)", () => {
    const compoundExercise = {
      form: "compound" as const,
      compound: {
        elements: [
          { exerciseId: EXERCISE_ID, reps: { kind: "count" as const, value: 5 } },
          { exerciseId: "ckxw5p7gp0000q1mnzv5cuq02", reps: { kind: "count" as const, value: 5 } },
        ],
      },
    };
    const row: SchemaRow = {
      ...baseRow,
      rowKind: "EXERCISE",
      rowPayload: { rowKind: "EXERCISE", exercise: compoundExercise },
    };

    const result = toExerciseValue(makeEditMode(row));

    expect(result.exercise).toEqual(compoundExercise);
  });

  it("seeds the default reps and load when the row stores them as null (R-3)", () => {
    const row: SchemaRow = {
      ...baseRow,
      rowKind: "EXERCISE",
      rowPayload: { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EXERCISE_ID } },
    };

    const result = toExerciseValue(makeEditMode(row));

    expect(result.reps).toEqual({ kind: "count", value: 5 });
    expect(result.load).toEqual({ kind: "percentage", value: 80, reference: { scope: "self" } });
  });

  it("maps a null row intensity to a null override", () => {
    const row: SchemaRow = {
      ...baseRow,
      rowKind: "EXERCISE",
      rowPayload: { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EXERCISE_ID } },
    };

    const result = toExerciseValue(makeEditMode(row));

    expect(result.intensity).toBeNull();
  });
});
