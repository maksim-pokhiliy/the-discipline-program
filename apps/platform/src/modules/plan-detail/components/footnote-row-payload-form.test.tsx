import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import type { RepNotation } from "@repo/contracts/lms/_shared";
import type { Exercise } from "@repo/contracts/lms/exercise";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import { assembleRowPayloadAndNotes } from "./row-form-utils";
import type { FootnoteRowFormValue } from "./row-payload-draft.types";

const exercisesState: { data: Exercise[]; isLoading: boolean } = { data: [], isLoading: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useExercises: () => ({ data: exercisesState.data, isLoading: exercisesState.isLoading }),
  };
});

const { FootnoteRowPayloadForm, footnoteDefaultValue, toFootnoteValue } = await import(
  "./footnote-row-payload-form"
);

const EXERCISE_ID = "ckxw5p7gp0000q1mnzv5cuq01";
const SEED_REPS: RepNotation = { kind: "count", value: 5 };

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

const makeFootnote = (overrides: Partial<FootnoteRowFormValue> = {}): FootnoteRowFormValue => ({
  marker: "*",
  target: "each_set",
  content: { elements: [] },
  notes: "",
  ...overrides,
});

const onChange: Mock = vi.fn();

const lastCallArg = (): FootnoteRowFormValue => {
  const call = onChange.mock.calls.at(-1);

  if (call === undefined) {
    throw new Error("onChange was not called");
  }

  return call[0] as FootnoteRowFormValue;
};

afterEach(() => {
  exercisesState.data = [];
  exercisesState.isLoading = false;
  onChange.mockReset();
});

describe("FootnoteRowPayloadForm marker/target toggles (MT-1, scenario 5)", () => {
  it("emits the picked marker via the toggle group", () => {
    render(<FootnoteRowPayloadForm value={makeFootnote()} onChange={onChange} />);

    const markerGroup = screen.getByRole("group", { name: "marker" });

    fireEvent.click(within(markerGroup).getByRole("button", { name: "**" }));

    expect(lastCallArg().marker).toBe("**");
  });

  it("emits the picked target via the toggle group", () => {
    render(<FootnoteRowPayloadForm value={makeFootnote()} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Each round" }));

    expect(lastCallArg().target).toBe("each_round");
  });

  it("does not call onChange when the active marker is re-clicked (null-guard)", () => {
    render(<FootnoteRowPayloadForm value={makeFootnote({ marker: "*" })} onChange={onChange} />);

    const markerGroup = screen.getByRole("group", { name: "marker" });

    fireEvent.click(within(markerGroup).getByRole("button", { name: "*", pressed: true }));

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("FootnoteRowPayloadForm typeLabel reveal (MT-1, scenario 1)", () => {
  it("hides the type label field at the each_set target", () => {
    render(
      <FootnoteRowPayloadForm value={makeFootnote({ target: "each_set" })} onChange={onChange} />,
    );

    expect(screen.queryByText("Type label")).toBeNull();
  });

  it("reveals the type label field at the each_typed_round target", () => {
    render(
      <FootnoteRowPayloadForm
        value={makeFootnote({ target: "each_typed_round" })}
        onChange={onChange}
      />,
    );

    expect(screen.getByText("Type label")).toBeInTheDocument();
  });

  it("surfaces the type label validation message", () => {
    render(
      <FootnoteRowPayloadForm
        value={makeFootnote({ target: "each_typed_round", typeLabel: "X" })}
        onChange={onChange}
        error={{ typeLabel: { type: "too_small", message: "type label is required" } }}
      />,
    );

    expect(screen.getByText("type label is required")).toBeInTheDocument();
  });
});

describe("FootnoteRowPayloadForm typeLabel drop on leave (scenario 2)", () => {
  it("emits no typeLabel key when the target switches away from each_typed_round", () => {
    render(
      <FootnoteRowPayloadForm
        value={makeFootnote({ target: "each_typed_round", typeLabel: "GYMNASTICS" })}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Each set" }));

    expect(lastCallArg().target).toBe("each_set");
    expect(lastCallArg()).not.toHaveProperty("typeLabel");
  });
});

describe("FootnoteRowPayloadForm content editor (D-01, scenario 4)", () => {
  it("renders zero content element cards at the default value", () => {
    render(<FootnoteRowPayloadForm value={footnoteDefaultValue} onChange={onChange} />);

    expect(screen.queryAllByRole("button", { name: "Remove" })).toHaveLength(0);
    expect(screen.getByRole("button", { name: "add element" })).toBeInTheDocument();
  });

  it("enables the lone element remove control because minElements is 0", () => {
    render(
      <FootnoteRowPayloadForm
        value={makeFootnote({
          content: { elements: [{ exerciseId: EXERCISE_ID, reps: SEED_REPS }] },
        })}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("button", { name: "Remove" })).toBeEnabled();
  });
});

describe("FootnoteRowPayloadForm content picker error (scenario 3)", () => {
  it("flags the delegated element picker when its exercise id is missing", () => {
    render(
      <FootnoteRowPayloadForm
        value={makeFootnote({ content: { elements: [{ exerciseId: null, reps: SEED_REPS }] } })}
        onChange={onChange}
        error={{
          content: {
            elements: { 0: { exerciseId: { type: "invalid_type", message: "Required" } } },
          },
        }}
      />,
    );

    expect(screen.getByText("Pick an exercise")).toBeInTheDocument();
  });
});

describe("FootnoteRowPayloadForm notes round-trip on edit (QA-002, scenario 6)", () => {
  const footnoteRow: SchemaRow = {
    ...baseSchemaRow,
    rowKind: "FOOTNOTE",
    rowPayload: {
      rowKind: "FOOTNOTE",
      marker: "**",
      target: "each_typed_round",
      content: { elements: [{ exerciseId: EXERCISE_ID, reps: SEED_REPS }] },
      typeLabel: "GYMNASTICS",
    },
    notes: "keep me",
  };

  it("carries the seeded notes into the form value", () => {
    const value = toFootnoteValue({ kind: "edit", row: footnoteRow });

    expect(value.notes).toBe("keep me");
    expect(value.typeLabel).toBe("GYMNASTICS");
  });

  it("emits the trimmed notes when the value is assembled", () => {
    const value = toFootnoteValue({ kind: "edit", row: footnoteRow });

    expect(assembleRowPayloadAndNotes("FOOTNOTE", value).notes).toBe("keep me");
  });
});
