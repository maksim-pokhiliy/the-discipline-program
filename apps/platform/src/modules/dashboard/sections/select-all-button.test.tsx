import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { render } from "@app/test/render";

import { SelectAllButton } from "./select-all-button";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SelectAllButton tri-state label", () => {
  it("shows Select all with the total when nothing is selected", () => {
    render(<SelectAllButton total={3} selectedCount={0} onToggle={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Select all 3" })).toBeInTheDocument();
  });

  it("shows the selected count and a pressed state when all are selected", () => {
    render(<SelectAllButton total={3} selectedCount={3} onToggle={vi.fn()} />);

    const button = screen.getByRole("button", { name: "Selected 3" });

    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("stays on Select all in a partial state", () => {
    render(<SelectAllButton total={3} selectedCount={1} onToggle={vi.fn()} />);

    const button = screen.getByRole("button", { name: "Select all 3" });

    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "false");
  });
});

describe("SelectAllButton interaction", () => {
  it("invokes onToggle when clicked", () => {
    const onToggle = vi.fn();

    render(<SelectAllButton total={3} selectedCount={0} onToggle={onToggle} />);

    fireEvent.click(screen.getByRole("button", { name: "Select all 3" }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
