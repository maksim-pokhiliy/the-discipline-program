import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import type { Exercise } from "@repo/contracts/lms/exercise";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import { assembleRowPayloadAndNotes, parseRowPayload } from "./row-form-utils";
import type { RepDefinitionRowFormValue } from "./row-payload-draft.types";

const exercisesState: { data: Exercise[]; isLoading: boolean } = { data: [], isLoading: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useExercises: () => ({ data: exercisesState.data, isLoading: exercisesState.isLoading }),
  };
});

const { RepDefinitionRowPayloadForm, repDefinitionDefaultValue, toRepDefinitionValue } =
  await import("./rep-definition-row-payload-form");

const EXERCISE_ID_A = "ckxw5p7gp0000q1mnzv5cuq01";
const EXERCISE_ID_B = "ckxw5p7gp0000q1mnzv5cuq02";

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

const makeRepDefinition = (
  overrides: Partial<RepDefinitionRowFormValue["equality"]> = {},
): RepDefinitionRowFormValue => ({
  equality: {
    form: "inline_equality",
    totalReps: 5,
    composition: [{ exerciseId: EXERCISE_ID_A, count: 1 }],
    ...overrides,
  },
});

const onChange: Mock = vi.fn();

const lastCallArg = (): RepDefinitionRowFormValue => {
  const call = onChange.mock.calls.at(-1);

  if (call === undefined) {
    throw new Error("onChange was not called");
  }

  return call[0] as RepDefinitionRowFormValue;
};

const readTotalRepsLeaf = (value: RepDefinitionRowFormValue): string | undefined => {
  const result = parseRowPayload("REP_DEFINITION", value);

  if (result.ok) {
    return undefined;
  }

  const equality = result.error.equality;

  if (typeof equality !== "object" || equality === null) {
    return undefined;
  }

  const totalReps = (equality as Record<string, unknown>).totalReps;

  return typeof totalReps === "object" && totalReps !== null
    ? ((totalReps as Record<string, unknown>).message as string | undefined)
    : undefined;
};

afterEach(() => {
  exercisesState.data = [];
  exercisesState.isLoading = false;
  onChange.mockReset();
});

describe("RepDefinitionRowPayloadForm defaults (scenario 22)", () => {
  it("renders the default total reps and a single composition row without calling onChange", () => {
    render(<RepDefinitionRowPayloadForm value={repDefinitionDefaultValue} onChange={onChange} />);

    expect(screen.getByDisplayValue("5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "add element" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove element" })).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("appends a count-1 null-picker row when add element is clicked", () => {
    render(<RepDefinitionRowPayloadForm value={makeRepDefinition()} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "add element" }));

    expect(lastCallArg().equality.composition).toHaveLength(2);
    expect(lastCallArg().equality.composition[1]).toEqual({ exerciseId: null, count: 1 });
  });

  it("enables the remove control with two composition rows", () => {
    const value = makeRepDefinition({
      composition: [
        { exerciseId: EXERCISE_ID_A, count: 1 },
        { exerciseId: EXERCISE_ID_B, count: 2 },
      ],
    });

    render(<RepDefinitionRowPayloadForm value={value} onChange={onChange} />);

    for (const removeButton of screen.getAllByRole("button", { name: "Remove element" })) {
      expect(removeButton).toBeEnabled();
    }
  });
});

describe("RepDefinitionRowPayloadForm error surfacing (scenarios 17, 19, 20, 21)", () => {
  it("surfaces the total reps validation message", () => {
    render(
      <RepDefinitionRowPayloadForm
        value={makeRepDefinition()}
        onChange={onChange}
        error={{ equality: { totalReps: { type: "too_small", message: "must be positive" } } }}
      />,
    );

    expect(screen.getByText("must be positive")).toBeInTheDocument();
  });

  it("surfaces the composition count validation message", () => {
    render(
      <RepDefinitionRowPayloadForm
        value={makeRepDefinition()}
        onChange={onChange}
        error={{
          equality: { composition: { 0: { count: { type: "too_small", message: "count > 0" } } } },
        }}
      />,
    );

    expect(screen.getByText("count > 0")).toBeInTheDocument();
  });

  it("flags the composition picker when its exercise id is missing", () => {
    render(
      <RepDefinitionRowPayloadForm
        value={makeRepDefinition({ composition: [{ exerciseId: null, count: 1 }] })}
        onChange={onChange}
        error={{
          equality: {
            composition: { 0: { exerciseId: { type: "invalid_type", message: "Required" } } },
          },
        }}
      />,
    );

    expect(screen.getByText("Pick an exercise")).toBeInTheDocument();
  });

  it("surfaces the injected composition-root message", () => {
    render(
      <RepDefinitionRowPayloadForm
        value={makeRepDefinition()}
        onChange={onChange}
        error={{
          equality: { composition: { root: { type: "too_small", message: "need one element" } } },
        }}
      />,
    );

    expect(screen.getByText("need one element")).toBeInTheDocument();
  });
});

describe("RepDefinitionRowPayloadForm totalReps coercion blocks save (QA-004, scenario 18)", () => {
  it("emits 0 on a cleared field, which parse rejects at the totalReps leaf", () => {
    render(<RepDefinitionRowPayloadForm value={makeRepDefinition()} onChange={onChange} />);

    const [totalReps] = screen.getAllByRole("spinbutton");

    fireEvent.change(totalReps as HTMLElement, { target: { value: "" } });

    expect(lastCallArg().equality.totalReps).toBe(0);
    expect(parseRowPayload("REP_DEFINITION", lastCallArg()).ok).toBe(false);
    expect(readTotalRepsLeaf(lastCallArg())).toBeDefined();
  });

  it("emits a float on a fractional entry, which parse rejects at the totalReps leaf", () => {
    render(<RepDefinitionRowPayloadForm value={makeRepDefinition()} onChange={onChange} />);

    const [totalReps] = screen.getAllByRole("spinbutton");

    fireEvent.change(totalReps as HTMLElement, { target: { value: "1.5" } });

    expect(lastCallArg().equality.totalReps).toBe(1.5);
    expect(parseRowPayload("REP_DEFINITION", lastCallArg()).ok).toBe(false);
    expect(readTotalRepsLeaf(lastCallArg())).toBeDefined();
  });

  it("collapses a non-numeric entry to a blocked totalReps with a leaf message", () => {
    render(<RepDefinitionRowPayloadForm value={makeRepDefinition()} onChange={onChange} />);

    const [totalReps] = screen.getAllByRole("spinbutton");

    fireEvent.change(totalReps as HTMLElement, { target: { value: "abc" } });

    expect(Number.isInteger(lastCallArg().equality.totalReps)).toBe(true);
    expect(lastCallArg().equality.totalReps).toBeLessThanOrEqual(0);
    expect(parseRowPayload("REP_DEFINITION", lastCallArg()).ok).toBe(false);
    expect(readTotalRepsLeaf(lastCallArg())).toBeDefined();
  });

  it("rejects a hand-built NaN totalReps at the leaf (the coercion-floor case)", () => {
    const value = makeRepDefinition({ totalReps: Number.NaN });

    expect(parseRowPayload("REP_DEFINITION", value).ok).toBe(false);
    expect(readTotalRepsLeaf(value)).toBeDefined();
  });
});

describe("RepDefinitionRowPayloadForm edit round-trip (scenario 23)", () => {
  const repDefinitionRow: SchemaRow = {
    ...baseSchemaRow,
    rowKind: "REP_DEFINITION",
    rowPayload: {
      rowKind: "REP_DEFINITION",
      equality: {
        form: "inline_equality",
        totalReps: 3,
        composition: [
          { exerciseId: EXERCISE_ID_A, count: 5 },
          { exerciseId: EXERCISE_ID_B, count: 5 },
        ],
      },
    },
    compoundRep: {
      form: "curly_brace",
      composition: [
        { exerciseId: EXERCISE_ID_A, count: 5 },
        { exerciseId: EXERCISE_ID_B, count: 5 },
      ],
    },
  };

  it("preserves the inline_equality arm and ignores the row-level compoundRep", () => {
    const value = toRepDefinitionValue({ kind: "edit", row: repDefinitionRow });

    expect(value.equality).toEqual({
      form: "inline_equality",
      totalReps: 3,
      composition: [
        { exerciseId: EXERCISE_ID_A, count: 5 },
        { exerciseId: EXERCISE_ID_B, count: 5 },
      ],
    });
    expect(JSON.stringify(value)).not.toContain("curly_brace");
    expect(parseRowPayload("REP_DEFINITION", value).ok).toBe(true);
  });
});

describe("RepDefinitionRowPayloadForm notes survives edit (opaque carry)", () => {
  const noteyRow: SchemaRow = {
    ...baseSchemaRow,
    rowKind: "REP_DEFINITION",
    rowPayload: {
      rowKind: "REP_DEFINITION",
      equality: {
        form: "inline_equality",
        totalReps: 5,
        composition: [{ exerciseId: EXERCISE_ID_A, count: 5 }],
      },
    },
    notes: "keep me",
  };

  it("carries the existing notes into the form value", () => {
    expect(toRepDefinitionValue({ kind: "edit", row: noteyRow }).notes).toBe("keep me");
  });

  it("re-emits the notes on assemble instead of dropping them to null", () => {
    const value = toRepDefinitionValue({ kind: "edit", row: noteyRow });

    expect(assembleRowPayloadAndNotes("REP_DEFINITION", value).notes).toBe("keep me");
  });
});
