import { createElement } from "react";

import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import {
  DEMO_URL,
  PLAN_ID,
  ROW_ID,
  START_DATE,
  exerciseById,
  makeAtomicExerciseNoDemoRow,
  makeCompoundExerciseRow,
  makeExerciseRow,
  makeRestRow,
  makeStandaloneLoadRow,
} from "./schema-row-card.fixtures";

const updateSchemaRowMutate = vi.fn();
const deleteSchemaRowMutate = vi.fn();
const updateSchemaRowState = { isPending: false };
const deleteSchemaRowState = { isPending: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useUpdateSchemaRow: () => ({
      mutate: updateSchemaRowMutate,
      isPending: updateSchemaRowState.isPending,
    }),
    useDeleteSchemaRow: () => ({
      mutate: deleteSchemaRowMutate,
      isPending: deleteSchemaRowState.isPending,
    }),
  };
});

vi.mock("./row-editor-modal", () => {
  const renderEditorMock = (props: { open: boolean }) =>
    props.open
      ? createElement("div", {
          "data-testid": "row-editor-modal-mock",
          "data-open": String(props.open),
        })
      : null;

  return { RowEditorModal: renderEditorMock };
});

const { SchemaRowCard } = await import("./schema-row-card");

const DRAG_LABEL = "Drag row";
const KEBAB_LABEL = "Row actions";

type RenderOptions = {
  row?: SchemaRow;
  index?: number;
};

const renderRowCard = ({ row = makeExerciseRow(), index = 0 }: RenderOptions = {}) =>
  render(
    <SchemaRowCard
      row={row}
      planId={PLAN_ID}
      startDate={START_DATE}
      exerciseById={exerciseById}
      index={index}
    />,
  );

afterEach(() => {
  updateSchemaRowState.isPending = false;
  deleteSchemaRowState.isPending = false;
  updateSchemaRowMutate.mockReset();
  deleteSchemaRowMutate.mockReset();
});

describe("SchemaRowCard chrome", () => {
  it("renders the outer 6-column grid with the documented template (D-01)", () => {
    const { container } = renderRowCard();
    const shell = container.firstChild;

    expect(shell).toHaveStyle({
      display: "grid",
      gridTemplateColumns: "24px 24px 32px 1fr auto auto",
    });
  });

  it("renders drag handle, ord cell, kind badge and kebab in column order", () => {
    renderRowCard();

    const dragBtn = screen.getByRole("button", { name: DRAG_LABEL });
    const ordCell = screen.getByText("1");
    const kindBadge = screen.getByText("EX");
    const kebab = screen.getByRole("button", { name: KEBAB_LABEL });

    const sectionOrder = [dragBtn, ordCell, kindBadge, kebab];

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

  it("renders the kebab IconButton with aria 'Row actions'", () => {
    renderRowCard();

    expect(screen.getByRole("button", { name: KEBAB_LABEL })).toBeInTheDocument();
  });
});

describe("SchemaRowCard demo link", () => {
  it("renders the demo link when EXERCISE is atomic and defaultDemoUrls has entries", () => {
    renderRowCard();

    const link = screen.getByRole("link", { name: /demo/ });

    expect(link).toHaveAttribute("href", DEMO_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does NOT render the demo link when EXERCISE is atomic but defaultDemoUrls is empty", () => {
    renderRowCard({ row: makeAtomicExerciseNoDemoRow() });

    expect(screen.queryByRole("link", { name: /demo/ })).toBeNull();
  });

  it("does NOT render the demo link when EXERCISE form is compound", () => {
    renderRowCard({ row: makeCompoundExerciseRow() });

    expect(screen.queryByRole("link", { name: /demo/ })).toBeNull();
  });

  it("does NOT render the demo link for non-EXERCISE rows (REST)", () => {
    renderRowCard({ row: makeRestRow() });

    expect(screen.queryByRole("link", { name: /demo/ })).toBeNull();
  });
});

describe("SchemaRowCard kebab menu interactions", () => {
  it("opens the RowEditorModal when Edit menu item is clicked", () => {
    renderRowCard();

    expect(screen.queryByTestId("row-editor-modal-mock")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: KEBAB_LABEL }));
    fireEvent.click(within(screen.getByRole("menu")).getByText("Edit"));

    expect(screen.getByTestId("row-editor-modal-mock")).toBeInTheDocument();
  });

  it("opens the ConfirmationModal with the row mainText as details when Delete is clicked", () => {
    renderRowCard({ row: makeStandaloneLoadRow() });

    fireEvent.click(screen.getByRole("button", { name: KEBAB_LABEL }));
    fireEvent.click(within(screen.getByRole("menu")).getByText("Delete"));

    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByRole("heading", { name: "Delete row" })).toBeInTheDocument();
    expect(within(dialog).getByText("Delete this row?")).toBeInTheDocument();
    expect(within(dialog).getByText("20 kg")).toBeInTheDocument();
  });

  it("fires useDeleteSchemaRow.mutate with the schemaRowId when Confirm is clicked", () => {
    renderRowCard();

    fireEvent.click(screen.getByRole("button", { name: KEBAB_LABEL }));
    fireEvent.click(within(screen.getByRole("menu")).getByText("Delete"));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteSchemaRowMutate).toHaveBeenCalledTimes(1);
    expect(deleteSchemaRowMutate.mock.calls[0]?.[0]).toEqual({ schemaRowId: ROW_ID });
  });

  it("does NOT fire useDeleteSchemaRow.mutate when Cancel is clicked", () => {
    renderRowCard();

    fireEvent.click(screen.getByRole("button", { name: KEBAB_LABEL }));
    fireEvent.click(within(screen.getByRole("menu")).getByText("Delete"));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(deleteSchemaRowMutate).not.toHaveBeenCalled();
  });
});

describe("SchemaRowCard double-click", () => {
  it("opens the RowEditorModal when the row is double-clicked", () => {
    const { container } = renderRowCard();
    const shell = container.firstChild;

    expect(screen.queryByTestId("row-editor-modal-mock")).toBeNull();

    if (!(shell instanceof HTMLElement)) {
      throw new Error("expected row shell to be an HTMLElement");
    }

    fireEvent.doubleClick(shell);

    expect(screen.getByTestId("row-editor-modal-mock")).toBeInTheDocument();
  });
});

describe("SchemaRowCard mutation-pending", () => {
  it("disables drag handle and kebab when useUpdateSchemaRow is pending", () => {
    updateSchemaRowState.isPending = true;

    renderRowCard();

    expect(screen.getByRole("button", { name: DRAG_LABEL })).toBeDisabled();
    expect(screen.getByRole("button", { name: KEBAB_LABEL })).toBeDisabled();
  });

  it("disables drag handle and kebab when useDeleteSchemaRow is pending", () => {
    deleteSchemaRowState.isPending = true;

    renderRowCard();

    expect(screen.getByRole("button", { name: DRAG_LABEL })).toBeDisabled();
    expect(screen.getByRole("button", { name: KEBAB_LABEL })).toBeDisabled();
  });
});
