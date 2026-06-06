import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Composition } from "@repo/contracts/lms/composition";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import type * as EditAxes from "../lib/use-edit-compose-axes";
import type * as Cascade from "../lib/use-persist-compose-cascade";

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

const EPOCH = new Date(0);
const EDIT_SCHEMA_CUID = "cklatchedittopaaaaaaaaaaa";

const editComposition: Composition = {
  repetition: { kind: "count", count: 3 },
};

const editSchema = (): SchemaWithBody => ({
  schema: {
    id: EDIT_SCHEMA_CUID,
    blockId: BLOCK_ID,
    parentSchemaId: null,
    order: 1,
    header: null,
    intensity: null,
    composition: editComposition,
    label: null,
    notes: null,
    createdAt: EPOCH,
    updatedAt: EPOCH,
  },
  rows: [],
  subSchemas: [],
});

const renderDrawer = () =>
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
      mode={{ kind: "edit", schema: editSchema() }}
    />,
  );

const saveButton = (): HTMLElement => screen.getByRole("button", { name: "Save block" });

const saveAxesButton = (): HTMLElement => screen.getByRole("button", { name: "Save axes" });

beforeEach(() => {
  persistMock.mockReset();
  persistMock.mockImplementation(() => new Promise<never>(() => undefined));
  saveEditsMock.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("ComposeEditorDrawer double-submit latch (QA-205, QA-007 regression)", () => {
  it("runs the tree-creation persist only once for two synchronous Save clicks", () => {
    renderDrawer();

    const button = saveButton();

    fireEvent.click(button);
    fireEvent.click(button);

    expect(persistMock).toHaveBeenCalledTimes(1);
  });

  it("runs the edit save only once for two synchronous Save axes clicks", () => {
    saveEditsMock.mockImplementation(() => new Promise<never>(() => undefined));

    renderEditDrawer();

    const button = saveAxesButton();

    fireEvent.click(button);
    fireEvent.click(button);

    expect(saveEditsMock).toHaveBeenCalledTimes(1);
  });
});
