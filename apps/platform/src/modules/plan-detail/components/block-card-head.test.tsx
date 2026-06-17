import type { DraggableAttributes } from "@dnd-kit/core";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Block } from "@repo/contracts/lms/block";

import { render } from "@app/test/render";

import { BlockCardHead } from "./block-card-head";

const NOW = new Date("2026-01-06T00:00:00.000Z");
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const SESSION_ID = "clp9z8x7w0000abcd1234ses1";
const DUPLICATE_LABEL = "Duplicate block";
const DELETE_LABEL = "Delete block";
const INTENSITY_LABEL = "Edit block intensity";

const DRAG_ATTRIBUTES: DraggableAttributes = {
  role: "button",
  tabIndex: 0,
  "aria-disabled": false,
  "aria-pressed": undefined,
  "aria-roledescription": "sortable",
  "aria-describedby": "drag-block",
};

const makeBlock = (overrides: Partial<Block> = {}): Block => ({
  id: BLOCK_ID,
  sessionId: SESSION_ID,
  order: 1,
  intensity: null,
  notes: null,
  labels: [],
  schemas: [],
  groups: [],
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

type RenderOptions = {
  block?: Block;
  isExpanded?: boolean;
  isMutationPending?: boolean;
  onDuplicate?: () => void;
  onDeleteOpen?: () => void;
  onIntensityOpen?: () => void;
};

const renderHead = ({
  block = makeBlock(),
  isExpanded = true,
  isMutationPending = false,
  onDuplicate = vi.fn(),
  onDeleteOpen = vi.fn(),
  onIntensityOpen = vi.fn(),
}: RenderOptions = {}) =>
  render(
    <BlockCardHead
      block={block}
      labelOptions={[]}
      isLabelsLoading={false}
      isMutationPending={isMutationPending}
      isExpanded={isExpanded}
      onToggleExpanded={vi.fn()}
      dragAttributes={DRAG_ATTRIBUTES}
      dragListeners={undefined}
      onLabelsChange={vi.fn()}
      onDeleteOpen={onDeleteOpen}
      onDuplicate={onDuplicate}
      intensity={block.intensity}
      onIntensityOpen={onIntensityOpen}
    />,
  );

describe("BlockCardHead duplicate affordance (T4.3 / Must-Test #8)", () => {
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

describe("BlockCardHead intensity affordance (D-V2-INTENSITY-TRINITY block scope)", () => {
  it("renders the block's own intensity chip", () => {
    renderHead({ block: makeBlock({ intensity: { effortPercent: { value: 85 } } }) });

    expect(screen.getByText("EFFORT 85%")).toBeInTheDocument();
  });

  it("fires the threaded onIntensityOpen when the edit-intensity button is clicked", () => {
    const onIntensityOpen = vi.fn();

    renderHead({ onIntensityOpen });

    fireEvent.click(screen.getByRole("button", { name: INTENSITY_LABEL }));

    expect(onIntensityOpen).toHaveBeenCalledTimes(1);
  });
});
