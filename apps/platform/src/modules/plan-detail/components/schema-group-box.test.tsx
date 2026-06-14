import { createElement, type ReactNode } from "react";

import type * as DndKitCore from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { alpha } from "@mui/material";
import { act, fireEvent, screen, waitForElementToBeRemoved, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SchemaWithBody } from "@repo/contracts/lms/schema";
import type { SchemaGroup } from "@repo/contracts/lms/schema-group";
import { theme } from "@repo/mui";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import type * as DeleteGroupWithMembers from "../lib/use-delete-group-with-members";

const updateGroupMutate = vi.fn();
const updateGroupState = { isPending: false };
const deleteGroupMutate = vi.fn();
const deleteGroupState = { isPending: false };
const deleteGroupWithMembersRun = vi.fn();
const deleteGroupWithMembersState = { isPending: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useUpdateGroup: () => ({
      mutate: updateGroupMutate,
      isPending: updateGroupState.isPending,
    }),
    useDeleteGroup: () => ({
      mutate: deleteGroupMutate,
      isPending: deleteGroupState.isPending,
    }),
  };
});

vi.mock("../lib/use-delete-group-with-members", async () => {
  const actual = await vi.importActual<typeof DeleteGroupWithMembers>(
    "../lib/use-delete-group-with-members",
  );

  return {
    ...actual,
    useDeleteGroupWithMembers: () => ({
      run: deleteGroupWithMembersRun,
      isPending: deleteGroupWithMembersState.isPending,
    }),
  };
});

vi.mock("./group-track-wrapper", () => {
  const renderGroupTrackWrapperMock = (props: { member: SchemaWithBody }) =>
    createElement(
      "div",
      {
        "data-testid": "group-track-wrapper-mock",
        "data-schema-id": props.member.schema.id,
      },
      `track:${props.member.schema.id}`,
    );

  return { GroupTrackWrapper: renderGroupTrackWrapperMock };
});

vi.mock("./add-track-button", () => {
  const renderAddTrackButtonMock = (props: { blockId: string; groupId: string }) =>
    createElement("div", {
      "data-testid": "add-track-button-mock",
      "data-block-id": props.blockId,
      "data-group-id": props.groupId,
    });

  return { AddTrackButton: renderAddTrackButtonMock };
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

const { SchemaGroupBox } = await import("./schema-group-box");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const NOW = new Date("2026-01-06T00:00:00.000Z");
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const GROUP_ID = "clp9z8x7w0000abcd1234grp1";
const BOX_TEST_ID = "schema-group-box";
const GROUP_LABEL_ARIA = "Group label";
const GROUP_PLACEHOLDER = "group label…";
const FRAME_BORDER_ALPHA = 0.35;

const makeSchema = (id: string, order: number): SchemaWithBody => ({
  schema: {
    id,
    blockId: BLOCK_ID,
    groupId: GROUP_ID,
    order,
    header: null,
    intensity: null,
    composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } },
    label: null,
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  rows: [],
  rowGroups: [],
});

const makeGroup = (overrides: Partial<SchemaGroup> = {}): SchemaGroup => ({
  id: GROUP_ID,
  blockId: BLOCK_ID,
  notes: null,
  interleaveOrder: "round_by_round",
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const onMemberReorder = vi.fn();

type RenderOptions = {
  group?: SchemaGroup;
  members?: SchemaWithBody[];
  parentIsReorderPending?: boolean;
};

const renderBox = ({
  group = makeGroup(),
  members = [
    makeSchema("clp9z8x7w0000abcd1234mm01", 1),
    makeSchema("clp9z8x7w0000abcd1234mm02", 2),
  ],
  parentIsReorderPending = false,
}: RenderOptions = {}) =>
  render(
    <SchemaGroupBox
      group={group}
      members={members}
      planId={PLAN_ID}
      startDate={START_DATE}
      parentIsReorderPending={parentIsReorderPending}
      onMemberReorder={onMemberReorder}
    />,
  );

const interleaveButton = (name: RegExp): HTMLElement =>
  within(screen.getByRole("group", { name: "Interleave order" })).getByRole("button", { name });

afterEach(() => {
  updateGroupState.isPending = false;
  deleteGroupState.isPending = false;
  deleteGroupWithMembersState.isPending = false;
  updateGroupMutate.mockReset();
  deleteGroupMutate.mockReset();
  deleteGroupWithMembersRun.mockReset();
  onMemberReorder.mockReset();
  capturedOnDragEnd = null;
});

describe("SchemaGroupBox proto frame", () => {
  it("renders a solid tinted frame whose border maps to alpha(primary.main, 0.35) — no dashed look", () => {
    renderBox();

    const box = screen.getByTestId(BOX_TEST_ID);

    expect(box).toHaveStyle({ borderStyle: "solid" });
    expect(box).toHaveStyle({
      borderColor: alpha(theme.palette.primary.main, FRAME_BORDER_ALPHA),
    });
    expect(box).not.toHaveStyle({ borderStyle: "dashed" });
  });

  it("shows the GROUP overline and the column icon in the head", () => {
    renderBox();

    expect(screen.getByText("GROUP")).toBeInTheDocument();
  });

  it("puts the drag listeners on a dedicated handle, never on the head container", () => {
    renderBox();

    const handle = screen.getByRole("button", { name: "Drag group" });

    expect(handle).toHaveAttribute("aria-roledescription");
    expect(screen.getByText("GROUP").parentElement).not.toHaveAttribute("aria-roledescription");
  });

  it("renders one GroupTrackWrapper per member in member order", () => {
    renderBox({
      members: [
        makeSchema("clp9z8x7w0000abcd1234aa01", 1),
        makeSchema("clp9z8x7w0000abcd1234aa02", 2),
        makeSchema("clp9z8x7w0000abcd1234aa03", 3),
      ],
    });

    const tracks = screen.getAllByTestId("group-track-wrapper-mock");

    expect(tracks.map((track) => track.getAttribute("data-schema-id"))).toEqual([
      "clp9z8x7w0000abcd1234aa01",
      "clp9z8x7w0000abcd1234aa02",
      "clp9z8x7w0000abcd1234aa03",
    ]);
  });

  it("wires the Add-track affordance to the group's block and group ids", () => {
    renderBox();

    const addTrack = screen.getByTestId("add-track-button-mock");

    expect(addTrack).toHaveAttribute("data-block-id", BLOCK_ID);
    expect(addTrack).toHaveAttribute("data-group-id", GROUP_ID);
  });
});

describe("SchemaGroupBox label edit", () => {
  it("shows an empty 'Group label' textbox with the proto placeholder when notes is null", () => {
    renderBox({ group: makeGroup({ notes: null }) });

    const label = screen.getByRole("textbox", { name: GROUP_LABEL_ARIA });

    if (!(label instanceof HTMLInputElement)) {
      throw new Error("group label is not an HTMLInputElement");
    }

    expect(label.value).toBe("");
    expect(label).toHaveAttribute("placeholder", GROUP_PLACEHOLDER);
  });

  it("commits a non-empty label as { notes: [<value>] } via useUpdateGroup.mutate", () => {
    renderBox({ group: makeGroup({ notes: null }) });

    const label = screen.getByRole("textbox", { name: GROUP_LABEL_ARIA });

    fireEvent.focus(label);
    fireEvent.change(label, { target: { value: "WOD A" } });
    fireEvent.blur(label);

    expect(updateGroupMutate).toHaveBeenCalledTimes(1);
    expect(updateGroupMutate).toHaveBeenCalledWith({
      groupId: GROUP_ID,
      data: { notes: ["WOD A"] },
    });
  });

  it("commits a cleared label as { notes: null } via useUpdateGroup.mutate", () => {
    renderBox({ group: makeGroup({ notes: ["WOD A"] }) });

    const label = screen.getByRole("textbox", { name: GROUP_LABEL_ARIA });

    fireEvent.focus(label);
    fireEvent.change(label, { target: { value: "" } });
    fireEvent.blur(label);

    expect(updateGroupMutate).toHaveBeenCalledTimes(1);
    expect(updateGroupMutate).toHaveBeenCalledWith({
      groupId: GROUP_ID,
      data: { notes: null },
    });
  });

  it("does NOT fire mutate when the label is committed unchanged", () => {
    renderBox({ group: makeGroup({ notes: ["Keep me"] }) });

    const label = screen.getByRole("textbox", { name: GROUP_LABEL_ARIA });

    fireEvent.focus(label);
    fireEvent.change(label, { target: { value: "Keep me" } });
    fireEvent.blur(label);

    expect(updateGroupMutate).not.toHaveBeenCalled();
  });
});

describe("SchemaGroupBox interleave seg control", () => {
  it("marks the active order via aria-pressed reflecting the stored interleaveOrder", () => {
    renderBox({ group: makeGroup({ interleaveOrder: "track_by_track" }) });

    expect(interleaveButton(/track by track/i)).toHaveAttribute("aria-pressed", "true");
    expect(interleaveButton(/round by round/i)).toHaveAttribute("aria-pressed", "false");
  });

  it("commits the flipped interleaveOrder via useUpdateGroup.mutate on the seg button", () => {
    renderBox({ group: makeGroup({ interleaveOrder: "round_by_round" }) });

    fireEvent.click(interleaveButton(/track by track/i));

    expect(updateGroupMutate).toHaveBeenCalledTimes(1);
    expect(updateGroupMutate).toHaveBeenCalledWith({
      groupId: GROUP_ID,
      data: { interleaveOrder: "track_by_track" },
    });
  });

  it("does NOT fire mutate when the active order is re-selected", () => {
    renderBox({ group: makeGroup({ interleaveOrder: "round_by_round" }) });

    fireEvent.click(interleaveButton(/round by round/i));

    expect(updateGroupMutate).not.toHaveBeenCalled();
  });

  it("disables the seg buttons while a group update is pending", () => {
    updateGroupState.isPending = true;

    renderBox();

    expect(interleaveButton(/round by round/i)).toBeDisabled();
    expect(interleaveButton(/track by track/i)).toBeDisabled();
  });
});

describe("SchemaGroupBox ungroup gesture", () => {
  it("dissolves the group via useDeleteGroup.mutate after confirming Ungroup", () => {
    renderBox();

    fireEvent.click(screen.getByRole("button", { name: "Ungroup" }));

    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByRole("heading", { name: "Ungroup" })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Ungroup" }));

    expect(deleteGroupMutate).toHaveBeenCalledTimes(1);
    expect(deleteGroupMutate.mock.calls[0]?.[0]).toEqual({ groupId: GROUP_ID });
    expect(deleteGroupWithMembersRun).not.toHaveBeenCalled();
  });

  it("keeps the dialog open until the dissolve succeeds (house modal pattern)", async () => {
    renderBox();

    fireEvent.click(screen.getByRole("button", { name: "Ungroup" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Ungroup" }));

    expect(deleteGroupMutate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const options = deleteGroupMutate.mock.calls[0]?.[1] as { onSuccess: () => void };

    act(() => options.onSuccess());

    await waitForElementToBeRemoved(() => screen.queryByRole("dialog"));
  });

  it("disables the Ungroup confirm while the dissolve is pending (QA-105)", () => {
    deleteGroupState.isPending = true;

    renderBox();

    fireEvent.click(screen.getByRole("button", { name: "Ungroup" }));

    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByRole("button", { name: "Processing..." })).toBeDisabled();
  });
});

describe("SchemaGroupBox delete-group gesture", () => {
  it("deletes the group and its members via useDeleteGroupWithMembers.run after confirming", () => {
    const members = [
      makeSchema("clp9z8x7w0000abcd1234dd01", 1),
      makeSchema("clp9z8x7w0000abcd1234dd02", 2),
    ];

    renderBox({ members });

    fireEvent.click(screen.getByRole("button", { name: "Delete group" }));

    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByRole("heading", { name: "Delete group" })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(deleteGroupWithMembersRun).toHaveBeenCalledTimes(1);
    expect(deleteGroupWithMembersRun.mock.calls[0]?.[0]).toEqual({ members });
    expect(deleteGroupMutate).not.toHaveBeenCalled();
  });

  it("keeps the dialog open while the delete runs and closes after it settles", async () => {
    let resolveRun: () => void = () => {};

    deleteGroupWithMembersRun.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveRun = resolve;
      }),
    );

    renderBox();

    fireEvent.click(screen.getByRole("button", { name: "Delete group" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }));

    expect(deleteGroupWithMembersRun).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await act(async () => {
      resolveRun();
    });

    await waitForElementToBeRemoved(() => screen.queryByRole("dialog"));
  });

  it("disables the Delete confirm while the run is pending (QA-104)", () => {
    deleteGroupWithMembersState.isPending = true;

    renderBox();

    fireEvent.click(screen.getByRole("button", { name: "Delete group" }));

    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByRole("button", { name: "Processing..." })).toBeDisabled();
  });
});

describe("SchemaGroupBox DR-W4E-INGROUP-REORDER: in-group member drag", () => {
  const M1 = "clp9z8x7w0000abcd1234ir01";
  const M2 = "clp9z8x7w0000abcd1234ir02";
  const M3 = "clp9z8x7w0000abcd1234ir03";

  it("calls onMemberReorder with the group id and the arrayMoved member order", () => {
    renderBox({ members: [makeSchema(M1, 1), makeSchema(M2, 2), makeSchema(M3, 3)] });

    triggerMemberDragEnd(makeDragEndEvent(`schema:${M3}`, `schema:${M1}`));

    expect(onMemberReorder).toHaveBeenCalledTimes(1);

    const call = onMemberReorder.mock.calls[0];

    if (call === undefined) {
      throw new Error("onMemberReorder was not called");
    }

    expect(call[0]).toBe(GROUP_ID);
    expect(call[1]).toEqual([M3, M1, M2]);
  });

  it("does NOT call onMemberReorder when the member is dropped on itself", () => {
    renderBox({ members: [makeSchema(M1, 1), makeSchema(M2, 2)] });

    triggerMemberDragEnd(makeDragEndEvent(`schema:${M1}`, `schema:${M1}`));

    expect(onMemberReorder).not.toHaveBeenCalled();
  });

  it("reverts the optimistic member order when the lifted mutation reports an error", () => {
    onMemberReorder.mockImplementation(
      (_groupId: string, _orderedMemberIds: string[], options: { onError: () => void }) => {
        options.onError();
      },
    );

    const { container } = renderBox({
      members: [makeSchema(M1, 1), makeSchema(M2, 2)],
    });

    triggerMemberDragEnd(makeDragEndEvent(`schema:${M2}`, `schema:${M1}`));

    expect(onMemberReorder).toHaveBeenCalledTimes(1);

    const renderedIds = Array.from(
      container.querySelectorAll('[data-testid="group-track-wrapper-mock"]'),
    ).map((node) => node.getAttribute("data-schema-id"));

    expect(renderedIds).toEqual([M1, M2]);
  });
});
