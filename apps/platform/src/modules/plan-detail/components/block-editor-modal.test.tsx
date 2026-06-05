import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Block } from "@repo/contracts/lms/block";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const updateBlockMutate = vi.fn();
const updateBlockState = { isPending: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useUpdateBlock: () => ({
      mutate: updateBlockMutate,
      isPending: updateBlockState.isPending,
    }),
  };
});

const { BlockEditorModal } = await import("./block-editor-modal");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2025-01-06";
const NOW = new Date("2025-01-01T00:00:00.000Z");
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const SESSION_ID = "clp9z8x7w0000abcd1234ses1";

const makeBlock = (overrides: Partial<Block> = {}): Block => ({
  id: BLOCK_ID,
  sessionId: SESSION_ID,
  order: 1,
  intensity: null,
  timeCap: null,
  notes: null,
  labels: [],
  schemas: [],
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const renderModal = (block: Block = makeBlock()) =>
  render(
    <BlockEditorModal
      open={true}
      onClose={vi.fn()}
      block={block}
      planId={PLAN_ID}
      startDate={START_DATE}
    />,
  );

const submit = () => {
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
};

const NOTES_PLACEHOLDER = 'e.g. "Build to a heavy 5. Slow ascent, no missed reps."';

const getNotesInput = (): HTMLTextAreaElement => {
  const el = screen.getByPlaceholderText(NOTES_PLACEHOLDER);

  if (!(el instanceof HTMLTextAreaElement)) {
    throw new Error("expected a textarea for Block notes");
  }

  return el;
};

afterEach(() => {
  updateBlockState.isPending = false;
  updateBlockMutate.mockReset();
});

describe("BlockEditorModal chrome", () => {
  it("renders the 'Edit block' title and the cascade subtitle", () => {
    renderModal();

    expect(screen.getByText("Edit block")).toBeInTheDocument();
    expect(
      screen.getByText("intensity + cap cascade to all schemas in this block"),
    ).toBeInTheDocument();
  });

  it("renders the three FormSection labels", () => {
    renderModal();

    expect(screen.getByText("Intensity — any combination of axes")).toBeInTheDocument();
    expect(screen.getByText("Time cap")).toBeInTheDocument();
    expect(screen.getByText("Block notes")).toBeInTheDocument();
  });

  it("exposes the notes textarea by its accessible name", () => {
    renderModal();

    expect(screen.getByRole("textbox", { name: "Block notes" })).toBeInTheDocument();
  });
});

describe("BlockEditorModal submit payload", () => {
  it("serializes intensity, timeCap and notes when an axis is set (QA-8 set path)", async () => {
    renderModal(makeBlock({ intensity: { rpe: { value: 8 } }, timeCap: { min: 12, unit: "min" } }));

    submit();

    await waitFor(() => {
      expect(updateBlockMutate).toHaveBeenCalledTimes(1);
    });
    expect(updateBlockMutate.mock.calls[0]?.[0]).toEqual({
      blockId: BLOCK_ID,
      data: { intensity: { rpe: { value: 8 } }, timeCap: { min: 12, unit: "min" }, notes: null },
    });
  });

  it("serializes intensity to null when no axis is set (QA-8 all-off)", async () => {
    renderModal(makeBlock());

    submit();

    await waitFor(() => {
      expect(updateBlockMutate).toHaveBeenCalledTimes(1);
    });
    expect(updateBlockMutate.mock.calls[0]?.[0]).toEqual({
      blockId: BLOCK_ID,
      data: { intensity: null, timeCap: null, notes: null },
    });
  });

  it("normalizes whitespace-only notes to null (QA-9)", async () => {
    renderModal(makeBlock({ notes: "   " }));

    submit();

    await waitFor(() => {
      expect(updateBlockMutate).toHaveBeenCalledTimes(1);
    });
    expect(updateBlockMutate.mock.calls[0]?.[0]).toMatchObject({
      data: { notes: null },
    });
  });

  it("passes a non-empty notes string through unchanged", async () => {
    renderModal();

    fireEvent.change(getNotesInput(), { target: { value: "focus on bar path" } });
    submit();

    await waitFor(() => {
      expect(updateBlockMutate).toHaveBeenCalledTimes(1);
    });
    expect(updateBlockMutate.mock.calls[0]?.[0]).toMatchObject({
      data: { notes: "focus on bar path" },
    });
  });
});

describe("BlockEditorModal validation gate (QA-1 / QA-10)", () => {
  it("blocks submit and surfaces an error when notes exceed the max length", async () => {
    const overLongNotes = "x".repeat(2001);

    renderModal(makeBlock({ notes: overLongNotes }));

    submit();

    await waitFor(() => {
      expect(getNotesInput()).toBeInvalid();
    });
    expect(updateBlockMutate).not.toHaveBeenCalled();
  });

  it("accepts notes exactly at the max length", async () => {
    const maxNotes = "x".repeat(2000);

    renderModal(makeBlock({ notes: maxNotes }));

    submit();

    await waitFor(() => {
      expect(updateBlockMutate).toHaveBeenCalledTimes(1);
    });
    expect(updateBlockMutate.mock.calls[0]?.[0]).toMatchObject({
      data: { notes: maxNotes },
    });
  });
});

describe("BlockEditorModal pending state (QA-11 / QA-12)", () => {
  it("disables Save and Cancel while the update is pending", () => {
    updateBlockState.isPending = true;

    renderModal();

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});

describe("BlockEditorModal render smoke (QA-13)", () => {
  it("renders an empty block without crashing", () => {
    renderModal(makeBlock());

    expect(screen.getByText("Edit block")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("renders a fully-loaded block (all axes + range effort + cap range + long notes) without crashing", () => {
    renderModal(
      makeBlock({
        intensity: {
          effortPercent: { range: { min: 75, max: 85 } },
          rpe: { value: 8 },
          pace: "moderate",
          hrZone: { zone: "Z2" },
          numericPace: { value: "5:00", distanceUnit: "km", paceType: "min_per_distance" },
        },
        timeCap: { min: 12, max: 20, unit: "min" },
        notes: "x".repeat(500),
      }),
    );

    expect(screen.getByText("Edit block")).toBeInTheDocument();
    expect(screen.getByText("Effort %")).toBeInTheDocument();
    expect(screen.getByText("Numeric pace")).toBeInTheDocument();
  });
});
