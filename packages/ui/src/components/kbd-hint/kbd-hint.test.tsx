import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "../../test/render";

import { KbdHint } from "./kbd-hint";

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
});
