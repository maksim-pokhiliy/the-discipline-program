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
const REFUSAL_MESSAGE = "This schema contains a rep-scheme not yet editable.";

const alertText = (): string => screen.getByRole("alert").textContent ?? "";

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

const selectRepetition = (label: string) =>
  fireEvent.click(screen.getByRole("button", { name: label }));

const selectScoring = (kind: string) =>
  fireEvent.change(screen.getByRole("combobox", { name: "scoring" }), { target: { value: kind } });

const toggleGroup = (groupName: string, optionLabel: string) =>
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

    expect(screen.getByText("Derived label")).toBeInTheDocument();
    expect(screen.getByText("flat — plain container")).toBeInTheDocument();

    selectRepetition("Count");

    expect(screen.getByText("rounds")).toBeInTheDocument();
  });

  it("submits createSchema with the count composition, a null header and null notes", () => {
    renderCreate();

    selectRepetition("Count");
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

    selectScoring("amrap");

    expect(screen.getByRole("textbox", { name: CONDITION_LABEL })).toBeInTheDocument();
    expect(screen.getAllByText("AMRAP").length).toBeGreaterThanOrEqual(1);
  });

  it("submits scoring.condition.appliesToRounds parsed from the rounds input", () => {
    renderCreate();

    selectScoring("amrap");
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

    selectRepetition("Count");
    selectScoring("amrap");

    expect(screen.getByText("rounds")).toBeInTheDocument();
  });
});

describe("AxisEditorModal error surfacing", () => {
  it("surfaces a contract-invalid composition in the FormModal error Alert and does not mutate", () => {
    renderCreate();

    selectRepetition("Clock window");
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

    toggleGroup("arrangement", "parallel");
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

    selectRepetition("Count");
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

describe("AxisEditorModal scoring appliesToRounds rejection (QA-Must-3)", () => {
  it("rejects a zero round and surfaces the path-prefixed message without mutating", () => {
    renderCreate();

    selectScoring("amrap");
    fireEvent.change(screen.getByRole("textbox", { name: CONDITION_LABEL }), {
      target: { value: "0" },
    });
    submit();

    expect(createSchemaMutate).not.toHaveBeenCalled();
    expect(alertText()).toContain("scoring.condition.appliesToRounds");
    expect(alertText()).toMatch(/greater than 0/i);
  });

  it("rejects a negative round and surfaces the path-prefixed message without mutating", () => {
    renderCreate();

    selectScoring("amrap");
    fireEvent.change(screen.getByRole("textbox", { name: CONDITION_LABEL }), {
      target: { value: "-1" },
    });
    submit();

    expect(createSchemaMutate).not.toHaveBeenCalled();
    expect(alertText()).toContain("scoring.condition.appliesToRounds");
  });

  it("treats non-numeric rounds as no condition and submits a valid scoring", () => {
    renderCreate();

    selectScoring("amrap");
    fireEvent.change(screen.getByRole("textbox", { name: CONDITION_LABEL }), {
      target: { value: "abc" },
    });
    submit();

    expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    expect(createSchemaMutate.mock.calls[0]?.[0]?.composition?.scoring).toEqual({ kind: "amrap" });
  });
});

describe("AxisEditorModal progressive empty seed rejection (QA-Must-3)", () => {
  it("rejects an empty progressive seed and surfaces the seed message without mutating", () => {
    renderCreate();

    selectScoring("progressive");
    submit();

    expect(createSchemaMutate).not.toHaveBeenCalled();
    expect(alertText()).toContain("scoring.seed");
    expect(alertText()).toMatch(/at least 1 character/i);
  });
});

describe("AxisEditorModal scoring condition round-trip through edit (QA-Must-4)", () => {
  const conditionSeedSchema = (): SchemaWithBody =>
    makeSchema({
      composition: { scoring: { kind: "amrap", condition: { appliesToRounds: [2, 3] } } },
    });

  it("pre-fills the rounds input and re-emits the identical condition on Save", () => {
    renderEdit(conditionSeedSchema());

    expect(screen.getByRole("textbox", { name: CONDITION_LABEL })).toHaveValue("2, 3");

    submitEdit();

    expect(updateSchemaMutate).toHaveBeenCalledTimes(1);
    expect(updateSchemaMutate.mock.calls[0]?.[0]?.data?.composition?.scoring).toEqual({
      kind: "amrap",
      condition: { appliesToRounds: [2, 3] },
    });
  });
});

describe("AxisEditorModal stored arrangement survives open then Save (QA-Must-5)", () => {
  const parallelStoredSchema = (): SchemaWithBody => {
    const top = makeSchema({
      composition: {
        repetition: { kind: "count", count: 4 },
        arrangement: {
          kind: "parallel",
          interleaveOrder: "round_by_round",
          tracks: [
            { childSchemaId: SUB_SCHEMA_ID, setEnumeration: [21, 15, 9] },
            { childSchemaId: SUB_SCHEMA_ID_B },
          ],
        },
      },
    });

    return {
      ...top,
      subSchemas: [
        makeSchema({ id: SUB_SCHEMA_ID, parentSchemaId: SCHEMA_ID }),
        makeSchema({ id: SUB_SCHEMA_ID_B, parentSchemaId: SCHEMA_ID }),
      ],
    };
  };

  const supersetStoredSchema = (): SchemaWithBody => {
    const rowA = "clp9z8x7w0000abcd1234rowa1";
    const rowB = "clp9z8x7w0000abcd1234rowb1";
    const top = makeSchema({
      composition: {
        arrangement: { kind: "superset", pairs: [{ label: "A1", rowIds: [rowA, rowB] }] },
      },
    });

    return {
      ...top,
      rows: [
        {
          ...makeMarkerRow(),
          id: rowA,
          rowKind: "REST_SLOT",
          rowPayload: { rowKind: "REST_SLOT" },
        },
        {
          ...makeMarkerRow(),
          id: rowB,
          rowKind: "REST_SLOT",
          rowPayload: { rowKind: "REST_SLOT" },
        },
      ],
    };
  };

  it("re-emits the stored parallel arrangement byte-for-byte with no edit", () => {
    const stored = parallelStoredSchema();

    renderEdit(stored);
    submitEdit();

    expect(updateSchemaMutate).toHaveBeenCalledTimes(1);
    expect(updateSchemaMutate.mock.calls[0]?.[0]?.data?.composition?.arrangement).toEqual(
      stored.schema.composition?.arrangement,
    );
  });

  it("re-emits the stored superset arrangement byte-for-byte with no edit", () => {
    const stored = supersetStoredSchema();

    renderEdit(stored);
    submitEdit();

    expect(updateSchemaMutate).toHaveBeenCalledTimes(1);
    expect(updateSchemaMutate.mock.calls[0]?.[0]?.data?.composition?.arrangement).toEqual(
      stored.schema.composition?.arrangement,
    );
  });
});

describe("AxisEditorModal range repetition refusal (QA-Must-7)", () => {
  const rangeSchema = (): SchemaWithBody =>
    makeSchema({ composition: { repetition: { kind: "range", range: { min: 3, max: 5 } } } });

  it("disables Save and surfaces the refusal Alert without mutating", () => {
    renderEdit(rangeSchema());

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(alertText()).toContain(REFUSAL_MESSAGE);

    submitEdit();

    expect(updateSchemaMutate).not.toHaveBeenCalled();
  });
});

describe("AxisEditorModal mutation error surfacing (QA-Must-8)", () => {
  it("surfaces the mutation error and re-enables Save for a retry", () => {
    createSchemaMutate.mockImplementationOnce((_vars, options) => {
      options?.onError?.(new Error("Network boom"));
      options?.onSettled?.();
    });

    renderCreate();

    selectRepetition("Count");
    submit();

    expect(alertText()).toContain("Network boom");
    expect(screen.getByRole("button", { name: "Add schema" })).toBeEnabled();

    submit();

    expect(createSchemaMutate).toHaveBeenCalledTimes(2);
  });
});

describe("AxisEditorModal count range refinement (QA-Must-10)", () => {
  const setRangeMinMax = (min: string, max: string): void => {
    fireEvent.click(screen.getByRole("button", { name: "Count" }));

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

describe("AxisEditorModal window ordering refinement (QA-Must-10)", () => {
  it("rejects a start at or after the end and surfaces the window message without mutating", () => {
    renderCreate();

    selectRepetition("Clock window");
    fireEvent.change(screen.getByRole("textbox", { name: "Start HH:MM" }), {
      target: { value: "10:00" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "End HH:MM" }), {
      target: { value: "09:00" },
    });
    submit();

    expect(createSchemaMutate).not.toHaveBeenCalled();
    expect(alertText()).toContain("endHhMm");
  });
});

describe("AxisEditorModal create-mode arrangement with no children (QA-Must-5)", () => {
  it("blocks a parallel arrangement that has no tracks and surfaces the issue without mutating", () => {
    renderCreate();

    toggleGroup("arrangement", "parallel");
    submit();

    expect(createSchemaMutate).not.toHaveBeenCalled();
    expect(alertText()).toMatch(/at least two tracks/i);
  });

  it("blocks a superset arrangement that has no rows and surfaces the issue without mutating", () => {
    renderCreate();

    toggleGroup("arrangement", "superset");
    submit();

    expect(createSchemaMutate).not.toHaveBeenCalled();
    expect(alertText()).toMatch(/superset pair needs/i);
  });
});

describe("AxisEditorModal repetition tile-group a11y contract (T13)", () => {
  const REPETITION_TILE_COUNT = 7;

  it("exposes a tile group with one button per repetition tile", () => {
    renderCreate();

    const group = screen.getByRole("group", { name: "repetition" });

    expect(within(group).getAllByRole("button")).toHaveLength(REPETITION_TILE_COUNT);
  });

  it("marks only the active repetition tile aria-pressed and moves the mark on select", () => {
    renderCreate();

    const group = screen.getByRole("group", { name: "repetition" });

    expect(within(group).getByRole("button", { pressed: true })).toHaveAccessibleName("Once");

    selectRepetition("Count");

    expect(within(group).getByRole("button", { pressed: true })).toHaveAccessibleName("Count");
  });
});

describe("AxisEditorModal scoring combobox a11y contract (T13)", () => {
  it("flips the scoring combobox value when a kind is selected", () => {
    renderCreate();

    const scoringCombobox = screen.getByRole("combobox", { name: "scoring" });

    expect(scoringCombobox).toHaveValue("prescribed");

    selectScoring("amrap");

    expect(scoringCombobox).toHaveValue("amrap");
  });
});
