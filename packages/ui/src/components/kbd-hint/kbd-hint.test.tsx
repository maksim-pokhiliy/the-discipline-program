import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "../../test/render";

import { KbdHint } from "./kbd-hint";

const LONG_COMBO = "⌘⇧⌥K + Tab";

describe("KbdHint", () => {
  it("renders the provided children as the label", () => {
    render(<KbdHint>⌘K</KbdHint>);

    expect(screen.getByText("⌘K")).toBeInTheDocument();
  });

  it("forwards ReactNode children into the Chip label", () => {
    render(
      <KbdHint>
        <span data-testid="kbd-inner">K</span>
      </KbdHint>,
    );

    expect(screen.getByTestId("kbd-inner")).toBeInTheDocument();
  });

  it("renders multi-glyph long combos as full label text without truncation (MT-07)", () => {
    const { container } = render(<KbdHint>{LONG_COMBO}</KbdHint>);
    const label = container.querySelector(".MuiChip-label");

    expect(label).not.toBeNull();
    expect(label?.textContent).toBe(LONG_COMBO);
    expect(screen.getByText(LONG_COMBO)).toBeInTheDocument();
  });
});
