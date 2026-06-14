import { useState } from "react";

import { fireEvent, type RenderResult, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "@app/test/render";

import { asNodeId } from "../lib/axis-draft-id";

import type { SchemaDraft } from "./axes/axis-draft.types";
import { CreateSchemaFlow } from "./create-schema-flow";

const REPETITION_GROUP = "repetition";
const ANOTHER_LADDER = "another ladder";
const FIRST_LADDER_STEPS = [21, 15, 9];
const EDITED_LADDER_STEPS = [20, 15, 9];
const STEPS_PER_DEFAULT_LADDER = 3;

const SWITCH_CONFIRM = "Switch & discard";
const SWITCH_CANCEL = "Keep editing";

const NON_LADDER_TILE_LABELS = ["Once", "Count", "Time cap", "EMOM", "Interval"];

const draftRef: { current: SchemaDraft | undefined } = { current: undefined };

const freshDraft = (): SchemaDraft => ({
  id: asNodeId("draft-fresh"),
  header: null,
  notes: null,
  rows: [],
});

const flatLadderDraft = (steps: number[] = FIRST_LADDER_STEPS): SchemaDraft => ({
  id: asNodeId("draft-flat"),
  header: null,
  notes: null,
  repetition: { kind: "ladder", steps },
  rows: [],
});

const dirtyLadderDraft = (): SchemaDraft => flatLadderDraft(EDITED_LADDER_STEPS);

const StatefulFlow: React.FC<{ seed: SchemaDraft }> = ({ seed }) => {
  const [draft, setDraft] = useState<SchemaDraft>(seed);

  draftRef.current = draft;

  return (
    <CreateSchemaFlow
      draft={draft}
      onDraftChange={(next) => {
        draftRef.current = next;
        setDraft(next);
      }}
      onUpdateNode={(id, patch) =>
        setDraft((prev) => {
          if (prev.id !== id) {
            return prev;
          }

          const next = patch(prev);

          draftRef.current = next;

          return next;
        })
      }
      onRename={(id, header) =>
        setDraft((prev) => {
          if (prev.id !== id) {
            return prev;
          }

          const next: SchemaDraft = { ...prev, header: header === "" ? null : header };

          draftRef.current = next;

          return next;
        })
      }
    />
  );
};

const renderFlow = (seed: SchemaDraft): RenderResult => {
  draftRef.current = seed;

  return render(<StatefulFlow seed={seed} />);
};

const repetitionGroups = (): HTMLElement[] =>
  screen.getAllByRole("group", { name: REPETITION_GROUP });

const repetitionGroup = (): HTMLElement => screen.getByRole("group", { name: REPETITION_GROUP });

const pressedTiles = (): HTMLElement[] =>
  within(repetitionGroup()).getAllByRole("button", { pressed: true });

const pressedTileName = (): string | null => {
  const [pressed] = pressedTiles();

  return pressed?.textContent ?? null;
};

const clickTile = (label: string): void => {
  fireEvent.click(within(repetitionGroup()).getByText(label));
};

const switchConfirmButton = (): HTMLElement | null =>
  screen.queryByRole("button", { name: SWITCH_CONFIRM });

const confirmSwitch = (): void => {
  fireEvent.click(screen.getByRole("button", { name: SWITCH_CONFIRM }));
};

const cancelSwitch = (): void => {
  fireEvent.click(screen.getByRole("button", { name: SWITCH_CANCEL }));
};

const anotherLadderButton = (): HTMLElement | null =>
  screen.queryByRole("button", { name: ANOTHER_LADDER });

const stepperCells = (): HTMLElement[] => screen.getAllByRole("spinbutton");

const stepperCount = (): number => screen.queryAllByRole("spinbutton").length;

const editStepCell = (cellIndex: number, value: string): void => {
  const cell = stepperCells()[cellIndex];

  if (cell === undefined) {
    throw new Error(`step cell ${cellIndex} not found`);
  }

  fireEvent.change(cell, { target: { value } });
};

const ladderSteps = (seed: SchemaDraft): number[] =>
  seed.repetition?.kind === "ladder" ? seed.repetition.steps : [];

const currentSeed = (): SchemaDraft => {
  const draft = draftRef.current;

  if (draft === undefined) {
    throw new Error("draft not initialised");
  }

  return draft;
};

const expectSingleGridAndPress = (): void => {
  expect(repetitionGroups()).toHaveLength(1);
  expect(pressedTiles()).toHaveLength(1);
};

describe("CreateSchemaFlow single-ladder authoring (DR-W4E-SG-WRAP)", () => {
  it("renders exactly one ladder stepper with Ladder active and no another-ladder affordance", () => {
    renderFlow(freshDraft());

    clickTile("Ladder");

    expect(pressedTileName()).toBe("Ladder");
    expect(stepperCount()).toBe(STEPS_PER_DEFAULT_LADDER);
    expect(anotherLadderButton()).toBeNull();
  });

  it("patches the single ladder steps from the rendered cell", () => {
    renderFlow(flatLadderDraft());

    editStepCell(0, "18");

    expect(ladderSteps(currentSeed())).toEqual([18, 15, 9]);
  });

  it("hides the another-ladder control for every non-ladder pattern", () => {
    renderFlow(freshDraft());

    for (const label of NON_LADDER_TILE_LABELS) {
      clickTile(label);

      expect(anotherLadderButton()).toBeNull();
    }
  });
});

describe("CreateSchemaFlow kind-switch off a dirty single ladder (QA-004)", () => {
  it("defers the switch and keeps the edited ladder until the coach confirms", () => {
    renderFlow(dirtyLadderDraft());

    clickTile("Count");

    expect(ladderSteps(currentSeed())).toEqual(EDITED_LADDER_STEPS);
    expect(switchConfirmButton()).toBeInTheDocument();

    confirmSwitch();

    expect(currentSeed().repetition).toEqual({ kind: "count", count: 3 });
  });

  it("keeps the edited single ladder when the switch is cancelled", () => {
    renderFlow(dirtyLadderDraft());

    clickTile("Count");
    cancelSwitch();

    expect(currentSeed().repetition).toEqual({ kind: "ladder", steps: EDITED_LADDER_STEPS });
  });

  it("shows exactly one confirm for a single-schema switch (no double-prompt)", () => {
    renderFlow(dirtyLadderDraft());

    clickTile("Count");

    expect(screen.getAllByRole("button", { name: SWITCH_CONFIRM })).toHaveLength(1);
  });

  it("switches without a prompt when the single ladder is still at its defaults", () => {
    renderFlow(flatLadderDraft());

    clickTile("Count");

    expect(switchConfirmButton()).toBeNull();
    expect(currentSeed().repetition).toEqual({ kind: "count", count: 3 });
  });
});

describe("CreateSchemaFlow tile-group a11y invariant (Must-Test #12)", () => {
  it("keeps exactly one tile group and one pressed tile in every reachable state", () => {
    renderFlow(freshDraft());

    expectSingleGridAndPress();

    clickTile("Ladder");
    expectSingleGridAndPress();

    clickTile("Count");
    expectSingleGridAndPress();
  });
});
