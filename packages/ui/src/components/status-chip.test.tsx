import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "../test/render";

import { StatusChip } from "./status-chip";

describe("StatusChip", () => {
  it("renders a filled chip rather than an outlined one", () => {
    const { container } = render(<StatusChip label="Active" />);
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();
    expect(chip).toHaveClass("MuiChip-filled");
    expect(chip).not.toHaveClass("MuiChip-outlined");
  });

  it("applies the provided color to the chip", () => {
    const { container } = render(<StatusChip label="Healthy" color="success" />);

    expect(container.querySelector(".MuiChip-root")).toHaveClass("MuiChip-colorSuccess");
  });

  it("renders the label text", () => {
    render(<StatusChip label="Archived" />);

    expect(screen.getByText("Archived")).toBeInTheDocument();
  });

  it("wraps the chip in a tooltip when a tooltip is provided", () => {
    render(<StatusChip label="Injured" tooltip="Athlete is recovering" />);

    expect(screen.getByLabelText("Athlete is recovering")).toBeInTheDocument();
  });
});
