import type { DraggableAttributes } from "@dnd-kit/core";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { SchemaWithBody } from "@repo/contracts/lms/schema";

import { render } from "@app/test/render";

import { SchemaCardHead } from "./schema-card-head";

const NOW = new Date("2026-01-06T00:00:00.000Z");
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const SCHEMA_ID = "clp9z8x7w0000abcd1234sch1";
const GROUP_ID = "clp9z8x7w0000abcd1234grp1";
const DRAG_LABEL = "Drag schema";
const TITLE_LABEL = "Schema title";
const EDIT_LABEL = "Edit axes";
const DUPLICATE_LABEL = "Duplicate schema";
const DELETE_LABEL = "Delete schema";

const LADDER_COMPOSITION: SchemaWithBody["schema"]["composition"] = {
  repetition: { kind: "ladder", steps: [21, 15, 9] },
};

const DRAG_ATTRIBUTES: DraggableAttributes = {
  role: "button",
  tabIndex: 0,
  "aria-disabled": false,
  "aria-pressed": undefined,
  "aria-roledescription": "sortable",
  "aria-describedby": "drag-schema",
};

const makeSchema = (overrides: Partial<SchemaWithBody["schema"]> = {}): SchemaWithBody => ({
  schema: {
    id: SCHEMA_ID,
    blockId: BLOCK_ID,
    groupId: null,
    order: 1,
    header: null,
    intensity: null,
    composition: LADDER_COMPOSITION,
    label: null,
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  },
  rows: [],
  rowGroups: [],
});

type RenderOptions = {
  schema?: SchemaWithBody;
  isBoxed?: boolean;
  isDraggable?: boolean;
  isExpanded?: boolean;
  isMutationPending?: boolean;
  onToggleExpanded?: () => void;
  onDuplicate?: () => void;
};

const renderHead = ({
  schema = makeSchema(),
  isBoxed = false,
  isDraggable = true,
  isExpanded = true,
  isMutationPending = false,
  onToggleExpanded = vi.fn(),
  onDuplicate = vi.fn(),
}: RenderOptions = {}) =>
  render(
    <SchemaCardHead
      schema={schema}
      isMutationPending={isMutationPending}
      dragAttributes={DRAG_ATTRIBUTES}
      dragListeners={undefined}
      onTitleCommit={vi.fn()}
      onDeleteOpen={vi.fn()}
      onEditOpen={vi.fn()}
      onDuplicate={onDuplicate}
      isExpanded={isExpanded}
      onToggleExpanded={onToggleExpanded}
      isBoxed={isBoxed}
      isDraggable={isDraggable}
    />,
  );

describe("SchemaCardHead title row (D-HEADER-KEEP parity)", () => {
  it("renders the composition tag and title textbox for a standalone schema (isBoxed=false)", () => {
    renderHead({ isBoxed: false });

    expect(screen.getByText("ladder 21-15-9")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: TITLE_LABEL })).toBeInTheDocument();
  });

  it("renders the composition tag and title textbox identically for an in-group schema (isBoxed=true)", () => {
    renderHead({ isBoxed: true });

    expect(screen.getByText("ladder 21-15-9")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: TITLE_LABEL })).toBeInTheDocument();
  });

  it("renders the derived header value in the title textbox when isBoxed", () => {
    renderHead({ schema: makeSchema({ header: "Custom heading" }), isBoxed: true });

    const titleInput = screen.getByRole("textbox", { name: TITLE_LABEL });

    if (!(titleInput instanceof HTMLInputElement)) {
      throw new Error("title input not an HTMLInputElement");
    }

    expect(titleInput.value).toBe("Custom heading");
  });

  it("renders the title textbox with no composition tag when composition is null, in both boxed states", () => {
    renderHead({ schema: makeSchema({ composition: null }), isBoxed: true });

    expect(screen.queryByText("ladder")).toBeNull();
    expect(screen.getByRole("textbox", { name: TITLE_LABEL })).toBeInTheDocument();
  });
});

describe("SchemaCardHead drag handle (isDraggable gate, unchanged)", () => {
  it("renders the drag handle when isDraggable is true", () => {
    renderHead({ isDraggable: true });

    expect(screen.getByRole("button", { name: DRAG_LABEL })).toBeInTheDocument();
  });

  it("hides the drag handle when isDraggable is false", () => {
    renderHead({ isDraggable: false });

    expect(screen.queryByRole("button", { name: DRAG_LABEL })).toBeNull();
  });

  it("keeps the title row visible for an in-group schema even when the drag handle is hidden", () => {
    renderHead({ schema: makeSchema({ groupId: GROUP_ID }), isBoxed: true, isDraggable: false });

    expect(screen.queryByRole("button", { name: DRAG_LABEL })).toBeNull();
    expect(screen.getByRole("textbox", { name: TITLE_LABEL })).toBeInTheDocument();
  });
});

describe("SchemaCardHead collapse toggle (Session/Block parity)", () => {
  it("renders a Collapse affordance when expanded and fires onToggleExpanded on click", () => {
    const onToggleExpanded = vi.fn();

    renderHead({ isExpanded: true, onToggleExpanded });

    fireEvent.click(screen.getByRole("button", { name: "Collapse schema" }));

    expect(onToggleExpanded).toHaveBeenCalledTimes(1);
  });

  it("renders an Expand affordance when collapsed", () => {
    renderHead({ isExpanded: false });

    expect(screen.getByRole("button", { name: "Expand schema" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Collapse schema" })).toBeNull();
  });
});

describe("SchemaCardHead duplicate affordance (T4.3 / Must-Test #8)", () => {
  it("renders the Duplicate button after the edit control and before delete", () => {
    renderHead();

    const editBtn = screen.getByRole("button", { name: EDIT_LABEL });
    const duplicateBtn = screen.getByRole("button", { name: DUPLICATE_LABEL });
    const deleteBtn = screen.getByRole("button", { name: DELETE_LABEL });

    expect(
      editBtn.compareDocumentPosition(duplicateBtn) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
    expect(
      duplicateBtn.compareDocumentPosition(deleteBtn) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
  });

  it("renders the Duplicate button for a standalone schema (isBoxed=false)", () => {
    renderHead({ isBoxed: false });

    expect(screen.getByRole("button", { name: DUPLICATE_LABEL })).toBeInTheDocument();
  });

  it("renders the Duplicate button for an in-group schema (isBoxed=true, boxed-member affordance)", () => {
    renderHead({ isBoxed: true });

    expect(screen.getByRole("button", { name: DUPLICATE_LABEL })).toBeInTheDocument();
  });

  it("fires the threaded onDuplicate when the Duplicate button is clicked", () => {
    const onDuplicate = vi.fn();

    renderHead({ onDuplicate });

    fireEvent.click(screen.getByRole("button", { name: DUPLICATE_LABEL }));

    expect(onDuplicate).toHaveBeenCalledTimes(1);
  });

  it("disables the Duplicate button when a mutation is pending", () => {
    renderHead({ isMutationPending: true });

    expect(screen.getByRole("button", { name: DUPLICATE_LABEL })).toBeDisabled();
  });
});
