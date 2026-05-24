import { describe, expect, it } from "vitest";

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
      expect(icon).not.toBeNull();
      expect(icon).toHaveClass(iconClassName);
    });
  }

  it("renders the leading dot via the icon slot", () => {
    const { container } = render(<IndicatorChip tone="primary" label="Primary" />);
    const icon = container.querySelector(".MuiChip-icon");

    expect(icon).not.toBeNull();
  });
});
