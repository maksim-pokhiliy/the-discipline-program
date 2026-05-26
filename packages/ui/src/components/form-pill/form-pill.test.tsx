import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { theme } from "@repo/mui";

import { render } from "../../test/render";

import { FormPill } from "./form-pill";

const FORM_LABELS = [
  "compound",
  "cyclical",
  "sandwich",
  "or alternative",
  "placeholder ref",
] as const;

describe("FormPill", () => {
  for (const text of FORM_LABELS) {
    it(`renders the ${text} label text`, () => {
      render(<FormPill text={text} />);

      expect(screen.getByText(text)).toBeInTheDocument();
    });
  }

  it("uses the small chip size for the canonical compound label", () => {
    const { container } = render(<FormPill text="compound" />);
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();
    expect(chip).toHaveClass("MuiChip-sizeSmall");
  });

  it("uses the filled tonal variant, not outlined", () => {
    const { container } = render(<FormPill text="compound" />);
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();
    expect(chip).toHaveClass("MuiChip-filled");
    expect(chip).not.toHaveClass("MuiChip-outlined");
  });

  it("applies the kind.load color to the chip", () => {
    const { container } = render(<FormPill text="compound" />);
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();
    expect(chip).toHaveStyle({ color: theme.palette.kind.load });
  });

  it("renders the text uppercased via CSS textTransform", () => {
    const { container } = render(<FormPill text="compound" />);
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();

    if (chip === null) {
      return;
    }

    expect(window.getComputedStyle(chip).textTransform).toBe("uppercase");
  });

  it("renders the label inside the standard MuiChip-label slot for scoped sx targeting", () => {
    const { container } = render(<FormPill text="compound" />);
    const label = container.querySelector(".MuiChip-label");

    expect(label).not.toBeNull();
    expect(label?.textContent).toBe("compound");
  });
});
