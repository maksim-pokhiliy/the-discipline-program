import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { render } from "@app/test/render";

import { asNodeId } from "../lib/axis-draft-id";
import type * as AxisDraftId from "../lib/axis-draft-id";

const createGroupRun = vi.fn();
const createGroupState = { isPending: false };
let nodeIdCounter = 0;

vi.mock("../lib/use-create-group", () => ({
  useCreateGroup: () => ({ run: createGroupRun, isPending: createGroupState.isPending }),
}));

vi.mock("../lib/axis-draft-id", async () => {
  const actual = await vi.importActual<typeof AxisDraftId>("../lib/axis-draft-id");

  return {
    ...actual,
    makeNodeId: () => {
      nodeIdCounter += 1;

      return actual.asNodeId(`node-${nodeIdCounter}`);
    },
  };
});

const { AddGroupButton } = await import("./add-group-button");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const BUTTON_LABEL = "Add group";

const renderButton = () =>
  render(<AddGroupButton planId={PLAN_ID} startDate={START_DATE} blockId={BLOCK_ID} />);

afterEach(() => {
  createGroupRun.mockReset();
  createGroupState.isPending = false;
  nodeIdCounter = 0;
});

describe("AddGroupButton", () => {
  it("renders the Add group trigger", () => {
    renderButton();

    expect(screen.getByRole("button", { name: BUTTON_LABEL })).toBeInTheDocument();
  });

  it("creates a group seeded with two default ladder tracks 21-15-9 / 9-15-21 (FORK-4a)", () => {
    renderButton();

    fireEvent.click(screen.getByRole("button", { name: BUTTON_LABEL }));

    expect(createGroupRun).toHaveBeenCalledTimes(1);

    const [args] = createGroupRun.mock.calls[0] ?? [];

    expect(args).toEqual({
      blockId: BLOCK_ID,
      draft: {
        id: asNodeId("node-1"),
        header: null,
        tracks: [
          { id: asNodeId("node-2"), header: null, steps: [21, 15, 9] },
          { id: asNodeId("node-3"), header: null, steps: [9, 15, 21] },
        ],
      },
    });
  });

  it("disables the trigger while a group create is pending", () => {
    createGroupState.isPending = true;

    renderButton();

    expect(screen.getByRole("button", { name: BUTTON_LABEL })).toBeDisabled();
  });

  it("fires a single group create on a synchronous double-click (QA-103)", () => {
    renderButton();

    const trigger = screen.getByRole("button", { name: BUTTON_LABEL });

    fireEvent.click(trigger);
    fireEvent.click(trigger);

    expect(createGroupRun).toHaveBeenCalledTimes(1);
  });
});
