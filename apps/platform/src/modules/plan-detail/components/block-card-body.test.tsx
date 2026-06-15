import { createElement, type ReactNode } from "react";

import type * as DndKitCore from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Block } from "@repo/contracts/lms/block";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";
import type { SchemaGroup } from "@repo/contracts/lms/schema-group";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import { restrictToVerticalAxis } from "../lib/restrict-to-vertical-axis";
import type { UseCreateSchemaGroupResult } from "../lib/use-create-schema-group";

type SchemaGroupRun = UseCreateSchemaGroupResult["run"];

const reorderSchemasMutate = vi.fn();
const reorderSchemasState = { isPending: false };
const createSchemaGroupRun = vi.fn<SchemaGroupRun>(() => Promise.resolve());
const createSchemaGroupState = { isPending: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useReorderSchemas: () => ({
      mutate: reorderSchemasMutate,
      isPending: reorderSchemasState.isPending,
    }),
  };
});

vi.mock("../lib/use-create-schema-group", () => ({
  useCreateSchemaGroup: () => ({
    run: createSchemaGroupRun,
    isPending: createSchemaGroupState.isPending,
  }),
}));

vi.mock("./schema-card", () => {
  const renderSchemaCardMock = (props: {
    schema: SchemaWithBody;
    parentIsReorderPending?: boolean;
    isDraggable?: boolean;
    isSelectMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: (schemaId: string) => void;
  }) =>
    createElement(
      "button",
      {
        type: "button",
        "data-testid": "schema-card-mock",
        "data-schema-id": props.schema.schema.id,
        "data-parent-pending": props.parentIsReorderPending === true ? "true" : "false",
        "data-draggable": props.isDraggable === false ? "false" : "true",
        "data-select-mode": props.isSelectMode === true ? "true" : "false",
        "data-selected": props.isSelected === true ? "true" : "false",
        onClick: () => props.onToggleSelect?.(props.schema.schema.id),
      },
      `schema-card:${props.schema.schema.id}`,
    );

  return { SchemaCard: renderSchemaCardMock };
});

type MemberReorder = (
  groupId: string,
  orderedMemberIds: string[],
  options: { onError: () => void },
) => void;

const capturedMemberReorderByGroup = new Map<string, MemberReorder>();

vi.mock("./schema-group-box", () => {
  const renderSchemaGroupBoxMock = (props: {
    group: SchemaGroup;
    members: SchemaWithBody[];
    parentIsReorderPending?: boolean;
    onMemberReorder: MemberReorder;
  }) => {
    capturedMemberReorderByGroup.set(props.group.id, props.onMemberReorder);

    return createElement(
      "div",
      {
        "data-testid": "schema-group-box-mock",
        "data-group-id": props.group.id,
        "data-member-ids": props.members.map((member) => member.schema.id).join(","),
        "data-parent-pending": props.parentIsReorderPending === true ? "true" : "false",
      },
      `group-box:${props.group.id}`,
    );
  };

  return { SchemaGroupBox: renderSchemaGroupBoxMock };
});

vi.mock("./add-schema-button", () => {
  const renderAddSchemaButtonMock = () =>
    createElement("div", { "data-testid": "add-schema-button-mock" });

  return { AddSchemaButton: renderAddSchemaButtonMock };
});

let capturedOnDragEnd: ((event: DragEndEvent) => void) | null = null;
let capturedOnDragStart: ((event: DragStartEvent) => void) | null = null;
let capturedModifiers: DndKitCore.Modifiers | undefined = undefined;

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
    modifiers?: DndKitCore.Modifiers;
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

const { BlockCardBody } = await import("./block-card-body");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const SESSION_ID = "clp9z8x7w0000abcd1234ses1";
const NOW = new Date("2026-01-06T00:00:00.000Z");

const makeSchema = (overrides: Partial<SchemaWithBody["schema"]> = {}): SchemaWithBody => ({
  schema: {
    id: "clp9z8x7w0000abcd1234sch1",
    blockId: BLOCK_ID,
    groupId: null,
    order: 1,
    header: null,
    intensity: null,
    composition: null,
    label: null,
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  },
  rows: [],
  rowGroups: [],
});

const makeGroup = (overrides: Partial<SchemaGroup> = {}): SchemaGroup => ({
  id: "clp9z8x7w0000abcd1234grp1",
  blockId: BLOCK_ID,
  notes: null,
  interleaveOrder: "round_by_round",
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const makeBlock = (overrides: Partial<Block> = {}): Block => ({
  id: BLOCK_ID,
  sessionId: SESSION_ID,
  order: 1,
  notes: null,
  labels: [],
  schemas: [],
  groups: [],
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const makeDragEndEvent = (activeId: string, overId: string): DragEndEvent =>
  ({
    active: {
      id: activeId,
      data: { current: undefined },
      rect: { current: { initial: null, translated: null } },
    },
    over: {
      id: overId,
      data: { current: undefined },
      rect: { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 },
    },
    activatorEvent: new MouseEvent("mousedown"),
    collisions: null,
    delta: { x: 0, y: 0 },
  }) as unknown as DragEndEvent;

const makeDragEndEventNoOver = (activeId: string): DragEndEvent =>
  ({
    active: {
      id: activeId,
      data: { current: undefined },
      rect: { current: { initial: null, translated: null } },
    },
    over: null,
    activatorEvent: new MouseEvent("mousedown"),
    collisions: null,
    delta: { x: 0, y: 0 },
  }) as unknown as DragEndEvent;

const triggerDragEnd = (event: DragEndEvent): void => {
  if (capturedOnDragEnd === null) {
    throw new Error("DndContext.onDragEnd was not captured");
  }

  const handler = capturedOnDragEnd;

  act(() => handler(event));
};

const triggerDragStart = (activeId: string): void => {
  if (capturedOnDragStart === null) {
    throw new Error("DndContext.onDragStart was not captured");
  }

  const handler = capturedOnDragStart;

  act(() => handler({ active: { id: activeId } } as unknown as DragStartEvent));
};

afterEach(() => {
  reorderSchemasMutate.mockReset();
  reorderSchemasState.isPending = false;
  createSchemaGroupRun.mockReset();
  createSchemaGroupRun.mockImplementation(() => Promise.resolve());
  createSchemaGroupState.isPending = false;
  capturedOnDragEnd = null;
  capturedOnDragStart = null;
  capturedModifiers = undefined;
  capturedMemberReorderByGroup.clear();
});

describe("BlockCardBody D-14 hoisted DnD: top-level drag-end", () => {
  it("fires reorderSchemas.mutate with { blockId, orderedIds: arrayMoved } when dragging within standalone schemas", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12bcb001", order: 1 });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd12bcb002", order: 2 });
    const s3 = makeSchema({ id: "clp9z8x7w0000abcd12bcb003", order: 3 });

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [s1, s2, s3] })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    triggerDragEnd(makeDragEndEvent(`schema:${s2.schema.id}`, `schema:${s1.schema.id}`));

    expect(reorderSchemasMutate).toHaveBeenCalledTimes(1);

    const payload = reorderSchemasMutate.mock.calls[0]?.[0];

    expect(payload).toEqual({
      blockId: BLOCK_ID,
      orderedIds: [s2.schema.id, s1.schema.id, s3.schema.id],
    });
    expect(payload).not.toHaveProperty("parentSchemaId");
  });

  it("fires reorderSchemas.mutate for any two schemas in the block (no alt-group restriction)", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12bcb101", order: 1 });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd12bcb102", order: 2 });

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [s1, s2] })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    triggerDragEnd(makeDragEndEvent(`schema:${s2.schema.id}`, `schema:${s1.schema.id}`));

    expect(reorderSchemasMutate).toHaveBeenCalledTimes(1);
    expect(reorderSchemasMutate.mock.calls[0]?.[0]).toEqual({
      blockId: BLOCK_ID,
      orderedIds: [s2.schema.id, s1.schema.id],
    });
  });
});

describe("BlockCardBody drag-end guards (QA-Must-01, QA-Must-02)", () => {
  it("does NOT fire mutate when active.id === over.id (QA-Must-01)", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12gd1s001", order: 1 });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd12gd1s002", order: 2 });

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [s1, s2] })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    triggerDragEnd(makeDragEndEvent(`schema:${s1.schema.id}`, `schema:${s1.schema.id}`));

    expect(reorderSchemasMutate).not.toHaveBeenCalled();
  });

  it("does NOT fire mutate when over is null (QA-Must-02, also covers Escape cancel)", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12gd2s001", order: 1 });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd12gd2s002", order: 2 });

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [s1, s2] })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    triggerDragEnd(makeDragEndEventNoOver(`schema:${s1.schema.id}`));

    expect(reorderSchemasMutate).not.toHaveBeenCalled();
  });
});

describe("BlockCardBody D-14: optimistic + rollback", () => {
  it("reverts sortedSchemas to previous order when mutate onError fires", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12bcr001", order: 1 });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd12bcr002", order: 2 });

    reorderSchemasMutate.mockImplementation(
      (_payload: unknown, options: { onError?: (error: Error) => void } | undefined) => {
        options?.onError?.(new Error("simulated reorder failure"));
      },
    );

    const { container } = render(
      <BlockCardBody
        block={makeBlock({ schemas: [s1, s2] })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    triggerDragEnd(makeDragEndEvent(`schema:${s2.schema.id}`, `schema:${s1.schema.id}`));

    expect(reorderSchemasMutate).toHaveBeenCalledTimes(1);

    const renderedIds = Array.from(
      container.querySelectorAll('[data-testid="schema-card-mock"]'),
    ).map((node) => node.getAttribute("data-schema-id"));

    expect(renderedIds).toEqual([s1.schema.id, s2.schema.id]);
  });
});

describe("BlockCardBody W1-RENDER-REPOINT: group clustering via buildBlockItems", () => {
  it("renders a SchemaGroupBox for a group's members and a plain SchemaCard for ungrouped schemas", () => {
    const GROUP_ID = "clp9z8x7w0000abcd12grp001";
    const m1 = makeSchema({ id: "clp9z8x7w0000abcd12grm001", order: 1, groupId: GROUP_ID });
    const m2 = makeSchema({ id: "clp9z8x7w0000abcd12grm002", order: 2, groupId: GROUP_ID });
    const flat = makeSchema({ id: "clp9z8x7w0000abcd12flt001", order: 3 });

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [m1, m2, flat], groups: [makeGroup({ id: GROUP_ID })] })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    const box = screen.getByTestId("schema-group-box-mock");

    expect(box).toHaveAttribute("data-group-id", GROUP_ID);
    expect(box).toHaveAttribute("data-member-ids", `${m1.schema.id},${m2.schema.id}`);

    const cards = screen.getAllByTestId("schema-card-mock");

    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveAttribute("data-schema-id", flat.schema.id);
  });

  it("positions a group item by its minimum member order among block items", () => {
    const GROUP_ID = "clp9z8x7w0000abcd12grp002";
    const flatFirst = makeSchema({ id: "clp9z8x7w0000abcd12flt010", order: 1 });
    const m1 = makeSchema({ id: "clp9z8x7w0000abcd12grm010", order: 2, groupId: GROUP_ID });
    const m2 = makeSchema({ id: "clp9z8x7w0000abcd12grm011", order: 3, groupId: GROUP_ID });

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [m1, m2, flatFirst], groups: [makeGroup({ id: GROUP_ID })] })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    const flatCard = screen.getByTestId("schema-card-mock");
    const box = screen.getByTestId("schema-group-box-mock");

    expect(flatCard.compareDocumentPosition(box) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
  });

  it("flattens a group to its contiguous member ids when the group drags as a single unit", () => {
    const GROUP_ID = "clp9z8x7w0000abcd12grp003";
    const m1 = makeSchema({ id: "clp9z8x7w0000abcd12grm020", order: 1, groupId: GROUP_ID });
    const m2 = makeSchema({ id: "clp9z8x7w0000abcd12grm021", order: 2, groupId: GROUP_ID });
    const flat = makeSchema({ id: "clp9z8x7w0000abcd12flt020", order: 3 });

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [m1, m2, flat], groups: [makeGroup({ id: GROUP_ID })] })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    triggerDragEnd(makeDragEndEvent(`group:${GROUP_ID}`, `schema:${flat.schema.id}`));

    expect(reorderSchemasMutate).toHaveBeenCalledTimes(1);
    expect(reorderSchemasMutate.mock.calls[0]?.[0]).toEqual({
      blockId: BLOCK_ID,
      orderedIds: [flat.schema.id, m1.schema.id, m2.schema.id],
    });
  });

  it("propagates effective pending to the SchemaGroupBox when parentIsReorderPending is true", () => {
    const GROUP_ID = "clp9z8x7w0000abcd12grp004";
    const m1 = makeSchema({ id: "clp9z8x7w0000abcd12grm030", order: 1, groupId: GROUP_ID });
    const m2 = makeSchema({ id: "clp9z8x7w0000abcd12grm031", order: 2, groupId: GROUP_ID });

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [m1, m2], groups: [makeGroup({ id: GROUP_ID })] })}
        planId={PLAN_ID}
        startDate={START_DATE}
        parentIsReorderPending
      />,
    );

    expect(screen.getByTestId("schema-group-box-mock")).toHaveAttribute(
      "data-parent-pending",
      "true",
    );
  });
});

describe("BlockCardBody DR-W4E-INGROUP-REORDER: lifted member reorder rebuilds the full block roster", () => {
  const GROUP_ID = "clp9z8x7w0000abcd12mrg001";

  const invokeMemberReorder = (
    groupId: string,
    orderedMemberIds: string[],
    options: { onError: () => void } = { onError: () => undefined },
  ): void => {
    const handler = capturedMemberReorderByGroup.get(groupId);

    if (handler === undefined) {
      throw new Error(`onMemberReorder for group ${groupId} was not captured`);
    }

    handler(groupId, orderedMemberIds, options);
  };

  it("emits every block schema with the group's members in the new order (length === full scope)", () => {
    const m1 = makeSchema({ id: "clp9z8x7w0000abcd12mrm001", order: 1, groupId: GROUP_ID });
    const m2 = makeSchema({ id: "clp9z8x7w0000abcd12mrm002", order: 2, groupId: GROUP_ID });
    const flat = makeSchema({ id: "clp9z8x7w0000abcd12mrf001", order: 3 });

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [m1, m2, flat], groups: [makeGroup({ id: GROUP_ID })] })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    invokeMemberReorder(GROUP_ID, [m2.schema.id, m1.schema.id]);

    expect(reorderSchemasMutate).toHaveBeenCalledTimes(1);

    const payload = reorderSchemasMutate.mock.calls[0]?.[0];

    expect(payload).toEqual({
      blockId: BLOCK_ID,
      orderedIds: [m2.schema.id, m1.schema.id, flat.schema.id],
    });
    expect(payload?.orderedIds).toHaveLength(3);
  });

  it("keeps standalone schemas around the group in their existing order", () => {
    const flatFirst = makeSchema({ id: "clp9z8x7w0000abcd12mrf010", order: 1 });
    const m1 = makeSchema({ id: "clp9z8x7w0000abcd12mrm010", order: 2, groupId: GROUP_ID });
    const m2 = makeSchema({ id: "clp9z8x7w0000abcd12mrm011", order: 3, groupId: GROUP_ID });
    const flatLast = makeSchema({ id: "clp9z8x7w0000abcd12mrf011", order: 4 });

    render(
      <BlockCardBody
        block={makeBlock({
          schemas: [flatFirst, m1, m2, flatLast],
          groups: [makeGroup({ id: GROUP_ID })],
        })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    invokeMemberReorder(GROUP_ID, [m2.schema.id, m1.schema.id]);

    expect(reorderSchemasMutate.mock.calls[0]?.[0]).toEqual({
      blockId: BLOCK_ID,
      orderedIds: [flatFirst.schema.id, m2.schema.id, m1.schema.id, flatLast.schema.id],
    });
  });

  it("forwards the box revert callback as the mutation onError", () => {
    const m1 = makeSchema({ id: "clp9z8x7w0000abcd12mrm020", order: 1, groupId: GROUP_ID });
    const m2 = makeSchema({ id: "clp9z8x7w0000abcd12mrm021", order: 2, groupId: GROUP_ID });

    reorderSchemasMutate.mockImplementation(
      (_payload: unknown, options: { onError?: () => void } | undefined) => {
        options?.onError?.();
      },
    );

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [m1, m2], groups: [makeGroup({ id: GROUP_ID })] })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    const onError = vi.fn();

    invokeMemberReorder(GROUP_ID, [m2.schema.id, m1.schema.id], { onError });

    expect(onError).toHaveBeenCalledTimes(1);
  });
});

describe("BlockCardBody D-14: parentIsReorderPending cascade", () => {
  it("propagates effective pending to every SchemaCard when parentIsReorderPending is true", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12cas201", order: 1 });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd12cas202", order: 2 });

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [s1, s2] })}
        planId={PLAN_ID}
        startDate={START_DATE}
        parentIsReorderPending
      />,
    );

    const cards = screen.getAllByTestId("schema-card-mock");

    expect(cards).toHaveLength(2);

    for (const card of cards) {
      expect(card).toHaveAttribute("data-parent-pending", "true");
    }
  });

  it("passes data-parent-pending='false' to every SchemaCard when parentIsReorderPending is omitted and reorderSchemas.isPending is false", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12cas301", order: 1 });

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [s1] })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    expect(screen.getByTestId("schema-card-mock")).toHaveAttribute("data-parent-pending", "false");
  });
});

describe("BlockCardBody DR-W4E-SG-WRAP: schema-group select-mode create", () => {
  const GROUP_BUTTON = "Group schemas";
  const GROUP_BAR_BUTTON = "Group schemas";

  it("shows the 'Group schemas' toggle when at least two ungrouped schemas exist", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12sgw001", order: 1 });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd12sgw002", order: 2 });

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [s1, s2] })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    expect(screen.getByRole("button", { name: GROUP_BUTTON })).toBeInTheDocument();
  });

  it("hides the 'Group schemas' toggle when fewer than two ungrouped schemas exist", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12sgw010", order: 1 });

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [s1] })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    expect(screen.queryByRole("button", { name: GROUP_BUTTON })).toBeNull();
  });

  it("counts only ungrouped schemas toward the toggle threshold (grouped members excluded)", () => {
    const GROUP_ID = "clp9z8x7w0000abcd12sgw0gr";
    const m1 = makeSchema({ id: "clp9z8x7w0000abcd12sgw020", order: 1, groupId: GROUP_ID });
    const m2 = makeSchema({ id: "clp9z8x7w0000abcd12sgw021", order: 2, groupId: GROUP_ID });
    const flat = makeSchema({ id: "clp9z8x7w0000abcd12sgw022", order: 3 });

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [m1, m2, flat], groups: [makeGroup({ id: GROUP_ID })] })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    expect(screen.queryByRole("button", { name: GROUP_BUTTON })).toBeNull();
  });

  it("enters select-mode and threads select props only to standalone SchemaCards", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12sgw030", order: 1 });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd12sgw031", order: 2 });

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [s1, s2] })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: GROUP_BUTTON }));

    const cards = screen.getAllByTestId("schema-card-mock");

    for (const card of cards) {
      expect(card).toHaveAttribute("data-select-mode", "true");
    }
  });

  it("disables standalone SchemaCard drag while select-mode is active (QA-B-06)", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12sgw0d0", order: 1 });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd12sgw0d1", order: 2 });

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [s1, s2] })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    for (const card of screen.getAllByTestId("schema-card-mock")) {
      expect(card).toHaveAttribute("data-draggable", "true");
    }

    fireEvent.click(screen.getByRole("button", { name: GROUP_BUTTON }));

    for (const card of screen.getAllByTestId("schema-card-mock")) {
      expect(card).toHaveAttribute("data-draggable", "false");
    }
  });

  it("runs useCreateSchemaGroup with the full block schemas and selected ids after selecting two and confirming", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12sgw040", order: 1 });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd12sgw041", order: 2 });
    const block = makeBlock({ schemas: [s1, s2] });

    render(<BlockCardBody block={block} planId={PLAN_ID} startDate={START_DATE} />);

    fireEvent.click(screen.getByRole("button", { name: GROUP_BUTTON }));

    const cards = screen.getAllByTestId("schema-card-mock");

    for (const card of cards) {
      fireEvent.click(card);
    }

    fireEvent.click(screen.getByRole("button", { name: GROUP_BAR_BUTTON }));

    expect(createSchemaGroupRun).toHaveBeenCalledTimes(1);

    const args = createSchemaGroupRun.mock.calls[0]?.[0];

    if (args === undefined) {
      throw new Error("useCreateSchemaGroup.run was not called");
    }

    expect(args.blockId).toBe(BLOCK_ID);
    expect(args.schemas).toBe(block.schemas);
    expect([...args.selectedIds]).toEqual([s1.schema.id, s2.schema.id]);
  });

  it("keeps the 'Group schemas' confirm disabled until two schemas are selected", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12sgw050", order: 1 });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd12sgw051", order: 2 });

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [s1, s2] })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: GROUP_BUTTON }));

    expect(screen.getByRole("button", { name: GROUP_BAR_BUTTON })).toBeDisabled();

    fireEvent.click(screen.getAllByTestId("schema-card-mock")[0] as HTMLElement);

    expect(screen.getByRole("button", { name: GROUP_BAR_BUTTON })).toBeDisabled();

    fireEvent.click(screen.getAllByTestId("schema-card-mock")[1] as HTMLElement);

    expect(screen.getByRole("button", { name: GROUP_BAR_BUTTON })).toBeEnabled();
  });

  it("exits select-mode via Cancel without invoking the create hook", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12sgw060", order: 1 });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd12sgw061", order: 2 });

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [s1, s2] })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: GROUP_BUTTON }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("button", { name: GROUP_BUTTON })).toBeInTheDocument();
    expect(createSchemaGroupRun).not.toHaveBeenCalled();
  });
});

describe("BlockCardBody W3-DND-POLISH: drag overlay ghost + vertical-axis modifier", () => {
  it("passes the restrict-to-vertical-axis modifier to the DndContext", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12dnp001", order: 1 });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd12dnp002", order: 2 });

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [s1, s2] })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    expect(capturedModifiers).toEqual([restrictToVerticalAxis]);
  });

  it("renders an empty DragOverlay (no ghost) before any drag starts", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12dnp010", order: 1 });

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [s1] })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    expect(screen.getByTestId("drag-overlay-mock")).toBeEmptyDOMElement();
  });

  it("shows the schema header in the ghost when a schema drag starts", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12dnp020", order: 1, header: "WOD A" });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd12dnp021", order: 2 });

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [s1, s2] })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    triggerDragStart(`schema:${s1.schema.id}`);

    const overlay = screen.getByTestId("drag-overlay-mock");

    expect(within(overlay).getByText("WOD A")).toBeInTheDocument();
  });

  it("shows the group label in the ghost when a group drag starts", () => {
    const GROUP_ID = "clp9z8x7w0000abcd12dnpgr1";
    const m1 = makeSchema({ id: "clp9z8x7w0000abcd12dnp030", order: 1, groupId: GROUP_ID });
    const m2 = makeSchema({ id: "clp9z8x7w0000abcd12dnp031", order: 2, groupId: GROUP_ID });

    render(
      <BlockCardBody
        block={makeBlock({
          schemas: [m1, m2],
          groups: [makeGroup({ id: GROUP_ID, notes: ["Conditioning"] })],
        })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    triggerDragStart(`group:${GROUP_ID}`);

    const overlay = screen.getByTestId("drag-overlay-mock");

    expect(within(overlay).getByText("Conditioning")).toBeInTheDocument();
  });

  it("clears the ghost when the drag ends", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12dnp040", order: 1, header: "WOD A" });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd12dnp041", order: 2 });

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [s1, s2] })}
        planId={PLAN_ID}
        startDate={START_DATE}
      />,
    );

    triggerDragStart(`schema:${s1.schema.id}`);

    expect(within(screen.getByTestId("drag-overlay-mock")).getByText("WOD A")).toBeInTheDocument();

    triggerDragEnd(makeDragEndEvent(`schema:${s1.schema.id}`, `schema:${s2.schema.id}`));

    expect(screen.getByTestId("drag-overlay-mock")).toBeEmptyDOMElement();
  });
});
