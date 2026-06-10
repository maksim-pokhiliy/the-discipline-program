import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Composition } from "@repo/contracts/lms/composition";
import { SCHEMA_CONSTANTS, type SchemaWithBody } from "@repo/contracts/lms/schema";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import { collectTrackChildren } from "../lib/arrangement-tree";
import type { UseCreateParallelSchemasResult } from "../lib/use-create-parallel-schemas";

import type { ComposeContainer } from "./axes/axis-draft.types";

type ParallelRun = UseCreateParallelSchemasResult["run"];
type ParallelRunArgs = Parameters<ParallelRun>[0];
type ParallelRunOptions = Parameters<ParallelRun>[1];

const createSchemaMutate = vi.fn();
const updateSchemaMutate = vi.fn();
const parallelRun = vi.fn<ParallelRun>();
const createSchemaState = { isPending: false };
const updateSchemaState = { isPending: false };
const parallelState = { isPending: false };

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

vi.mock("../lib/use-create-parallel-schemas", () => ({
  useCreateParallelSchemas: () => ({ run: parallelRun, isPending: parallelState.isPending }),
}));

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

const makeStructurallyParallelSchema = (composition: Composition = {}): SchemaWithBody => ({
  ...makeSchema({ composition }),
  subSchemas: [
    makeSchema({ id: SUB_SCHEMA_ID, parentSchemaId: SCHEMA_ID, header: "Track A" }),
    makeSchema({ id: SUB_SCHEMA_ID_B, parentSchemaId: SCHEMA_ID, header: "Track B" }),
  ],
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

const renderCreateSub = (parentSchemaId: string) =>
  render(
    <AxisEditorModal
      open
      onClose={vi.fn()}
      planId={PLAN_ID}
      startDate={START_DATE}
      mode={{ kind: "create", blockId: BLOCK_ID, parentSchemaId }}
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

const toggleGroup = (groupName: string, optionLabel: string) =>
  fireEvent.click(within(screen.getByRole("group", { name: groupName })).getByText(optionLabel));

const addAnotherLadder = () =>
  fireEvent.click(screen.getByRole("button", { name: "another ladder" }));

const buildParallel = () => {
  selectRepetition("Ladder");
  addAnotherLadder();
};

const editStepCell = (cellIndex: number, value: string) => {
  const cell = screen.getAllByRole("spinbutton")[cellIndex];

  if (cell === undefined) {
    throw new Error(`step cell ${cellIndex} not found`);
  }

  fireEvent.change(cell, { target: { value } });
};

const capturedParallelArgs = (): ParallelRunArgs => {
  const args = parallelRun.mock.calls[0]?.[0];

  if (args === undefined) {
    throw new Error("parallelRun was not called");
  }

  return args;
};

const capturedParallelOptions = (): ParallelRunOptions => {
  const options = parallelRun.mock.calls[0]?.[1];

  if (options === undefined) {
    throw new Error("parallelRun was not called");
  }

  return options;
};

afterEach(() => {
  createSchemaState.isPending = false;
  updateSchemaState.isPending = false;
  parallelState.isPending = false;
  createSchemaMutate.mockReset();
  updateSchemaMutate.mockReset();
  parallelRun.mockReset();
});

describe("AxisEditorModal create mode", () => {
  it("renders the create title and submit label", () => {
    renderCreate();

    expect(screen.getByRole("dialog", { name: CREATE_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add schema" })).toBeInTheDocument();
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

  it("omits parentSchemaId from the payload for a top-level create (no parentSchemaId in mode)", () => {
    renderCreate();

    selectRepetition("Count");
    submit();

    expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    expect(createSchemaMutate.mock.calls[0]?.[0]).not.toHaveProperty("parentSchemaId");
  });

  it("forwards parentSchemaId in the payload when the create mode carries one (F5 sub-schema)", () => {
    renderCreateSub(SUB_SCHEMA_ID);

    selectRepetition("Count");
    submit();

    expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    expect(createSchemaMutate.mock.calls[0]?.[0]).toEqual({
      blockId: BLOCK_ID,
      parentSchemaId: SUB_SCHEMA_ID,
      composition: { repetition: { kind: "count", count: 3 } },
      header: null,
      notes: null,
    });
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

describe("AxisEditorModal structurally-parallel edit (REV-003)", () => {
  it("shows the parallel derived label for a structurally-parallel schema", () => {
    renderEdit(makeStructurallyParallelSchema());

    expect(screen.getByText("parallel")).toBeInTheDocument();
  });

  it("writes interleaveOrder on Save when the interleave toggle flips", () => {
    renderEdit(makeStructurallyParallelSchema());

    toggleGroup("interleave", "track by track");
    submitEdit();

    expect(updateSchemaMutate).toHaveBeenCalledTimes(1);
    expect(updateSchemaMutate.mock.calls[0]?.[0]).toStrictEqual({
      schemaId: SCHEMA_ID,
      data: { composition: { interleaveOrder: "track_by_track" }, header: null },
    });
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
  const headerCapSchema = (): SchemaWithBody =>
    makeSchema({ composition: { repetition: { kind: "count", count: 4 } } });

  it("caps the header input at the contract maximum length", () => {
    renderEdit(headerCapSchema());

    expect(screen.getByRole("textbox", { name: HEADER_ARIA })).toHaveAttribute(
      "maxlength",
      String(SCHEMA_CONSTANTS.MAX_HEADER_LENGTH),
    );
  });
});

describe("AxisEditorModal stored composition survives open then Save (QA-Must-5)", () => {
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

  it("re-emits the empty structural-parallel composition byte-for-byte with no children in the payload", () => {
    renderEdit(makeStructurallyParallelSchema());
    submitEdit();

    expect(updateSchemaMutate).toHaveBeenCalledTimes(1);
    expect(updateSchemaMutate.mock.calls[0]?.[0]).toStrictEqual({
      schemaId: SCHEMA_ID,
      data: { composition: {}, header: null },
    });
  });

  it("re-emits an explicit stored interleaveOrder byte-for-byte with no edit", () => {
    renderEdit(makeStructurallyParallelSchema({ interleaveOrder: "track_by_track" }));
    submitEdit();

    expect(updateSchemaMutate).toHaveBeenCalledTimes(1);
    expect(updateSchemaMutate.mock.calls[0]?.[0]).toStrictEqual({
      schemaId: SCHEMA_ID,
      data: { composition: { interleaveOrder: "track_by_track" }, header: null },
    });
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

  it("re-emits a stored explicit ordered arrangement byte-for-byte with no edit", () => {
    renderEdit(makeStructurallyParallelSchema({ arrangement: { kind: "ordered" } }));
    submitEdit();

    expect(updateSchemaMutate).toHaveBeenCalledTimes(1);
    expect(updateSchemaMutate.mock.calls[0]?.[0]).toStrictEqual({
      schemaId: SCHEMA_ID,
      data: { composition: { arrangement: { kind: "ordered" } }, header: null },
    });
  });
});

describe("AxisEditorModal ordered escape hatch (REV-S2-W2)", () => {
  const supersetSeedSchema = (): SchemaWithBody =>
    makeSchema({
      composition: { arrangement: { kind: "superset", pairs: [{ label: "A1", rowIds: [] }] } },
    });

  it("keeps a multi-child parent with stored ordered suppressed instead of parallel", () => {
    renderEdit(makeStructurallyParallelSchema({ arrangement: { kind: "ordered" } }));

    expect(screen.queryByText("parallel")).toBeNull();
    expect(screen.getByRole("group", { name: "arrangement" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "interleave" })).toBeNull();
  });

  it("persists ordered selected in the edit UI in place of a stored superset", () => {
    renderEdit(supersetSeedSchema());

    toggleGroup("arrangement", "ordered");
    submitEdit();

    expect(updateSchemaMutate).toHaveBeenCalledTimes(1);
    expect(updateSchemaMutate.mock.calls[0]?.[0]).toStrictEqual({
      schemaId: SCHEMA_ID,
      data: { composition: { arrangement: { kind: "ordered" } }, header: null },
    });
  });

  it("emits no arrangement for an untouched container that never stored one", () => {
    renderEdit(makeSchema({ composition: { repetition: { kind: "count", count: 4 } } }));
    submitEdit();

    expect(updateSchemaMutate).toHaveBeenCalledTimes(1);
    expect(updateSchemaMutate.mock.calls[0]?.[0]).toStrictEqual({
      schemaId: SCHEMA_ID,
      data: { composition: { repetition: { kind: "count", count: 4 } }, header: null },
    });
  });
});

describe("AxisEditorModal repetition toggles on a structural parallel (QA-301)", () => {
  it("restores the parallel label and interleave control after a Count then Once exploration and saves once explicitly (QA-Must-1)", () => {
    renderEdit(makeStructurallyParallelSchema());

    selectRepetition("Count");

    expect(screen.queryByText("parallel")).toBeNull();
    expect(screen.queryByRole("group", { name: "interleave" })).toBeNull();

    selectRepetition("Once");

    expect(screen.getByText("parallel")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "interleave" })).toBeInTheDocument();

    submitEdit();

    expect(updateSchemaMutate).toHaveBeenCalledTimes(1);
    expect(updateSchemaMutate.mock.calls[0]?.[0]).toStrictEqual({
      schemaId: SCHEMA_ID,
      data: { composition: { repetition: { kind: "once" } }, header: null },
    });
  });

  it("swaps interleave for arrangement on a Count flip and retains the stranded interleaveOrder in the payload (QA-Must-2)", () => {
    renderEdit(makeStructurallyParallelSchema({ interleaveOrder: "track_by_track" }));

    expect(screen.getByRole("group", { name: "interleave" })).toBeInTheDocument();

    selectRepetition("Count");

    expect(screen.queryByRole("group", { name: "interleave" })).toBeNull();
    expect(screen.getByRole("group", { name: "arrangement" })).toBeInTheDocument();

    submitEdit();

    expect(updateSchemaMutate).toHaveBeenCalledTimes(1);
    expect(updateSchemaMutate.mock.calls[0]?.[0]).toStrictEqual({
      schemaId: SCHEMA_ID,
      data: {
        composition: {
          repetition: { kind: "count", count: 3 },
          interleaveOrder: "track_by_track",
        },
        header: null,
      },
    });
  });
});

describe("AxisEditorModal single-track stranded interleave (QA-Must-3)", () => {
  const singleTrackStrandedSchema = (): SchemaWithBody => ({
    ...makeSchema({ composition: { interleaveOrder: "track_by_track" } }),
    subSchemas: [makeSchema({ id: SUB_SCHEMA_ID, parentSchemaId: SCHEMA_ID, header: "Track A" })],
  });

  it("shows no parallel label and no interleave control for a single-child parent", () => {
    renderEdit(singleTrackStrandedSchema());

    expect(screen.queryByText("parallel")).toBeNull();
    expect(screen.queryByRole("group", { name: "interleave" })).toBeNull();
    expect(screen.getByRole("group", { name: "arrangement" })).toBeInTheDocument();
  });

  it("round-trips the stranded interleaveOrder byte-for-byte on an untouched save", () => {
    renderEdit(singleTrackStrandedSchema());
    submitEdit();

    expect(updateSchemaMutate).toHaveBeenCalledTimes(1);
    expect(updateSchemaMutate.mock.calls[0]?.[0]).toStrictEqual({
      schemaId: SCHEMA_ID,
      data: { composition: { interleaveOrder: "track_by_track" }, header: null },
    });
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

    selectRepetition("Count");

    expect(within(group).getByRole("button", { pressed: true })).toHaveAccessibleName("Count");
  });

  it("renders the another-ladder control outside the repetition tile group once Ladder is active", () => {
    renderCreate();

    selectRepetition("Ladder");

    const group = screen.getByRole("group", { name: "repetition" });
    const anotherLadder = screen.getByRole("button", { name: "another ladder" });

    expect(anotherLadder).toBeInTheDocument();
    expect(within(group).queryByRole("button", { name: "another ladder" })).toBeNull();
  });
});

describe("AxisEditorModal parallel-submit integration (REV-W1)", () => {
  const FIRST_LADDER_STEPS = [21, 15, 9];
  const SECOND_LADDER_STEPS = [15, 12, 9];

  const ladderKinds = (draft: ComposeContainer): Array<string | undefined> =>
    collectTrackChildren(draft).map((track) => track.repetition?.kind);

  it("fires the parallel-create request once with a two-track ladder draft and skips the flat create (#2)", () => {
    renderCreate();

    buildParallel();
    submit();

    expect(parallelRun).toHaveBeenCalledTimes(1);

    const { draft } = capturedParallelArgs();

    expect(collectTrackChildren(draft)).toHaveLength(2);
    expect(ladderKinds(draft)).toEqual(["ladder", "ladder"]);
    expect(createSchemaMutate).not.toHaveBeenCalled();
  });

  it("threads an edited second-track step into the parallel-create draft (#2 edit)", () => {
    renderCreate();

    buildParallel();
    editStepCell(FIRST_LADDER_STEPS.length, "12");
    submit();

    const { draft } = capturedParallelArgs();
    const [, secondTrack] = collectTrackChildren(draft);

    expect(secondTrack?.repetition).toEqual({
      kind: "ladder",
      steps: [12, SECOND_LADDER_STEPS[1], SECOND_LADDER_STEPS[2]],
    });
  });

  it("submits a single ladder through the flat create and never calls the parallel create (#7)", () => {
    renderCreate();

    selectRepetition("Ladder");
    submit();

    expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    expect(createSchemaMutate.mock.calls[0]?.[0]).toEqual({
      blockId: BLOCK_ID,
      composition: { repetition: { kind: "ladder", steps: FIRST_LADDER_STEPS } },
      header: null,
      notes: null,
    });
    expect(parallelRun).not.toHaveBeenCalled();
  });

  it("surfaces a per-track validation error from the parallel create in the modal Alert (#8)", () => {
    parallelRun.mockImplementationOnce((_args, options) => {
      options.onError("ladder 2: step values must be positive");

      return Promise.resolve();
    });

    renderCreate();

    buildParallel();
    submit();

    expect(parallelRun).toHaveBeenCalledTimes(1);
    expect(alertText()).toMatch(/ladder 2/);
    expect(createSchemaMutate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Add schema" })).toBeEnabled();
  });

  it("surfaces a request failure, keeps the modal open and re-enables submit (#9)", () => {
    const onClose = vi.fn();

    parallelRun.mockImplementationOnce((_args, options) => {
      options.onError("network exploded");

      return Promise.resolve();
    });

    render(
      <AxisEditorModal
        open
        onClose={onClose}
        planId={PLAN_ID}
        startDate={START_DATE}
        mode={{ kind: "create", blockId: BLOCK_ID }}
      />,
    );

    buildParallel();
    submit();

    expect(alertText()).toContain("network exploded");
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: CREATE_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add schema" })).toBeEnabled();
  });

  it("forwards an incoming parentSchemaId to the parallel create for a sub-schema parallel (#11)", () => {
    renderCreateSub(SUB_SCHEMA_ID);

    buildParallel();
    submit();

    expect(parallelRun).toHaveBeenCalledTimes(1);
    expect(capturedParallelArgs().parentSchemaId).toBe(SUB_SCHEMA_ID);
  });

  it("calls the parallel create once for a synchronous double-click on a parallel draft", () => {
    renderCreate();

    buildParallel();
    submit();
    submit();

    expect(parallelRun).toHaveBeenCalledTimes(1);
  });

  it("re-enables submit after a parallel-create success so a follow-up create can fire", () => {
    parallelRun.mockImplementationOnce((_args, options) => {
      options.onSuccess();

      return Promise.resolve();
    });

    renderCreate();

    buildParallel();
    submit();

    expect(capturedParallelOptions().onSuccess).toBeTypeOf("function");
    expect(screen.getByRole("button", { name: "Add schema" })).toBeEnabled();
  });
});
