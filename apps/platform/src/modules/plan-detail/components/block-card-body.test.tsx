import { createElement, type ReactNode } from "react";

import type * as DndKitCore from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AlternatingGroup } from "@repo/contracts/lms/alternating-group";
import type { Block } from "@repo/contracts/lms/block";
import type { Exercise } from "@repo/contracts/lms/exercise";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const reorderSchemasMutate = vi.fn();
const reorderSchemasState = { isPending: false };

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

vi.mock("./schema-card", () => {
  const renderSchemaCardMock = (props: {
    schema: SchemaWithBody;
    parentIsReorderPending?: boolean;
  }) =>
    createElement(
      "div",
      {
        "data-testid": "schema-card-mock",
        "data-schema-id": props.schema.schema.id,
        "data-parent-pending": props.parentIsReorderPending === true ? "true" : "false",
      },
      `schema-card:${props.schema.schema.id}`,
    );

  return { SchemaCard: renderSchemaCardMock };
});

vi.mock("./add-schema-button", () => {
  const renderAddSchemaButtonMock = () =>
    createElement("div", { "data-testid": "add-schema-button-mock" });

  return { AddSchemaButton: renderAddSchemaButtonMock };
});

let capturedOnDragEnd: ((event: DragEndEvent) => void) | null = null;

vi.mock("@dnd-kit/core", async () => {
  const actual = await vi.importActual<typeof DndKitCore>("@dnd-kit/core");

  const DndContextMock = ({
    onDragEnd,
    children,
  }: {
    onDragEnd: (event: DragEndEvent) => void;
    children: ReactNode;
  }) => {
    capturedOnDragEnd = onDragEnd;

    return createElement("div", { "data-testid": "dnd-context-mock" }, children);
  };

  return {
    ...actual,
    DndContext: DndContextMock,
  };
});

const { BlockCardBody } = await import("./block-card-body");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const SESSION_ID = "clp9z8x7w0000abcd1234ses1";
const ARCHETYPE_ID = "clp9z8x7w0000abcd1234arc1";
const NOW = new Date("2026-01-06T00:00:00.000Z");

const EMPTY_EXERCISE_BY_ID: ReadonlyMap<string, Exercise> = new Map();

const makeSchema = (overrides: Partial<SchemaWithBody["schema"]> = {}): SchemaWithBody => ({
  schema: {
    id: "clp9z8x7w0000abcd1234sch1",
    blockId: BLOCK_ID,
    parentSchemaId: null,
    alternatingGroupId: null,
    order: 1,
    kind: "ATOMIC",
    archetypeId: ARCHETYPE_ID,
    header: null,
    archetypeParams: { archetype: "single-line-bare", params: {} },
    intensity: null,
    trailingConnector: null,
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  },
  rows: [],
  subSchemas: [],
});

const makeAltGroup = (overrides: Partial<AlternatingGroup> = {}): AlternatingGroup => ({
  id: "clp9z8x7w0000abcd1234alt1",
  blockId: BLOCK_ID,
  relationKind: "ALTERNATING_SETS",
  schemaIds: [],
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const makeBlock = (overrides: Partial<Block> = {}): Block => ({
  id: BLOCK_ID,
  sessionId: SESSION_ID,
  order: 1,
  intensity: null,
  timeCap: null,
  notes: null,
  labels: [],
  schemas: [],
  alternatingGroups: [],
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

  capturedOnDragEnd(event);
};

afterEach(() => {
  reorderSchemasMutate.mockReset();
  reorderSchemasState.isPending = false;
  capturedOnDragEnd = null;
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
        exerciseById={EMPTY_EXERCISE_BY_ID}
      />,
    );

    triggerDragEnd(makeDragEndEvent(s2.schema.id, s1.schema.id));

    expect(reorderSchemasMutate).toHaveBeenCalledTimes(1);

    const payload = reorderSchemasMutate.mock.calls[0]?.[0];

    expect(payload).toEqual({
      blockId: BLOCK_ID,
      orderedIds: [s2.schema.id, s1.schema.id, s3.schema.id],
    });
    expect(payload).not.toHaveProperty("parentSchemaId");
  });
});

describe("BlockCardBody QA-01: cross-alt-group drag is forbidden", () => {
  it("does NOT fire mutate when active is a standalone and over is an alt-group member", () => {
    const altGroupId = "clp9z8x7w0000abcd12qa1alt1";
    const a1 = makeSchema({
      id: "clp9z8x7w0000abcd12qa1m001",
      alternatingGroupId: altGroupId,
      order: 1,
    });
    const a2 = makeSchema({
      id: "clp9z8x7w0000abcd12qa1m002",
      alternatingGroupId: altGroupId,
      order: 2,
    });
    const standalone = makeSchema({
      id: "clp9z8x7w0000abcd12qa1s003",
      alternatingGroupId: null,
      order: 3,
    });

    render(
      <BlockCardBody
        block={makeBlock({
          schemas: [a1, a2, standalone],
          alternatingGroups: [
            makeAltGroup({ id: altGroupId, schemaIds: [a1.schema.id, a2.schema.id] }),
          ],
        })}
        planId={PLAN_ID}
        startDate={START_DATE}
        exerciseById={EMPTY_EXERCISE_BY_ID}
      />,
    );

    triggerDragEnd(makeDragEndEvent(standalone.schema.id, a1.schema.id));

    expect(reorderSchemasMutate).not.toHaveBeenCalled();
  });

  it("does NOT fire mutate when active and over belong to DIFFERENT alt-groups", () => {
    const altGroupA = "clp9z8x7w0000abcd12qa2altA";
    const altGroupB = "clp9z8x7w0000abcd12qa2altB";
    const a1 = makeSchema({
      id: "clp9z8x7w0000abcd12qa2a001",
      alternatingGroupId: altGroupA,
      order: 1,
    });
    const b1 = makeSchema({
      id: "clp9z8x7w0000abcd12qa2b001",
      alternatingGroupId: altGroupB,
      order: 2,
    });

    render(
      <BlockCardBody
        block={makeBlock({
          schemas: [a1, b1],
          alternatingGroups: [
            makeAltGroup({ id: altGroupA, schemaIds: [a1.schema.id] }),
            makeAltGroup({ id: altGroupB, schemaIds: [b1.schema.id] }),
          ],
        })}
        planId={PLAN_ID}
        startDate={START_DATE}
        exerciseById={EMPTY_EXERCISE_BY_ID}
      />,
    );

    triggerDragEnd(makeDragEndEvent(a1.schema.id, b1.schema.id));

    expect(reorderSchemasMutate).not.toHaveBeenCalled();
  });

  it("DOES fire mutate when active and over are BOTH standalone schemas in the same block", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12qa3s001", order: 1 });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd12qa3s002", order: 2 });

    render(
      <BlockCardBody
        block={makeBlock({ schemas: [s1, s2] })}
        planId={PLAN_ID}
        startDate={START_DATE}
        exerciseById={EMPTY_EXERCISE_BY_ID}
      />,
    );

    triggerDragEnd(makeDragEndEvent(s2.schema.id, s1.schema.id));

    expect(reorderSchemasMutate).toHaveBeenCalledTimes(1);
    expect(reorderSchemasMutate.mock.calls[0]?.[0]).toEqual({
      blockId: BLOCK_ID,
      orderedIds: [s2.schema.id, s1.schema.id],
    });
  });

  it("DOES fire mutate when active and over are members of the SAME alt-group", () => {
    const altGroupId = "clp9z8x7w0000abcd12qa4alt1";
    const a1 = makeSchema({
      id: "clp9z8x7w0000abcd12qa4m001",
      alternatingGroupId: altGroupId,
      order: 1,
    });
    const a2 = makeSchema({
      id: "clp9z8x7w0000abcd12qa4m002",
      alternatingGroupId: altGroupId,
      order: 2,
    });

    render(
      <BlockCardBody
        block={makeBlock({
          schemas: [a1, a2],
          alternatingGroups: [
            makeAltGroup({ id: altGroupId, schemaIds: [a1.schema.id, a2.schema.id] }),
          ],
        })}
        planId={PLAN_ID}
        startDate={START_DATE}
        exerciseById={EMPTY_EXERCISE_BY_ID}
      />,
    );

    triggerDragEnd(makeDragEndEvent(a2.schema.id, a1.schema.id));

    expect(reorderSchemasMutate).toHaveBeenCalledTimes(1);
    expect(reorderSchemasMutate.mock.calls[0]?.[0]).toEqual({
      blockId: BLOCK_ID,
      orderedIds: [a2.schema.id, a1.schema.id],
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
        exerciseById={EMPTY_EXERCISE_BY_ID}
      />,
    );

    triggerDragEnd(makeDragEndEvent(s1.schema.id, s1.schema.id));

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
        exerciseById={EMPTY_EXERCISE_BY_ID}
      />,
    );

    triggerDragEnd(makeDragEndEventNoOver(s1.schema.id));

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
        exerciseById={EMPTY_EXERCISE_BY_ID}
      />,
    );

    triggerDragEnd(makeDragEndEvent(s2.schema.id, s1.schema.id));

    const renderedIds = Array.from(
      container.querySelectorAll('[data-testid="schema-card-mock"]'),
    ).map((node) => node.getAttribute("data-schema-id"));

    expect(renderedIds).toEqual([s1.schema.id, s2.schema.id]);
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
        exerciseById={EMPTY_EXERCISE_BY_ID}
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
        exerciseById={EMPTY_EXERCISE_BY_ID}
      />,
    );

    expect(screen.getByTestId("schema-card-mock")).toHaveAttribute("data-parent-pending", "false");
  });
});
