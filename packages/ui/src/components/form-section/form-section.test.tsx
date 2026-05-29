import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "../../test/render";

import { FormSection } from "./form-section";

describe("FormSection", () => {
  it("renders the label text", () => {
    render(
      <FormSection label="Intensity — any combination of axes">
        <span data-testid="form-body">body</span>
      </FormSection>,
    );

    expect(screen.getByText("Intensity — any combination of axes")).toBeInTheDocument();
  });

  it("renders the label uppercased via CSS textTransform", () => {
    render(
      <FormSection label="Time cap">
        <span>body</span>
      </FormSection>,
    );
    const label = screen.getByText("Time cap");

    expect(window.getComputedStyle(label).textTransform).toBe("uppercase");
  });

  it("renders the helper em-dash-prefixed when provided", () => {
    render(
      <FormSection label="Block notes" helper="coaching cues, intent">
        <span>body</span>
      </FormSection>,
    );

    expect(screen.getByText("— coaching cues, intent")).toBeInTheDocument();
  });

  it("omits the helper when not provided", () => {
    const { rerender } = render(
      <FormSection label="Block notes" helper="coaching cues, intent">
        <span>body</span>
      </FormSection>,
    );

    expect(screen.getByText("— coaching cues, intent")).toBeInTheDocument();

    rerender(
      <FormSection label="Block notes">
        <span>body</span>
      </FormSection>,
    );

    expect(screen.queryByText("— coaching cues, intent")).not.toBeInTheDocument();
  });

  it("renders the children body content", () => {
    render(
      <FormSection label="Intensity">
        <span data-testid="form-body">body content</span>
      </FormSection>,
    );

    expect(screen.getByTestId("form-body")).toBeInTheDocument();
    expect(screen.getByText("body content")).toBeInTheDocument();
  });
});
