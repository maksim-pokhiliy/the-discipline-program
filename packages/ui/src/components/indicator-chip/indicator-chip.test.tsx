import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../../test/render";

import { IndicatorChip, type IndicatorChipTone } from "./indicator-chip";

type ToneCase = {
  tone: IndicatorChipTone;
  className: string;
  iconClassName: string;
};

const TONE_CASES: ToneCase[] = [
  { tone: "default", className: "MuiChip-colorDefault", iconClassName: "MuiChip-iconColorDefault" },
  { tone: "primary", className: "MuiChip-colorPrimary", iconClassName: "MuiChip-iconColorPrimary" },
  { tone: "info", className: "MuiChip-colorInfo", iconClassName: "MuiChip-iconColorInfo" },
  { tone: "success", className: "MuiChip-colorSuccess", iconClassName: "MuiChip-iconColorSuccess" },
  { tone: "warning", className: "MuiChip-colorWarning", iconClassName: "MuiChip-iconColorWarning" },
  { tone: "error", className: "MuiChip-colorError", iconClassName: "MuiChip-iconColorError" },
];

describe("IndicatorChip", () => {
  for (const { tone, className, iconClassName } of TONE_CASES) {
    it(`renders the ${tone} tone with matching chip + icon color classes (MT-05)`, () => {
      const { container } = render(<IndicatorChip tone={tone} label={tone} />);
      const chip = container.querySelector(".MuiChip-root");
      const icon = container.querySelector(".MuiChip-icon");

      expect(chip).not.toBeNull();
      expect(chip).toHaveClass(className);
      expect(chip).toHaveClass("MuiChip-filled");
      expect(icon).not.toBeNull();
      expect(icon).toHaveClass(iconClassName);
    });
  }

  it("renders the filled tonal variant, not outlined", () => {
    const { container } = render(<IndicatorChip tone="primary" label="Primary" />);
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();
    expect(chip).toHaveClass("MuiChip-filled");
    expect(chip).not.toHaveClass("MuiChip-outlined");
  });

  it("renders the leading dot via the icon slot", () => {
    const { container } = render(<IndicatorChip tone="primary" label="Primary" />);
    const icon = container.querySelector(".MuiChip-icon");

    expect(icon).not.toBeNull();
  });

  it("fires onClick when chip is clicked", () => {
    const handleClick = vi.fn();

    render(<IndicatorChip tone="primary" label="Today" clickable onClick={handleClick} />);

    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies clickable className when clickable is true", () => {
    const { container } = render(
      <IndicatorChip tone="primary" label="Today" clickable onClick={vi.fn()} />,
    );
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();
    expect(chip).toHaveClass("MuiChip-clickable");
  });

  it("omits clickable className when clickable is not set", () => {
    const { container } = render(<IndicatorChip tone="primary" label="Today" />);
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();
    expect(chip).not.toHaveClass("MuiChip-clickable");
  });

  it("replaces the default dot when icon prop is provided", () => {
    const { container } = render(
      <IndicatorChip tone="primary" label="Today" icon={<span data-testid="custom-icon" />} />,
    );
    const customIcon = screen.getByTestId("custom-icon");
    const iconSlot = container.querySelector(".MuiChip-icon");

    expect(customIcon).toBeInTheDocument();
    expect(iconSlot).not.toBeNull();
    expect(iconSlot).toContainElement(customIcon);
  });

  it("does not crash when clickable is set without onClick (MT-04)", () => {
    const { container } = render(<IndicatorChip tone="primary" label="Today" clickable />);
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();
    expect(chip).toHaveClass("MuiChip-clickable");
  });

  it("gets MuiChip-clickable when onClick is set without clickable (MT-04)", () => {
    const { container } = render(<IndicatorChip tone="primary" label="Today" onClick={vi.fn()} />);
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();
    expect(chip).toHaveClass("MuiChip-clickable");
  });
});
