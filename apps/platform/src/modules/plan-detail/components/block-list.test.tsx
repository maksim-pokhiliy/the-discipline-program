import { createElement, type ReactNode } from "react";

import type * as DndKitCore from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Block } from "@repo/contracts/lms/block";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const reorderBlocksMutate = vi.fn();
const reorderBlocksState = { isPending: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useReorderBlocks: () => ({
      mutate: reorderBlocksMutate,
      isPending: reorderBlocksState.isPending,
    }),
  };
});

vi.mock("./block-card", () => {
  const renderBlockCardMock = (props: { block: Block }) =>
    createElement(
      "div",
      {
        "data-testid": "block-card-mock",
        "data-block-id": props.block.id,
      },
      `block-card:${props.block.id}`,
    );

  return { BlockCard: renderBlockCardMock };
});

vi.mock("./add-block-button", () => {
  const renderAddBlockButtonMock = () =>
    createElement("div", { "data-testid": "add-block-button-mock" });

  return { AddBlockButton: renderAddBlockButtonMock };
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

const { BlockList } = await import("./block-list");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const SESSION_ID = "clp9z8x7w0000abcd1234ses1";
const NOW = new Date("2026-01-06T00:00:00.000Z");

const makeBlock = (overrides: Partial<Block> = {}): Block => ({
  id: "clp9z8x7w0000abcd1234blk1",
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
  reorderBlocksMutate.mockReset();
  reorderBlocksState.isPending = false;
  capturedOnDragEnd = null;
});

describe("BlockList drag-end guards (QA-Must-01, QA-Must-02)", () => {
  it("does NOT fire mutate when active.id === over.id (QA-Must-01)", () => {
    const b1 = makeBlock({ id: "clp9z8x7w0000abcd12gd1b001", order: 1 });
    const b2 = makeBlock({ id: "clp9z8x7w0000abcd12gd1b002", order: 2 });

    render(
      <BlockList
        planId={PLAN_ID}
        startDate={START_DATE}
        sessionId={SESSION_ID}
        blocks={[b1, b2]}
      />,
    );

    triggerDragEnd(makeDragEndEvent(b1.id, b1.id));

    expect(reorderBlocksMutate).not.toHaveBeenCalled();
  });

  it("does NOT fire mutate when over is null (QA-Must-02, also covers Escape cancel)", () => {
    const b1 = makeBlock({ id: "clp9z8x7w0000abcd12gd2b001", order: 1 });
    const b2 = makeBlock({ id: "clp9z8x7w0000abcd12gd2b002", order: 2 });

    render(
      <BlockList
        planId={PLAN_ID}
        startDate={START_DATE}
        sessionId={SESSION_ID}
        blocks={[b1, b2]}
      />,
    );

    triggerDragEnd(makeDragEndEventNoOver(b1.id));

    expect(reorderBlocksMutate).not.toHaveBeenCalled();
  });
});

describe("BlockList optimistic + rollback (QA-Must-05)", () => {
  it("reverts sortedBlocks to previous order when mutate onError fires", () => {
    const b1 = makeBlock({ id: "clp9z8x7w0000abcd12ro1b001", order: 1 });
    const b2 = makeBlock({ id: "clp9z8x7w0000abcd12ro1b002", order: 2 });

    reorderBlocksMutate.mockImplementation(
      (_payload: unknown, options: { onError?: (error: Error) => void } | undefined) => {
        options?.onError?.(new Error("simulated reorder failure"));
      },
    );

    const { container } = render(
      <BlockList
        planId={PLAN_ID}
        startDate={START_DATE}
        sessionId={SESSION_ID}
        blocks={[b1, b2]}
      />,
    );

    triggerDragEnd(makeDragEndEvent(b2.id, b1.id));

    const renderedIds = Array.from(
      container.querySelectorAll('[data-testid="block-card-mock"]'),
    ).map((node) => node.getAttribute("data-block-id"));

    expect(renderedIds).toEqual([b1.id, b2.id]);
  });

  it("sends { orderedIds } payload (no inactive scope keys) on a valid drag", () => {
    const b1 = makeBlock({ id: "clp9z8x7w0000abcd12pl1b001", order: 1 });
    const b2 = makeBlock({ id: "clp9z8x7w0000abcd12pl1b002", order: 2 });

    render(
      <BlockList
        planId={PLAN_ID}
        startDate={START_DATE}
        sessionId={SESSION_ID}
        blocks={[b1, b2]}
      />,
    );

    triggerDragEnd(makeDragEndEvent(b2.id, b1.id));

    expect(reorderBlocksMutate).toHaveBeenCalledTimes(1);

    const payload = reorderBlocksMutate.mock.calls[0]?.[0];

    expect(payload).toEqual({ orderedIds: [b2.id, b1.id] });
  });
});
