import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Composition } from "@repo/contracts/lms/composition";
import type { Exercise } from "@repo/contracts/lms/exercise";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import type { ComposeContainer, ComposeRow } from "../compose-tree.types";
import { asNodeId } from "../lib/id-factory";
import type * as EditAxes from "../lib/use-edit-compose-axes";
import type * as Cascade from "../lib/use-persist-compose-cascade";

import { ComposeContainerInspector } from "./compose-container-inspector";

const persistMock = vi.fn();
const saveEditsMock = vi.fn();

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useCatalog: () => ({ exerciseById: new Map() }),
  };
});

vi.mock("../lib/use-persist-compose-cascade", async () => {
  const actual = await vi.importActual<typeof Cascade>("../lib/use-persist-compose-cascade");

  return {
    ...actual,
    usePersistComposeCascade: () => ({ persist: persistMock, isPending: false }),
  };
});

vi.mock("../lib/use-edit-compose-axes", async () => {
  const actual = await vi.importActual<typeof EditAxes>("../lib/use-edit-compose-axes");

  return {
    ...actual,
    useEditComposeAxes: () => ({ saveEdits: saveEditsMock, isPending: false }),
  };
});

const { ComposeEditorDrawer } = await import("./compose-editor-drawer");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2025-01-06";
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const TOP_CUID = "ckaffordtopaaaaaaaaaaaaaa";

const EPOCH = new Date(0);

const seededComposition: Composition = {
  repetition: { kind: "count", count: 3 },
};

const seededSchema = (): SchemaWithBody => ({
  schema: {
    id: TOP_CUID,
    blockId: BLOCK_ID,
    parentSchemaId: null,
    order: 1,
    header: "Strength block",
    intensity: null,
    composition: seededComposition,
    label: null,
    notes: null,
    createdAt: EPOCH,
    updatedAt: EPOCH,
  },
  rows: [],
  subSchemas: [],
});

const renderCreateDrawer = () =>
  render(
    <ComposeEditorDrawer
      open={true}
      onClose={vi.fn()}
      planId={PLAN_ID}
      startDate={START_DATE}
      blockId={BLOCK_ID}
    />,
  );

const renderEditDrawer = () =>
  render(
    <ComposeEditorDrawer
      open={true}
      onClose={vi.fn()}
      planId={PLAN_ID}
      startDate={START_DATE}
      blockId={BLOCK_ID}
      mode={{ kind: "edit", schema: seededSchema() }}
    />,
  );

const duplicateButtons = (): HTMLElement[] =>
  screen.queryAllByRole("button", { name: /^Duplicate (week|day|session|block)$/ });

beforeEach(() => {
  persistMock.mockReset();
  saveEditsMock.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("ComposeEditorDrawer hides upper-row duplicate affordances in edit-mode (QA-101)", () => {
  it("renders no upper-row Duplicate buttons when editing an existing block", () => {
    renderEditDrawer();

    expect(duplicateButtons()).toHaveLength(0);
  });

  it("renders the upper-row Duplicate buttons in create-mode (positive control)", () => {
    renderCreateDrawer();

    expect(duplicateButtons().length).toBeGreaterThan(0);
  });
});

const DEMOTE_BUTTON_NAME = /Demote to row/;
const DEMOTE_HINT_TEXT = /drop it down to a row/i;

const demotableRow = (): ComposeRow => ({
  nodeType: "row",
  id: asNodeId("demote-child-row"),
  rowKind: "EXERCISE",
  rowPayload: { rowKind: "REST_SLOT" },
  reps: null,
  load: null,
  side: null,
  tempo: null,
  position: null,
  intensity: null,
  notes: null,
  editorDraft: null,
});

const demotableContainer = (): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId("demote-container"),
  header: "Single movement",
  notes: null,
  children: [demotableRow()],
});

const renderInspector = (isCreateMode: boolean): void => {
  render(
    <ComposeContainerInspector
      container={demotableContainer()}
      exerciseById={new Map<string, Exercise>()}
      isCreateMode={isCreateMode}
      onUpdateNode={vi.fn()}
      onRename={vi.fn()}
      onDemoteNode={vi.fn()}
    />,
  );
};

describe("ComposeContainerInspector gates the demote-to-row affordance to create-mode (T2-6)", () => {
  it("shows the Demote to row button on a single-row-child group in create-mode", () => {
    renderInspector(true);

    expect(screen.getByRole("button", { name: DEMOTE_BUTTON_NAME })).toBeInTheDocument();
  });

  it("hides the demote button and the hint in edit-mode", () => {
    renderInspector(false);

    expect(screen.queryByRole("button", { name: DEMOTE_BUTTON_NAME })).toBeNull();
    expect(screen.queryByText(DEMOTE_HINT_TEXT)).toBeNull();
  });
});

const CHILD_A_CUID = "ckaffordchildaaaaaaaaaaaa";
const CHILD_B_CUID = "ckaffordchildbbbbbbbbbbbb";
const SELF_PAIRED_ROW_CUID = "ckaffordrowdownaaaaaaaaaa";
const SIBLING_ROW_CUID = "ckaffordrowupaaaaaaaaaaaa";
const SAVE_AXES_BUTTON_NAME = "Save axes";
const ISSUES_TITLE = "Cannot save this block yet";

const restSlotRow = (id: string, schemaId: string): SchemaRow => ({
  id,
  schemaId,
  order: 1,
  rowKind: "REST_SLOT",
  rowPayload: { rowKind: "REST_SLOT" },
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
  createdAt: EPOCH,
  updatedAt: EPOCH,
});

const leafSchema = (id: string, rows: SchemaRow[]): SchemaWithBody => ({
  schema: {
    id,
    blockId: BLOCK_ID,
    parentSchemaId: TOP_CUID,
    order: 1,
    header: null,
    intensity: null,
    composition: null,
    label: null,
    notes: null,
    createdAt: EPOCH,
    updatedAt: EPOCH,
  },
  rows,
  subSchemas: [],
});

const selfPairedSchema = (): SchemaWithBody => ({
  schema: {
    id: TOP_CUID,
    blockId: BLOCK_ID,
    parentSchemaId: null,
    order: 1,
    header: "Parallel block",
    intensity: null,
    composition: {
      arrangement: {
        kind: "parallel",
        interleaveOrder: "round_by_round",
        tracks: [
          { childSchemaId: CHILD_A_CUID, pairedWithRowId: SELF_PAIRED_ROW_CUID },
          { childSchemaId: CHILD_B_CUID },
        ],
      },
    },
    label: null,
    notes: null,
    createdAt: EPOCH,
    updatedAt: EPOCH,
  },
  rows: [],
  subSchemas: [
    leafSchema(CHILD_A_CUID, [restSlotRow(SELF_PAIRED_ROW_CUID, CHILD_A_CUID)]),
    leafSchema(CHILD_B_CUID, [restSlotRow(SIBLING_ROW_CUID, CHILD_B_CUID)]),
  ],
});

const renderSelfPairedEditDrawer = () =>
  render(
    <ComposeEditorDrawer
      open={true}
      onClose={vi.fn()}
      planId={PLAN_ID}
      startDate={START_DATE}
      blockId={BLOCK_ID}
      mode={{ kind: "edit", schema: selfPairedSchema() }}
    />,
  );

describe("ComposeEditorDrawer validates the arrangement on edit save (QA-103)", () => {
  it("blocks the update and surfaces the issues Alert for a self-paired parallel track", async () => {
    renderSelfPairedEditDrawer();

    fireEvent.click(screen.getByRole("button", { name: SAVE_AXES_BUTTON_NAME }));

    await waitFor(() => {
      expect(screen.getByText(ISSUES_TITLE)).toBeInTheDocument();
    });
    expect(saveEditsMock).not.toHaveBeenCalled();
  });
});
