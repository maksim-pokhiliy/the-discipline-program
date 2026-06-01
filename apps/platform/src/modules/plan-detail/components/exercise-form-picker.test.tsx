import { fireEvent, screen } from "@testing-library/react";
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

const COMPOUND_SEED_REPS = 10;
const MULTI_FORM_NOTICE_FRAGMENT = /coming soon/;
const FULL_PICKER_PLACEHOLDER = "search by name, family, or modality…";

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

  it("keeps every form tile live", () => {
    render(<ExerciseFormPicker value={ATOMIC_VALUE} onChange={onChange} />);

    for (const label of ALL_TILE_LABELS) {
      expect(getTileButton(label)).toBeEnabled();
    }
  });

  it("seeds a two-element compound draft when the Compound tile is selected", () => {
    render(<ExerciseFormPicker value={ATOMIC_VALUE} onChange={onChange} />);

    fireEvent.click(getTileButton("Compound"));

    expect(onChange).toHaveBeenCalledWith({
      form: "compound",
      compound: {
        elements: [
          { exerciseId: null, reps: { kind: "count", value: COMPOUND_SEED_REPS } },
          { exerciseId: null, reps: { kind: "count", value: COMPOUND_SEED_REPS } },
        ],
      },
    });
  });
});

describe("ExerciseFormPicker atomic body", () => {
  it("renders the exercise picker search box inside the body for an atomic value", () => {
    render(<ExerciseFormPicker value={ATOMIC_VALUE} onChange={onChange} />);

    expect(screen.getByPlaceholderText(FULL_PICKER_PLACEHOLDER)).toBeInTheDocument();
  });
});

describe("ExerciseFormPicker non-atomic body", () => {
  it("renders the compound editor without the read-only notice for a compound value", () => {
    render(<ExerciseFormPicker value={COMPOUND_VALUE} onChange={onChange} />);

    expect(screen.getByText("add element")).toBeInTheDocument();
    expect(screen.getByText("element 1")).toBeInTheDocument();
    expect(screen.getByText("element 2")).toBeInTheDocument();

    expect(screen.queryByText(MULTI_FORM_NOTICE_FRAGMENT)).toBeNull();
    expect(screen.queryByPlaceholderText(FULL_PICKER_PLACEHOLDER)).toBeNull();
  });
});
