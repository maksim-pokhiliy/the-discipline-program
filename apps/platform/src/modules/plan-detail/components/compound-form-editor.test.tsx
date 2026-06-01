import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import type { Load, PerLimbDistribution, RepNotation } from "@repo/contracts/lms/_shared";
import type { Exercise } from "@repo/contracts/lms/exercise";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import type { CompoundFormDraft, CompoundRowElementDraft } from "./exercise-form-draft.types";

const exercisesState: { data: Exercise[]; isLoading: boolean } = { data: [], isLoading: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useExercises: () => ({ data: exercisesState.data, isLoading: exercisesState.isLoading }),
  };
});

const { CompoundFormEditor } = await import("./compound-form-editor");

const EXERCISE_ID_A = "ckxw5p7gp0000q1mnzv5cuq01";
const EXERCISE_ID_B = "ckxw5p7gp0000q1mnzv5cuq02";
const SEED_REPS: RepNotation = { kind: "count", value: 5 };
const NEW_ELEMENT_REPS: RepNotation = { kind: "count", value: 10 };
const SEED_SHARED_LOAD: Load = { kind: "absolute", weight: { variant: "dual", valueKg: 15 } };
const SEED_SIDE: PerLimbDistribution = { kind: "each_arm", countPerLimb: 8 };

const makeElement = (exerciseId: string): CompoundRowElementDraft => ({
  exerciseId,
  reps: SEED_REPS,
});

const makeCompound = (overrides: Partial<CompoundFormDraft> = {}): CompoundFormDraft => ({
  elements: [makeElement(EXERCISE_ID_A), makeElement(EXERCISE_ID_B)],
  ...overrides,
});

const onChange: Mock = vi.fn();

const lastCallArg = (): CompoundFormDraft => {
  const call = onChange.mock.calls.at(-1);

  if (call === undefined) {
    throw new Error("onChange was not called");
  }

  return call[0] as CompoundFormDraft;
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

describe("CompoundFormEditor add/remove", () => {
  it("appends a count-10 element with a null exercise id when add element is clicked", () => {
    render(<CompoundFormEditor value={makeCompound()} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "add element" }));

    expect(lastCallArg().elements).toHaveLength(3);
    expect(lastCallArg().elements[2]).toEqual({ exerciseId: null, reps: NEW_ELEMENT_REPS });
  });

  it("disables the element remove control with exactly the minimum two elements", () => {
    render(<CompoundFormEditor value={makeCompound()} onChange={onChange} />);

    for (const removeButton of screen.getAllByRole("button", { name: "Remove" })) {
      expect(removeButton).toBeDisabled();
    }
  });

  it("enables the element remove control with three elements", () => {
    const value = makeCompound({
      elements: [
        makeElement(EXERCISE_ID_A),
        makeElement(EXERCISE_ID_B),
        makeElement(EXERCISE_ID_A),
      ],
    });

    render(<CompoundFormEditor value={value} onChange={onChange} />);

    for (const removeButton of screen.getAllByRole("button", { name: "Remove" })) {
      expect(removeButton).toBeEnabled();
    }
  });
});

describe("CompoundFormEditor shared load (#113 round-trip)", () => {
  it("mounts the shared load editor when a seeded sharedModifiers.load is present", () => {
    const value = makeCompound({ sharedModifiers: { load: SEED_SHARED_LOAD } });

    render(<CompoundFormEditor value={value} onChange={onChange} />);

    expect(screen.getByRole("group", { name: "load kind" })).toBeInTheDocument();
  });

  it("preserves the seeded sharedModifiers.load when an unrelated element is added (#113)", () => {
    const value = makeCompound({ sharedModifiers: { load: SEED_SHARED_LOAD } });

    render(<CompoundFormEditor value={value} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "add element" }));

    expect(lastCallArg().sharedModifiers).toEqual({ load: SEED_SHARED_LOAD });
  });
});

describe("CompoundFormEditor shared modifiers omit-when-empty (D-04)", () => {
  it("emits no sharedModifiers key when the shared load is removed and tempo is empty", () => {
    const value = makeCompound({ sharedModifiers: { load: SEED_SHARED_LOAD } });

    render(<CompoundFormEditor value={value} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "remove" }));

    expect(lastCallArg()).not.toHaveProperty("sharedModifiers");
  });

  it("adds a default shared load via the add load affordance when none is set", () => {
    const value = makeCompound({
      elements: [
        { exerciseId: EXERCISE_ID_A, reps: SEED_REPS, load: SEED_SHARED_LOAD },
        { exerciseId: EXERCISE_ID_B, reps: SEED_REPS, load: SEED_SHARED_LOAD },
      ],
    });

    render(<CompoundFormEditor value={value} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "add load" }));

    expect(lastCallArg().sharedModifiers?.load).toBeDefined();
  });
});

describe("CompoundFormEditor element optional keys (#113 co-present)", () => {
  it("drops the element load but keeps the side when the load is removed", () => {
    const value = makeCompound({
      elements: [
        { exerciseId: EXERCISE_ID_A, reps: SEED_REPS, load: SEED_SHARED_LOAD, side: SEED_SIDE },
        makeElement(EXERCISE_ID_B),
      ],
    });

    render(<CompoundFormEditor value={value} onChange={onChange} />);

    fireEvent.click(nth(screen.getAllByRole("button", { name: "remove" }), 0));

    expect(lastCallArg().elements[0]).toEqual({
      exerciseId: EXERCISE_ID_A,
      reps: SEED_REPS,
      side: SEED_SIDE,
    });
  });

  it("drops the element side but keeps the load when the side is set to none", () => {
    const value = makeCompound({
      elements: [
        { exerciseId: EXERCISE_ID_A, reps: SEED_REPS, load: SEED_SHARED_LOAD, side: SEED_SIDE },
        makeElement(EXERCISE_ID_B),
      ],
    });

    render(<CompoundFormEditor value={value} onChange={onChange} />);

    const firstCard = nth(screen.getAllByRole("group", { name: "side distribution" }), 0);

    fireEvent.click(within(firstCard).getByRole("button", { name: "—" }));

    expect(lastCallArg().elements[0]).toEqual({
      exerciseId: EXERCISE_ID_A,
      reps: SEED_REPS,
      load: SEED_SHARED_LOAD,
    });
  });
});

describe("CompoundFormEditor error surfacing (#115)", () => {
  it("renders the array-root message when fewer than two elements is reported", () => {
    render(
      <CompoundFormEditor
        value={makeCompound()}
        onChange={onChange}
        error={{ elements: { root: { type: "too_small", message: "Need at least 2" } } }}
      />,
    );

    expect(screen.getByText("Need at least 2")).toBeInTheDocument();
  });

  it("flags the element picker in error when its exercise id is missing", () => {
    render(
      <CompoundFormEditor
        value={makeCompound()}
        onChange={onChange}
        error={{ elements: { 0: { exerciseId: { type: "invalid_type", message: "Required" } } } }}
      />,
    );

    expect(screen.getByText("Pick an exercise")).toBeInTheDocument();
  });
});
