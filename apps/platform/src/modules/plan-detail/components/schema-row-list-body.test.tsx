import { createElement, type ReactNode } from "react";

import type * as DndKitCore from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent, Modifiers } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildRowItems, type RowGroup, type RowItem } from "@repo/contracts/lms/row-group";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { render } from "@app/test/render";

import { restrictToVerticalAxis } from "../lib/restrict-to-vertical-axis";

import { exerciseById, ID_BACK_SQUAT } from "./schema-row-card.fixtures";

const reorderMutate = vi.fn();

vi.mock("@app/lib/hooks", () => ({
  useReorderSchemaRows: () => ({ mutate: reorderMutate, isPending: false }),
  useCatalog: () => ({ exerciseById }),
}));

let capturedOnDragEnd: ((event: DragEndEvent) => void) | null = null;
let capturedOnDragStart: ((event: DragStartEvent) => void) | null = null;
let capturedModifiers: Modifiers | undefined = undefined;

vi.mock("@dnd-kit/core", async () => {
  const actual = await vi.importActual<typeof DndKitCore>("@dnd-kit/core");

  const renderDndContextMock = ({
    onDragEnd,
    onDragStart,
    modifiers,
    children,
  }: {
    onDragEnd: (event: DragEndEvent) => void;
    onDragStart?: (event: DragStartEvent) => void;
    modifiers?: Modifiers;
    children: ReactNode;
  }) => {
    capturedOnDragEnd = onDragEnd;
    capturedOnDragStart = onDragStart ?? null;
    capturedModifiers = modifiers;

    return createElement("div", { "data-testid": "dnd-context-mock" }, children);
  };

  const renderDragOverlayMock = ({ children }: { children: ReactNode }) =>
    createElement("div", { "data-testid": "drag-overlay-mock" }, children);

  return {
    ...actual,
    DndContext: renderDndContextMock,
    DragOverlay: renderDragOverlayMock,
  };
});

vi.mock("./schema-row-card", () => {
  const renderSchemaRowCardMock = (props: {
    row: SchemaRow;
    index: number;
    minuteLabel?: string | null;
    isDraggable?: boolean;
    isSelectMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: (rowId: string) => void;
  }) =>
    createElement(
      "div",
      {
        "data-testid": "schema-row-card-mock",
        "data-row-id": props.row.id,
        "data-index": String(props.index),
        "data-minute-label": props.minuteLabel ?? "",
        "data-draggable": props.isDraggable === false ? "false" : "true",
        "data-select-mode": props.isSelectMode ? "true" : "false",
        "data-selected": props.isSelected ? "true" : "false",
      },
      createElement(
        "button",
        {
          type: "button",
          "data-testid": "row-select-toggle",
          onClick: () => props.onToggleSelect?.(props.row.id),
        },
        `toggle:${props.row.id}`,
      ),
    );

  return { SchemaRowCard: renderSchemaRowCardMock };
});

type MemberReorder = (
  rowGroupId: string,
  orderedMemberIds: string[],
  options: { onError: () => void },
) => void;

const capturedMemberReorderByGroup = new Map<string, MemberReorder>();

vi.mock("./row-group-box", () => ({
  RowGroupBox: (props: { group: RowGroup; startIndex: number; onMemberReorder: MemberReorder }) => {
    capturedMemberReorderByGroup.set(props.group.id, props.onMemberReorder);

    return createElement(
      "div",
      {
        "data-testid": "row-group-box-mock",
        "data-group-id": props.group.id,
        "data-start-index": String(props.startIndex),
      },
      "row-group-box",
    );
  },
}));

const { SchemaRowListBody, itemMemberIds } = await import("./schema-row-list-body");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const SCHEMA_ID = "clp9z8x7w0000abcd1234sch1";
const EXERCISE_ID = "clp9z8x7w0000abcd1234ex001";
const GROUP_ID = "clp9z8x7w0000abcd1234grp1";
const NOW = new Date("2026-01-06T00:00:00.000Z");
const R1 = "clp9z8x7w0000abcd12rl1r001";
const R2 = "clp9z8x7w0000abcd12rl1r002";
const R3 = "clp9z8x7w0000abcd12rl1r003";

const makeRow = (overrides: Partial<SchemaRow> = {}): SchemaRow => ({
  id: R1,
  schemaId: SCHEMA_ID,
  order: 1,
  exerciseId: EXERCISE_ID,
  sets: null,
  rowGroupId: null,
  load: null,
  reps: null,
  side: null,
  tempo: null,
  media: null,
  modifiers: [],
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const makeRowGroup = (overrides: Partial<RowGroup> = {}): RowGroup => ({
  id: GROUP_ID,
  schemaId: SCHEMA_ID,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const renderBody = (
  rows: SchemaRow[],
  rowGroups: RowGroup[] = [],
  options: {
    minuteLabelById?: Map<string, string>;
    isSelectMode?: boolean;
    selectedIds?: ReadonlySet<string>;
    onToggleSelect?: (rowId: string) => void;
  } = {},
) =>
  render(
    createElement(SchemaRowListBody, {
      schemaId: SCHEMA_ID,
      planId: PLAN_ID,
      startDate: START_DATE,
      items: buildRowItems(rows, rowGroups),
      minuteLabelById: options.minuteLabelById ?? new Map(),
      parentIsReorderPending: false,
      isSelectMode: options.isSelectMode ?? false,
      selectedIds: options.selectedIds ?? new Set(),
      onToggleSelect: options.onToggleSelect ?? (() => undefined),
    }),
  );

const rowIdsOf = (container: HTMLElement): (string | null)[] =>
  Array.from(container.querySelectorAll('[data-testid="schema-row-card-mock"]')).map((node) =>
    node.getAttribute("data-row-id"),
  );

const triggerDragStart = (activeId: string): void => {
  if (capturedOnDragStart === null) {
    throw new Error("DndContext.onDragStart was not captured");
  }

  const handler = capturedOnDragStart;

  act(() => handler({ active: { id: activeId } } as unknown as DragStartEvent));
};

const triggerTopDragEnd = (activeId: string, overId: string): void => {
  if (capturedOnDragEnd === null) {
    throw new Error("DndContext.onDragEnd was not captured");
  }

  const handler = capturedOnDragEnd;

  act(() =>
    handler({
      active: { id: activeId },
      over: { id: overId },
    } as unknown as DragEndEvent),
  );
};

beforeEach(() => {
  reorderMutate.mockReset();
  capturedMemberReorderByGroup.clear();
  capturedOnDragEnd = null;
  capturedOnDragStart = null;
  capturedModifiers = undefined;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SchemaRowListBody rendering", () => {
  it("renders each ungrouped row as a sortable card in order", () => {
    const { container } = renderBody([
      makeRow({ id: R1, order: 1 }),
      makeRow({ id: R2, order: 2 }),
    ]);

    expect(rowIdsOf(container)).toEqual([R1, R2]);
  });

  it("renders a row-group box for grouped rows and keeps standalone rows as cards", () => {
    const group = makeRowGroup();
    const { container } = renderBody(
      [makeRow({ id: R1, order: 1, rowGroupId: GROUP_ID }), makeRow({ id: R2, order: 2 })],
      [group],
    );

    expect(screen.getByTestId("row-group-box-mock")).toHaveAttribute("data-group-id", GROUP_ID);
    expect(rowIdsOf(container)).toEqual([R2]);
  });

  it("assigns a continuous row index across the row-group box and standalone rows", () => {
    const group = makeRowGroup();

    renderBody(
      [
        makeRow({ id: R1, order: 1, rowGroupId: GROUP_ID }),
        makeRow({ id: R2, order: 2, rowGroupId: GROUP_ID }),
        makeRow({ id: R3, order: 3 }),
      ],
      [group],
    );

    expect(screen.getByTestId("row-group-box-mock")).toHaveAttribute("data-start-index", "0");
    expect(screen.getByTestId("schema-row-card-mock")).toHaveAttribute("data-index", "2");
  });

  it("threads the minute label for each row by id", () => {
    renderBody([makeRow({ id: R1, order: 1 })], [], {
      minuteLabelById: new Map([[R1, "MIN 1"]]),
    });

    expect(screen.getByTestId("schema-row-card-mock")).toHaveAttribute(
      "data-minute-label",
      "MIN 1",
    );
  });
});

describe("SchemaRowListBody select mode", () => {
  it("threads select-mode and selected state into each card", () => {
    renderBody([makeRow({ id: R1, order: 1 }), makeRow({ id: R2, order: 2 })], [], {
      isSelectMode: true,
      selectedIds: new Set([R1]),
    });

    const cards = screen.getAllByTestId("schema-row-card-mock");

    expect(cards.every((node) => node.getAttribute("data-select-mode") === "true")).toBe(true);

    const selected = cards.find((node) => node.getAttribute("data-row-id") === R1);

    expect(selected).toHaveAttribute("data-selected", "true");
  });

  it("invokes onToggleSelect with the row id when a card toggles", () => {
    const onToggleSelect = vi.fn();

    renderBody([makeRow({ id: R1, order: 1 })], [], { isSelectMode: true, onToggleSelect });

    fireEvent.click(
      within(screen.getByTestId("schema-row-card-mock")).getByTestId("row-select-toggle"),
    );

    expect(onToggleSelect).toHaveBeenCalledWith(R1);
  });

  it("disables standalone SchemaRowCard drag while select-mode is active (QA-B-06)", () => {
    const draggableWhenIdle = renderBody([makeRow({ id: R1, order: 1 })]);

    expect(screen.getByTestId("schema-row-card-mock")).toHaveAttribute("data-draggable", "true");

    draggableWhenIdle.unmount();

    renderBody([makeRow({ id: R1, order: 1 }), makeRow({ id: R2, order: 2 })], [], {
      isSelectMode: true,
    });

    for (const card of screen.getAllByTestId("schema-row-card-mock")) {
      expect(card).toHaveAttribute("data-draggable", "false");
    }
  });
});

const isGroupContiguous = (orderedIds: string[], memberIds: string[]): boolean => {
  const positions = memberIds.map((id) => orderedIds.indexOf(id)).sort((a, b) => a - b);
  const last = positions[positions.length - 1] ?? -1;
  const first = positions[0] ?? -1;

  return positions.every((position) => position >= 0) && last - first + 1 === positions.length;
};

describe("SchemaRowListBody reorder flatten invariant (QA-005)", () => {
  const GROUP_MEMBERS = [R1, R2];
  const STANDALONE = R3;
  const buildItems = (): RowItem[] =>
    buildRowItems(
      [
        makeRow({ id: R1, order: 1, rowGroupId: GROUP_ID }),
        makeRow({ id: R2, order: 2, rowGroupId: GROUP_ID }),
        makeRow({ id: STANDALONE, order: 3 }),
      ],
      [makeRowGroup()],
    );

  it("keeps a row-group's members contiguous for every arrayMove of the top-level items", () => {
    const items = buildItems();

    for (let from = 0; from < items.length; from += 1) {
      for (let to = 0; to < items.length; to += 1) {
        const orderedIds = arrayMove(items, from, to).flatMap(itemMemberIds);

        expect(isGroupContiguous(orderedIds, GROUP_MEMBERS)).toBe(true);
      }
    }
  });

  it("emits every member id exactly once across the flatten", () => {
    const orderedIds = arrayMove(buildItems(), 0, 1).flatMap(itemMemberIds);

    expect([...orderedIds].sort()).toEqual([R1, R2, STANDALONE].sort());
  });
});

describe("SchemaRowListBody minute labels with a grouped run (QA-012)", () => {
  it("keeps a standalone row's minute label aligned by row id when a group precedes it", () => {
    const group = makeRowGroup();

    renderBody(
      [
        makeRow({ id: R1, order: 1, rowGroupId: GROUP_ID }),
        makeRow({ id: R2, order: 2, rowGroupId: GROUP_ID }),
        makeRow({ id: R3, order: 3 }),
      ],
      [group],
      {
        minuteLabelById: new Map([
          [R1, "MIN 1"],
          [R2, "MIN 2"],
          [R3, "MIN 3"],
        ]),
      },
    );

    expect(screen.getByTestId("schema-row-card-mock")).toHaveAttribute(
      "data-minute-label",
      "MIN 3",
    );
  });
});

describe("SchemaRowListBody DR-W4E-INGROUP-REORDER: lifted member reorder rebuilds the full schema roster", () => {
  const invokeMemberReorder = (
    rowGroupId: string,
    orderedMemberIds: string[],
    options: { onError: () => void } = { onError: () => undefined },
  ): void => {
    const handler = capturedMemberReorderByGroup.get(rowGroupId);

    if (handler === undefined) {
      throw new Error(`onMemberReorder for row group ${rowGroupId} was not captured`);
    }

    handler(rowGroupId, orderedMemberIds, options);
  };

  it("emits every schema row with the group's members in the new order (length === full scope)", () => {
    renderBody(
      [
        makeRow({ id: R1, order: 1, rowGroupId: GROUP_ID }),
        makeRow({ id: R2, order: 2, rowGroupId: GROUP_ID }),
        makeRow({ id: R3, order: 3 }),
      ],
      [makeRowGroup()],
    );

    invokeMemberReorder(GROUP_ID, [R2, R1]);

    expect(reorderMutate).toHaveBeenCalledTimes(1);

    const payload = reorderMutate.mock.calls[0]?.[0];

    expect(payload).toEqual({ schemaId: SCHEMA_ID, orderedIds: [R2, R1, R3] });
    expect(payload?.orderedIds).toHaveLength(3);
  });

  it("forwards the box revert callback as the mutation onError", () => {
    reorderMutate.mockImplementation(
      (_payload: unknown, options: { onError?: () => void } | undefined) => {
        options?.onError?.();
      },
    );

    renderBody(
      [
        makeRow({ id: R1, order: 1, rowGroupId: GROUP_ID }),
        makeRow({ id: R2, order: 2, rowGroupId: GROUP_ID }),
      ],
      [makeRowGroup()],
    );

    const onError = vi.fn();

    invokeMemberReorder(GROUP_ID, [R2, R1], { onError });

    expect(onError).toHaveBeenCalledTimes(1);
  });
});

describe("SchemaRowListBody W3-DND-POLISH: drag overlay ghost + vertical-axis modifier", () => {
  it("passes the restrict-to-vertical-axis modifier to the DndContext", () => {
    renderBody([makeRow({ id: R1, order: 1 }), makeRow({ id: R2, order: 2 })]);

    expect(capturedModifiers).toEqual([restrictToVerticalAxis]);
  });

  it("renders an empty DragOverlay (no ghost) before any drag starts", () => {
    renderBody([makeRow({ id: R1, order: 1 })]);

    expect(screen.getByTestId("drag-overlay-mock")).toBeEmptyDOMElement();
  });

  it("shows the row exercise name in the ghost when a row drag starts", () => {
    renderBody([
      makeRow({ id: R1, order: 1, exerciseId: ID_BACK_SQUAT }),
      makeRow({ id: R2, order: 2 }),
    ]);

    triggerDragStart(`row:${R1}`);

    const overlay = screen.getByTestId("drag-overlay-mock");

    expect(within(overlay).getByText("Back Squat")).toBeInTheDocument();
  });

  it("shows the row-group label in the ghost when a row-group drag starts", () => {
    renderBody(
      [
        makeRow({ id: R1, order: 1, rowGroupId: GROUP_ID }),
        makeRow({ id: R2, order: 2, rowGroupId: GROUP_ID }),
      ],
      [makeRowGroup({ notes: ["AMRAP"] })],
    );

    triggerDragStart(`rowgroup:${GROUP_ID}`);

    const overlay = screen.getByTestId("drag-overlay-mock");

    expect(within(overlay).getByText("AMRAP")).toBeInTheDocument();
  });

  it("clears the ghost when the drag ends", () => {
    renderBody([
      makeRow({ id: R1, order: 1, exerciseId: ID_BACK_SQUAT }),
      makeRow({ id: R2, order: 2 }),
    ]);

    triggerDragStart(`row:${R1}`);

    expect(
      within(screen.getByTestId("drag-overlay-mock")).getByText("Back Squat"),
    ).toBeInTheDocument();

    triggerTopDragEnd(`row:${R1}`, `row:${R2}`);

    expect(screen.getByTestId("drag-overlay-mock")).toBeEmptyDOMElement();
  });
});
