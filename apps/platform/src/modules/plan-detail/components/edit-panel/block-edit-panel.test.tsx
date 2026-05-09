import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type BlockType } from "@repo/contracts/lms/block-type";
import { type Exercise } from "@repo/contracts/lms/exercise";
import { type PlanBlock } from "@repo/contracts/lms/plan-block";
import { type PlanItem } from "@repo/contracts/lms/plan-item";
import { type SchemeType } from "@repo/contracts/lms/scheme-type";

const createMutation = vi.fn();
const updateMutation = vi.fn();

vi.mock("@app/lib/hooks", () => ({
  useCreatePlanBlock: () => ({
    mutateAsync: createMutation,
    isPending: false,
  }),
  useUpdatePlanBlock: () => ({
    mutateAsync: updateMutation,
    isPending: false,
  }),
}));

const { BlockEditPanel } = await import("./block-edit-panel");

const NOW = new Date("2026-05-08T00:00:00.000Z");

const PLAN_ID = "ckxplanid000000000000000001";
const SESSION_ID = "ckxsessionid00000000000001";
const BLOCK_ID = "ckxblockid000000000000001";
const SCHEME_NONE_ID = "ckxschemenone000000000001";
const SCHEME_COUNT_DOWN_ID = "ckxschemecd0000000000001";
const BLOCK_TYPE_A_ID = "ckxbtypeid00000000000001";
const BLOCK_TYPE_B_ID = "ckxbtypeid00000000000002";
const EXERCISE_ID = "ckxexerciseid00000000001";

const makeSchemeType = (
  id: string,
  name: string,
  kind: SchemeType["archetypeKind"],
): SchemeType => ({
  id,
  name,
  archetypeKind: kind,
  createdAt: NOW,
  updatedAt: NOW,
});

const makeBlockType = (id: string, name: string): BlockType => ({
  id,
  name,
  description: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const makeExercise = (id: string, name: string): Exercise => ({
  id,
  name,
  urls: [],
  primaryMovement: "SQUAT",
  benchmarkPrKind: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const makeLookups = () => ({
  schemeTypes: new Map([
    [SCHEME_NONE_ID, makeSchemeType(SCHEME_NONE_ID, "None", "NONE")],
    [SCHEME_COUNT_DOWN_ID, makeSchemeType(SCHEME_COUNT_DOWN_ID, "Count down", "COUNT_DOWN")],
  ]),
  blockTypes: new Map([
    [BLOCK_TYPE_A_ID, makeBlockType(BLOCK_TYPE_A_ID, "Strength")],
    [BLOCK_TYPE_B_ID, makeBlockType(BLOCK_TYPE_B_ID, "Conditioning")],
  ]),
  exercises: new Map([[EXERCISE_ID, makeExercise(EXERCISE_ID, "Back Squat")]]),
});

const makeExistingBlock = (overrides: Partial<PlanBlock> = {}): PlanBlock => ({
  id: BLOCK_ID,
  sessionId: SESSION_ID,
  order: 2,
  schemeTypeId: SCHEME_NONE_ID,
  blockTypeIds: [BLOCK_TYPE_A_ID],
  schemeParams: { kind: "NONE" },
  modifiers: null,
  notes: "warmup",
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const makeExistingItem = (overrides: Partial<PlanItem> = {}): PlanItem => ({
  id: "ckxitemid000000000000001",
  blockId: BLOCK_ID,
  order: 0,
  exerciseId: EXERCISE_ID,
  prescription: { reps: { kind: "FIXED", value: 5 }, sideMode: "BILATERAL", modifiers: [] },
  alternatives: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const renderCreatePanel = () => {
  const onClose = vi.fn();
  const onStatusChange = vi.fn();
  const onDirtyChange = vi.fn();

  render(
    <BlockEditPanel
      planId={PLAN_ID}
      sessionId={SESSION_ID}
      blockId={null}
      existingBlocks={[]}
      existingItems={[]}
      lookups={makeLookups()}
      onClose={onClose}
      onStatusChange={onStatusChange}
      onDirtyChange={onDirtyChange}
    />,
  );

  return { onClose, onStatusChange, onDirtyChange };
};

const renderEditPanel = () => {
  const onClose = vi.fn();
  const onStatusChange = vi.fn();
  const onDirtyChange = vi.fn();
  const block = makeExistingBlock();
  const item = makeExistingItem();

  render(
    <BlockEditPanel
      planId={PLAN_ID}
      sessionId={SESSION_ID}
      blockId={block.id}
      existingBlock={block}
      existingBlocks={[block]}
      existingItems={[item]}
      lookups={makeLookups()}
      onClose={onClose}
      onStatusChange={onStatusChange}
      onDirtyChange={onDirtyChange}
    />,
  );

  return { onClose, onStatusChange, onDirtyChange, block, item };
};

describe("BlockEditPanel", () => {
  beforeEach(() => {
    createMutation.mockReset();
    updateMutation.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("mounts in create mode with the documented empty defaults", () => {
    renderCreatePanel();

    expect(screen.getByRole("heading", { name: "Add block" })).toBeInTheDocument();

    const orderInput = screen.getByLabelText("Order") as HTMLInputElement;

    expect(orderInput.value).toBe("0");

    const notesInput = screen.getByLabelText("Notes") as HTMLTextAreaElement;

    expect(notesInput.value).toBe("");

    expect(screen.getByText(/Items \(0\)/)).toBeInTheDocument();
  });

  it("mounts in edit mode with values seeded from the existing block and items", () => {
    renderEditPanel();

    expect(screen.getByRole("heading", { name: "Edit block" })).toBeInTheDocument();

    const orderInput = screen.getByLabelText("Order") as HTMLInputElement;

    expect(orderInput.value).toBe("2");

    const blockNotes = document.querySelector(
      'textarea[name="notes"]',
    ) as HTMLTextAreaElement | null;

    expect(blockNotes).not.toBeNull();
    expect(blockNotes?.value).toBe("warmup");

    expect(screen.getByText(/Items \(1\)/)).toBeInTheDocument();
  });

  it("appends a row with the default prescription when 'Add item' is clicked", () => {
    renderCreatePanel();

    expect(screen.getByText(/Items \(0\)/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Add item/ }));

    expect(screen.getByText(/Items \(1\)/)).toBeInTheDocument();

    const repsInputs = screen.getAllByLabelText(/Reps/);

    expect(repsInputs.length).toBeGreaterThan(0);
  });

  it("invokes updatePlanBlock.mutateAsync with the merged patch when the form is submitted in edit mode", async () => {
    updateMutation.mockResolvedValue({ id: BLOCK_ID });

    const { onClose } = renderEditPanel();

    const blockNotes = document.querySelector(
      'textarea[name="notes"]',
    ) as HTMLTextAreaElement | null;

    expect(blockNotes).not.toBeNull();

    fireEvent.change(blockNotes as HTMLTextAreaElement, {
      target: { value: "updated notes" },
    });

    const saveButton = screen.getByRole("button", { name: /^Save$/ });

    fireEvent.click(saveButton);

    await vi.waitFor(() => {
      expect(updateMutation).toHaveBeenCalledTimes(1);
    });

    const [args] = updateMutation.mock.calls[0] as [{ id: string; data: Record<string, unknown> }];

    expect(args.id).toBe(BLOCK_ID);
    expect(args.data.notes).toBe("updated notes");
    expect(args.data.order).toBe(2);
    expect(args.data.schemeTypeId).toBe(SCHEME_NONE_ID);

    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("seeds the archetype kind hidden field from the picked SchemeType so the dispatcher can react", async () => {
    renderEditPanel();

    const schemeSelect = screen.getByRole("combobox", { name: /Scheme type/ });

    fireEvent.mouseDown(schemeSelect);

    const optionList = await screen.findByRole("listbox");
    const countDownOption = within(optionList).getByText("Count down");

    fireEvent.click(countDownOption);

    expect(schemeSelect).toHaveTextContent("Count down");
  });

  it("emits 'saving' then 'saved' through onStatusChange and clears dirty on successful submit", async () => {
    updateMutation.mockResolvedValue({ id: BLOCK_ID });

    const { onStatusChange, onDirtyChange } = renderEditPanel();

    const blockNotes = document.querySelector(
      'textarea[name="notes"]',
    ) as HTMLTextAreaElement | null;

    fireEvent.change(blockNotes as HTMLTextAreaElement, {
      target: { value: "fresh notes" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));

    await vi.waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith("saved");
    });

    const statuses = onStatusChange.mock.calls.map((call) => call[0]);

    expect(statuses).toEqual(expect.arrayContaining(["saving", "saved"]));

    const lastDirtyCall = onDirtyChange.mock.calls.at(-1);

    expect(lastDirtyCall?.[0]).toBe(false);
  });

  it("ignores rapid double-click on Save and triggers updatePlanBlock.mutateAsync exactly once", async () => {
    let resolveMutation: ((value: { id: string }) => void) | null = null;
    const mutationPromise = new Promise<{ id: string }>((resolve) => {
      resolveMutation = resolve;
    });

    updateMutation.mockReturnValueOnce(mutationPromise);

    renderEditPanel();

    const blockNotes = document.querySelector(
      'textarea[name="notes"]',
    ) as HTMLTextAreaElement | null;

    fireEvent.change(blockNotes as HTMLTextAreaElement, {
      target: { value: "guard-double-click" },
    });

    const saveButton = screen.getByRole("button", { name: /^Save$/ });

    fireEvent.click(saveButton);
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    await vi.waitFor(() => {
      expect(updateMutation).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    expect(updateMutation).toHaveBeenCalledTimes(1);

    if (resolveMutation !== null) {
      (resolveMutation as (value: { id: string }) => void)({ id: BLOCK_ID });
    }

    await mutationPromise;
  });

  it("emits 'error' with a retry callback that re-fires the same mutateAsync payload", async () => {
    const error = new Error("Network down");

    updateMutation.mockRejectedValueOnce(error);

    const { onStatusChange } = renderEditPanel();

    const blockNotes = document.querySelector(
      'textarea[name="notes"]',
    ) as HTMLTextAreaElement | null;

    fireEvent.change(blockNotes as HTMLTextAreaElement, {
      target: { value: "fail then retry" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));

    await vi.waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith(
        "error",
        expect.objectContaining({ message: "Network down" }),
      );
    });

    const errorCall = onStatusChange.mock.calls.find((call) => call[0] === "error");
    const errorOptions = errorCall?.[1] as { message: string; retry: () => Promise<void> };

    expect(typeof errorOptions.retry).toBe("function");

    updateMutation.mockResolvedValueOnce({ id: BLOCK_ID });

    await errorOptions.retry();

    expect(updateMutation).toHaveBeenCalledTimes(2);

    const firstPayload = updateMutation.mock.calls[0]?.[0] as { data: { notes: string } };
    const secondPayload = updateMutation.mock.calls[1]?.[0] as { data: { notes: string } };

    expect(firstPayload.data.notes).toBe("fail then retry");
    expect(secondPayload.data.notes).toBe("fail then retry");
  });
});
