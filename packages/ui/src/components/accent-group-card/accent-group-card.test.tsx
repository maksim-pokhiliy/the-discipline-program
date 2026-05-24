import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "../../test/render";

import { AccentGroupCard } from "./accent-group-card";

describe("AccentGroupCard", () => {
  it("renders the header and the children", () => {
    render(
      <AccentGroupCard header={<span data-testid="agc-header">Header text</span>}>
        <span data-testid="agc-body">Body text</span>
      </AccentGroupCard>,
    );

    expect(screen.getByTestId("agc-header")).toBeInTheDocument();
    expect(screen.getByTestId("agc-body")).toBeInTheDocument();
  });

  it("renders the Card root with a dashed accent border", () => {
    const { container } = render(
      <AccentGroupCard header={<span>H</span>}>
        <span>B</span>
      </AccentGroupCard>,
    );
    const card = container.querySelector(".MuiCard-root");

    expect(card).not.toBeNull();
    expect(card).toHaveStyle({ borderStyle: "dashed" });
  });
});
