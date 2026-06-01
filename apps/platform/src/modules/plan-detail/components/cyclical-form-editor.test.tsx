import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import type { Exercise } from "@repo/contracts/lms/exercise";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import type { CyclicalFormDraft } from "./exercise-form-draft.types";

const exercisesState: { data: Exercise[]; isLoading: boolean } = { data: [], isLoading: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useExercises: () => ({ data: exercisesState.data, isLoading: exercisesState.isLoading }),
  };
});

const { CyclicalFormEditor } = await import("./cyclical-form-editor");

const PRIMARY_ID = "ckxw5p7gp0000q1mnzv5cuq01";
const SECONDARY_ID = "ckxw5p7gp0000q1mnzv5cuq02";
const ROTATION_ID = "ckxw5p7gp0000q1mnzv5cuq03";
const NEW_CYCLE = { primaryReps: 1, secondaryReps: 1 };

const makeCyclical = (overrides: Partial<CyclicalFormDraft> = {}): CyclicalFormDraft => ({
  primaryExerciseId: PRIMARY_ID,
  secondaryExerciseId: SECONDARY_ID,
  cycles: [{ primaryReps: 3, secondaryReps: 6 }],
  ...overrides,
});

const onChange: Mock = vi.fn();

const lastCallArg = (): CyclicalFormDraft => {
  const call = onChange.mock.calls.at(-1);

  if (call === undefined) {
    throw new Error("onChange was not called");
  }

  return call[0] as CyclicalFormDraft;
};

const nth = <T,>(items: readonly T[], index: number): T => {
  const item = items[index];

  if (item === undefined) {
    throw new Error(`expected an item at index ${index}`);
  }

  return item;
};

afterEach(() => {
  exercisesState.data = [];
  exercisesState.isLoading = false;
  onChange.mockReset();
});

describe("CyclicalFormEditor primaryReps error (QA-001 regression)", () => {
  it("renders the primaryReps validation message when it is invalid (QA-001)", () => {
    render(
      <CyclicalFormEditor
        value={makeCyclical()}
        onChange={onChange}
        error={{
          cycles: {
            0: { primaryReps: { type: "too_small", message: "must be a positive integer" } },
          },
        }}
      />,
    );

    expect(screen.getByText("must be a positive integer")).toBeInTheDocument();
  });
});

describe("CyclicalFormEditor secondaryReps error", () => {
  it("renders the secondaryReps validation message when it is invalid", () => {
    render(
      <CyclicalFormEditor
        value={makeCyclical()}
        onChange={onChange}
        error={{
          cycles: {
            0: { secondaryReps: { type: "too_small", message: "secondary must be positive" } },
          },
        }}
      />,
    );

    expect(screen.getByText("secondary must be positive")).toBeInTheDocument();
  });
});

describe("CyclicalFormEditor cycle reps inputs (D-05)", () => {
  it("renders plain number inputs for cycle reps rather than a rep-notation kind toggle", () => {
    render(<CyclicalFormEditor value={makeCyclical()} onChange={onChange} />);

    expect(screen.queryByRole("group", { name: "rep notation kind" })).toBeNull();
    expect(screen.getAllByRole("spinbutton").length).toBeGreaterThanOrEqual(2);
  });

  it("omits primaryReps from the cycle when the primary input is cleared", () => {
    render(<CyclicalFormEditor value={makeCyclical()} onChange={onChange} />);

    const primaryInput = nth(screen.getAllByRole("spinbutton"), 0);

    fireEvent.change(primaryInput, { target: { value: "" } });

    const cycle = nth(lastCallArg().cycles, 0);

    expect(cycle).not.toHaveProperty("primaryReps");
    expect(cycle.secondaryReps).toBe(6);
  });
});

describe("CyclicalFormEditor add/remove", () => {
  it("appends a one-by-one cycle when add cycle is clicked", () => {
    render(<CyclicalFormEditor value={makeCyclical()} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "add cycle" }));

    expect(lastCallArg().cycles).toHaveLength(2);
    expect(lastCallArg().cycles[1]).toEqual(NEW_CYCLE);
  });

  it("disables the cycle remove control with exactly one cycle", () => {
    render(<CyclicalFormEditor value={makeCyclical()} onChange={onChange} />);

    expect(screen.getByRole("button", { name: "remove cycle" })).toBeDisabled();
  });

  it("enables the cycle remove control with two cycles", () => {
    const value = makeCyclical({
      cycles: [
        { primaryReps: 3, secondaryReps: 6 },
        { primaryReps: 2, secondaryReps: 4 },
      ],
    });

    render(<CyclicalFormEditor value={value} onChange={onChange} />);

    for (const removeButton of screen.getAllByRole("button", { name: "remove cycle" })) {
      expect(removeButton).toBeEnabled();
    }
  });
});

describe("CyclicalFormEditor round-trip preservation (R4)", () => {
  it("preserves optionalRotationStepExerciseId when a cycle is added", () => {
    const value = makeCyclical({ optionalRotationStepExerciseId: ROTATION_ID });

    render(<CyclicalFormEditor value={value} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "add cycle" }));

    expect(lastCallArg().optionalRotationStepExerciseId).toBe(ROTATION_ID);
  });
});
