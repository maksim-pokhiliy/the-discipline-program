import { createElement, type ReactNode } from "react";

import type * as DndKitCore from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { alpha } from "@mui/material";
import { act, fireEvent, screen, waitForElementToBeRemoved, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { RowGroup } from "@repo/contracts/lms/row-group";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";
import { theme } from "@repo/mui";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import type * as DeleteRowGroupWithMembers from "../lib/use-delete-row-group-with-members";

import { exerciseById } from "./schema-row-card.fixtures";

const updateRowGroupMutate = vi.fn();
const updateRowGroupState = { isPending: false };
const deleteRowGroupMutate = vi.fn();
const deleteRowGroupState = { isPending: false };
const deleteRowGroupWithMembersRun = vi.fn();
const deleteRowGroupWithMembersState = { isPending: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useCatalog: () => ({ exerciseById }),
    useUpdateRowGroup: () => ({
      mutate: updateRowGroupMutate,
      isPending: updateRowGroupState.isPending,
    }),
    useDeleteRowGroup: () => ({
      mutate: deleteRowGroupMutate,
      isPending: deleteRowGroupState.isPending,
    }),
  };
});

vi.mock("../lib/use-delete-row-group-with-members", async () => {
  const actual = await vi.importActual<typeof DeleteRowGroupWithMembers>(
    "../lib/use-delete-row-group-with-members",
  );

  return {
    ...actual,
    useDeleteRowGroupWithMembers: () => ({
      run: deleteRowGroupWithMembersRun,
      isPending: deleteRowGroupWithMembersState.isPending,
    }),
  };
});

vi.mock("./schema-row-card", () => {
  const renderSchemaRowCardMock = (props: { row: SchemaRow; index: number }) =>
    createElement(
      "div",
      {
        "data-testid": "schema-row-card-mock",
        "data-row-id": props.row.id,
        "data-index": String(props.index),
      },
      `schema-row-card:${props.row.id}`,
    );

  return { SchemaRowCard: renderSchemaRowCardMock };
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

    return createElement("div", { "data-testid": "member-dnd-context-mock" }, children);
  };

  return {
    ...actual,
    DndContext: DndContextMock,
  };
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

const triggerMemberDragEnd = (event: DragEndEvent): void => {
  if (capturedOnDragEnd === null) {
    throw new Error("inner DndContext.onDragEnd was not captured");
  }

  capturedOnDragEnd(event);
};

const { RowGroupBox } = await import("./row-group-box");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const SCHEMA_ID = "clp9z8x7w0000abcd1234sch1";
const GROUP_ID = "clp9z8x7w0000abcd1234grp1";
const EXERCISE_ID = "clp9z8x7w0000abcd1234ex001";
const BOX_TEST_ID = "row-group-box";
const GROUP_LABEL_ARIA = "Group label";
const GROUP_PLACEHOLDER = "group label…";
const FRAME_BORDER_ALPHA = 0.35;
const NOW = new Date("2026-01-06T00:00:00.000Z");

const makeGroup = (overrides: Partial<RowGroup> = {}): RowGroup => ({
  id: GROUP_ID,
  schemaId: SCHEMA_ID,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const makeRow = (id: string, order: number): SchemaRow => ({
  id,
  schemaId: SCHEMA_ID,
  order,
  exerciseId: EXERCISE_ID,
  sets: null,
  rowGroupId: GROUP_ID,
  load: null,
  reps: null,
  side: null,
  tempo: null,
  media: null,
  modifiers: [],
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const DEFAULT_MEMBERS = [makeRow("m1", 1), makeRow("m2", 2)];

const onMemberReorder = vi.fn();

const renderBox = (group: RowGroup = makeGroup(), members: SchemaRow[] = DEFAULT_MEMBERS) =>
  render(
    <RowGroupBox
      group={group}
      members={members}
      planId={PLAN_ID}
      startDate={START_DATE}
      startIndex={0}
      isReorderPending={false}
      onMemberReorder={onMemberReorder}
    />,
  );

afterEach(() => {
  updateRowGroupState.isPending = false;
  deleteRowGroupState.isPending = false;
  deleteRowGroupWithMembersState.isPending = false;
  updateRowGroupMutate.mockReset();
  deleteRowGroupMutate.mockReset();
  deleteRowGroupWithMembersRun.mockReset();
  onMemberReorder.mockReset();
  capturedOnDragEnd = null;
});

describe("RowGroupBox frame", () => {
  it("renders a solid tinted frame whose border maps to alpha(primary.main, 0.35) — no dashed look", () => {
    renderBox();

    const box = screen.getByTestId(BOX_TEST_ID);

    expect(box).toHaveStyle({ borderStyle: "solid" });
    expect(box).toHaveStyle({
      borderColor: alpha(theme.palette.primary.main, FRAME_BORDER_ALPHA),
    });
    expect(box).not.toHaveStyle({ borderStyle: "dashed" });
  });

  it("shows the GROUP overline in the head", () => {
    renderBox();

    expect(screen.getByText("GROUP")).toBeInTheDocument();
  });
});

describe("RowGroupBox label", () => {
  it("seeds the label textbox from the first note", () => {
    renderBox(makeGroup({ notes: ["OR"] }));

    const label = screen.getByRole("textbox", { name: GROUP_LABEL_ARIA });

    if (!(label instanceof HTMLInputElement)) {
      throw new Error("group label is not an HTMLInputElement");
    }

    expect(label.value).toBe("OR");
  });

  it("shows an empty label textbox with the proto placeholder when notes is null", () => {
    renderBox(makeGroup({ notes: null }));

    const label = screen.getByRole("textbox", { name: GROUP_LABEL_ARIA });

    if (!(label instanceof HTMLInputElement)) {
      throw new Error("group label is not an HTMLInputElement");
    }

    expect(label.value).toBe("");
    expect(label).toHaveAttribute("placeholder", GROUP_PLACEHOLDER);
  });

  it("commits a non-empty label as { notes: [<value>] } via useUpdateRowGroup.mutate", () => {
    renderBox(makeGroup({ notes: null }));

    const label = screen.getByRole("textbox", { name: GROUP_LABEL_ARIA });

    fireEvent.focus(label);
    fireEvent.change(label, { target: { value: "OR" } });
    fireEvent.blur(label);

    expect(updateRowGroupMutate).toHaveBeenCalledTimes(1);
    expect(updateRowGroupMutate).toHaveBeenCalledWith({
      rowGroupId: GROUP_ID,
      data: { notes: ["OR"] },
    });
  });

  it("commits a cleared label as { notes: null } via useUpdateRowGroup.mutate", () => {
    renderBox(makeGroup({ notes: ["OR"] }));

    const label = screen.getByRole("textbox", { name: GROUP_LABEL_ARIA });

    fireEvent.focus(label);
    fireEvent.change(label, { target: { value: "" } });
    fireEvent.blur(label);

    expect(updateRowGroupMutate).toHaveBeenCalledTimes(1);
    expect(updateRowGroupMutate).toHaveBeenCalledWith({
      rowGroupId: GROUP_ID,
      data: { notes: null },
    });
  });

  it("does NOT fire mutate when the label is committed unchanged", () => {
    renderBox(makeGroup({ notes: ["Keep me"] }));

    const label = screen.getByRole("textbox", { name: GROUP_LABEL_ARIA });

    fireEvent.focus(label);
    fireEvent.change(label, { target: { value: "Keep me" } });
    fireEvent.blur(label);

    expect(updateRowGroupMutate).not.toHaveBeenCalled();
  });
});

describe("RowGroupBox members", () => {
  it("renders each member card with a continuous index from startIndex", () => {
    const { container } = renderBox(makeGroup(), [makeRow("m1", 1), makeRow("m2", 2)]);

    const cards = Array.from(container.querySelectorAll('[data-testid="schema-row-card-mock"]'));

    expect(cards.map((c) => c.getAttribute("data-row-id"))).toEqual(["m1", "m2"]);
    expect(cards.map((c) => c.getAttribute("data-index"))).toEqual(["0", "1"]);
  });
});

describe("RowGroupBox ungroup gesture", () => {
  it("dissolves the group via useDeleteRowGroup.mutate after confirming Ungroup", () => {
    renderBox();

    fireEvent.click(screen.getByRole("button", { name: "Ungroup" }));

    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByRole("heading", { name: "Ungroup" })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Ungroup" }));

    expect(deleteRowGroupMutate).toHaveBeenCalledTimes(1);
    expect(deleteRowGroupMutate.mock.calls[0]?.[0]).toEqual({ rowGroupId: GROUP_ID });
    expect(deleteRowGroupWithMembersRun).not.toHaveBeenCalled();
  });

  it("keeps the dialog open until the dissolve succeeds (house modal pattern)", async () => {
    renderBox();

    fireEvent.click(screen.getByRole("button", { name: "Ungroup" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Ungroup" }));

    expect(deleteRowGroupMutate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const options = deleteRowGroupMutate.mock.calls[0]?.[1] as { onSuccess: () => void };

    act(() => options.onSuccess());

    await waitForElementToBeRemoved(() => screen.queryByRole("dialog"));
  });

  it("disables the Ungroup confirm while the dissolve is pending", () => {
    deleteRowGroupState.isPending = true;

    renderBox();

    fireEvent.click(screen.getByRole("button", { name: "Ungroup" }));

    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByRole("button", { name: "Processing..." })).toBeDisabled();
  });
});

describe("RowGroupBox delete-group gesture", () => {
  it("deletes the group and its members via useDeleteRowGroupWithMembers.run after confirming", () => {
    const members = [makeRow("d1", 1), makeRow("d2", 2)];

    renderBox(makeGroup(), members);

    fireEvent.click(screen.getByRole("button", { name: "Delete group" }));

    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByRole("heading", { name: "Delete group" })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(deleteRowGroupWithMembersRun).toHaveBeenCalledTimes(1);
    expect(deleteRowGroupWithMembersRun.mock.calls[0]?.[0]).toEqual({ members });
    expect(deleteRowGroupMutate).not.toHaveBeenCalled();
  });

  it("keeps the dialog open while the delete runs and closes after it settles", async () => {
    let resolveRun: () => void = () => {};

    deleteRowGroupWithMembersRun.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveRun = resolve;
      }),
    );

    renderBox();

    fireEvent.click(screen.getByRole("button", { name: "Delete group" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }));

    expect(deleteRowGroupWithMembersRun).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await act(async () => {
      resolveRun();
    });

    await waitForElementToBeRemoved(() => screen.queryByRole("dialog"));
  });

  it("disables the Delete confirm while the run is pending", () => {
    deleteRowGroupWithMembersState.isPending = true;

    renderBox();

    fireEvent.click(screen.getByRole("button", { name: "Delete group" }));

    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByRole("button", { name: "Processing..." })).toBeDisabled();
  });
});

describe("RowGroupBox DR-W4E-INGROUP-REORDER: in-group member drag", () => {
  it("calls onMemberReorder with the group id and the arrayMoved member order", () => {
    renderBox(makeGroup(), [makeRow("m1", 1), makeRow("m2", 2), makeRow("m3", 3)]);

    triggerMemberDragEnd(makeDragEndEvent("row:m3", "row:m1"));

    expect(onMemberReorder).toHaveBeenCalledTimes(1);

    const call = onMemberReorder.mock.calls[0];

    if (call === undefined) {
      throw new Error("onMemberReorder was not called");
    }

    expect(call[0]).toBe(GROUP_ID);
    expect(call[1]).toEqual(["m3", "m1", "m2"]);
  });

  it("does NOT call onMemberReorder when the member is dropped on itself", () => {
    renderBox(makeGroup(), [makeRow("m1", 1), makeRow("m2", 2)]);

    triggerMemberDragEnd(makeDragEndEvent("row:m1", "row:m1"));

    expect(onMemberReorder).not.toHaveBeenCalled();
  });

  it("reverts the optimistic member order when the lifted mutation reports an error", () => {
    onMemberReorder.mockImplementation(
      (_rowGroupId: string, _orderedMemberIds: string[], options: { onError: () => void }) => {
        options.onError();
      },
    );

    const { container } = renderBox(makeGroup(), [makeRow("m1", 1), makeRow("m2", 2)]);

    triggerMemberDragEnd(makeDragEndEvent("row:m2", "row:m1"));

    expect(onMemberReorder).toHaveBeenCalledTimes(1);

    const renderedIds = Array.from(
      container.querySelectorAll('[data-testid="schema-row-card-mock"]'),
    ).map((node) => node.getAttribute("data-row-id"));

    expect(renderedIds).toEqual(["m1", "m2"]);
  });
});
