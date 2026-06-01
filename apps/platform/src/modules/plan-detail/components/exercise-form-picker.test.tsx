import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import type { Exercise } from "@repo/contracts/lms/exercise";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import type { ExerciseFormValue } from "./exercise-row-payload-form";

const exercisesState: { data: Exercise[]; isLoading: boolean } = { data: [], isLoading: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useExercises: () => ({ data: exercisesState.data, isLoading: exercisesState.isLoading }),
  };
});

const { ExerciseFormPicker } = await import("./exercise-form-picker");

const onChange: Mock = vi.fn();

const ATOMIC_VALUE: ExerciseFormValue = { form: "atomic", exerciseId: null };

const COMPOUND_VALUE: ExerciseFormValue = {
  form: "compound",
  compound: {
    elements: [
      { exerciseId: "ckxw5p7gp0000q1mnzv5cuq01", reps: { kind: "count", value: 5 } },
      { exerciseId: "ckxw5p7gp0000q1mnzv5cuq02", reps: { kind: "count", value: 5 } },
    ],
  },
};

const ALL_TILE_LABELS = [
  "Atomic",
  "Compound",
  "Cyclical",
  "Sandwich",
  "OR alternative",
  "Placeholder ref",
] as const;

const getTileButton = (label: string): HTMLButtonElement => {
  const node = screen.getByText(label).closest("button");

  if (!(node instanceof HTMLButtonElement)) {
    throw new Error(`expected a tile button for "${label}"`);
  }

  return node;
};

afterEach(() => {
  exercisesState.data = [];
  exercisesState.isLoading = false;
  onChange.mockReset();
});

describe("ExerciseFormPicker tiles", () => {
  it("renders all 6 exercise-form tiles", () => {
    render(<ExerciseFormPicker value={ATOMIC_VALUE} onChange={onChange} />);

    for (const label of ALL_TILE_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("keeps the atomic tile live while disabling the 5 multi-exercise tiles", () => {
    render(<ExerciseFormPicker value={ATOMIC_VALUE} onChange={onChange} />);

    expect(getTileButton("Atomic")).toBeEnabled();

    for (const label of ["Compound", "Cyclical", "Sandwich", "OR alternative", "Placeholder ref"]) {
      expect(getTileButton(label)).toBeDisabled();
    }
  });
});

describe("ExerciseFormPicker atomic body", () => {
  it("renders the exercise picker search box inside the body for an atomic value", () => {
    render(<ExerciseFormPicker value={ATOMIC_VALUE} onChange={onChange} />);

    expect(screen.getByPlaceholderText("search by name, family, or modality…")).toBeInTheDocument();
  });
});

describe("ExerciseFormPicker non-atomic preserved state (QA-MT11, QA-005)", () => {
  it("disables every tile and shows the preserved notice without the atomic picker", () => {
    render(<ExerciseFormPicker value={COMPOUND_VALUE} onChange={onChange} />);

    for (const label of ALL_TILE_LABELS) {
      expect(getTileButton(label)).toBeDisabled();
    }

    expect(
      screen.getByText(
        "Multi-exercise form (Compound) — editing the exercise itself is coming soon; it stays preserved on save.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("search by name, family, or modality…")).toBeNull();
  });
});
