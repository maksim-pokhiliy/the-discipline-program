import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "@app/test/render";

import { InertScoringChip } from "./inert-scoring-chip";

describe("InertScoringChip", () => {
  it("renders the provided scoring text", () => {
    render(<InertScoringChip text="AMRAP · rounds 2, 3" />);

    expect(screen.getByText("AMRAP · rounds 2, 3")).toBeInTheDocument();
  });

  it("uses the outlined dashed treatment as the inert cue", () => {
    const { container } = render(<InertScoringChip text="AMRAP" />);
    const chip = container.querySelector(".MuiChip-root");

    expect(chip).not.toBeNull();
    expect(chip).toHaveClass("MuiChip-outlined");
    expect(chip).toHaveStyle({ borderStyle: "dashed" });
  });
});
