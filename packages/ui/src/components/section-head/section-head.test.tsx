import { alpha } from "@mui/material/styles";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { theme } from "@repo/mui";

import { render } from "../../test/render";

import { SectionHead, type SectionHeadCountTone } from "./section-head";

const COUNT_TONE_BG_ALPHA = 0.2;
const COUNT_DEFAULT_BG_ALPHA = 0.1;

const getCountPill = (container: HTMLElement, value: number): HTMLElement => {
  const pill = screen.getByText(String(value));

  if (!container.contains(pill)) {
    throw new Error("count pill missing");
  }

  return pill;
};

type ToneCase = {
  tone: Exclude<SectionHeadCountTone, "default">;
  paletteMain: string;
};

const TONE_CASES: ToneCase[] = [
  { tone: "warn", paletteMain: theme.palette.warning.main },
  { tone: "error", paletteMain: theme.palette.error.main },
  { tone: "success", paletteMain: theme.palette.success.main },
];

describe("SectionHead", () => {
  it("renders the title with the display heading variant", () => {
    render(<SectionHead title="Needs attention" />);
    const title = screen.getByText("Needs attention");

    expect(title).toBeInTheDocument();
    expect(title).toHaveClass("MuiTypography-h4");
  });

  it("renders the count pill when a count is provided", () => {
    const { container } = render(<SectionHead title="Needs attention" count={4} />);

    expect(getCountPill(container, 4)).toBeInTheDocument();
  });

  it("omits the count pill when no count is provided", () => {
    render(<SectionHead title="Today" />);

    expect(screen.queryByText("0")).toBeNull();
  });

  it("renders a default-tone count pill with a neutral white tint", () => {
    const { container } = render(<SectionHead title="Today" count={12} />);

    expect(getCountPill(container, 12)).toHaveStyle({
      backgroundColor: alpha(theme.palette.common.white, COUNT_DEFAULT_BG_ALPHA),
      color: theme.palette.text.primary,
    });
  });

  for (const { tone, paletteMain } of TONE_CASES) {
    it(`recolors the count pill for the ${tone} tone`, () => {
      const { container } = render(
        <SectionHead title="Needs attention" count={5} countTone={tone} />,
      );

      expect(getCountPill(container, 5)).toHaveStyle({
        backgroundColor: alpha(paletteMain, COUNT_TONE_BG_ALPHA),
        color: paletteMain,
      });
    });
  }

  it("renders the meta line when provided", () => {
    render(<SectionHead title="Needs attention" meta="sorted by severity" />);

    expect(screen.getByText("sorted by severity")).toBeInTheDocument();
  });

  it("omits the meta line when not provided", () => {
    render(<SectionHead title="Today" />);

    expect(screen.queryByText("sorted by severity")).toBeNull();
  });

  it("renders the trailing action slot", () => {
    render(
      <SectionHead title="Today" action={<button data-testid="head-action">View all</button>} />,
    );

    expect(screen.getByTestId("head-action")).toBeInTheDocument();
  });
});
