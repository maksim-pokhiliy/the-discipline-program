import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SCHEMA_CONSTANTS, type SchemaWithBody } from "@repo/contracts/lms/schema";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

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
const SCHEMA_ID = "clp9z8x7w0000abcd1234sch1";
const SUB_SCHEMA_ID = "clp9z8x7w0000abcd1234ssa1";
const SUB_SCHEMA_ID_B = "clp9z8x7w0000abcd1234ssb1";
const MARKER_ROW_ID = "clp9z8x7w0000abcd1234row1";

const CREATE_TITLE = "Add schema";
const EDIT_TITLE = "Container composition";
const HEADER_ARIA = "Inspector header";
const CONDITION_LABEL = "Applies to rounds (optional condition)";

const makeSchema = (overrides: Partial<SchemaWithBody["schema"]> = {}): SchemaWithBody => ({
  schema: {
    id: SCHEMA_ID,
    blockId: BLOCK_ID,
    parentSchemaId: null,
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
  subSchemas: [],
});

const makeMarkerRow = (): SchemaRow => ({
  id: MARKER_ROW_ID,
  schemaId: SCHEMA_ID,
  order: 1,
  rowKind: "INNER_LADDER_MARKER",
  rowPayload: { rowKind: "INNER_LADDER_MARKER", steps: [21, 15, 9] },
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
  createdAt: NOW,
  updatedAt: NOW,
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

const toggle = (groupName: string, optionLabel: string) =>
  fireEvent.click(within(screen.getByRole("group", { name: groupName })).getByText(optionLabel));

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

  it("shows the flat hint for a fresh draft and a rounds tag once a count repetition is set", () => {
    renderCreate();

    expect(screen.getByText("flat — plain container")).toBeInTheDocument();

    toggle("repetition", "count");

    expect(screen.getByText("rounds")).toBeInTheDocument();
  });

  it("submits createSchema with the count composition, a null header and null notes", () => {
    renderCreate();

    toggle("repetition", "count");
    submit();

    expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    expect(createSchemaMutate.mock.calls[0]?.[0]).toEqual({
      blockId: BLOCK_ID,
      composition: { repetition: { kind: "count", count: 3 } },
      header: null,
      notes: null,
    });
  });

  it("sends an authored header on submit", () => {
    renderCreate();

    fireEvent.change(screen.getByRole("textbox", { name: HEADER_ARIA }), {
      target: { value: "Opener" },
    });
    fireEvent.blur(screen.getByRole("textbox", { name: HEADER_ARIA }));
    submit();

    expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    expect(createSchemaMutate.mock.calls[0]?.[0]).toMatchObject({ header: "Opener" });
  });

  it("sends a null header when the header is left blank", () => {
    renderCreate();

    submit();

    expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    expect(createSchemaMutate.mock.calls[0]?.[0]).toMatchObject({ header: null });
  });
});

describe("AxisEditorModal edit mode", () => {
  const editableSchema = (): SchemaWithBody => {
    const top = makeSchema({ composition: { repetition: { kind: "count", count: 4 } } });

    return {
      ...top,
      subSchemas: [
        makeSchema({ id: SUB_SCHEMA_ID, parentSchemaId: SCHEMA_ID }),
        makeSchema({ id: "clp9z8x7w0000abcd1234ssb1", parentSchemaId: SCHEMA_ID }),
      ],
    };
  };

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
      data: { composition: { repetition: { kind: "count", count: 4 } }, header: null },
    });
  });
});

describe("AxisEditorModal scoring condition (D4)", () => {
  it("reveals the inert chip and the appliesToRounds input when a non-prescribed kind is selected", () => {
    renderCreate();

    toggle("scoring", "AMRAP");

    expect(screen.getByRole("textbox", { name: CONDITION_LABEL })).toBeInTheDocument();
    expect(screen.getAllByText("AMRAP").length).toBeGreaterThanOrEqual(1);
  });

  it("submits scoring.condition.appliesToRounds parsed from the rounds input", () => {
    renderCreate();

    toggle("scoring", "AMRAP");
    fireEvent.change(screen.getByRole("textbox", { name: CONDITION_LABEL }), {
      target: { value: "2, 3" },
    });
    submit();

    expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    expect(createSchemaMutate.mock.calls[0]?.[0]).toMatchObject({
      composition: { scoring: { kind: "amrap", condition: { appliesToRounds: [2, 3] } } },
    });
  });

  it("excludes scoring from the live composition-kind tag", () => {
    renderCreate();

    toggle("repetition", "count");
    toggle("scoring", "AMRAP");

    expect(screen.getByText("rounds")).toBeInTheDocument();
  });
});

describe("AxisEditorModal error surfacing", () => {
  it("surfaces a contract-invalid composition in the FormModal error Alert and does not mutate", () => {
    renderCreate();

    toggle("repetition", "window");
    fireEvent.change(screen.getByRole("textbox", { name: "End HH:MM" }), {
      target: { value: "" },
    });
    submit();

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(createSchemaMutate).not.toHaveBeenCalled();
  });
});

describe("AxisEditorModal edit-on-children arrangement fold (REV-003)", () => {
  const parallelSeedSchema = (): SchemaWithBody => {
    const top = makeSchema({ composition: { repetition: { kind: "count", count: 4 } } });

    return {
      ...top,
      subSchemas: [
        makeSchema({ id: SUB_SCHEMA_ID, parentSchemaId: SCHEMA_ID, header: "Track A" }),
        makeSchema({ id: SUB_SCHEMA_ID_B, parentSchemaId: SCHEMA_ID, header: "Track B" }),
      ],
    };
  };

  it("folds two sub-schemas into a valid parallel arrangement on submit", () => {
    renderEdit(parallelSeedSchema());

    toggle("arrangement", "parallel");
    fireEvent.click(screen.getByRole("switch", { name: "track · Track A" }));
    fireEvent.click(screen.getByRole("switch", { name: "track · Track B" }));
    submitEdit();

    expect(updateSchemaMutate).toHaveBeenCalledTimes(1);

    const arrangement = updateSchemaMutate.mock.calls[0]?.[0]?.data?.composition?.arrangement;

    expect(arrangement?.kind).toBe("parallel");
    expect(arrangement?.tracks).toHaveLength(2);
    expect(
      arrangement?.tracks?.map((track: { childSchemaId: string }) => track.childSchemaId),
    ).toEqual([SUB_SCHEMA_ID, SUB_SCHEMA_ID_B]);
  });
});

describe("AxisEditorModal edit-mode header (REV-004)", () => {
  const headerSeedSchema = (): SchemaWithBody =>
    makeSchema({ composition: { repetition: { kind: "count", count: 4 } }, header: "Original" });

  it("keeps the header editable in edit-mode and sends the new value on submit", () => {
    renderEdit(headerSeedSchema());

    const headerInput = screen.getByRole("textbox", { name: HEADER_ARIA });

    fireEvent.change(headerInput, { target: { value: "Renamed opener" } });
    fireEvent.blur(headerInput);
    submitEdit();

    expect(updateSchemaMutate).toHaveBeenCalledTimes(1);
    expect(updateSchemaMutate.mock.calls[0]?.[0]?.data).toMatchObject({ header: "Renamed opener" });
  });
});

describe("AxisEditorModal double-submit guard (QA-201)", () => {
  it("fires createSchema once for a synchronous double-click", () => {
    renderCreate();

    toggle("repetition", "count");
    submit();
    submit();

    expect(createSchemaMutate).toHaveBeenCalledTimes(1);
  });
});

describe("AxisEditorModal ladder-marker conflict on edit (QA-202)", () => {
  const ladderWithMarkerSchema = (): SchemaWithBody => ({
    ...makeSchema({ composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } } }),
    rows: [makeMarkerRow()],
  });

  it("blocks Save without mutating and surfaces the conflict message", () => {
    renderEdit(ladderWithMarkerSchema());

    submitEdit();

    expect(updateSchemaMutate).not.toHaveBeenCalled();
    expect(
      within(screen.getByRole("alert")).getByText(/inner-ladder-marker row/i),
    ).toBeInTheDocument();
  });
});

describe("AxisEditorModal header length cap (QA-204)", () => {
  it("caps the header input at the contract maximum length", () => {
    renderCreate();

    expect(screen.getByRole("textbox", { name: HEADER_ARIA })).toHaveAttribute(
      "maxlength",
      String(SCHEMA_CONSTANTS.MAX_HEADER_LENGTH),
    );
  });
});
