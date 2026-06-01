import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import type { Load, RepNotation } from "@repo/contracts/lms/_shared";
import type { Exercise } from "@repo/contracts/lms/exercise";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import type { SandwichCompoundElementDraft, SandwichFormDraft } from "./exercise-form-draft.types";

const exercisesState: { data: Exercise[]; isLoading: boolean } = { data: [], isLoading: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useExercises: () => ({ data: exercisesState.data, isLoading: exercisesState.isLoading }),
  };
});

const { SandwichFormEditor } = await import("./sandwich-form-editor");

const OPENING_ID = "ckxw5p7gp0000q1mnzv5cuq01";
const MIDDLE_ID = "ckxw5p7gp0000q1mnzv5cuq02";
const CLOSING_ID = "ckxw5p7gp0000q1mnzv5cuq03";
const SLOT_REPS: RepNotation = { kind: "count", value: 8 };
const SEED_LOAD: Load = { kind: "absolute", weight: { variant: "dual", valueKg: 15 } };

const makeSlot = (exerciseId: string): SandwichCompoundElementDraft => ({
  exerciseId,
  reps: SLOT_REPS,
});

const makeSandwich = (overrides: Partial<SandwichFormDraft> = {}): SandwichFormDraft => ({
  opening: makeSlot(OPENING_ID),
  middle: makeSlot(MIDDLE_ID),
  closing: makeSlot(CLOSING_ID),
  ...overrides,
});

const onChange: Mock = vi.fn();

const lastCallArg = (): SandwichFormDraft => {
  const call = onChange.mock.calls.at(-1);

  if (call === undefined) {
    throw new Error("onChange was not called");
  }

  return call[0] as SandwichFormDraft;
};

const nth = <T,>(items: readonly T[], index: number): T => {
  const item = items[index];

  if (item === undefined) {
    throw new Error(`expected an item at index ${index}`);
  }

  return item;
};

afterEach(() => {
  exercisesState.data = [];
  exercisesState.isLoading = false;
  onChange.mockReset();
});

describe("SandwichFormEditor structure", () => {
  it("renders exactly the three fixed slot cards", () => {
    render(<SandwichFormEditor value={makeSandwich()} onChange={onChange} />);

    expect(screen.getByText("opening")).toBeInTheDocument();
    expect(screen.getByText("middle")).toBeInTheDocument();
    expect(screen.getByText("closing")).toBeInTheDocument();
  });

  it("never renders a side distribution control on a sandwich slot", () => {
    render(<SandwichFormEditor value={makeSandwich()} onChange={onChange} />);

    expect(screen.queryByRole("group", { name: "side distribution" })).toBeNull();
  });
});

describe("SandwichFormEditor error surfacing (#115)", () => {
  it("flags the middle slot picker in error when its exercise id is missing", () => {
    render(
      <SandwichFormEditor
        value={makeSandwich()}
        onChange={onChange}
        error={{ middle: { exerciseId: { type: "invalid_type", message: "Required" } } }}
      />,
    );

    expect(screen.getByText("Pick an exercise")).toBeInTheDocument();
  });

  it("renders the opening slot reps validation message", () => {
    render(
      <SandwichFormEditor
        value={makeSandwich()}
        onChange={onChange}
        error={{ opening: { reps: { root: { type: "custom", message: "bad reps range" } } } }}
      />,
    );

    expect(screen.getByText("bad reps range")).toBeInTheDocument();
  });
});

describe("SandwichFormEditor slot load toggle (D-03)", () => {
  it("reverts a slot to exerciseId and reps only when its load is removed", () => {
    const value = makeSandwich({
      opening: { exerciseId: OPENING_ID, reps: SLOT_REPS, load: SEED_LOAD },
    });

    render(<SandwichFormEditor value={value} onChange={onChange} />);

    fireEvent.click(nth(screen.getAllByRole("button", { name: "remove" }), 0));

    expect(lastCallArg().opening).toEqual({ exerciseId: OPENING_ID, reps: SLOT_REPS });
  });
});

describe("SandwichFormEditor shared modifiers omit-when-empty (D-04)", () => {
  it("emits no sharedModifiers key when the shared load is removed and tempo is empty", () => {
    const value = makeSandwich({ sharedModifiers: { load: SEED_LOAD } });

    render(<SandwichFormEditor value={value} onChange={onChange} />);

    const removeButtons = screen.getAllByRole("button", { name: "remove" });

    fireEvent.click(nth(removeButtons, removeButtons.length - 1));

    expect(lastCallArg()).not.toHaveProperty("sharedModifiers");
  });
});
