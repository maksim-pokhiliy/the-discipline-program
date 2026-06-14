import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SCHEMA_CONSTANTS, type SchemaWithBody } from "@repo/contracts/lms/schema";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import type { UseCreateGroupResult } from "../lib/use-create-group";
import type { UseCreateIndependentLaddersResult } from "../lib/use-create-independent-ladders";

type GroupRun = UseCreateGroupResult["run"];
type GroupRunArgs = Parameters<GroupRun>[0];
type GroupRunOptions = Parameters<GroupRun>[1];

type IndependentRun = UseCreateIndependentLaddersResult["run"];
type IndependentRunArgs = Parameters<IndependentRun>[0];

const createSchemaMutate = vi.fn();
const updateSchemaMutate = vi.fn();
const groupRun = vi.fn<GroupRun>();
const independentRun = vi.fn<IndependentRun>();
const createSchemaState = { isPending: false };
const updateSchemaState = { isPending: false };
const groupState = { isPending: false };
const independentState = { isPending: false };

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

vi.mock("../lib/use-create-group", () => ({
  useCreateGroup: () => ({ run: groupRun, isPending: groupState.isPending }),
}));

vi.mock("../lib/use-create-independent-ladders", () => ({
  useCreateIndependentLadders: () => ({
    run: independentRun,
    isPending: independentState.isPending,
  }),
}));

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

const renderCreateIntoGroup = (groupId: string) =>
  render(
    <AxisEditorModal
      open
      onClose={vi.fn()}
      planId={PLAN_ID}
      startDate={START_DATE}
      mode={{ kind: "create", blockId: BLOCK_ID, groupId }}
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

const groupCheckbox = (): HTMLElement | null =>
  screen.queryByRole("checkbox", { name: GROUP_CHECKBOX });

const uncheckGroup = (): void => {
  fireEvent.click(screen.getByRole("checkbox", { name: GROUP_CHECKBOX }));
};

const capturedGroupArgs = (): GroupRunArgs => {
  const args = groupRun.mock.calls[0]?.[0];

  if (args === undefined) {
    throw new Error("groupRun was not called");
  }

  return args;
};

const capturedGroupOptions = (): GroupRunOptions => {
  const options = groupRun.mock.calls[0]?.[1];

  if (options === undefined) {
    throw new Error("groupRun was not called");
  }

  return options;
};

const capturedIndependentArgs = (): IndependentRunArgs => {
  const args = independentRun.mock.calls[0]?.[0];

  if (args === undefined) {
    throw new Error("independentRun was not called");
  }

  return args;
};

afterEach(() => {
  createSchemaState.isPending = false;
  updateSchemaState.isPending = false;
  groupState.isPending = false;
  independentState.isPending = false;
  createSchemaMutate.mockReset();
  updateSchemaMutate.mockReset();
  groupRun.mockReset();
  independentRun.mockReset();
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

  it("omits groupId from the payload for a top-level create (no groupId in mode)", () => {
    renderCreate();

    selectRepetition("Count");
    submit();

    expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    expect(createSchemaMutate.mock.calls[0]?.[0]).not.toHaveProperty("groupId");
  });
});

describe("AxisEditorModal in-group add (W1-SUBADD-BOX)", () => {
  it("forwards groupId in the flat-create payload when the create mode carries one", () => {
    renderCreateIntoGroup(GROUP_ID);

    selectRepetition("Count");
    submit();

    expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    expect(createSchemaMutate.mock.calls[0]?.[0]).toEqual({
      blockId: BLOCK_ID,
      groupId: GROUP_ID,
      composition: { repetition: { kind: "count", count: 3 } },
      header: null,
      notes: null,
    });
  });

  it("hides the Group-into-box checkbox in the in-group add context even for a parallel draft (MT-18)", () => {
    renderCreateIntoGroup(GROUP_ID);

    buildParallel();

    expect(groupCheckbox()).toBeNull();
  });

  it("routes a parallel draft through the flat create (never the group/independent hook) in the in-group add context", () => {
    renderCreateIntoGroup(GROUP_ID);

    buildParallel();
    submit();

    expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    expect(createSchemaMutate.mock.calls[0]?.[0]).toMatchObject({ groupId: GROUP_ID });
    expect(groupRun).not.toHaveBeenCalled();
    expect(independentRun).not.toHaveBeenCalled();
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
      data: { composition: { repetition: { kind: "count", count: 4 } }, header: null },
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
      data: { composition: { repetition: { kind: "count", count: 4 } }, header: null },
    });
  });

  it("never shows the Group-into-box checkbox in edit mode", () => {
    renderEdit(editableSchema());

    expect(groupCheckbox()).toBeNull();

    submitEdit();

    expect(groupRun).not.toHaveBeenCalled();
    expect(independentRun).not.toHaveBeenCalled();
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

describe("AxisEditorModal group-into-box submit routing (MT-18, DR-W1-2)", () => {
  it("fires the group create once with a two-track ladder draft and skips the flat create when Group-into-box stays checked", () => {
    renderCreate();

    buildParallel();

    expect(groupCheckbox()).toBeChecked();

    submit();

    expect(groupRun).toHaveBeenCalledTimes(1);
    expect(capturedGroupArgs().draft.tracks).toHaveLength(2);
    expect(createSchemaMutate).not.toHaveBeenCalled();
    expect(independentRun).not.toHaveBeenCalled();
  });

  it("threads an edited second-track step into the group-create draft", () => {
    renderCreate();

    buildParallel();
    editStepCell(3, "12");
    submit();

    const [, secondTrack] = capturedGroupArgs().draft.tracks;

    expect(secondTrack?.steps).toEqual([12, 12, 9]);
  });

  it("routes a parallel draft to the independent create when Group-into-box is unchecked", () => {
    renderCreate();

    buildParallel();
    uncheckGroup();

    expect(groupCheckbox()).not.toBeChecked();

    submit();

    expect(independentRun).toHaveBeenCalledTimes(1);
    expect(groupRun).not.toHaveBeenCalled();
    expect(capturedIndependentArgs().draft.tracks).toHaveLength(2);
  });

  it("submits a single ladder through the flat create and never calls the group create", () => {
    renderCreate();

    selectRepetition("Ladder");

    expect(groupCheckbox()).toBeNull();

    submit();

    expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    expect(createSchemaMutate.mock.calls[0]?.[0]).toEqual({
      blockId: BLOCK_ID,
      composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } },
      header: null,
      notes: null,
    });
    expect(groupRun).not.toHaveBeenCalled();
    expect(independentRun).not.toHaveBeenCalled();
  });

  it("surfaces a per-track validation error from the group create in the modal Alert", () => {
    groupRun.mockImplementationOnce((_args, options) => {
      options.onError("ladder 2: step values must be positive");

      return Promise.resolve();
    });

    renderCreate();

    buildParallel();
    submit();

    expect(groupRun).toHaveBeenCalledTimes(1);
    expect(alertText()).toMatch(/ladder 2/);
    expect(createSchemaMutate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Add schema" })).toBeEnabled();
  });

  it("surfaces a request failure, keeps the modal open and re-enables submit", () => {
    const onClose = vi.fn();

    groupRun.mockImplementationOnce((_args, options) => {
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

  it("calls the group create once for a synchronous double-click on a parallel draft", () => {
    renderCreate();

    buildParallel();
    submit();
    submit();

    expect(groupRun).toHaveBeenCalledTimes(1);
  });

  it("re-enables submit after a group-create success so a follow-up create can fire", () => {
    groupRun.mockImplementationOnce((_args, options) => {
      options.onSuccess();

      return Promise.resolve();
    });

    renderCreate();

    buildParallel();
    submit();

    expect(capturedGroupOptions().onSuccess).toBeTypeOf("function");
    expect(screen.getByRole("button", { name: "Add schema" })).toBeEnabled();
  });
});
