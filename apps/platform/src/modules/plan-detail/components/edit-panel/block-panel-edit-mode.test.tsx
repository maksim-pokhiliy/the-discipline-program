import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { type BlockType } from "@repo/contracts/lms/block-type";
import { type Exercise } from "@repo/contracts/lms/exercise";
import { type PlanBlock } from "@repo/contracts/lms/plan-block";
import { type PlanItem } from "@repo/contracts/lms/plan-item";
import { type SchemeType } from "@repo/contracts/lms/scheme-type";

const itemsQueryState = {
  data: undefined as { items: PlanItem[] } | undefined,
};

vi.mock("@app/lib/hooks", () => ({
  useItemsByBlock: () => ({
    data: itemsQueryState.data,
  }),
  useCreatePlanBlock: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdatePlanBlock: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeletePlanBlock: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

const { BlockPanelEditMode } = await import("./block-panel-edit-mode");

const NOW = new Date("2026-05-08T00:00:00.000Z");

const PLAN_ID = "ckxplanid000000000000000001";
const SESSION_ID = "ckxsessionid00000000000001";
const BLOCK_ID = "ckxblockid000000000000001";
const SCHEME_NONE_ID = "ckxschemenone000000000001";
const BLOCK_TYPE_A_ID = "ckxbtypeid00000000000001";
const EXERCISE_ID = "ckxexerciseid00000000001";

const makeSchemeType = (): SchemeType => ({
  id: SCHEME_NONE_ID,
  name: "None",
  archetypeKind: "NONE",
  createdAt: NOW,
  updatedAt: NOW,
});

const makeBlockType = (): BlockType => ({
  id: BLOCK_TYPE_A_ID,
  name: "Strength",
  description: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const makeExercise = (): Exercise => ({
  id: EXERCISE_ID,
  name: "Back Squat",
  urls: [],
  primaryMovement: "SQUAT",
  benchmarkPrKind: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const makeBlock = (): PlanBlock => ({
  id: BLOCK_ID,
  sessionId: SESSION_ID,
  order: 0,
  schemeTypeId: SCHEME_NONE_ID,
  blockTypeIds: [BLOCK_TYPE_A_ID],
  schemeParams: { kind: "NONE" },
  modifiers: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const lookups = {
  schemeTypes: new Map([[SCHEME_NONE_ID, makeSchemeType()]]),
  blockTypes: new Map([[BLOCK_TYPE_A_ID, makeBlockType()]]),
  exercises: new Map([[EXERCISE_ID, makeExercise()]]),
};

const renderEditMode = () =>
  render(
    <BlockPanelEditMode
      planId={PLAN_ID}
      sessionId={SESSION_ID}
      blockId={BLOCK_ID}
      existingBlock={makeBlock()}
      existingBlocks={[makeBlock()]}
      lookups={lookups}
      onClose={vi.fn()}
      onStatusChange={vi.fn()}
    />,
  );

describe("BlockPanelEditMode", () => {
  afterEach(() => {
    itemsQueryState.data = undefined;
    vi.clearAllMocks();
  });

  it("renders a loading state and does NOT mount the BlockEditPanel while items are loading", () => {
    itemsQueryState.data = undefined;

    renderEditMode();

    expect(screen.getByText(/Loading block items/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Edit block/ })).not.toBeInTheDocument();
  });

  it("renders BlockEditPanel once items have loaded", () => {
    itemsQueryState.data = { items: [] };

    renderEditMode();

    expect(screen.queryByText(/Loading block items/)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Edit block" })).toBeInTheDocument();
  });
});
