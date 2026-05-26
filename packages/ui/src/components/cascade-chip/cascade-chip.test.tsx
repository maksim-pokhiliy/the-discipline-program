import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "../../test/render";

import { CascadeChip } from "./cascade-chip";

describe("CascadeChip", () => {
  it("renders the provided text", () => {
    render(<CascadeChip text="@ 75%" />);

    expect(screen.getByText("@ 75%")).toBeInTheDocument();
  });

  it("renders the leading up arrow glyph", () => {
    render(<CascadeChip text="RPE 8" />);

    expect(screen.getByTestId("ArrowUpwardIcon")).toBeInTheDocument();
  });

  it("renders the icon inside the chip icon slot", () => {
    const { container } = render(<CascadeChip text="cap 10:00" />);
    const iconSlot = container.querySelector(".MuiChip-icon");
    const arrow = screen.getByTestId("ArrowUpwardIcon");

    expect(iconSlot).not.toBeNull();
    expect(iconSlot).toContainElement(arrow);
  });

  it("uses the small chip size", () => {
    const { container } = render(<CascadeChip text="HR Z2" />);
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();
    expect(chip).toHaveClass("MuiChip-sizeSmall");
  });

  it("uses the filled tonal variant, not outlined", () => {
    const { container } = render(<CascadeChip text="pace · moderate" />);
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();
    expect(chip).toHaveClass("MuiChip-filled");
    expect(chip).not.toHaveClass("MuiChip-outlined");
  });

  it("applies italic font style", () => {
    const { container } = render(<CascadeChip text="@ 80%" />);
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();

    if (chip === null) {
      return;
    }

    expect(window.getComputedStyle(chip).fontStyle).toBe("italic");
  });
});
