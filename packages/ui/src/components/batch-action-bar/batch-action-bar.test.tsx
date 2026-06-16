import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../../test/render";

import { BatchActionBar } from "./batch-action-bar";

describe("BatchActionBar", () => {
  it("renders the selected count", () => {
    render(
      <BatchActionBar count={3} onCancel={vi.fn()} primaryLabel="Message 3" onPrimary={vi.fn()} />,
    );

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("selected")).toBeInTheDocument();
  });

  it("renders the primary label", () => {
    render(
      <BatchActionBar count={2} onCancel={vi.fn()} primaryLabel="Message 2" onPrimary={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "Message 2" })).toBeInTheDocument();
  });

  it("fires onCancel when the Cancel button is clicked", () => {
    const onCancel = vi.fn();

    render(
      <BatchActionBar count={1} onCancel={onCancel} primaryLabel="Message 1" onPrimary={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("fires onPrimary when the primary button is clicked", () => {
    const onPrimary = vi.fn();

    render(
      <BatchActionBar
        count={5}
        onCancel={vi.fn()}
        primaryLabel="Message 5"
        onPrimary={onPrimary}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Message 5" }));

    expect(onPrimary).toHaveBeenCalledTimes(1);
  });
});
