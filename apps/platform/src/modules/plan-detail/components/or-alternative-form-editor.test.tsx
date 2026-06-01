import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import type { RepNotation } from "@repo/contracts/lms/_shared";
import type { Exercise } from "@repo/contracts/lms/exercise";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import type { OrAlternativeFormDraft } from "./exercise-form-draft.types";

const exercisesState: { data: Exercise[]; isLoading: boolean } = { data: [], isLoading: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useExercises: () => ({ data: exercisesState.data, isLoading: exercisesState.isLoading }),
  };
});

const { OrAlternativeFormEditor } = await import("./or-alternative-form-editor");

const PRIMARY_ID = "ckxw5p7gp0000q1mnzv5cuq01";
const ALTERNATIVE_ID = "ckxw5p7gp0000q1mnzv5cuq02";
const REPS: RepNotation = { kind: "count", value: 5 };

const makeOrAlternative = (
  overrides: Partial<OrAlternativeFormDraft> = {},
): OrAlternativeFormDraft => ({
  primaryExerciseId: PRIMARY_ID,
  primaryReps: REPS,
  alternativeExerciseId: ALTERNATIVE_ID,
  alternativeReps: REPS,
  purpose: "scale_down",
  ...overrides,
});

const onChange: Mock = vi.fn();

const lastCallArg = (): OrAlternativeFormDraft => {
  const call = onChange.mock.calls.at(-1);

  if (call === undefined) {
    throw new Error("onChange was not called");
  }

  return call[0] as OrAlternativeFormDraft;
};

afterEach(() => {
  exercisesState.data = [];
  exercisesState.isLoading = false;
  onChange.mockReset();
});

describe("OrAlternativeFormEditor structure", () => {
  it("renders the OR divider between the primary and alternative blocks", () => {
    render(<OrAlternativeFormEditor value={makeOrAlternative()} onChange={onChange} />);

    expect(screen.getByText("· OR ·")).toBeInTheDocument();
  });
});

describe("OrAlternativeFormEditor purpose toggle", () => {
  it("emits coach_choice when the Coach choice option is selected", () => {
    render(<OrAlternativeFormEditor value={makeOrAlternative()} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Coach choice" }));

    expect(lastCallArg().purpose).toBe("coach_choice");
  });
});

describe("OrAlternativeFormEditor error surfacing (#115)", () => {
  it("renders the primary reps range message at the rep-notation root", () => {
    render(
      <OrAlternativeFormEditor
        value={makeOrAlternative()}
        onChange={onChange}
        error={{
          primaryReps: { root: { type: "custom", message: "range.min must be < range.max" } },
        }}
      />,
    );

    expect(screen.getByText("range.min must be < range.max")).toBeInTheDocument();
  });

  it("flags the alternative picker in error when its exercise id is missing", () => {
    render(
      <OrAlternativeFormEditor
        value={makeOrAlternative()}
        onChange={onChange}
        error={{ alternativeExerciseId: { type: "invalid_type", message: "Required" } }}
      />,
    );

    expect(screen.getByText("Pick an exercise")).toBeInTheDocument();
  });

  it("renders the purpose validation message", () => {
    render(
      <OrAlternativeFormEditor
        value={makeOrAlternative()}
        onChange={onChange}
        error={{ purpose: { type: "invalid_enum_value", message: "pick a purpose" } }}
      />,
    );

    expect(screen.getByText("pick a purpose")).toBeInTheDocument();
  });
});
