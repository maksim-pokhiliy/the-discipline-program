import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import type { Exercise } from "@repo/contracts/lms/exercise";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import { assembleRowPayloadAndNotes, parseRowPayload } from "./row-form-utils";
import type { PerSetSubstitutionDraft, PlaceholderRowFormValue } from "./row-payload-draft.types";

const exercisesState: { data: Exercise[]; isLoading: boolean } = { data: [], isLoading: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useExercises: () => ({ data: exercisesState.data, isLoading: exercisesState.isLoading }),
  };
});

const { PlaceholderRowPayloadForm, placeholderDefaultValue, toPlaceholderValue } = await import(
  "./placeholder-row-payload-form"
);

const EXERCISE_ID_A = "ckxw5p7gp0000q1mnzv5cuq01";
const EXERCISE_ID_B = "ckxw5p7gp0000q1mnzv5cuq02";
const EXERCISE_ID_C = "ckxw5p7gp0000q1mnzv5cuq03";
const PAIRED_ROW_ID = "ckxw5p7gp0000q1mnzv5cuq09";

const baseSchemaRow = {
  id: "ckxw5p7gp0000q1mnzv5cuq0a",
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
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
} as const;

const PER_SET: PerSetSubstitutionDraft = {
  placeholderName: "DB",
  assignments: [{ setIndex: 1, exerciseId: EXERCISE_ID_A }],
};

const makePlaceholder = (
  overrides: Partial<PlaceholderRowFormValue["placeholder"]> = {},
): PlaceholderRowFormValue => ({
  placeholder: { placeholderKind: "muscle_group_reference", text: "biceps", ...overrides },
});

const onChange: Mock = vi.fn();

const lastCallArg = (): PlaceholderRowFormValue => {
  const call = onChange.mock.calls.at(-1);

  if (call === undefined) {
    throw new Error("onChange was not called");
  }

  return call[0] as PlaceholderRowFormValue;
};

afterEach(() => {
  exercisesState.data = [];
  exercisesState.isLoading = false;
  onChange.mockReset();
});

describe("PlaceholderRowPayloadForm kind/text fields (scenario 7)", () => {
  it("emits the picked placeholder kind via the toggle group", () => {
    render(<PlaceholderRowPayloadForm value={makePlaceholder()} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Coach choice" }));

    expect(lastCallArg().placeholder.placeholderKind).toBe("coach_choice_slot");
  });

  it("surfaces the text validation message", () => {
    render(
      <PlaceholderRowPayloadForm
        value={makePlaceholder({ text: "" })}
        onChange={onChange}
        error={{ placeholder: { text: { type: "too_small", message: "text is required" } } }}
      />,
    );

    expect(screen.getByText("text is required")).toBeInTheDocument();
  });
});

describe("PlaceholderRowPayloadForm per-set assignment picker error (D-02, scenarios 8-9)", () => {
  it("flags the per-set picker via the leaf exerciseId path", () => {
    render(
      <PlaceholderRowPayloadForm
        value={makePlaceholder({ perSetAssignments: PER_SET })}
        onChange={onChange}
        error={{
          placeholder: {
            perSetAssignments: {
              assignments: { 0: { exerciseId: { type: "invalid_type", message: "Required" } } },
            },
          },
        }}
      />,
    );

    expect(screen.getByText("Pick an exercise")).toBeInTheDocument();
  });

  it("flags the per-set picker via the root refine path", () => {
    render(
      <PlaceholderRowPayloadForm
        value={makePlaceholder({ perSetAssignments: PER_SET })}
        onChange={onChange}
        error={{
          placeholder: {
            perSetAssignments: {
              assignments: { 0: { root: { type: "custom", message: "exactly one of …" } } },
            },
          },
        }}
      />,
    );

    expect(screen.getByText("Pick an exercise")).toBeInTheDocument();
  });
});

describe("PlaceholderRowPayloadForm per-set name + root errors (scenarios 10-11)", () => {
  it("surfaces the placeholder name validation message", () => {
    render(
      <PlaceholderRowPayloadForm
        value={makePlaceholder({ perSetAssignments: PER_SET })}
        onChange={onChange}
        error={{
          placeholder: {
            perSetAssignments: {
              placeholderName: { type: "too_small", message: "name is required" },
            },
          },
        }}
      />,
    );

    expect(screen.getByText("name is required")).toBeInTheDocument();
  });

  it("surfaces the injected assignments-root message and disables remove at one row", () => {
    render(
      <PlaceholderRowPayloadForm
        value={makePlaceholder({ perSetAssignments: PER_SET })}
        onChange={onChange}
        error={{
          placeholder: {
            perSetAssignments: {
              assignments: { root: { type: "too_small", message: "at least one assignment" } },
            },
          },
        }}
      />,
    );

    expect(screen.getByText("at least one assignment")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove assignment" })).toBeDisabled();
  });
});

describe("PlaceholderRowPayloadForm per-set add/remove affordance (scenario 12)", () => {
  it("renders no per-set block at the default value", () => {
    render(<PlaceholderRowPayloadForm value={placeholderDefaultValue} onChange={onChange} />);

    expect(screen.getByRole("button", { name: "add per-set substitutions" })).toBeInTheDocument();
    expect(screen.queryByText("set 1:")).toBeNull();
  });

  it("reveals a placeholder name field and one set row when per-set is added", () => {
    render(<PlaceholderRowPayloadForm value={makePlaceholder()} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "add per-set substitutions" }));

    expect(lastCallArg().placeholder.perSetAssignments).toEqual({
      placeholderName: "",
      assignments: [{ setIndex: 1, exerciseId: null }],
    });
  });

  it("appends a second set row when add assignment is clicked", () => {
    render(
      <PlaceholderRowPayloadForm
        value={makePlaceholder({ perSetAssignments: PER_SET })}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "add assignment" }));

    expect(lastCallArg().placeholder.perSetAssignments?.assignments).toHaveLength(2);
    expect(lastCallArg().placeholder.perSetAssignments?.assignments[1]).toEqual({
      setIndex: 2,
      exerciseId: null,
    });
  });

  it("drops the per-set block entirely when remove substitutions is clicked", () => {
    render(
      <PlaceholderRowPayloadForm
        value={makePlaceholder({ perSetAssignments: PER_SET })}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "remove substitutions" }));

    expect(lastCallArg().placeholder).not.toHaveProperty("perSetAssignments");
  });
});

describe("PlaceholderRowPayloadForm pairedConcreteRowId opaque carry (D-02b, scenario 13)", () => {
  it("preserves pairedConcreteRowId while dropping the per-set block on remove", () => {
    render(
      <PlaceholderRowPayloadForm
        value={makePlaceholder({ perSetAssignments: PER_SET, pairedConcreteRowId: PAIRED_ROW_ID })}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "remove substitutions" }));

    expect(lastCallArg().placeholder.pairedConcreteRowId).toBe(PAIRED_ROW_ID);
    expect(lastCallArg().placeholder).not.toHaveProperty("perSetAssignments");
  });
});

describe("PlaceholderRowPayloadForm edit round-trips (scenarios 14-15)", () => {
  const coachChoiceRow: SchemaRow = {
    ...baseSchemaRow,
    rowKind: "PLACEHOLDER",
    rowPayload: {
      rowKind: "PLACEHOLDER",
      placeholder: {
        placeholderKind: "coach_choice_slot",
        text: "*DB exercise",
        perSetAssignments: {
          placeholderName: "DB",
          assignments: [
            { setIndex: 1, exerciseId: EXERCISE_ID_A },
            { setIndex: 2, exerciseId: EXERCISE_ID_B },
            { setIndex: 3, exerciseId: EXERCISE_ID_C },
          ],
        },
      },
    },
  };

  it("preserves the seeded per-set exerciseId assignments and re-parses ok", () => {
    const value = toPlaceholderValue({ kind: "edit", row: coachChoiceRow });

    expect(value.placeholder.perSetAssignments?.assignments).toEqual([
      { setIndex: 1, exerciseId: EXERCISE_ID_A },
      { setIndex: 2, exerciseId: EXERCISE_ID_B },
      { setIndex: 3, exerciseId: EXERCISE_ID_C },
    ]);
    expect(parseRowPayload("PLACEHOLDER", value).ok).toBe(true);
  });

  it("carries an opaque pairedConcreteRowId through the value and re-parse", () => {
    const row: SchemaRow = {
      ...baseSchemaRow,
      rowKind: "PLACEHOLDER",
      rowPayload: {
        rowKind: "PLACEHOLDER",
        placeholder: {
          placeholderKind: "muscle_group_reference",
          text: "biceps",
          pairedConcreteRowId: PAIRED_ROW_ID,
        },
      },
    };

    const value = toPlaceholderValue({ kind: "edit", row });

    expect(value.placeholder.pairedConcreteRowId).toBe(PAIRED_ROW_ID);

    const result = parseRowPayload("PLACEHOLDER", value);

    expect(result.ok).toBe(true);

    if (result.ok && result.value.rowKind === "PLACEHOLDER") {
      expect(result.value.placeholder.pairedConcreteRowId).toBe(PAIRED_ROW_ID);
    }
  });
});

describe("PlaceholderRowPayloadForm notes survives edit (QA-002 opaque carry, scenario 16)", () => {
  const noteyRow: SchemaRow = {
    ...baseSchemaRow,
    rowKind: "PLACEHOLDER",
    rowPayload: {
      rowKind: "PLACEHOLDER",
      placeholder: { placeholderKind: "purpose_category", text: "ABS" },
    },
    notes: "keep me",
  };

  it("carries the existing notes into the form value", () => {
    expect(toPlaceholderValue({ kind: "edit", row: noteyRow }).notes).toBe("keep me");
  });

  it("re-emits the notes on assemble instead of dropping them to null", () => {
    const value = toPlaceholderValue({ kind: "edit", row: noteyRow });

    expect(assembleRowPayloadAndNotes("PLACEHOLDER", value).notes).toBe("keep me");
  });
});
