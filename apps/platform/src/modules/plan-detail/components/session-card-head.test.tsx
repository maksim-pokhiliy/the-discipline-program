import type { DraggableAttributes } from "@dnd-kit/core";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { SessionWithLabel } from "@repo/contracts/lms/day";

import {
  LabelOptionsContext,
  type LabelOptionsContextValue,
} from "@app/lib/contexts/label-options-provider";
import { render } from "@app/test/render";

import { SessionCardHead } from "./session-card-head";

const NOW = new Date("2026-01-06T00:00:00.000Z");
const SESSION_ID = "clp9z8x7w0000abcd1234ses1";
const DAY_ID = "clp9z8x7w0000abcd1234day1";
const DUPLICATE_LABEL = "Duplicate session";
const DELETE_LABEL = "Delete session";

const DRAG_ATTRIBUTES: DraggableAttributes = {
  role: "button",
  tabIndex: 0,
  "aria-disabled": false,
  "aria-pressed": undefined,
  "aria-roledescription": "sortable",
  "aria-describedby": "drag-session",
};

const makeSession = (overrides: Partial<SessionWithLabel> = {}): SessionWithLabel => ({
  id: SESSION_ID,
  dayId: DAY_ID,
  order: 1,
  labelId: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  label: null,
  blocks: [],
  ...overrides,
});

type RenderOptions = {
  session?: SessionWithLabel;
  isExpanded?: boolean;
  isMutationPending?: boolean;
  onDuplicate?: () => void;
  onDeleteOpen?: () => void;
};

const renderHead = ({
  session = makeSession(),
  isExpanded = true,
  isMutationPending = false,
  onDuplicate = vi.fn(),
  onDeleteOpen = vi.fn(),
}: RenderOptions = {}) => {
  const ctxValue: LabelOptionsContextValue = {
    DAY: { options: [], isLoading: false },
    SESSION: { options: [], isLoading: false },
    BLOCK: { options: [], isLoading: false },
  };

  return render(
    <LabelOptionsContext.Provider value={ctxValue}>
      <SessionCardHead
        session={session}
        isExpanded={isExpanded}
        onToggleExpanded={vi.fn()}
        onLabelChange={vi.fn()}
        onNotesCommit={vi.fn()}
        onDeleteOpen={onDeleteOpen}
        onDuplicate={onDuplicate}
        dragAttributes={DRAG_ATTRIBUTES}
        dragListeners={undefined}
        isMutationPending={isMutationPending}
      />
    </LabelOptionsContext.Provider>,
  );
};

describe("SessionCardHead duplicate affordance (T4.3 / Must-Test #8)", () => {
  it("renders the Duplicate button before the Delete button", () => {
    renderHead();

    const duplicateBtn = screen.getByRole("button", { name: DUPLICATE_LABEL });
    const deleteBtn = screen.getByRole("button", { name: DELETE_LABEL });

    expect(
      duplicateBtn.compareDocumentPosition(deleteBtn) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
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
