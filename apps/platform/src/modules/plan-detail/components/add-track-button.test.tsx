import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { render } from "@app/test/render";

import type { AxisEditorMode } from "./axis-editor-modal";

const axisEditorProps = vi.fn<(props: { mode: AxisEditorMode }) => void>();

vi.mock("./axis-editor-modal", () => ({
  AxisEditorModal: (props: { mode: AxisEditorMode; onClose: () => void }) => {
    axisEditorProps(props);

    return (
      <div role="dialog" aria-label="Add schema">
        <button type="button" onClick={props.onClose}>
          close
        </button>
      </div>
    );
  },
}));

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
  axisEditorProps.mockReset();
});

describe("AddTrackButton", () => {
  it("renders the trigger and opens no modal initially", () => {
    renderButton();

    expect(screen.getByRole("button", { name: BUTTON_LABEL })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens AxisEditorModal in create mode carrying blockId and groupId on click", () => {
    renderButton();

    fireEvent.click(screen.getByRole("button", { name: BUTTON_LABEL }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(axisEditorProps).toHaveBeenCalledTimes(1);
    expect(axisEditorProps.mock.calls[0]?.[0]?.mode).toEqual({
      kind: "create",
      blockId: BLOCK_ID,
      groupId: GROUP_ID,
    });
  });

  it("disables the trigger while the modal is open", () => {
    renderButton();

    fireEvent.click(screen.getByRole("button", { name: BUTTON_LABEL }));

    expect(screen.getByRole("button", { name: BUTTON_LABEL })).toBeDisabled();
  });

  it("closes the modal and re-enables the trigger when the modal requests close", () => {
    renderButton();

    fireEvent.click(screen.getByRole("button", { name: BUTTON_LABEL }));
    fireEvent.click(screen.getByRole("button", { name: "close" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: BUTTON_LABEL })).toBeEnabled();
  });
});
