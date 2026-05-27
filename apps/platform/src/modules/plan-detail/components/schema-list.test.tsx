import { createElement, type ReactNode } from "react";

import type * as DndKitCore from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Exercise } from "@repo/contracts/lms/exercise";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import type { BlockCtx } from "../lib/build-cascade-chips";

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

const { SchemaList } = await import("./schema-list");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const PARENT_SCHEMA_ID = "clp9z8x7w0000abcd1234psc1";
const ARCHETYPE_ID = "clp9z8x7w0000abcd1234arc1";
const NOW = new Date("2026-01-06T00:00:00.000Z");

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

const makeBlockCtx = (overrides: Partial<BlockCtx> = {}): BlockCtx => ({
  intensity: null,
  timeCap: null,
  ...overrides,
});

const EMPTY_EXERCISE_BY_ID: ReadonlyMap<string, Exercise> = new Map();

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

describe("SchemaList parent.kind === 'block' (D-03 block branch)", () => {
  it("sends { blockId, orderedIds } payload without parentSchemaId key", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12340001", order: 1 });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd12340002", order: 2 });
    const s3 = makeSchema({ id: "clp9z8x7w0000abcd12340003", order: 3 });
    const schemas = [s1, s2, s3];

    render(
      <SchemaList
        planId={PLAN_ID}
        startDate={START_DATE}
        parent={{ kind: "block", blockId: BLOCK_ID, allBlockSchemas: schemas }}
        schemas={schemas}
        blockCtx={makeBlockCtx()}
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

describe("SchemaList parent.kind === 'schema' (D-03 sub-schema branch)", () => {
  it("sends { parentSchemaId, orderedIds } payload without blockId key", () => {
    const sub0 = makeSchema({
      id: "clp9z8x7w0000abcd12345001",
      parentSchemaId: PARENT_SCHEMA_ID,
      order: 1,
    });
    const sub1 = makeSchema({
      id: "clp9z8x7w0000abcd12345002",
      parentSchemaId: PARENT_SCHEMA_ID,
      order: 2,
    });
    const sub2 = makeSchema({
      id: "clp9z8x7w0000abcd12345003",
      parentSchemaId: PARENT_SCHEMA_ID,
      order: 3,
    });
    const schemas = [sub0, sub1, sub2];

    render(
      <SchemaList
        planId={PLAN_ID}
        startDate={START_DATE}
        parent={{ kind: "schema", parentSchemaId: PARENT_SCHEMA_ID }}
        schemas={schemas}
        blockCtx={makeBlockCtx()}
        exerciseById={EMPTY_EXERCISE_BY_ID}
      />,
    );

    triggerDragEnd(makeDragEndEvent(sub1.schema.id, sub2.schema.id));

    expect(reorderSchemasMutate).toHaveBeenCalledTimes(1);

    const payload = reorderSchemasMutate.mock.calls[0]?.[0];

    expect(payload).toEqual({
      parentSchemaId: PARENT_SCHEMA_ID,
      orderedIds: [sub0.schema.id, sub2.schema.id, sub1.schema.id],
    });
    expect(payload).not.toHaveProperty("blockId");
  });
});

describe("SchemaList D-09 full-block orderedIds reconstruction", () => {
  it("includes ALL block schemas when dragging within an alt-group subset (2 alt-groups)", () => {
    const a1 = makeSchema({ id: "clp9z8x7w0000abcd123ag1a1", order: 1 });
    const a2 = makeSchema({ id: "clp9z8x7w0000abcd123ag1a2", order: 2 });
    const a3 = makeSchema({ id: "clp9z8x7w0000abcd123ag1a3", order: 3 });
    const b1 = makeSchema({ id: "clp9z8x7w0000abcd123ag2b1", order: 4 });
    const b2 = makeSchema({ id: "clp9z8x7w0000abcd123ag2b2", order: 5 });
    const allBlockSchemas = [a1, a2, a3, b1, b2];

    render(
      <SchemaList
        planId={PLAN_ID}
        startDate={START_DATE}
        parent={{ kind: "block", blockId: BLOCK_ID, allBlockSchemas }}
        schemas={[a1, a2, a3]}
        blockCtx={makeBlockCtx()}
        exerciseById={EMPTY_EXERCISE_BY_ID}
      />,
    );

    triggerDragEnd(makeDragEndEvent(a2.schema.id, a1.schema.id));

    expect(reorderSchemasMutate).toHaveBeenCalledTimes(1);

    const payload = reorderSchemasMutate.mock.calls[0]?.[0];

    expect(payload).toEqual({
      blockId: BLOCK_ID,
      orderedIds: [a2.schema.id, a1.schema.id, a3.schema.id, b1.schema.id, b2.schema.id],
    });
  });

  it("matches a direct arrayMove when visible subset equals full block (single alt-group)", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd123sa1aa", order: 1 });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd123sa1bb", order: 2 });
    const s3 = makeSchema({ id: "clp9z8x7w0000abcd123sa1cc", order: 3 });
    const schemas = [s1, s2, s3];

    render(
      <SchemaList
        planId={PLAN_ID}
        startDate={START_DATE}
        parent={{ kind: "block", blockId: BLOCK_ID, allBlockSchemas: schemas }}
        schemas={schemas}
        blockCtx={makeBlockCtx()}
        exerciseById={EMPTY_EXERCISE_BY_ID}
      />,
    );

    triggerDragEnd(makeDragEndEvent(s3.schema.id, s1.schema.id));

    expect(reorderSchemasMutate).toHaveBeenCalledTimes(1);

    const payload = reorderSchemasMutate.mock.calls[0]?.[0];

    expect(payload).toEqual({
      blockId: BLOCK_ID,
      orderedIds: [s3.schema.id, s1.schema.id, s2.schema.id],
    });
  });
});

describe("SchemaList optimistic + rollback (D-03 block branch)", () => {
  it("reverts sortedSchemas to previous order when mutate onError fires", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd1234ro01", order: 1 });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd1234ro02", order: 2 });
    const schemas = [s1, s2];

    reorderSchemasMutate.mockImplementation(
      (_payload: unknown, options: { onError?: (error: Error) => void } | undefined) => {
        options?.onError?.(new Error("simulated reorder failure"));
      },
    );

    const { container } = render(
      <SchemaList
        planId={PLAN_ID}
        startDate={START_DATE}
        parent={{ kind: "block", blockId: BLOCK_ID, allBlockSchemas: schemas }}
        schemas={schemas}
        blockCtx={makeBlockCtx()}
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

describe("SchemaList parentIsReorderPending cascade (D-10)", () => {
  it("propagates effective pending to every SchemaCard when parentIsReorderPending is true", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12cas001", order: 1 });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd12cas002", order: 2 });
    const schemas = [s1, s2];

    render(
      <SchemaList
        planId={PLAN_ID}
        startDate={START_DATE}
        parent={{ kind: "block", blockId: BLOCK_ID, allBlockSchemas: schemas }}
        schemas={schemas}
        blockCtx={makeBlockCtx()}
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
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12cas101", order: 1 });
    const schemas = [s1];

    render(
      <SchemaList
        planId={PLAN_ID}
        startDate={START_DATE}
        parent={{ kind: "block", blockId: BLOCK_ID, allBlockSchemas: schemas }}
        schemas={schemas}
        blockCtx={makeBlockCtx()}
        exerciseById={EMPTY_EXERCISE_BY_ID}
      />,
    );

    expect(screen.getByTestId("schema-card-mock")).toHaveAttribute("data-parent-pending", "false");
  });
});

describe("SchemaList empty schemas", () => {
  it("renders null when schemas is an empty array", () => {
    const { container } = render(
      <SchemaList
        planId={PLAN_ID}
        startDate={START_DATE}
        parent={{ kind: "block", blockId: BLOCK_ID, allBlockSchemas: [] }}
        schemas={[]}
        blockCtx={makeBlockCtx()}
        exerciseById={EMPTY_EXERCISE_BY_ID}
      />,
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId("dnd-context-mock")).toBeNull();
    expect(screen.queryByTestId("schema-card-mock")).toBeNull();
  });
});
