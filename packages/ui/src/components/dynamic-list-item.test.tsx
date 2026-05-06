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
});
