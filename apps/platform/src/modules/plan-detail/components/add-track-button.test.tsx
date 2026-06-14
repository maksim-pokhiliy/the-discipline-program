import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const createSchemaMutate = vi.fn();
const createSchemaState = { isPending: false };

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useCreateSchema: () => ({
      mutate: createSchemaMutate,
      isPending: createSchemaState.isPending,
    }),
  };
});

const { AddTrackButton } = await import("./add-track-button");

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const START_DATE = "2026-01-06";
const BLOCK_ID = "clp9z8x7w0000abcd1234blk1";
const GROUP_ID = "clp9z8x7w0000abcd1234grp1";
const BUTTON_LABEL = "Add schema to group";

const renderButton = () =>
  render(
    <AddTrackButton
      planId={PLAN_ID}
      startDate={START_DATE}
      blockId={BLOCK_ID}
      groupId={GROUP_ID}
    />,
  );

afterEach(() => {
  createSchemaMutate.mockReset();
  createSchemaState.isPending = false;
});

describe("AddTrackButton", () => {
  it("renders the Add track trigger and opens no modal", () => {
    renderButton();

    expect(screen.getByRole("button", { name: BUTTON_LABEL })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("instantly creates a default ladder schema carrying groupId and blockId on click (FORK-1a)", () => {
    renderButton();

    fireEvent.click(screen.getByRole("button", { name: BUTTON_LABEL }));

    expect(createSchemaMutate).toHaveBeenCalledTimes(1);
    expect(createSchemaMutate.mock.calls[0]?.[0]).toEqual({
      blockId: BLOCK_ID,
      groupId: GROUP_ID,
      composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } },
      header: null,
      notes: null,
    });
  });

  it("disables the trigger while a create is pending", () => {
    createSchemaState.isPending = true;

    renderButton();

    expect(screen.getByRole("button", { name: BUTTON_LABEL })).toBeDisabled();
  });

  it("fires a single create on a synchronous double-click (QA-102)", () => {
    renderButton();

    const trigger = screen.getByRole("button", { name: BUTTON_LABEL });

    fireEvent.click(trigger);
    fireEvent.click(trigger);

    expect(createSchemaMutate).toHaveBeenCalledTimes(1);
  });
});
