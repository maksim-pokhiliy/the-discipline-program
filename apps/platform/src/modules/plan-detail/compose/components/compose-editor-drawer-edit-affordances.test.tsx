import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Composition } from "@repo/contracts/lms/composition";
import type { Exercise } from "@repo/contracts/lms/exercise";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";

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
