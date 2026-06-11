import { createElement } from "react";

import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SchemaWithBody } from "@repo/contracts/lms/schema";
import type { SchemaGroup } from "@repo/contracts/lms/schema-group";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import type { BlockCtx } from "../lib/build-cascade-chips";

const updateGroupMutate = vi.fn();
const updateGroupState = { isPending: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useUpdateGroup: () => ({
      mutate: updateGroupMutate,
      isPending: updateGroupState.isPending,
    }),
  };
});

vi.mock("./schema-card", () => {
  const renderSchemaCardMock = (props: { schema: SchemaWithBody; isBoxed?: boolean }) =>
    createElement(
      "div",
      {
        "data-testid": "schema-card-mock",
        "data-schema-id": props.schema.schema.id,
        "data-boxed": props.isBoxed === true ? "true" : "false",
      },
      `schema-card:${props.schema.schema.id}`,
    );

  return { SchemaCard: renderSchemaCardMock };
});

vi.mock("./add-sub-schema-button", () => {
  const renderAddSubSchemaButtonMock = (props: { blockId: string; groupId: string }) =>
    createElement("div", {
      "data-testid": "add-sub-schema-button-mock",
      "data-block-id": props.blockId,
      "data-group-id": props.groupId,
    });

  return { AddSubSchemaButton: renderAddSubSchemaButtonMock };
});

const { SchemaGroupBox } = await import("./schema-group-box");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const NOW = new Date("2026-01-06T00:00:00.000Z");
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const GROUP_ID = "clp9z8x7w0000abcd1234grp1";
const BOX_TEST_ID = "schema-group-box";
const GROUP_LABEL_ARIA = "Group label";
const GROUP_PLACEHOLDER = "group…";

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
});

const makeGroup = (overrides: Partial<SchemaGroup> = {}): SchemaGroup => ({
  id: GROUP_ID,
  blockId: BLOCK_ID,
  label: null,
  interleaveOrder: "round_by_round",
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const makeBlockCtx = (overrides: Partial<BlockCtx> = {}): BlockCtx => ({
  intensity: null,
  timeCap: null,
  ...overrides,
});

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
      blockCtx={makeBlockCtx()}
      parentIsReorderPending={parentIsReorderPending}
    />,
  );

afterEach(() => {
  updateGroupState.isPending = false;
  updateGroupMutate.mockReset();
});

describe("SchemaGroupBox chrome", () => {
  it("renders an AccentGroupCard with the schema-group-box test id and a dashed border (MT-2)", () => {
    renderBox();

    const box = screen.getByTestId(BOX_TEST_ID);
    const card = box.querySelector(".MuiCard-root");

    expect(box).toBeInTheDocument();
    expect(card).not.toBeNull();
    expect(card).toHaveStyle({ borderStyle: "dashed" });
  });

  it("renders one boxed SchemaCard per member in order, plus the in-box add affordance", () => {
    renderBox({
      members: [
        makeSchema("clp9z8x7w0000abcd1234aa01", 1),
        makeSchema("clp9z8x7w0000abcd1234aa02", 2),
      ],
    });

    const cards = screen.getAllByTestId("schema-card-mock");

    expect(cards.map((card) => card.getAttribute("data-schema-id"))).toEqual([
      "clp9z8x7w0000abcd1234aa01",
      "clp9z8x7w0000abcd1234aa02",
    ]);

    for (const card of cards) {
      expect(card).toHaveAttribute("data-boxed", "true");
    }
  });

  it("wires the in-box add button to the group's block and group ids (W1-SUBADD-BOX)", () => {
    renderBox();

    const addButton = screen.getByTestId("add-sub-schema-button-mock");

    expect(addButton).toHaveAttribute("data-block-id", BLOCK_ID);
    expect(addButton).toHaveAttribute("data-group-id", GROUP_ID);
  });
});

describe("SchemaGroupBox label edit (MT-8 / W1-RENDER-REPOINT)", () => {
  it("shows an empty 'Group label' textbox with the neutral placeholder when label is null (MT-9)", () => {
    renderBox({ group: makeGroup({ label: null }) });

    const label = screen.getByRole("textbox", { name: GROUP_LABEL_ARIA });

    if (!(label instanceof HTMLInputElement)) {
      throw new Error("group label is not an HTMLInputElement");
    }

    expect(label.value).toBe("");
    expect(label).toHaveAttribute("placeholder", GROUP_PLACEHOLDER);
  });

  it("commits a non-empty label as { label: <value> } via useUpdateGroup.mutate", () => {
    renderBox({ group: makeGroup({ label: null }) });

    const label = screen.getByRole("textbox", { name: GROUP_LABEL_ARIA });

    fireEvent.focus(label);
    fireEvent.change(label, { target: { value: "WOD A" } });
    fireEvent.blur(label);

    expect(updateGroupMutate).toHaveBeenCalledTimes(1);
    expect(updateGroupMutate).toHaveBeenCalledWith({
      groupId: GROUP_ID,
      data: { label: "WOD A" },
    });
  });

  it("commits a cleared label as { label: null } via useUpdateGroup.mutate", () => {
    renderBox({ group: makeGroup({ label: "WOD A" }) });

    const label = screen.getByRole("textbox", { name: GROUP_LABEL_ARIA });

    fireEvent.focus(label);
    fireEvent.change(label, { target: { value: "" } });
    fireEvent.blur(label);

    expect(updateGroupMutate).toHaveBeenCalledTimes(1);
    expect(updateGroupMutate).toHaveBeenCalledWith({
      groupId: GROUP_ID,
      data: { label: null },
    });
  });

  it("does NOT fire mutate on a whitespace-only label edit with no prior label", () => {
    renderBox({ group: makeGroup({ label: null }) });

    const label = screen.getByRole("textbox", { name: GROUP_LABEL_ARIA });

    fireEvent.focus(label);
    fireEvent.change(label, { target: { value: "   " } });
    fireEvent.blur(label);

    expect(updateGroupMutate).not.toHaveBeenCalled();
  });

  it("does NOT fire mutate when the label is committed unchanged", () => {
    renderBox({ group: makeGroup({ label: "Keep me" }) });

    const label = screen.getByRole("textbox", { name: GROUP_LABEL_ARIA });

    fireEvent.focus(label);
    fireEvent.change(label, { target: { value: "Keep me" } });
    fireEvent.blur(label);

    expect(updateGroupMutate).not.toHaveBeenCalled();
  });
});

describe("SchemaGroupBox interleave edit (fork #4 / W1-RENDER-REPOINT)", () => {
  const interleaveTrigger = (): HTMLElement => screen.getByRole("combobox");

  it("renders the interleave control reflecting the group's stored interleaveOrder", () => {
    renderBox({ group: makeGroup({ interleaveOrder: "track_by_track" }) });

    expect(interleaveTrigger()).toHaveTextContent("track by track");
  });

  it("commits the flipped interleaveOrder via useUpdateGroup.mutate", () => {
    renderBox({ group: makeGroup({ interleaveOrder: "round_by_round" }) });

    fireEvent.mouseDown(interleaveTrigger());
    fireEvent.click(within(screen.getByRole("listbox")).getByText("track by track"));

    expect(updateGroupMutate).toHaveBeenCalledTimes(1);
    expect(updateGroupMutate).toHaveBeenCalledWith({
      groupId: GROUP_ID,
      data: { interleaveOrder: "track_by_track" },
    });
  });

  it("does NOT fire mutate when the selected interleaveOrder is unchanged", () => {
    renderBox({ group: makeGroup({ interleaveOrder: "round_by_round" }) });

    fireEvent.mouseDown(interleaveTrigger());
    fireEvent.click(within(screen.getByRole("listbox")).getByText("round by round"));

    expect(updateGroupMutate).not.toHaveBeenCalled();
  });

  it("disables the interleave control while a group update is pending", () => {
    updateGroupState.isPending = true;

    renderBox();

    expect(interleaveTrigger()).toHaveAttribute("aria-disabled", "true");
  });
});
