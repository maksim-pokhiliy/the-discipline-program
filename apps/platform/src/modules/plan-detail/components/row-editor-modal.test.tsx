import { createElement } from "react";

import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const createRowMutate = vi.fn();
const updateRowMutate = vi.fn();
const createRowState = { isPending: false };
const updateRowState = { isPending: false };

const NOW = new Date("2026-01-06T00:00:00.000Z");
const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const SCHEMA_ID = "cksch1234567890abcdef01234";
const ROW_ID = "ckrow1234567890abcdef01234";
const EXERCISE_ID = "ckabc1234567890abcdef01234";

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useCreateSchemaRow: () => ({ mutate: createRowMutate, isPending: createRowState.isPending }),
    useUpdateSchemaRow: () => ({ mutate: updateRowMutate, isPending: updateRowState.isPending }),
  };
});

vi.mock("./exercise-picker", () => {
  const renderExercisePickerMock = (props: {
    disabled?: boolean;
    onChange?: (id: string | null) => void;
  }) =>
    createElement(
      "button",
      {
        type: "button",
        "data-testid": "exercise-picker-mock",
        disabled: props.disabled ?? false,
        onClick: () => props.onChange?.(EXERCISE_ID),
      },
      "pick exercise",
    );

  return { ExercisePicker: renderExercisePickerMock };
});

vi.mock("./modifier-picker", () => {
  const renderModifierPickerMock = () =>
    createElement("div", { "data-testid": "modifier-picker-mock" });

  return { ModifierPicker: renderModifierPickerMock };
});

const { RowEditorModal } = await import("./row-editor-modal");

const makeRow = (overrides: Partial<SchemaRow> = {}): SchemaRow => ({
  id: ROW_ID,
  schemaId: SCHEMA_ID,
  order: 1,
  exerciseId: EXERCISE_ID,
  sets: null,
  rowGroupId: null,
  load: null,
  reps: null,
  side: null,
  tempo: null,
  media: null,
  intensity: null,
  rest: null,
  modifiers: [],
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const renderCreate = (onClose = vi.fn()) =>
  render(
    <RowEditorModal
      open
      onClose={onClose}
      planId={PLAN_ID}
      startDate={START_DATE}
      mode={{ kind: "create", schemaId: SCHEMA_ID }}
    />,
  );

const renderEdit = (row: SchemaRow, onClose = vi.fn()) =>
  render(
    <RowEditorModal
      open
      onClose={onClose}
      planId={PLAN_ID}
      startDate={START_DATE}
      mode={{ kind: "edit", row }}
    />,
  );

afterEach(() => {
  createRowState.isPending = false;
  updateRowState.isPending = false;
  createRowMutate.mockReset();
  updateRowMutate.mockReset();
});

describe("RowEditorModal chrome", () => {
  it("renders the Add row title and submit in create mode", () => {
    renderCreate();

    expect(screen.getByRole("heading", { name: "Add row" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add row" })).toBeInTheDocument();
  });

  it("renders the Edit row title and Save submit in edit mode", () => {
    renderEdit(makeRow());

    expect(screen.getByRole("heading", { name: "Edit row" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("enables the exercise picker in create mode", () => {
    renderCreate();

    expect(screen.getByTestId("exercise-picker-mock")).toBeEnabled();
  });

  it("disables the exercise picker in edit mode (DR-W4E-EXERCISE-LOCK)", () => {
    renderEdit(makeRow());

    expect(screen.getByTestId("exercise-picker-mock")).toBeDisabled();
  });
});

describe("RowEditorModal submit", () => {
  it("keeps submit enabled and does not fire create when no exercise is picked", () => {
    renderCreate();

    const submit = screen.getByRole("button", { name: "Add row" });

    expect(submit).toBeEnabled();

    fireEvent.click(submit);

    expect(createRowMutate).not.toHaveBeenCalled();
  });

  it("fires update with the schemaRowId and built data on a valid edit submit", () => {
    renderEdit(makeRow({ sets: 3 }));

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(updateRowMutate).toHaveBeenCalledTimes(1);

    const call = updateRowMutate.mock.calls[0]?.[0];

    expect(call).toMatchObject({ schemaRowId: ROW_ID, data: { sets: 3 } });
  });

  it("enables submit and fires create once a valid exercise is picked", () => {
    renderCreate();

    fireEvent.click(screen.getByTestId("exercise-picker-mock"));

    const submit = screen.getByRole("button", { name: "Add row" });

    expect(submit).toBeEnabled();

    fireEvent.click(submit);

    expect(createRowMutate).toHaveBeenCalledTimes(1);
    expect(createRowMutate.mock.calls[0]?.[0]).toMatchObject({
      schemaId: SCHEMA_ID,
      exerciseId: EXERCISE_ID,
    });
  });

  it("keeps Save enabled and shows an error without firing update when an engaged load is incomplete (QA-002/QA-003)", () => {
    renderEdit(makeRow({ load: { kind: "absolute", count: 1, kg: Number.NaN } }));

    const save = screen.getByRole("button", { name: "Save" });

    expect(save).toBeEnabled();

    fireEvent.click(save);

    expect(updateRowMutate).not.toHaveBeenCalled();
    expect(screen.getByText("Enter a weight greater than 0.")).toBeInTheDocument();
  });
});

describe("RowEditorModal intensity + rest wiring (QA-004)", () => {
  const SEEDED_INTENSITY: SchemaRow["intensity"] = { rpe: { value: 8 } };
  const SEEDED_REST: SchemaRow["rest"] = {
    duration: { value: 60, unit: "sec" },
    scope: "between_sets",
  };

  it("seeds the intensity and rest sections from the row and carries them on submit", () => {
    renderEdit(makeRow({ intensity: SEEDED_INTENSITY, rest: SEEDED_REST }));

    expect(screen.getByRole("spinbutton", { name: "RPE" })).toHaveValue(8);
    expect(screen.getByRole("button", { name: "Remove rest" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(updateRowMutate).toHaveBeenCalledTimes(1);
    expect(updateRowMutate.mock.calls[0]?.[0]).toMatchObject({
      schemaRowId: ROW_ID,
      data: { intensity: SEEDED_INTENSITY, rest: SEEDED_REST },
    });
  });

  it("carries an edited intensity value on submit", () => {
    renderEdit(makeRow({ intensity: SEEDED_INTENSITY, rest: SEEDED_REST }));

    fireEvent.change(screen.getByRole("spinbutton", { name: "RPE" }), {
      target: { value: "6" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(updateRowMutate.mock.calls[0]?.[0]).toMatchObject({
      data: { intensity: { rpe: { value: 6 } } },
    });
  });

  it("clears intensity and rest to null on submit when both are emptied", () => {
    renderEdit(makeRow({ intensity: SEEDED_INTENSITY, rest: SEEDED_REST }));

    fireEvent.change(screen.getByRole("spinbutton", { name: "RPE" }), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Remove rest" }));

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(updateRowMutate).toHaveBeenCalledTimes(1);

    const { data } = updateRowMutate.mock.calls[0]?.[0] ?? {};

    expect(data.intensity).toBeNull();
    expect(data.rest).toBeNull();
  });
});
