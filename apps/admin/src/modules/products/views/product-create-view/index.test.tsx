import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "@app/test/render";

import { ProductCreateView } from "./index";

vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());

vi.mock("next-auth/react", async () => (await import("@app/test/mocks")).buildNextAuthMock());

describe("ProductCreateView pricing", () => {
  it("seeds a new product with a 4-week UAH price that offers auto-renew", () => {
    render(<ProductCreateView />);

    expect(screen.getByLabelText("Price")).toHaveValue(null);
    expect(screen.getByLabelText("Currency")).toHaveTextContent("UAH");
    expect(screen.getByLabelText("Period length")).toHaveValue(4);
    expect(screen.getByLabelText("Period unit")).toHaveTextContent("weeks");
    expect(screen.getByRole("checkbox", { name: "Offer auto-renew" })).toBeChecked();
    expect(screen.getByText("₴")).toBeInTheDocument();
  });

  it("explains what switching auto-renew off means", () => {
    render(<ProductCreateView />);

    expect(
      screen.getByText("When off, this price is sold only as a one-off paid period."),
    ).toBeInTheDocument();
  });
});
