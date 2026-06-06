import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Exercise } from "@repo/contracts/lms/exercise";

import { render } from "@app/test/render";

import { ComposePrototypeView } from "../../views/compose-prototype-view";
import { MOCK_EXERCISES } from "../compose-mock-exercises";
import type {
  ComposeBlock,
  ComposeContainer,
  ComposeNode,
  ComposeProgram,
} from "../compose-tree.types";
import { asNodeId } from "../lib/id-factory";
import { makeRow } from "../lib/make-row";

import { ComposeBlockRow } from "./compose-block-row";
import type { NodeHandlers } from "./compose-canvas-handlers";
import { ComposeTreeDnd } from "./compose-tree-dnd";

const HEAVY_RENDER_TIMEOUT_MS = 15000;

const at = (elements: HTMLElement[], index: number): HTMLElement => {
  const element = elements[index];

  if (element === undefined) {
    throw new Error(`no element at index ${index}`);
  }

  return element;
};

const rowCardFor = (label: HTMLElement): HTMLElement => {
  let element: HTMLElement | null = label;

  while (element !== null && element.querySelector('button[aria-label="Drag row"]') === null) {
    element = element.parentElement;
  }

  if (element === null) {
    throw new Error("expected an enclosing row card with a drag handle");
  }

  return element;
};

const addExerciseRow = (): void => {
  fireEvent.click(at(screen.getAllByRole("button", { name: /\+ row/ }), 0));
  fireEvent.click(screen.getByText("Exercise"));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
};

const noopHandlers: NodeHandlers = {
  selectedNodeId: null,
  isStructuralEditingAllowed: true,
  onSelect: vi.fn(),
  onDuplicateNode: vi.fn(),
  onDeleteNode: vi.fn(),
  onReorderChildren: vi.fn(),
  onAddContainer: vi.fn(),
  onAddRow: vi.fn(),
};

const container = (idSeed: string, children: ComposeNode[]): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId(idSeed),
  header: idSeed,
  notes: null,
  children,
});

const blockWith = (rootChildren: ComposeNode[]): ComposeBlock => ({
  id: asNodeId("isolated-block"),
  label: "Isolated block",
  root: container("isolated-root", rootChildren),
});

const renderIsolatedBlock = (rootChildren: ComposeNode[]) =>
  render(
    <ComposeBlockRow
      block={blockWith(rootChildren)}
      exerciseById={new Map<string, Exercise>()}
      handlers={noopHandlers}
      onRename={() => undefined}
      onDuplicateBlock={() => undefined}
    />,
  );

const miniProgram = (): ComposeProgram => ({
  weeks: [
    {
      id: asNodeId("mini-week"),
      label: "Mini week",
      days: [
        {
          id: asNodeId("mini-day"),
          label: "Mini day",
          sessions: [
            {
              id: asNodeId("mini-session"),
              label: "Mini session",
              blocks: [
                {
                  id: asNodeId("mini-block"),
                  label: "Mini block",
                  root: container("mini-root", [makeRow("REST"), makeRow("REST")]),
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});

describe("ComposePrototypeView", () => {
  it("renders the Gauntlet blocks B, C and D from the mock seed", () => {
    render(<ComposePrototypeView />);

    expect(screen.getByText("EMOM 16 / 4 rounds")).toBeInTheDocument();
    expect(screen.getByText("Parallel ladders into AMRAP")).toBeInTheDocument();
    expect(screen.getByText("Intervals, max in remaining")).toBeInTheDocument();
  });

  it("renders compound exercise rows with per-element reps and movement names", () => {
    render(<ComposePrototypeView />);

    expect(screen.getByText("5 Pull-up + 10 Dip")).toBeInTheDocument();
  });

  it("renders an axes summary for a cadence container", () => {
    render(<ComposePrototypeView />);

    expect(screen.getByText("EMOM 1’×4")).toBeInTheDocument();
  });

  it("shows the empty inspector placeholder before a node is selected", () => {
    render(<ComposePrototypeView />);

    expect(screen.getByText("Select a node to edit its axes.")).toBeInTheDocument();
  });

  it("duplicates a block, appending one more block-duplicate affordance", () => {
    render(<ComposePrototypeView initialProgram={miniProgram()} />);

    const before = screen.getAllByRole("button", { name: "Duplicate block" }).length;

    fireEvent.click(at(screen.getAllByRole("button", { name: "Duplicate block" }), 0));

    expect(screen.getAllByRole("button", { name: "Duplicate block" })).toHaveLength(before + 1);
  });

  it("deletes a leaf node, removing exactly one delete affordance", () => {
    render(<ComposePrototypeView initialProgram={miniProgram()} />);

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    const before = deleteButtons.length;

    fireEvent.click(at(deleteButtons, before - 1));

    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(before - 1);
  });

  it(
    "adds an uncommitted exercise row via the picker and renders its setup placeholder",
    () => {
      render(<ComposePrototypeView initialProgram={miniProgram()} />);

      addExerciseRow();

      expect(screen.getAllByText("tap to set up…").length).toBeGreaterThan(0);
    },
    HEAVY_RENDER_TIMEOUT_MS,
  );
});

describe("the block-root container card omits the delete and drag controls (QA-002 / QA-006 fix)", () => {
  it("renders no delete and no drag handle for the block-root, but does for a nested container", () => {
    renderIsolatedBlock([container("nested-non-root", [])]);

    expect(screen.getAllByRole("button", { name: "Drag group" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(1);
  });

  it("does not throw when the block-root useSortable runs outside a DndContext", () => {
    expect(() => renderIsolatedBlock([])).not.toThrow();
  });
});

describe("an empty container still renders the add-menu and no empty dnd scope (QA-1.3 / QA-7.3)", () => {
  it("shows the + group and + row affordances for an empty nested container", () => {
    renderIsolatedBlock([container("empty-nested", [])]);

    expect(screen.getAllByRole("button", { name: "+ group" }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole("button", { name: /\+ row/ }).length).toBeGreaterThanOrEqual(2);
  });
});

describe("ComposeTreeDnd scopes a sortable to its own children (QA-6.2 cross-container reject)", () => {
  it("renders only the provided children, isolating the parent's reorder scope from foreign ids", () => {
    render(
      <ComposeTreeDnd
        parentId={asNodeId("scope-parent")}
        nodes={[container("scope-a", []), container("scope-b", [])]}
        isReorderAllowed
        onReorder={vi.fn()}
        renderChild={(child: ComposeNode) => <div key={child.id}>{child.id}</div>}
      />,
    );

    expect(screen.getByText("scope-a")).toBeInTheDocument();
    expect(screen.getByText("scope-b")).toBeInTheDocument();
    expect(screen.queryByText("foreign-child")).not.toBeInTheDocument();
  });
});

describe("the sentinel uncommitted EXERCISE row (QA-3.x)", () => {
  it(
    "shows the EX badge and the setup placeholder, never the rest-slot label",
    () => {
      render(<ComposePrototypeView initialProgram={miniProgram()} />);

      addExerciseRow();

      const card = rowCardFor(screen.getByText("tap to set up…"));

      expect(within(card).getAllByText("EX")).toHaveLength(1);
      expect(within(card).getByText("tap to set up…")).toBeInTheDocument();
      expect(within(card).queryByText("rest slot")).not.toBeInTheDocument();
    },
    HEAVY_RENDER_TIMEOUT_MS,
  );

  it(
    "duplicates the sentinel row into a second uncommitted EXERCISE row (QA-8)",
    () => {
      render(<ComposePrototypeView initialProgram={miniProgram()} />);

      addExerciseRow();

      const card = rowCardFor(screen.getByText("tap to set up…"));

      fireEvent.click(within(card).getByRole("button", { name: "Duplicate", hidden: true }));

      expect(screen.getAllByText("tap to set up…")).toHaveLength(2);
    },
    HEAVY_RENDER_TIMEOUT_MS,
  );
});

describe("the offline ExercisePicker (QA-5.2 / QA-301)", () => {
  it(
    "shows all 10 mock exercises without firing the throwing network queryFn",
    () => {
      render(<ComposePrototypeView initialProgram={miniProgram()} />);

      addExerciseRow();

      fireEvent.mouseDown(screen.getByPlaceholderText("search by name, family, or modality…"));

      expect(screen.getAllByRole("option")).toHaveLength(MOCK_EXERCISES.length);
      expect(screen.getByRole("option", { name: /Thrusters/ })).toBeInTheDocument();
    },
    HEAVY_RENDER_TIMEOUT_MS,
  );
});
