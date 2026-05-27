import { createElement } from "react";

import { alpha } from "@mui/material";
import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SchemaRow } from "@repo/contracts/lms/schema-row";
import { theme } from "@repo/mui";

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
  makeFootnoteRow,
  makeInnerLadderMarkerRow,
  makeRestRow,
  makeStandaloneLoadRow,
} from "./schema-row-card.fixtures";

const TINT_ALPHA = 0.04;
const LADDER_TINT_ALPHA = 0.02;

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
  isReorderPending?: boolean;
};

const renderRowCard = ({
  row = makeExerciseRow(),
  index = 0,
  isReorderPending = false,
}: RenderOptions = {}) =>
  render(
    <SchemaRowCard
      row={row}
      planId={PLAN_ID}
      startDate={START_DATE}
      exerciseById={exerciseById}
      index={index}
      isReorderPending={isReorderPending}
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

describe("SchemaRowCard per-RowKind tint", () => {
  it("applies kind.load tint at 0.04 alpha for STANDALONE_LOAD", () => {
    const { container } = renderRowCard({ row: makeStandaloneLoadRow() });
    const shell = container.firstChild;
    const expectedBgColor = alpha(theme.palette.kind.load, TINT_ALPHA);

    expect(shell).toHaveStyle({ backgroundColor: expectedBgColor });
  });

  it("applies kind.rest tint at 0.04 alpha for REST", () => {
    const { container } = renderRowCard({ row: makeRestRow() });
    const shell = container.firstChild;
    const expectedBgColor = alpha(theme.palette.kind.rest, TINT_ALPHA);

    expect(shell).toHaveStyle({ backgroundColor: expectedBgColor });
  });

  it("applies kind.foot tint at 0.04 alpha for FOOTNOTE", () => {
    const { container } = renderRowCard({ row: makeFootnoteRow() });
    const shell = container.firstChild;
    const expectedBgColor = alpha(theme.palette.kind.foot, TINT_ALPHA);

    expect(shell).toHaveStyle({ backgroundColor: expectedBgColor });
  });

  it("applies text.primary tint at 0.02 alpha for INNER_LADDER_MARKER", () => {
    const { container } = renderRowCard({ row: makeInnerLadderMarkerRow() });
    const shell = container.firstChild;
    const expectedBgColor = alpha(theme.palette.text.primary, LADDER_TINT_ALPHA);

    expect(shell).toHaveStyle({ backgroundColor: expectedBgColor });
  });

  it("applies no kind tint for EXERCISE rows (empty backgroundColor inline)", () => {
    const { container } = renderRowCard();
    const shell = container.firstChild;

    if (!(shell instanceof HTMLElement)) {
      throw new Error("expected row shell to be an HTMLElement");
    }

    expect(shell.style.backgroundColor).toBe("");
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

  it("does not open the RowEditorModal when useUpdateSchemaRow is pending (QA-C7-01)", () => {
    updateSchemaRowState.isPending = true;

    const { container } = renderRowCard();
    const shell = container.firstChild;

    if (!(shell instanceof HTMLElement)) {
      throw new Error("expected row shell to be an HTMLElement");
    }

    fireEvent.doubleClick(shell);

    expect(screen.queryByTestId("row-editor-modal-mock")).toBeNull();
  });

  it("does not open the RowEditorModal when useDeleteSchemaRow is pending (QA-C7-01)", () => {
    deleteSchemaRowState.isPending = true;

    const { container } = renderRowCard();
    const shell = container.firstChild;

    if (!(shell instanceof HTMLElement)) {
      throw new Error("expected row shell to be an HTMLElement");
    }

    fireEvent.doubleClick(shell);

    expect(screen.queryByTestId("row-editor-modal-mock")).toBeNull();
  });

  it("stops propagation so parent shells do not open additional editors (QA-C7-03, QA-Must-C7-1)", () => {
    const parentDoubleClick = vi.fn();

    render(
      <div data-testid="parent-shell" onDoubleClick={parentDoubleClick}>
        <SchemaRowCard
          row={makeExerciseRow()}
          planId={PLAN_ID}
          startDate={START_DATE}
          exerciseById={exerciseById}
          index={0}
          isReorderPending={false}
        />
      </div>,
    );

    const parentShell = screen.getByTestId("parent-shell");
    const rowShell = parentShell.firstChild;

    if (!(rowShell instanceof HTMLElement)) {
      throw new Error("expected row shell to be an HTMLElement");
    }

    fireEvent.doubleClick(rowShell);

    expect(screen.getByTestId("row-editor-modal-mock")).toBeInTheDocument();
    expect(parentDoubleClick).not.toHaveBeenCalled();
  });

  it("does not open the RowEditorModal when double-click originates inside a descendant button (QA-Must-C7-12)", () => {
    renderRowCard();

    expect(screen.queryByTestId("row-editor-modal-mock")).toBeNull();

    fireEvent.doubleClick(screen.getByRole("button", { name: DRAG_LABEL }));

    expect(screen.queryByTestId("row-editor-modal-mock")).toBeNull();
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

  it("disables drag handle and kebab when isReorderPending is true (QA-004)", () => {
    renderRowCard({ isReorderPending: true });

    expect(screen.getByRole("button", { name: DRAG_LABEL })).toBeDisabled();
    expect(screen.getByRole("button", { name: KEBAB_LABEL })).toBeDisabled();
  });
});
