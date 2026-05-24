import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../../test/render";

import { TogglePill } from "./toggle-pill";

describe("TogglePill", () => {
  it("renders the icon and label", () => {
    render(
      <TogglePill
        active={false}
        label="Show details"
        icon={<span data-testid="pill-icon">+</span>}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("pill-icon")).toBeInTheDocument();
    expect(screen.getByText("Show details")).toBeInTheDocument();
  });

  it("renders the active state with the filled variant and default activeColor info", () => {
    const { container } = render(
      <TogglePill active={true} label="On" icon={<span>i</span>} onChange={vi.fn()} />,
    );
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).toHaveClass("MuiChip-filled");
    expect(chip).toHaveClass("MuiChip-colorInfo");
  });

  it("renders the active state with the provided activeColor", () => {
    const { container } = render(
      <TogglePill
        active={true}
        activeColor="success"
        label="On"
        icon={<span>i</span>}
        onChange={vi.fn()}
      />,
    );

    expect(container.querySelector(".MuiChip-root")).toHaveClass("MuiChip-colorSuccess");
  });

  it("renders the inactive state with the outlined variant and default color", () => {
    const { container } = render(
      <TogglePill active={false} label="Off" icon={<span>i</span>} onChange={vi.fn()} />,
    );
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).toHaveClass("MuiChip-outlined");
    expect(chip).toHaveClass("MuiChip-colorDefault");
  });

  it("calls onChange when clicked", () => {
    const onChange = vi.fn();

    render(<TogglePill active={false} label="Toggle" icon={<span>i</span>} onChange={onChange} />);

    fireEvent.click(screen.getByText("Toggle"));

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("forwards every rapid click as an independent onChange call (MT-13)", () => {
    const onChange = vi.fn();

    render(<TogglePill active={false} label="Spammy" icon={<span>i</span>} onChange={onChange} />);
    const target = screen.getByText("Spammy");

    fireEvent.click(target);
    fireEvent.click(target);
    fireEvent.click(target);

    expect(onChange).toHaveBeenCalledTimes(3);
  });
});
