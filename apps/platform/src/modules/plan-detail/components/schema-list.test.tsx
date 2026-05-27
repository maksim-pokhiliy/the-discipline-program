import { createElement, type ReactNode } from "react";

import type * as DndKitCore from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
    parentSchemaId: PARENT_SCHEMA_ID,
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

const renderTestItem = (schema: SchemaWithBody, pending: boolean): ReactNode =>
  createElement(
    "div",
    {
      key: schema.schema.id,
      "data-testid": "schema-item-mock",
      "data-schema-id": schema.schema.id,
      "data-parent-pending": pending ? "true" : "false",
    },
    `schema:${schema.schema.id}`,
  );

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

describe("SchemaList sub-schema drag-end payload", () => {
  it("sends { parentSchemaId, orderedIds } payload without blockId key", () => {
    const sub0 = makeSchema({ id: "clp9z8x7w0000abcd12345001", order: 1 });
    const sub1 = makeSchema({ id: "clp9z8x7w0000abcd12345002", order: 2 });
    const sub2 = makeSchema({ id: "clp9z8x7w0000abcd12345003", order: 3 });
    const schemas = [sub0, sub1, sub2];

    render(
      <SchemaList
        planId={PLAN_ID}
        startDate={START_DATE}
        parentSchemaId={PARENT_SCHEMA_ID}
        schemas={schemas}
        renderItem={renderTestItem}
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

describe("SchemaList drag-end guards (QA-Must-01, QA-Must-02)", () => {
  it("does NOT fire mutate when active.id === over.id (QA-Must-01)", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12gd1s001", order: 1 });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd12gd1s002", order: 2 });

    render(
      <SchemaList
        planId={PLAN_ID}
        startDate={START_DATE}
        parentSchemaId={PARENT_SCHEMA_ID}
        schemas={[s1, s2]}
        renderItem={renderTestItem}
      />,
    );

    triggerDragEnd(makeDragEndEvent(s1.schema.id, s1.schema.id));

    expect(reorderSchemasMutate).not.toHaveBeenCalled();
  });

  it("does NOT fire mutate when over is null (QA-Must-02, also covers Escape cancel)", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12gd2s001", order: 1 });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd12gd2s002", order: 2 });

    render(
      <SchemaList
        planId={PLAN_ID}
        startDate={START_DATE}
        parentSchemaId={PARENT_SCHEMA_ID}
        schemas={[s1, s2]}
        renderItem={renderTestItem}
      />,
    );

    triggerDragEnd(makeDragEndEventNoOver(s1.schema.id));

    expect(reorderSchemasMutate).not.toHaveBeenCalled();
  });
});

describe("SchemaList optimistic + rollback", () => {
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
        parentSchemaId={PARENT_SCHEMA_ID}
        schemas={schemas}
        renderItem={renderTestItem}
      />,
    );

    triggerDragEnd(makeDragEndEvent(s2.schema.id, s1.schema.id));

    const renderedIds = Array.from(
      container.querySelectorAll('[data-testid="schema-item-mock"]'),
    ).map((node) => node.getAttribute("data-schema-id"));

    expect(renderedIds).toEqual([s1.schema.id, s2.schema.id]);
  });
});

describe("SchemaList parentIsReorderPending cascade (D-10)", () => {
  it("propagates effective pending to every renderItem when parentIsReorderPending is true", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12cas001", order: 1 });
    const s2 = makeSchema({ id: "clp9z8x7w0000abcd12cas002", order: 2 });
    const schemas = [s1, s2];

    render(
      <SchemaList
        planId={PLAN_ID}
        startDate={START_DATE}
        parentSchemaId={PARENT_SCHEMA_ID}
        schemas={schemas}
        parentIsReorderPending
        renderItem={renderTestItem}
      />,
    );

    const items = screen.getAllByTestId("schema-item-mock");

    expect(items).toHaveLength(2);

    for (const item of items) {
      expect(item).toHaveAttribute("data-parent-pending", "true");
    }
  });

  it("passes data-parent-pending='false' to every renderItem when parentIsReorderPending is omitted and reorderSchemas.isPending is false", () => {
    const s1 = makeSchema({ id: "clp9z8x7w0000abcd12cas101", order: 1 });
    const schemas = [s1];

    render(
      <SchemaList
        planId={PLAN_ID}
        startDate={START_DATE}
        parentSchemaId={PARENT_SCHEMA_ID}
        schemas={schemas}
        renderItem={renderTestItem}
      />,
    );

    expect(screen.getByTestId("schema-item-mock")).toHaveAttribute("data-parent-pending", "false");
  });
});

describe("SchemaList empty schemas", () => {
  it("renders null when schemas is an empty array", () => {
    const { container } = render(
      <SchemaList
        planId={PLAN_ID}
        startDate={START_DATE}
        parentSchemaId={PARENT_SCHEMA_ID}
        schemas={[]}
        renderItem={renderTestItem}
      />,
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId("dnd-context-mock")).toBeNull();
    expect(screen.queryByTestId("schema-item-mock")).toBeNull();
  });
});
