import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ActionItemSeverity } from "@repo/contracts/coaching/coach-action-item";
import { theme } from "@repo/mui";

import { render } from "../../test/render";

import { SeverityActionCard } from "./severity-action-card";

const getStripe = (container: HTMLElement): Element => {
  const card = container.querySelector(".MuiCard-root");

  if (card === null || card.firstElementChild === null) {
    throw new Error("stripe node missing");
  }

  return card.firstElementChild;
};

describe("SeverityActionCard", () => {
  it("renders the children body content", () => {
    render(
      <SeverityActionCard severity={ActionItemSeverity.INFO}>
        <span data-testid="card-body">Body</span>
      </SeverityActionCard>,
    );

    expect(screen.getByTestId("card-body")).toBeInTheDocument();
  });

  it("colors the stripe with the error palette for CRITICAL", () => {
    const { container } = render(
      <SeverityActionCard severity={ActionItemSeverity.CRITICAL}>
        <span>Body</span>
      </SeverityActionCard>,
    );

    expect(getStripe(container)).toHaveStyle({ backgroundColor: theme.palette.error.main });
  });

  it("colors the stripe with the warning palette for WARNING", () => {
    const { container } = render(
      <SeverityActionCard severity={ActionItemSeverity.WARNING}>
        <span>Body</span>
      </SeverityActionCard>,
    );

    expect(getStripe(container)).toHaveStyle({ backgroundColor: theme.palette.warning.main });
  });

  it("colors the stripe with the info palette for INFO", () => {
    const { container } = render(
      <SeverityActionCard severity={ActionItemSeverity.INFO}>
        <span>Body</span>
      </SeverityActionCard>,
    );

    expect(getStripe(container)).toHaveStyle({ backgroundColor: theme.palette.info.main });
  });

  it("renders the actions slot when provided", () => {
    render(
      <SeverityActionCard
        severity={ActionItemSeverity.INFO}
        actions={<button data-testid="card-action">Resolve</button>}
      >
        <span>Body</span>
      </SeverityActionCard>,
    );

    expect(screen.getByTestId("card-action")).toBeInTheDocument();
  });

  it("fires onClick when the card is clicked", () => {
    const onClick = vi.fn();

    render(
      <SeverityActionCard severity={ActionItemSeverity.INFO} onClick={onClick}>
        <span>Body</span>
      </SeverityActionCard>,
    );

    fireEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is not a button when no onClick is provided", () => {
    render(
      <SeverityActionCard severity={ActionItemSeverity.INFO}>
        <span>Body</span>
      </SeverityActionCard>,
    );

    expect(screen.queryByRole("button")).toBeNull();
  });
});
