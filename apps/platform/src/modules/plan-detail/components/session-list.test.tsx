import { createElement, type ReactNode } from "react";

import type * as DndKitCore from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import type { SessionWithLabel } from "@repo/contracts/lms/day";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const reorderSessionsMutate = vi.fn();
const reorderSessionsState = { isPending: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useReorderSessions: () => ({
      mutate: reorderSessionsMutate,
      isPending: reorderSessionsState.isPending,
    }),
  };
});

vi.mock("./session-card", () => {
  const renderSessionCardMock = (props: { session: SessionWithLabel }) =>
    createElement(
      "div",
      {
        "data-testid": "session-card-mock",
        "data-session-id": props.session.id,
      },
      `session-card:${props.session.id}`,
    );

  return { SessionCard: renderSessionCardMock };
});

vi.mock("./add-session-button", () => {
  const renderAddSessionButtonMock = () =>
    createElement("div", { "data-testid": "add-session-button-mock" });

  return { AddSessionButton: renderAddSessionButtonMock };
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

const { SessionList } = await import("./session-list");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const DAY_OF_WEEK: DayOfWeek = "MONDAY";
const NOW = new Date("2026-01-06T00:00:00.000Z");

const makeSession = (overrides: Partial<SessionWithLabel> = {}): SessionWithLabel => ({
  id: "clp9z8x7w0000abcd1234ses1",
  dayId: "clp9z8x7w0000abcd1234day1",
  order: 1,
  labelId: null,
  notes: null,
  freezeLoadsAtCreation: false,
  createdAt: NOW,
  updatedAt: NOW,
  label: null,
  blocks: [],
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
  reorderSessionsMutate.mockReset();
  reorderSessionsState.isPending = false;
  capturedOnDragEnd = null;
});

describe("SessionList drag-end guards (QA-Must-01, QA-Must-02)", () => {
  it("does NOT fire mutate when active.id === over.id (QA-Must-01)", () => {
    const s1 = makeSession({ id: "clp9z8x7w0000abcd12gd1s001", order: 1 });
    const s2 = makeSession({ id: "clp9z8x7w0000abcd12gd1s002", order: 2 });

    render(
      <SessionList
        planId={PLAN_ID}
        startDate={START_DATE}
        dayOfWeek={DAY_OF_WEEK}
        sessions={[s1, s2]}
      />,
    );

    triggerDragEnd(makeDragEndEvent(s1.id, s1.id));

    expect(reorderSessionsMutate).not.toHaveBeenCalled();
  });

  it("does NOT fire mutate when over is null (QA-Must-02, also covers Escape cancel)", () => {
    const s1 = makeSession({ id: "clp9z8x7w0000abcd12gd2s001", order: 1 });
    const s2 = makeSession({ id: "clp9z8x7w0000abcd12gd2s002", order: 2 });

    render(
      <SessionList
        planId={PLAN_ID}
        startDate={START_DATE}
        dayOfWeek={DAY_OF_WEEK}
        sessions={[s1, s2]}
      />,
    );

    triggerDragEnd(makeDragEndEventNoOver(s1.id));

    expect(reorderSessionsMutate).not.toHaveBeenCalled();
  });
});

describe("SessionList optimistic + rollback (QA-Must-05)", () => {
  it("reverts sortedSessions to previous order when mutate onError fires", () => {
    const s1 = makeSession({ id: "clp9z8x7w0000abcd12ro1s001", order: 1 });
    const s2 = makeSession({ id: "clp9z8x7w0000abcd12ro1s002", order: 2 });

    reorderSessionsMutate.mockImplementation(
      (_payload: unknown, options: { onError?: (error: Error) => void } | undefined) => {
        options?.onError?.(new Error("simulated reorder failure"));
      },
    );

    const { container } = render(
      <SessionList
        planId={PLAN_ID}
        startDate={START_DATE}
        dayOfWeek={DAY_OF_WEEK}
        sessions={[s1, s2]}
      />,
    );

    triggerDragEnd(makeDragEndEvent(s2.id, s1.id));

    const renderedIds = Array.from(
      container.querySelectorAll('[data-testid="session-card-mock"]'),
    ).map((node) => node.getAttribute("data-session-id"));

    expect(renderedIds).toEqual([s1.id, s2.id]);
  });

  it("sends { orderedIds } payload (no inactive scope keys) on a valid drag", () => {
    const s1 = makeSession({ id: "clp9z8x7w0000abcd12pl1s001", order: 1 });
    const s2 = makeSession({ id: "clp9z8x7w0000abcd12pl1s002", order: 2 });

    render(
      <SessionList
        planId={PLAN_ID}
        startDate={START_DATE}
        dayOfWeek={DAY_OF_WEEK}
        sessions={[s1, s2]}
      />,
    );

    triggerDragEnd(makeDragEndEvent(s2.id, s1.id));

    expect(reorderSessionsMutate).toHaveBeenCalledTimes(1);

    const payload = reorderSessionsMutate.mock.calls[0]?.[0];

    expect(payload).toEqual({ orderedIds: [s2.id, s1.id] });
  });
});
