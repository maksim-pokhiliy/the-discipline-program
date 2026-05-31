import { createElement, type ReactNode } from "react";

import type * as DndKitCore from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const reorderSchemaRowsMutate = vi.fn();
const reorderSchemaRowsState = { isPending: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useReorderSchemaRows: () => ({
      mutate: reorderSchemaRowsMutate,
      isPending: reorderSchemaRowsState.isPending,
    }),
  };
});

vi.mock("./schema-row-card", () => {
  const renderSchemaRowCardMock = (props: { row: SchemaRow }) =>
    createElement(
      "div",
      {
        "data-testid": "schema-row-card-mock",
        "data-row-id": props.row.id,
      },
      `schema-row-card:${props.row.id}`,
    );

  return { SchemaRowCard: renderSchemaRowCardMock };
});

vi.mock("./add-row-button", () => {
  const renderAddRowButtonMock = () =>
    createElement("div", { "data-testid": "add-row-button-mock" });

  return { AddRowButton: renderAddRowButtonMock };
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

const { SchemaRowList } = await import("./schema-row-list");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const SCHEMA_ID = "clp9z8x7w0000abcd1234sch1";
const NOW = new Date("2026-01-06T00:00:00.000Z");

const makeRow = (overrides: Partial<SchemaRow> = {}): SchemaRow => ({
  id: "clp9z8x7w0000abcd1234row1",
  schemaId: SCHEMA_ID,
  order: 1,
  rowKind: "REST_SLOT",
  rowPayload: { rowKind: "REST_SLOT" },
  load: null,
  reps: null,
  side: null,
  tempo: null,
  position: null,
  sequence: null,
  intensity: null,
  media: null,
  compoundRep: null,
  notes: null,
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
  reorderSchemaRowsMutate.mockReset();
  reorderSchemaRowsState.isPending = false;
  capturedOnDragEnd = null;
});

describe("SchemaRowList drag-end guards (QA-Must-01, QA-Must-02)", () => {
  it("does NOT fire mutate when active.id === over.id (QA-Must-01)", () => {
    const r1 = makeRow({ id: "clp9z8x7w0000abcd12gd1r001", order: 1 });
    const r2 = makeRow({ id: "clp9z8x7w0000abcd12gd1r002", order: 2 });

    render(
      <SchemaRowList
        planId={PLAN_ID}
        startDate={START_DATE}
        schemaId={SCHEMA_ID}
        rows={[r1, r2]}
      />,
    );

    triggerDragEnd(makeDragEndEvent(r1.id, r1.id));

    expect(reorderSchemaRowsMutate).not.toHaveBeenCalled();
  });

  it("does NOT fire mutate when over is null (QA-Must-02, also covers Escape cancel)", () => {
    const r1 = makeRow({ id: "clp9z8x7w0000abcd12gd2r001", order: 1 });
    const r2 = makeRow({ id: "clp9z8x7w0000abcd12gd2r002", order: 2 });

    render(
      <SchemaRowList
        planId={PLAN_ID}
        startDate={START_DATE}
        schemaId={SCHEMA_ID}
        rows={[r1, r2]}
      />,
    );

    triggerDragEnd(makeDragEndEventNoOver(r1.id));

    expect(reorderSchemaRowsMutate).not.toHaveBeenCalled();
  });
});

describe("SchemaRowList optimistic + rollback (QA-Must-05)", () => {
  it("reverts sortedRows to previous order when mutate onError fires", () => {
    const r1 = makeRow({ id: "clp9z8x7w0000abcd12ro1r001", order: 1 });
    const r2 = makeRow({ id: "clp9z8x7w0000abcd12ro1r002", order: 2 });

    reorderSchemaRowsMutate.mockImplementation(
      (_payload: unknown, options: { onError?: (error: Error) => void } | undefined) => {
        options?.onError?.(new Error("simulated reorder failure"));
      },
    );

    const { container } = render(
      <SchemaRowList
        planId={PLAN_ID}
        startDate={START_DATE}
        schemaId={SCHEMA_ID}
        rows={[r1, r2]}
      />,
    );

    triggerDragEnd(makeDragEndEvent(r2.id, r1.id));

    const renderedIds = Array.from(
      container.querySelectorAll('[data-testid="schema-row-card-mock"]'),
    ).map((node) => node.getAttribute("data-row-id"));

    expect(renderedIds).toEqual([r1.id, r2.id]);
  });

  it("sends { schemaId, orderedIds } payload on a valid drag", () => {
    const r1 = makeRow({ id: "clp9z8x7w0000abcd12pl1r001", order: 1 });
    const r2 = makeRow({ id: "clp9z8x7w0000abcd12pl1r002", order: 2 });

    render(
      <SchemaRowList
        planId={PLAN_ID}
        startDate={START_DATE}
        schemaId={SCHEMA_ID}
        rows={[r1, r2]}
      />,
    );

    triggerDragEnd(makeDragEndEvent(r2.id, r1.id));

    expect(reorderSchemaRowsMutate).toHaveBeenCalledTimes(1);

    const payload = reorderSchemaRowsMutate.mock.calls[0]?.[0];

    expect(payload).toEqual({ schemaId: SCHEMA_ID, orderedIds: [r2.id, r1.id] });
  });
});
