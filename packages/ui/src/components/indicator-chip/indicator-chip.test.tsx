import { describe, expect, it } from "vitest";

import { render } from "../../test/render";

import { IndicatorChip, type IndicatorChipTone } from "./indicator-chip";

type ToneCase = {
  tone: IndicatorChipTone;
  className: string;
};

const TONE_CASES: ToneCase[] = [
  { tone: "default", className: "MuiChip-colorDefault" },
  { tone: "primary", className: "MuiChip-colorPrimary" },
  { tone: "info", className: "MuiChip-colorInfo" },
  { tone: "success", className: "MuiChip-colorSuccess" },
  { tone: "warning", className: "MuiChip-colorWarning" },
  { tone: "error", className: "MuiChip-colorError" },
];

describe("IndicatorChip", () => {
  for (const { tone, className } of TONE_CASES) {
    it(`renders the ${tone} tone with the matching MUI color class`, () => {
      const { container } = render(<IndicatorChip tone={tone} label={tone} />);
      const chip = container.querySelector(".MuiChip-root");

      expect(chip).not.toBeNull();
      expect(chip).toHaveClass(className);
    });
  }

  it("renders the leading dot via the icon slot as a circular 5px Box", () => {
    const { container } = render(<IndicatorChip tone="primary" label="Primary" />);
    const icon = container.querySelector(".MuiChip-icon");

    expect(icon).not.toBeNull();
    expect(icon).toHaveStyle({ width: "5px", height: "5px", borderRadius: "50%" });
  });
});
