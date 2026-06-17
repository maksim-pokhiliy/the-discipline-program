import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SCHEMA_CONSTANTS, type SchemaWithBody } from "@repo/contracts/lms/schema";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const createSchemaMutate = vi.fn();
const updateSchemaMutate = vi.fn();
const createSchemaState = { isPending: false };
const updateSchemaState = { isPending: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useCatalog: () => ({ exerciseById: new Map() }),
    useCreateSchema: () => ({
      mutate: createSchemaMutate,
      isPending: createSchemaState.isPending,
    }),
    useUpdateSchema: () => ({
      mutate: updateSchemaMutate,
      isPending: updateSchemaState.isPending,
    }),
  };
});

const { AxisEditorModal } = await import("./axis-editor-modal");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const NOW = new Date("2026-01-06T00:00:00.000Z");
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const GROUP_ID = "clp9z8x7w0000abcd1234grp1";
const SCHEMA_ID = "clp9z8x7w0000abcd1234sch1";

const CREATE_TITLE = "Add schema";
const EDIT_TITLE = "Edit schema";
const HEADER_ARIA = "Inspector header";
const GROUP_CHECKBOX = /group into one box/i;

const alertText = (): string => screen.getByRole("alert").textContent ?? "";

const makeSchema = (overrides: Partial<SchemaWithBody["schema"]> = {}): SchemaWithBody => ({
  schema: {
    id: SCHEMA_ID,
    blockId: BLOCK_ID,
    groupId: null,
    order: 1,
    header: null,
    intensity: null,
    composition: null,
    label: null,
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  },
  rows: [],
  rowGroups: [],
});

const renderCreate = () =>
  render(
    <AxisEditorModal
      open
      onClose={vi.fn()}
      planId={PLAN_ID}
      startDate={START_DATE}
      mode={{ kind: "create", blockId: BLOCK_ID }}
    />,
  );

const renderCreateInGroup = () =>
  render(
    <AxisEditorModal
      open
      onClose={vi.fn()}
      planId={PLAN_ID}
      startDate={START_DATE}
      mode={{ kind: "create", blockId: BLOCK_ID, groupId: GROUP_ID }}
    />,
  );

const renderEdit = (schema: SchemaWithBody, onClose = vi.fn()) =>
  render(
    <AxisEditorModal
      open
      onClose={onClose}
      planId={PLAN_ID}
      startDate={START_DATE}
      mode={{ kind: "edit", schema }}
    />,
  );

const submit = () => fireEvent.click(screen.getByRole("button", { name: "Add schema" }));
const submitEdit = () => fireEvent.click(screen.getByRole("button", { name: "Save" }));

const selectRepetition = (label: string) =>
  fireEvent.click(screen.getByRole("button", { name: label }));

const groupCheckbox = (): HTMLElement | null =>
  screen.queryByRole("checkbox", { name: GROUP_CHECKBOX });

const anotherLadderButton = (): HTMLElement | null =>
  screen.queryByRole("button", { name: "another ladder" });

afterEach(() => {
  createSchemaState.isPending = false;
  updateSchemaState.isPending = false;
  createSchemaMutate.mockReset();
  updateSchemaMutate.mockReset();
});

describe("AxisEditorModal create mode", () => {
  it("renders the create title and submit label", () => {
    renderCreate();

    expect(screen.getByRole("dialog", { name: CREATE_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add schema" })).toBeInTheDocument();
  });

  it("submits createSchema with the count composition, a null header and null notes", () => {
    renderCreate();

    selectRepetition("Rounds");
    submit();

    expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    expect(createSchemaMutate.mock.calls[0]?.[0]).toEqual({
      blockId: BLOCK_ID,
      composition: { repetition: { kind: "count", count: 3 } },
      header: null,
      intensity: null,
      notes: null,
    });
  });

  it("omits groupId from the payload for a top-level create (no groupId in mode)", () => {
    renderCreate();

    selectRepetition("Rounds");
    submit();

    expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    expect(createSchemaMutate.mock.calls[0]?.[0]).not.toHaveProperty("groupId");
  });

  it("threads groupId into the payload for a create-into-group", () => {
    renderCreateInGroup();

    selectRepetition("Rounds");
    submit();

    expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    expect(createSchemaMutate.mock.calls[0]?.[0]).toEqual({
      blockId: BLOCK_ID,
      groupId: GROUP_ID,
      composition: { repetition: { kind: "count", count: 3 } },
      header: null,
      intensity: null,
      notes: null,
    });
  });

  it("submits a single ladder schema through the flat create", () => {
    renderCreate();

    selectRepetition("Ladder");
    submit();

    expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    expect(createSchemaMutate.mock.calls[0]?.[0]).toEqual({
      blockId: BLOCK_ID,
      composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } },
      header: null,
      intensity: null,
      notes: null,
    });
  });

  it("never offers a group-into-box checkbox or another-ladder affordance (single-schema only)", () => {
    renderCreate();

    selectRepetition("Ladder");

    expect(groupCheckbox()).toBeNull();
    expect(anotherLadderButton()).toBeNull();
  });
});

describe("AxisEditorModal edit mode", () => {
  const editableSchema = (): SchemaWithBody =>
    makeSchema({ composition: { repetition: { kind: "count", count: 4 } } });

  it("renders the edit title and Save submit label, seeded from the stored composition", () => {
    renderEdit(editableSchema());

    expect(screen.getByRole("dialog", { name: EDIT_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByText("rounds")).toBeInTheDocument();
  });

  it("submits updateSchema with the composition and header for the edited schema", () => {
    renderEdit(editableSchema());

    submitEdit();

    expect(updateSchemaMutate).toHaveBeenCalledTimes(1);
    expect(updateSchemaMutate.mock.calls[0]?.[0]).toEqual({
      schemaId: SCHEMA_ID,
      data: {
        composition: { repetition: { kind: "count", count: 4 } },
        header: null,
        intensity: null,
      },
    });
  });

  it("keeps the header editable in edit-mode and sends the new value on submit (REV-004)", () => {
    renderEdit(
      makeSchema({ composition: { repetition: { kind: "count", count: 4 } }, header: "Original" }),
    );

    const headerInput = screen.getByRole("textbox", { name: HEADER_ARIA });

    fireEvent.change(headerInput, { target: { value: "Renamed opener" } });
    fireEvent.blur(headerInput);
    submitEdit();

    expect(updateSchemaMutate).toHaveBeenCalledTimes(1);
    expect(updateSchemaMutate.mock.calls[0]?.[0]?.data).toMatchObject({ header: "Renamed opener" });
  });

  it("caps the header input at the contract maximum length (QA-204)", () => {
    renderEdit(editableSchema());

    expect(screen.getByRole("textbox", { name: HEADER_ARIA })).toHaveAttribute(
      "maxlength",
      String(SCHEMA_CONSTANTS.MAX_HEADER_LENGTH),
    );
  });

  it("re-emits an untouched stored composition byte-for-byte on Save", () => {
    renderEdit(editableSchema());
    submitEdit();

    expect(updateSchemaMutate).toHaveBeenCalledTimes(1);
    expect(updateSchemaMutate.mock.calls[0]?.[0]).toStrictEqual({
      schemaId: SCHEMA_ID,
      data: {
        composition: { repetition: { kind: "count", count: 4 } },
        header: null,
        intensity: null,
      },
    });
  });

  it("never shows the Group-into-box checkbox in edit mode", () => {
    renderEdit(editableSchema());

    expect(groupCheckbox()).toBeNull();
  });
});

describe("AxisEditorModal double-submit guard (QA-201)", () => {
  it("fires createSchema once for a synchronous double-click", () => {
    renderCreate();

    selectRepetition("Rounds");
    submit();
    submit();

    expect(createSchemaMutate).toHaveBeenCalledTimes(1);
  });
});

describe("AxisEditorModal mutation error surfacing (QA-Must-8)", () => {
  it("surfaces the mutation error and re-enables Save for a retry", () => {
    createSchemaMutate.mockImplementationOnce((_vars, options) => {
      options?.onError?.(new Error("Network boom"));
      options?.onSettled?.();
    });

    renderCreate();

    selectRepetition("Rounds");
    submit();

    expect(alertText()).toContain("Network boom");
    expect(screen.getByRole("button", { name: "Add schema" })).toBeEnabled();

    submit();

    expect(createSchemaMutate).toHaveBeenCalledTimes(2);
  });
});

describe("AxisEditorModal count range refinement (QA-Must-10)", () => {
  const setRangeMinMax = (min: string, max: string): void => {
    fireEvent.click(screen.getByRole("button", { name: "Rounds" }));

    const [rangeButton] = screen.getAllByRole("button", { name: "range" });

    fireEvent.click(rangeButton as HTMLElement);

    const [minField, maxField] = screen.getAllByRole("spinbutton");

    fireEvent.change(minField as HTMLElement, { target: { value: min } });
    fireEvent.change(maxField as HTMLElement, { target: { value: max } });
  };

  it("rejects a min equal to max and surfaces the range message without mutating", () => {
    renderCreate();

    setRangeMinMax("3", "3");
    submit();

    expect(createSchemaMutate).not.toHaveBeenCalled();
    expect(alertText()).toContain("repetition.count");
    expect(alertText()).toMatch(/range\.min must be less than range\.max/i);
  });

  it("rejects a min greater than max and surfaces the range message without mutating", () => {
    renderCreate();

    setRangeMinMax("5", "2");
    submit();

    expect(createSchemaMutate).not.toHaveBeenCalled();
    expect(alertText()).toContain("repetition.count");
  });
});

describe("AxisEditorModal repetition tile-group a11y contract (T13)", () => {
  const REPETITION_TILE_COUNT = 6;

  it("exposes a tile group with one button per repetition tile", () => {
    renderCreate();

    const group = screen.getByRole("group", { name: "repetition" });

    expect(within(group).getAllByRole("button")).toHaveLength(REPETITION_TILE_COUNT);
  });

  it("marks only the active repetition tile aria-pressed and moves the mark on select", () => {
    renderCreate();

    const group = screen.getByRole("group", { name: "repetition" });

    expect(within(group).getByRole("button", { pressed: true })).toHaveAccessibleName("Once");

    selectRepetition("Rounds");

    expect(within(group).getByRole("button", { pressed: true })).toHaveAccessibleName("Rounds");
  });
});
