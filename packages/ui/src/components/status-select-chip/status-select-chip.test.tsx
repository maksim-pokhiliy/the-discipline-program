import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../../test/render";

import { StatusSelectChip } from "./status-select-chip";

describe("StatusSelectChip", () => {
  it("renders as a read-only chip when options are empty", () => {
    const { container } = render(<StatusSelectChip label="Draft" options={[]} />);
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();
    expect(chip).not.toHaveClass("MuiChip-clickable");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("renders a clickable chip and opens menu on click when options are present", () => {
    const { container } = render(
      <StatusSelectChip
        label="Active"
        options={[
          { key: "archive", label: "Archive plan", onSelect: vi.fn() },
          { key: "restore", label: "Restore as draft", onSelect: vi.fn() },
        ]}
      />,
    );
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();
    expect(chip).toHaveClass("MuiChip-clickable");

    fireEvent.click(screen.getByRole("button", { name: "Active" }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("fires onSelect when a menu item is clicked", () => {
    const archiveSpy = vi.fn();

    render(
      <StatusSelectChip
        label="Active"
        options={[{ key: "archive", label: "Archive plan", onSelect: archiveSpy }]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Active" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Archive plan" }));

    expect(archiveSpy).toHaveBeenCalledTimes(1);
  });

  it("closes the menu after an option is selected", () => {
    render(
      <StatusSelectChip
        label="Active"
        options={[{ key: "archive", label: "Archive plan", onSelect: vi.fn() }]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Active" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Archive plan" }));

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("renders each option label in the menu", () => {
    render(
      <StatusSelectChip
        label="Draft"
        options={[
          { key: "activate", label: "Activate plan", onSelect: vi.fn() },
          { key: "archive", label: "Archive plan", onSelect: vi.fn() },
          { key: "delete", label: "Delete plan", onSelect: vi.fn() },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Draft" }));

    expect(screen.getByText("Activate plan")).toBeInTheDocument();
    expect(screen.getByText("Archive plan")).toBeInTheDocument();
    expect(screen.getByText("Delete plan")).toBeInTheDocument();
  });
});
