import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { CatalogContext, type CatalogContextValue } from "@app/lib/contexts/catalog-provider";
import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import {
  DEMO_URL,
  PLAN_ID,
  ROW_ID,
  START_DATE,
  exerciseById,
  makeAtomicExerciseNoDemoRow,
  makeExerciseRow,
  makePlaceholderRow,
} from "./schema-row-card.fixtures";

const deleteSchemaRowMutate = vi.fn();
const deleteSchemaRowState = { isPending: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useDeleteSchemaRow: () => ({
      mutate: deleteSchemaRowMutate,
      isPending: deleteSchemaRowState.isPending,
    }),
  };
});

const { SchemaRowCard } = await import("./schema-row-card");

const DRAG_LABEL = "Drag row";
const EDIT_LABEL = "Edit row";
const DELETE_LABEL = "Delete row";

type RenderOptions = {
  row?: SchemaRow;
  index?: number;
  isReorderPending?: boolean;
};

const catalogValue: CatalogContextValue = {
  exerciseById,
};

const renderRowCard = ({
  row = makeExerciseRow(),
  index = 0,
  isReorderPending = false,
}: RenderOptions = {}) =>
  render(
    <CatalogContext.Provider value={catalogValue}>
      <SchemaRowCard
        row={row}
        planId={PLAN_ID}
        startDate={START_DATE}
        index={index}
        isReorderPending={isReorderPending}
      />
    </CatalogContext.Provider>,
  );

afterEach(() => {
  deleteSchemaRowState.isPending = false;
  deleteSchemaRowMutate.mockReset();
});

describe("SchemaRowCard chrome", () => {
  it("renders the outer 7-column grid with the documented template (D-01)", () => {
    const { container } = renderRowCard();
    const shell = container.firstChild;

    expect(shell).toHaveStyle({
      display: "grid",
      gridTemplateColumns: "24px 24px 32px 1fr auto auto auto",
    });
  });

  it("renders drag handle, ord cell, kind badge, edit button and delete button in column order", () => {
    renderRowCard();

    const dragBtn = screen.getByRole("button", { name: DRAG_LABEL });
    const ordCell = screen.getByText("1");
    const kindBadge = screen.getByText("EX");
    const editBtn = screen.getByRole("button", { name: EDIT_LABEL });
    const deleteBtn = screen.getByRole("button", { name: DELETE_LABEL });

    const sectionOrder = [dragBtn, ordCell, kindBadge, editBtn, deleteBtn];

    for (let i = 0; i < sectionOrder.length - 1; i += 1) {
      const earlier = sectionOrder[i];
      const later = sectionOrder[i + 1];

      if (earlier === undefined || later === undefined) {
        throw new Error("section reference missing");
      }

      expect(earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    }
  });

  it("renders the drag handle with grab cursor and touchAction:none", () => {
    renderRowCard();
    const dragBtn = screen.getByRole("button", { name: DRAG_LABEL });

    expect(dragBtn).toBeInTheDocument();
    expect(dragBtn).toHaveStyle({ cursor: "grab", touchAction: "none" });
  });

  it("renders the Edit and Delete IconButtons with their aria labels", () => {
    renderRowCard();

    expect(screen.getByRole("button", { name: EDIT_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: DELETE_LABEL })).toBeInTheDocument();
  });

  it("renders the Edit IconButton as a disabled stub (W4-editor)", () => {
    renderRowCard();

    expect(screen.getByRole("button", { name: EDIT_LABEL })).toBeDisabled();
  });
});

describe("SchemaRowCard demo link", () => {
  it("renders the demo link when the exercise has defaultDemoUrls entries", () => {
    renderRowCard();

    const link = screen.getByRole("link", { name: /demo/ });

    expect(link).toHaveAttribute("href", DEMO_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does NOT render the demo link when the exercise has no defaultDemoUrls", () => {
    renderRowCard({ row: makeAtomicExerciseNoDemoRow() });

    expect(screen.queryByRole("link", { name: /demo/ })).toBeNull();
  });

  it("does NOT render the demo link for a placeholder exercise", () => {
    renderRowCard({ row: makePlaceholderRow() });

    expect(screen.queryByRole("link", { name: /demo/ })).toBeNull();
  });

  it("focuses the demo link when programmatically focused (accessibility — QA-Must-14)", () => {
    renderRowCard();

    const link = screen.getByRole("link", { name: /demo/ });

    if (!(link instanceof HTMLAnchorElement)) {
      throw new Error("expected demo link to be an HTMLAnchorElement");
    }

    expect(link).not.toHaveAttribute("tabindex", "-1");
    expect(link).not.toHaveAttribute("aria-hidden", "true");

    link.focus();

    expect(link).toHaveFocus();
  });
});

describe("SchemaRowCard delete action", () => {
  it("opens the ConfirmationModal with the row mainText as details when the Delete IconButton is clicked", () => {
    renderRowCard({ row: makePlaceholderRow() });

    fireEvent.click(screen.getByRole("button", { name: DELETE_LABEL }));

    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByRole("heading", { name: "Delete row" })).toBeInTheDocument();
    expect(within(dialog).getByText("Delete this row?")).toBeInTheDocument();
    expect(within(dialog).getByText("Coach choice")).toBeInTheDocument();
  });

  it("fires useDeleteSchemaRow.mutate with the schemaRowId when Confirm is clicked", () => {
    renderRowCard();

    fireEvent.click(screen.getByRole("button", { name: DELETE_LABEL }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteSchemaRowMutate).toHaveBeenCalledTimes(1);
    expect(deleteSchemaRowMutate.mock.calls[0]?.[0]).toEqual({ schemaRowId: ROW_ID });
  });

  it("does NOT fire useDeleteSchemaRow.mutate when Cancel is clicked", () => {
    renderRowCard();

    fireEvent.click(screen.getByRole("button", { name: DELETE_LABEL }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(deleteSchemaRowMutate).not.toHaveBeenCalled();
  });
});

describe("SchemaRowCard mutation-pending", () => {
  it("disables the drag handle and delete button when useDeleteSchemaRow is pending", () => {
    deleteSchemaRowState.isPending = true;

    renderRowCard();

    expect(screen.getByRole("button", { name: DRAG_LABEL })).toBeDisabled();
    expect(screen.getByRole("button", { name: DELETE_LABEL })).toBeDisabled();
  });

  it("disables the drag handle and delete button when isReorderPending is true (QA-004)", () => {
    renderRowCard({ isReorderPending: true });

    expect(screen.getByRole("button", { name: DRAG_LABEL })).toBeDisabled();
    expect(screen.getByRole("button", { name: DELETE_LABEL })).toBeDisabled();
  });
});
