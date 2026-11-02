import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../test/render";

import { DynamicListItem } from "./dynamic-list-item";

describe("DynamicListItem", () => {
  it("renders the children inside the row", () => {
    render(
      <DynamicListItem onRemove={vi.fn()}>
        <span data-testid="row-content">Row content</span>
      </DynamicListItem>,
    );

    expect(screen.getByTestId("row-content")).toBeInTheDocument();
  });

  it("renders the remove button enabled by default and invokes onRemove on click", () => {
    const onRemove = vi.fn();

    render(
      <DynamicListItem onRemove={onRemove}>
        <span>child</span>
      </DynamicListItem>,
    );

    const button = screen.getByRole("button", { name: "Remove item" });

    expect(button).toBeEnabled();

    fireEvent.click(button);

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("disables the remove button when disableRemove is true", () => {
    render(
      <DynamicListItem onRemove={vi.fn()} disableRemove>
        <span>child</span>
      </DynamicListItem>,
    );

    const button = screen.getByRole("button", { name: "Remove item" });

    expect(button).toBeDisabled();
  });

  it("does not call onRemove when the disabled remove button is clicked", () => {
    const onRemove = vi.fn();

    render(
      <DynamicListItem onRemove={onRemove} disableRemove>
        <span>child</span>
      </DynamicListItem>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove item" }));

    expect(onRemove).not.toHaveBeenCalled();
  });

  it("respects a custom removeAriaLabel", () => {
    render(
      <DynamicListItem onRemove={vi.fn()} removeAriaLabel="Delete slot">
        <span>child</span>
      </DynamicListItem>,
    );

    expect(screen.getByRole("button", { name: "Delete slot" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove item" })).not.toBeInTheDocument();
  });

  it("renders no move buttons when no move handler is given", () => {
    render(
      <DynamicListItem onRemove={vi.fn()}>
        <span>child</span>
      </DynamicListItem>,
    );

    expect(screen.queryByRole("button", { name: "Move up" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Move down" })).not.toBeInTheDocument();
  });

  it("renders no move buttons when only one move handler is given", () => {
    const { rerender } = render(
      <DynamicListItem onRemove={vi.fn()} onMoveUp={vi.fn()}>
        <span>child</span>
      </DynamicListItem>,
    );

    expect(screen.queryByRole("button", { name: "Move up" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Move down" })).not.toBeInTheDocument();

    rerender(
      <DynamicListItem onRemove={vi.fn()} onMoveDown={vi.fn()}>
        <span>child</span>
      </DynamicListItem>,
    );

    expect(screen.queryByRole("button", { name: "Move up" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Move down" })).not.toBeInTheDocument();
  });

  it("invokes the matching move handler on click", () => {
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();

    render(
      <DynamicListItem onRemove={vi.fn()} onMoveUp={onMoveUp} onMoveDown={onMoveDown}>
        <span>child</span>
      </DynamicListItem>,
    );

    const moveUpButton = screen.getByRole("button", { name: "Move up" });
    const moveDownButton = screen.getByRole("button", { name: "Move down" });

    expect(moveUpButton).toBeEnabled();
    expect(moveDownButton).toBeEnabled();

    fireEvent.click(moveUpButton);

    expect(onMoveUp).toHaveBeenCalledTimes(1);
    expect(onMoveDown).not.toHaveBeenCalled();

    fireEvent.click(moveDownButton);

    expect(onMoveUp).toHaveBeenCalledTimes(1);
    expect(onMoveDown).toHaveBeenCalledTimes(1);
  });

  it("disables move up on the first row and keeps move down enabled", () => {
    render(
      <DynamicListItem onRemove={vi.fn()} onMoveUp={vi.fn()} onMoveDown={vi.fn()} disableMoveUp>
        <span>child</span>
      </DynamicListItem>,
    );

    expect(screen.getByRole("button", { name: "Move up" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move down" })).toBeEnabled();
  });

  it("disables move down on the last row and keeps move up enabled", () => {
    render(
      <DynamicListItem onRemove={vi.fn()} onMoveUp={vi.fn()} onMoveDown={vi.fn()} disableMoveDown>
        <span>child</span>
      </DynamicListItem>,
    );

    expect(screen.getByRole("button", { name: "Move up" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Move down" })).toBeDisabled();
  });

  it("does not call a disabled move handler on click", () => {
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();

    render(
      <DynamicListItem
        onRemove={vi.fn()}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        disableMoveUp
        disableMoveDown
      >
        <span>child</span>
      </DynamicListItem>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Move up" }));
    fireEvent.click(screen.getByRole("button", { name: "Move down" }));

    expect(onMoveUp).not.toHaveBeenCalled();
    expect(onMoveDown).not.toHaveBeenCalled();
  });
});
