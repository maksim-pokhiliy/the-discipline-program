import { alpha } from "@mui/material/styles";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { theme } from "@repo/mui";

import { render } from "../../test/render";

import { AccentGroupCard } from "./accent-group-card";

const ACCENT_BORDER_ALPHA = 0.4;

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

  it("contracts the Card height to its content via height auto (MT-03)", () => {
    const { container } = render(
      <AccentGroupCard header={<span>H</span>}>
        <span>B</span>
      </AccentGroupCard>,
    );
    const card = container.querySelector(".MuiCard-root");

    expect(card).not.toBeNull();
    expect(card).toHaveStyle({ height: "auto" });
  });

  it("locks the dashed border color cascade to alpha(primary.main, 0.4) (MT-06)", () => {
    const { container } = render(
      <AccentGroupCard header={<span>H</span>}>
        <span>B</span>
      </AccentGroupCard>,
    );
    const card = container.querySelector(".MuiCard-root");
    const expectedBorderColor = alpha(theme.palette.primary.main, ACCENT_BORDER_ALPHA);

    expect(card).not.toBeNull();
    expect(card).toHaveStyle({ borderColor: expectedBorderColor });
  });
});
