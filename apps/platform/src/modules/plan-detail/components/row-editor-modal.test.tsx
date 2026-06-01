import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Exercise } from "@repo/contracts/lms/exercise";
import type { RowKind, SchemaRow } from "@repo/contracts/lms/schema-row";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import { formatRestSpec } from "../lib/format-rest-spec";

import type { RowEditorMode } from "./row-editor-types";

type MutateOptions = { onSuccess?: () => void; onSettled?: () => void };

const settleState = { settle: false };

const createRowMutate = vi.fn((_body: unknown, options?: MutateOptions) => {
  if (settleState.settle) {
    options?.onSuccess?.();
    options?.onSettled?.();
  }
});
const updateRowMutate = vi.fn((_body: unknown, options?: MutateOptions) => {
  if (settleState.settle) {
    options?.onSuccess?.();
    options?.onSettled?.();
  }
});
const createRowState = { isPending: false };
const updateRowState = { isPending: false };
const exercisesState: { data: Exercise[]; isLoading: boolean } = { data: [], isLoading: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useCreateSchemaRow: () => ({ mutate: createRowMutate, isPending: createRowState.isPending }),
    useUpdateSchemaRow: () => ({ mutate: updateRowMutate, isPending: updateRowState.isPending }),
    useExercises: () => ({ data: exercisesState.data, isLoading: exercisesState.isLoading }),
  };
});

const { RowEditorModal } = await import("./row-editor-modal");

const EXERCISE_ID = "ckxw5p7gp0000q1mnzv5cuq0e";

const frontSquat: Exercise = {
  id: EXERCISE_ID,
  canonicalName: "Front Squat",
  canonicalNameLower: "front squat",
  primaryEquipment: "BARBELL",
  movementTypeTagPrimary: "SQUAT",
  movementTypeTagSecondary: null,
  canonicalCompoundType: "ATOMIC",
  placeholderFlag: false,
  movementFamily: "squat",
  defaultDemoUrls: [],
  aliases: [],
  notes: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const pickFrontSquat = (): void => {
  fireEvent.mouseDown(screen.getByPlaceholderText("search by name, family, or modality…"));
  fireEvent.click(screen.getByText("Front Squat"));
};

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const SCHEMA_ID = "ckxw5p7gp0000q1mnzv5cuq0b";

const baseSchemaRow = {
  id: "ckxw5p7gp0000q1mnzv5cuq0c",
  schemaId: SCHEMA_ID,
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

const urlRowWrappedFalse: SchemaRow = {
  ...baseSchemaRow,
  rowKind: "STANDALONE_URL",
  rowPayload: {
    rowKind: "STANDALONE_URL",
    url: "https://youtu.be/abc123",
    wrapped: false,
    appliesTo: "whole_schema",
  },
};

const footnoteRow: SchemaRow = {
  ...baseSchemaRow,
  rowKind: "FOOTNOTE",
  rowPayload: {
    rowKind: "FOOTNOTE",
    marker: "*",
    target: "each_round",
    content: { elements: [] },
  },
};

const createMode = (rowKind: RowKind): RowEditorMode => ({
  kind: "create",
  schemaId: SCHEMA_ID,
  rowKind,
});

const renderModal = (
  mode: RowEditorMode,
  extra: { open?: boolean; onBack?: () => void; onClose?: () => void } = {},
) =>
  render(
    <RowEditorModal
      open={extra.open ?? true}
      onClose={extra.onClose ?? vi.fn()}
      mode={mode}
      planId={PLAN_ID}
      startDate={START_DATE}
      {...(extra.onBack !== undefined && { onBack: extra.onBack })}
    />,
  );

const saveRow = (): void => {
  fireEvent.click(screen.getByRole("button", { name: "Save row" }));
};

const setNumber = (name: string, value: string): void => {
  fireEvent.change(screen.getByRole("spinbutton", { name }), { target: { value } });
};

afterEach(() => {
  createRowState.isPending = false;
  updateRowState.isPending = false;
  exercisesState.data = [];
  exercisesState.isLoading = false;
  settleState.settle = false;
  createRowMutate.mockClear();
  updateRowMutate.mockClear();
});

describe("RowEditorModal open gating (MT-10)", () => {
  it("renders nothing when open is false", () => {
    const { container } = renderModal(createMode("REST_SLOT"), { open: false });

    expect(container).toBeEmptyDOMElement();
  });
});

describe("RowEditorModal create submit assembly (MT-8)", () => {
  it("assembles the REST envelope deriving raw from formatRestSpec when raw is blank", async () => {
    renderModal(createMode("REST"));

    const [, notesField] = screen.getAllByRole("textbox");

    if (notesField === undefined) {
      throw new Error("expected a REST notes textbox");
    }

    fireEvent.change(notesField, { target: { value: "warm up" } });
    saveRow();

    await waitFor(() => {
      expect(createRowMutate).toHaveBeenCalledTimes(1);
    });
    expect(createRowMutate.mock.calls[0]?.[0]).toEqual({
      schemaId: SCHEMA_ID,
      rowKind: "REST",
      rowPayload: {
        rowKind: "REST",
        parsed: { duration: { value: 90, unit: "sec" }, scope: "between_sets" },
        raw: formatRestSpec({ duration: { value: 90, unit: "sec" }, scope: "between_sets" }),
      },
      notes: "warm up",
    });
  });

  it("assembles the STANDALONE_URL envelope with wrapped:true and notes:null", async () => {
    renderModal(createMode("STANDALONE_URL"));

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "https://x.com" } });
    saveRow();

    await waitFor(() => {
      expect(createRowMutate).toHaveBeenCalledTimes(1);
    });
    expect(createRowMutate.mock.calls[0]?.[0]).toEqual({
      schemaId: SCHEMA_ID,
      rowKind: "STANDALONE_URL",
      rowPayload: {
        rowKind: "STANDALONE_URL",
        url: "https://x.com",
        wrapped: true,
        appliesTo: "previous_exercise_row",
      },
      notes: null,
    });
  });

  it("assembles the INNER_LADDER_MARKER envelope with steps:[21] and notes:null", async () => {
    renderModal(createMode("INNER_LADDER_MARKER"));

    saveRow();

    await waitFor(() => {
      expect(createRowMutate).toHaveBeenCalledTimes(1);
    });
    expect(createRowMutate.mock.calls[0]?.[0]).toEqual({
      schemaId: SCHEMA_ID,
      rowKind: "INNER_LADDER_MARKER",
      rowPayload: { rowKind: "INNER_LADDER_MARKER", steps: [21] },
      notes: null,
    });
  });

  it("assembles the REST_SLOT envelope with an empty payload and notes from the field", async () => {
    renderModal(createMode("REST_SLOT"));

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "emom rest" } });
    saveRow();

    await waitFor(() => {
      expect(createRowMutate).toHaveBeenCalledTimes(1);
    });
    expect(createRowMutate.mock.calls[0]?.[0]).toEqual({
      schemaId: SCHEMA_ID,
      rowKind: "REST_SLOT",
      rowPayload: { rowKind: "REST_SLOT" },
      notes: "emom rest",
    });
  });

  it("assembles the STANDALONE_LOAD envelope injecting the scope and notes from the field", async () => {
    renderModal(createMode("STANDALONE_LOAD"));

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "heavy day" } });
    saveRow();

    await waitFor(() => {
      expect(createRowMutate).toHaveBeenCalledTimes(1);
    });
    expect(createRowMutate.mock.calls[0]?.[0]).toEqual({
      schemaId: SCHEMA_ID,
      rowKind: "STANDALONE_LOAD",
      rowPayload: {
        rowKind: "STANDALONE_LOAD",
        load: { kind: "absolute", weight: { variant: "single", valueKg: 15 } },
        scope: "applies_to_all_preceding_rows",
      },
      notes: "heavy day",
    });
  });
});

describe("RowEditorModal edit submit assembly (MT-9)", () => {
  it("round-trips a STANDALONE_URL wrapped:false row through update", async () => {
    renderModal({ kind: "edit", row: urlRowWrappedFalse });

    saveRow();

    await waitFor(() => {
      expect(updateRowMutate).toHaveBeenCalledTimes(1);
    });
    expect(updateRowMutate.mock.calls[0]?.[0]).toEqual({
      schemaRowId: baseSchemaRow.id,
      data: {
        rowPayload: {
          rowKind: "STANDALONE_URL",
          url: "https://youtu.be/abc123",
          wrapped: false,
          appliesTo: "whole_schema",
        },
        notes: null,
      },
    });
  });
});

describe("RowEditorModal REST range validation (MT-1, QA-01)", () => {
  it("blocks the mutation and shows the duration refine message when rangeMax <= value", async () => {
    renderModal(createMode("REST"));

    fireEvent.click(screen.getByRole("button", { name: "sec range" }));
    setNumber("Rest max", "60");
    saveRow();

    await waitFor(() => {
      expect(
        screen.getByText(
          "rangeMax required when unit is range_*, must be > value; forbidden otherwise",
        ),
      ).toBeInTheDocument();
    });
    expect(createRowMutate).not.toHaveBeenCalled();
  });
});

describe("RowEditorModal percentage-load range validation (MT-2, QA-02)", () => {
  it("blocks the mutation and shows the load refine message when rangeMax <= value", async () => {
    renderModal(createMode("STANDALONE_LOAD"));

    fireEvent.click(screen.getByRole("button", { name: "% of ref" }));
    setNumber("Percentage", "70");
    setNumber("Max % (optional)", "60");
    saveRow();

    await waitFor(() => {
      expect(screen.getByText("percentage.rangeMax must be > value when set")).toBeInTheDocument();
    });
    expect(createRowMutate).not.toHaveBeenCalled();
  });
});

describe("RowEditorModal double-submit guard (MT-3, QA-03)", () => {
  it("fires exactly one create mutation on a double Save click", async () => {
    renderModal(createMode("REST_SLOT"));

    const save = screen.getByRole("button", { name: "Save row" });

    fireEvent.click(save);
    fireEvent.click(save);

    await waitFor(() => {
      expect(createRowMutate).toHaveBeenCalledTimes(1);
    });
    expect(createRowMutate).toHaveBeenCalledTimes(1);
  });
});

describe("RowEditorModal submit-while-pending guard (MT-4, QA-04)", () => {
  it("does not call mutate when a form submit fires while pending", async () => {
    createRowState.isPending = true;

    renderModal(createMode("STANDALONE_URL"));

    const form = document.querySelector("form");

    expect(form).not.toBeNull();

    if (form !== null) {
      fireEvent.submit(form);
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(createRowMutate).not.toHaveBeenCalled();
  });
});

describe("RowEditorModal deferred-kind edit (MT-11, QA-06)", () => {
  it("renders an empty-body modal whose Save does not mutate for a FOOTNOTE row", async () => {
    renderModal({ kind: "edit", row: footnoteRow });

    expect(screen.getByRole("button", { name: "Save row" })).toBeInTheDocument();
    expect(document.querySelector("form")?.childElementCount ?? -1).toBe(0);

    saveRow();

    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(updateRowMutate).not.toHaveBeenCalled();
  });
});

describe("RowEditorModal Back affordance (MT-16)", () => {
  it("renders Back in create mode when onBack is supplied", () => {
    renderModal(createMode("REST"), { onBack: vi.fn() });

    expect(screen.getByRole("button", { name: "← Back" })).toBeInTheDocument();
  });

  it("does not render Back in create mode when onBack is omitted", () => {
    renderModal(createMode("REST"));

    expect(screen.queryByRole("button", { name: "← Back" })).toBeNull();
  });

  it("does not render Back in edit mode even when onBack is supplied", () => {
    renderModal({ kind: "edit", row: urlRowWrappedFalse }, { onBack: vi.fn() });

    expect(screen.queryByRole("button", { name: "← Back" })).toBeNull();
  });

  it("invokes onBack when Back is clicked", () => {
    const onBack = vi.fn();

    renderModal(createMode("REST"), { onBack });

    fireEvent.click(screen.getByRole("button", { name: "← Back" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

const exerciseRow: SchemaRow = {
  ...baseSchemaRow,
  rowKind: "EXERCISE",
  rowPayload: { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EXERCISE_ID } },
  reps: { kind: "range", min: 6, max: 8 },
  load: { kind: "percentage", value: 75, reference: { scope: "self" } },
  side: { kind: "each_leg", countPerLimb: 10 },
  tempo: { slowEccentric: { durationSec: 4 } },
  position: "NEUTRAL_GRIP",
  intensity: { rpe: { value: 8 } },
};

describe("RowEditorModal EXERCISE create envelope (QA-MT1)", () => {
  it("threads the full VO sibling envelope when an exercise is picked and saved", async () => {
    exercisesState.data = [frontSquat];

    renderModal(createMode("EXERCISE"));

    pickFrontSquat();
    saveRow();

    await waitFor(() => {
      expect(createRowMutate).toHaveBeenCalledTimes(1);
    });
    expect(createRowMutate.mock.calls[0]?.[0]).toEqual({
      schemaId: SCHEMA_ID,
      rowKind: "EXERCISE",
      rowPayload: { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EXERCISE_ID } },
      reps: { kind: "count", value: 5 },
      load: { kind: "percentage", value: 80, reference: { scope: "self" } },
      side: null,
      tempo: null,
      position: null,
      intensity: null,
      notes: null,
    });
  });
});

describe("RowEditorModal EXERCISE edit round-trip (QA-MT2)", () => {
  it("mirrors the row VOs into the update data on save", async () => {
    exercisesState.data = [frontSquat];

    renderModal({ kind: "edit", row: exerciseRow });

    saveRow();

    await waitFor(() => {
      expect(updateRowMutate).toHaveBeenCalledTimes(1);
    });
    expect(updateRowMutate.mock.calls[0]?.[0]).toEqual({
      schemaRowId: baseSchemaRow.id,
      data: {
        rowPayload: { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EXERCISE_ID } },
        notes: null,
        reps: { kind: "range", min: 6, max: 8 },
        load: { kind: "percentage", value: 75, reference: { scope: "self" } },
        side: { kind: "each_leg", countPerLimb: 10 },
        tempo: { slowEccentric: { durationSec: 4 } },
        position: "NEUTRAL_GRIP",
        intensity: { rpe: { value: 8 } },
      },
    });
  });
});

describe("RowEditorModal required-exercise gate (QA-MT3, D-09)", () => {
  it("blocks the mutation and shows the picker error when no exercise is picked", async () => {
    exercisesState.data = [frontSquat];

    renderModal(createMode("EXERCISE"));

    saveRow();

    await waitFor(() => {
      expect(screen.getByText("Pick an exercise")).toBeInTheDocument();
    });
    expect(createRowMutate).not.toHaveBeenCalled();
  });
});

describe("RowEditorModal EXERCISE modal width (QA-MT12)", () => {
  it("opens the EXERCISE modal at the md width", () => {
    exercisesState.data = [frontSquat];

    renderModal(createMode("EXERCISE"));

    expect(document.querySelector(".MuiDialog-paperWidthMd")).not.toBeNull();
  });

  it("opens a simple-kind modal at the sm width", () => {
    renderModal(createMode("REST"));

    expect(document.querySelector(".MuiDialog-paperWidthSm")).not.toBeNull();
  });
});

describe("RowEditorModal save-and-add-another (QA-MT8, D-10)", () => {
  it("mutates and keeps the modal open re-seeded when Save & add another is clicked", async () => {
    settleState.settle = true;
    exercisesState.data = [frontSquat];
    const onClose = vi.fn();

    renderModal(createMode("EXERCISE"), { onClose });

    pickFrontSquat();
    fireEvent.click(screen.getByRole("button", { name: "Save & add another" }));

    await waitFor(() => {
      expect(createRowMutate).toHaveBeenCalledTimes(1);
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Save & add another" })).toBeInTheDocument();
  });

  it("closes correctly on a plain Save after a Save & add another (QA-003)", async () => {
    settleState.settle = true;
    exercisesState.data = [frontSquat];
    const onClose = vi.fn();

    renderModal(createMode("EXERCISE"), { onClose });

    pickFrontSquat();
    fireEvent.click(screen.getByRole("button", { name: "Save & add another" }));

    await waitFor(() => {
      expect(createRowMutate).toHaveBeenCalledTimes(1);
    });

    pickFrontSquat();
    saveRow();

    await waitFor(() => {
      expect(createRowMutate).toHaveBeenCalledTimes(2);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not render Save & add another in edit mode", () => {
    exercisesState.data = [frontSquat];

    renderModal({ kind: "edit", row: exerciseRow });

    expect(screen.queryByRole("button", { name: "Save & add another" })).toBeNull();
  });
});

describe("RowEditorModal EXERCISE double-submit guard (QA-MT7)", () => {
  it("fires exactly one create mutation on a double Save click after a pick", async () => {
    exercisesState.data = [frontSquat];

    renderModal(createMode("EXERCISE"));

    pickFrontSquat();
    const save = screen.getByRole("button", { name: "Save row" });

    fireEvent.click(save);
    fireEvent.click(save);

    await waitFor(() => {
      expect(createRowMutate).toHaveBeenCalledTimes(1);
    });
    expect(createRowMutate).toHaveBeenCalledTimes(1);
  });
});
