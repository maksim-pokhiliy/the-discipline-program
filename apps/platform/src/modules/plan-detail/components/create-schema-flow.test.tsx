import { useState } from "react";

import { fireEvent, type RenderResult, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "@app/test/render";

import { asNodeId } from "../lib/axis-draft-id";

import type { DraftSeed } from "./axes/axis-draft.types";
import { CreateSchemaFlow } from "./create-schema-flow";

const REPETITION_GROUP = "repetition";
const ANOTHER_LADDER = "another ladder";
const FIRST_LADDER_STEPS = [21, 15, 9];
const EDITED_LADDER_STEPS = [20, 15, 9];
const STEPS_PER_DEFAULT_LADDER = 3;

const SWITCH_CONFIRM = "Switch & discard";
const SWITCH_CANCEL = "Keep editing";

const NON_LADDER_TILE_LABELS = ["Once", "Count", "Time cap", "EMOM", "Interval"];

const draftRef: { current: DraftSeed | undefined } = { current: undefined };
const linkRef: { current: boolean } = { current: true };

const freshDraft = (): DraftSeed => ({
  mode: "schema",
  schema: { id: asNodeId("draft-fresh"), header: null, notes: null, rows: [] },
});

const flatLadderDraft = (steps: number[] = FIRST_LADDER_STEPS): DraftSeed => ({
  mode: "schema",
  schema: {
    id: asNodeId("draft-flat"),
    header: null,
    notes: null,
    repetition: { kind: "ladder", steps },
    rows: [],
  },
});

const dirtyLadderDraft = (): DraftSeed => flatLadderDraft(EDITED_LADDER_STEPS);

const StatefulFlow: React.FC<{ seed: DraftSeed }> = ({ seed }) => {
  const [draft, setDraft] = useState<DraftSeed>(seed);
  const [linkIntoBox, setLinkIntoBox] = useState(true);

  draftRef.current = draft;
  linkRef.current = linkIntoBox;

  return (
    <CreateSchemaFlow
      draft={draft}
      onDraftChange={(next) => {
        draftRef.current = next;
        setDraft(next);
      }}
      onUpdateNode={(id, patch) =>
        setDraft((prev) => {
          if (prev.mode !== "schema" || prev.schema.id !== id) {
            return prev;
          }

          const next: DraftSeed = { mode: "schema", schema: patch(prev.schema) };

          draftRef.current = next;

          return next;
        })
      }
      onRename={(id, header) =>
        setDraft((prev) => {
          if (prev.mode !== "schema" || prev.schema.id !== id) {
            return prev;
          }

          const next: DraftSeed = {
            mode: "schema",
            schema: { ...prev.schema, header: header === "" ? null : header },
          };

          draftRef.current = next;

          return next;
        })
      }
      linkIntoBox={linkIntoBox}
      onLinkIntoBoxChange={(next) => {
        linkRef.current = next;
        setLinkIntoBox(next);
      }}
    />
  );
};

const renderFlow = (seed: DraftSeed): RenderResult => {
  draftRef.current = seed;
  linkRef.current = true;

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

const clickAnotherLadder = (): void => {
  fireEvent.click(screen.getByRole("button", { name: ANOTHER_LADDER }));
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

const trackCaptions = (): string[] =>
  screen
    .queryAllByText(/^LADDER \d+$/)
    .map((node) => node.textContent ?? "")
    .filter((text) => text.length > 0);

const removeTrackButtons = (): HTMLElement[] =>
  screen.queryAllByRole("button", { name: /^Remove ladder \d+$/ });

const currentSeed = (): DraftSeed => {
  const draft = draftRef.current;

  if (draft === undefined) {
    throw new Error("draft not initialised");
  }

  return draft;
};

const isParallelSeed = (seed: DraftSeed): boolean => seed.mode === "group";

const trackSteps = (seed: DraftSeed): number[][] =>
  seed.mode === "group" ? seed.group.tracks.map((track) => track.steps) : [];

const expectSingleGridAndPress = (): void => {
  expect(repetitionGroups()).toHaveLength(1);
  expect(pressedTiles()).toHaveLength(1);
};

const GROUP_CHECKBOX = /group into one box/i;

const groupCheckbox = (): HTMLElement | null =>
  screen.queryByRole("checkbox", { name: GROUP_CHECKBOX });

const toggleGroupCheckbox = (): void => {
  const checkbox = screen.getByRole("checkbox", { name: GROUP_CHECKBOX });

  fireEvent.click(checkbox);
};

const dividerCount = (container: HTMLElement): number =>
  container.querySelectorAll(".MuiDivider-root").length;

describe("CreateSchemaFlow materialize keeps the editor alive (Must-Test #1, catches QA-001)", () => {
  it("renders two ladder steppers with Ladder still active after tapping another ladder", () => {
    renderFlow(freshDraft());

    clickTile("Ladder");
    clickAnotherLadder();

    expect(pressedTileName()).toBe("Ladder");
    expect(trackCaptions()).toEqual(["LADDER 1", "LADDER 2"]);
    expect(stepperCount()).toBe(STEPS_PER_DEFAULT_LADDER * 2);
    expect(anotherLadderButton()).toBeInTheDocument();
  });
});

describe("CreateSchemaFlow track-2 editing after materialize (Must-Test #3)", () => {
  it("patches the second track's first step from the rendered cell", () => {
    renderFlow(flatLadderDraft());

    clickAnotherLadder();
    editStepCell(STEPS_PER_DEFAULT_LADDER, "12");

    expect(trackSteps(currentSeed())[1]).toEqual([12, 12, 9]);
  });
});

describe("CreateSchemaFlow another-ladder is gated to Ladder (Must-Test #4)", () => {
  it("hides the another-ladder control for every non-ladder pattern", () => {
    renderFlow(freshDraft());

    for (const label of NON_LADDER_TILE_LABELS) {
      clickTile(label);

      expect(anotherLadderButton()).toBeNull();
    }
  });

  it("shows the another-ladder control outside the tile group under Ladder", () => {
    renderFlow(freshDraft());

    clickTile("Ladder");

    expect(anotherLadderButton()).toBeInTheDocument();
    expect(within(repetitionGroup()).queryByRole("button", { name: ANOTHER_LADDER })).toBeNull();
  });
});

describe("CreateSchemaFlow remove-track collapses 2 to 1 (Must-Test #5)", () => {
  it("returns to a flat single ladder when the second track is removed", () => {
    renderFlow(flatLadderDraft());

    clickAnotherLadder();
    fireEvent.click(screen.getByRole("button", { name: "Remove ladder 2" }));

    expect(trackCaptions()).toEqual([]);
    expect(removeTrackButtons()).toEqual([]);
    expect(stepperCount()).toBe(STEPS_PER_DEFAULT_LADDER);
    expect(isParallelSeed(currentSeed())).toBe(false);
  });
});

describe("CreateSchemaFlow append grows to three tracks (Must-Test #6)", () => {
  it("renders three steppers and three remove controls after a second append", () => {
    renderFlow(flatLadderDraft());

    clickAnotherLadder();
    clickAnotherLadder();

    expect(trackCaptions()).toEqual(["LADDER 1", "LADDER 2", "LADDER 3"]);
    expect(removeTrackButtons()).toHaveLength(3);
    expect(stepperCount()).toBe(STEPS_PER_DEFAULT_LADDER * 3);
  });
});

describe("CreateSchemaFlow kind-switch off a materialized parallel (Must-Test #10)", () => {
  it("asks before discarding, then collapses to a single count schema on confirm", () => {
    renderFlow(flatLadderDraft());

    clickAnotherLadder();
    clickTile("Count");

    expect(isParallelSeed(currentSeed())).toBe(true);
    expect(switchConfirmButton()).toBeInTheDocument();

    confirmSwitch();

    const collapsed = currentSeed();

    expect(isParallelSeed(collapsed)).toBe(false);

    if (collapsed.mode === "schema") {
      expect(collapsed.schema.rows).toEqual([]);
      expect(collapsed.schema.repetition).toEqual({ kind: "count", count: 3 });
    }
  });

  it("keeps the parallel draft intact when the discard is cancelled", () => {
    renderFlow(flatLadderDraft());

    clickAnotherLadder();
    clickTile("Count");
    cancelSwitch();

    const preserved = currentSeed();

    expect(isParallelSeed(preserved)).toBe(true);
    expect(trackSteps(preserved)).toEqual([FIRST_LADDER_STEPS, [15, 12, 9]]);
  });

  it("never produces a draft carrying both a ladder repetition and tracks", () => {
    renderFlow(flatLadderDraft());

    clickAnotherLadder();
    clickTile("Count");
    confirmSwitch();
    clickTile("Ladder");

    const reladdered = currentSeed();

    expect(reladdered.mode).toBe("schema");

    if (reladdered.mode === "schema") {
      expect(reladdered.schema.repetition).toEqual({ kind: "ladder", steps: [21, 15, 9] });
    }
  });

  it("treats re-selecting Ladder while parallel as a no-op (QA-003 unreachable)", () => {
    renderFlow(flatLadderDraft());

    clickAnotherLadder();
    clickTile("Ladder");

    const stillParallel = currentSeed();

    expect(isParallelSeed(stillParallel)).toBe(true);
    expect(stillParallel).not.toHaveProperty("schema");
    expect(switchConfirmButton()).toBeNull();
  });
});

describe("CreateSchemaFlow gates a dirty single-ladder kind-switch (QA-004)", () => {
  it("defers the switch and keeps the edited ladder until the coach confirms", () => {
    renderFlow(dirtyLadderDraft());

    clickTile("Count");

    expect(trackSteps(currentSeed())).toEqual([]);
    expect(currentSeed().mode).toBe("schema");
    expect(switchConfirmButton()).toBeInTheDocument();

    confirmSwitch();

    const switched = currentSeed();

    if (switched.mode === "schema") {
      expect(switched.schema.repetition).toEqual({ kind: "count", count: 3 });
    }
  });

  it("keeps the edited single ladder when the switch is cancelled", () => {
    renderFlow(dirtyLadderDraft());

    clickTile("Count");
    cancelSwitch();

    const preserved = currentSeed();

    expect(preserved.mode).toBe("schema");

    if (preserved.mode === "schema") {
      expect(preserved.schema.repetition).toEqual({ kind: "ladder", steps: EDITED_LADDER_STEPS });
    }
  });

  it("shows exactly one confirm for a single-schema switch (no double-prompt)", () => {
    renderFlow(dirtyLadderDraft());

    clickTile("Count");

    expect(screen.getAllByRole("button", { name: SWITCH_CONFIRM })).toHaveLength(1);
  });
});

describe("CreateSchemaFlow tile-group a11y invariant (Must-Test #12)", () => {
  it("keeps exactly one tile group and one pressed tile in every reachable state", () => {
    renderFlow(freshDraft());

    expectSingleGridAndPress();

    clickTile("Ladder");
    expectSingleGridAndPress();

    clickAnotherLadder();
    expectSingleGridAndPress();

    fireEvent.click(screen.getByRole("button", { name: "Remove ladder 2" }));
    expectSingleGridAndPress();

    clickTile("Count");
    expectSingleGridAndPress();
  });
});

describe("CreateSchemaFlow group-into-box checkbox visibility (MT-11)", () => {
  it("hides the checkbox for a single-track ladder", () => {
    renderFlow(freshDraft());

    clickTile("Ladder");

    expect(groupCheckbox()).toBeNull();
  });

  it("shows the checkbox checked by default once a second ladder is added", () => {
    renderFlow(freshDraft());

    clickTile("Ladder");
    clickAnotherLadder();

    expect(groupCheckbox()).toBeChecked();
  });

  it("hides the checkbox again when the pattern switches to a non-ladder tile", () => {
    renderFlow(flatLadderDraft());

    clickAnotherLadder();

    expect(groupCheckbox()).toBeInTheDocument();

    clickTile("Count");

    expect(groupCheckbox()).toBeNull();
  });

  it("keeps exactly one tile group and one pressed tile while the checkbox is visible", () => {
    renderFlow(flatLadderDraft());

    clickAnotherLadder();

    expect(groupCheckbox()).toBeInTheDocument();
    expectSingleGridAndPress();
  });
});

describe("CreateSchemaFlow group-into-box checkbox toggle (MT-12)", () => {
  it("flips the link state off and back on across two clicks", () => {
    renderFlow(flatLadderDraft());

    clickAnotherLadder();

    expect(linkRef.current).toBe(true);

    toggleGroupCheckbox();

    expect(linkRef.current).toBe(false);
    expect(groupCheckbox()).not.toBeChecked();

    toggleGroupCheckbox();

    expect(linkRef.current).toBe(true);
    expect(groupCheckbox()).toBeChecked();
  });
});

describe("CreateSchemaFlow unboxed de-emphasis (MT-13)", () => {
  it("inserts an inter-track divider only while the checkbox is unchecked", () => {
    const { container } = renderFlow(flatLadderDraft());

    clickAnotherLadder();

    expect(dividerCount(container)).toBe(0);

    toggleGroupCheckbox();

    expect(dividerCount(container)).toBeGreaterThanOrEqual(1);

    toggleGroupCheckbox();

    expect(dividerCount(container)).toBe(0);
  });
});
